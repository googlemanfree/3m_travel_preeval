import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { flightBookingRequestHistory, flightBookingRequests } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { notifyAdmins } from "./adminNotifications";
import { resolveDeskRecipients } from "../services/flightDeskAlert";
import { buildOnlinePaymentConfirmedAlert } from "../services/flightWorkflow";

/**
 * Paiement en ligne CinetPay des réservations de vol : chemin distinct de la déclaration manuelle (clientValidate /
 * adminValidatePayment) qui reste intacte pour les clients qui préfèrent payer par virement ou en agence. Colonnes
 * onlinePayment* (voir drizzle/0073_flight_online_payment.sql) : NULL tant qu'aucun paiement en ligne n'est tenté.
 * Le paiement confirmé n'émet jamais le billet lui-même — l'émission reste une action admin séparée (PNR + checklist).
 */

const PAYMENT_CURRENCY = "XAF";

/** La seule vérification qui protège des données personnelles : jamais contournée, quel que soit l'état de la réservation. */
export function emailMismatch(request: { candidateEmail: string }, candidateEmail: string): boolean {
  return request.candidateEmail.trim().toLowerCase() !== candidateEmail.trim().toLowerCase();
}

/** Pour DÉMARRER un paiement : en plus de l'e-mail, une réservation déjà émise ou annulée n'accepte plus de nouveau paiement. */
export function ownershipRefusal(request: { candidateEmail: string; status: string }, candidateEmail: string): string | null {
  if (emailMismatch(request, candidateEmail)) return "Accès non autorisé à cette réservation.";
  if (request.status === "issued") return "Le billet est déjà émis : le paiement en ligne n'est plus disponible ici.";
  if (request.status === "cancelled") return "Cette réservation est annulée : aucun paiement en ligne n'est possible.";
  return null;
}

/** Tarif à régler : celui de l'aller-retour complet si un retour a été choisi, sinon le tarif de l'aller. Jamais un montant recalculé. */
export function amountFromFlightData(flightData: unknown): number | null {
  const flight = (flightData && typeof flightData === "object" ? flightData as Record<string, unknown> : {});
  const amount = typeof flight.quotedTotalPrice === "number" ? flight.quotedTotalPrice : typeof flight.totalPrice === "number" ? flight.totalPrice : null;
  return amount !== null && Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

async function verifyWithCinetPay(transactionId: string): Promise<{ configured: boolean; accepted: boolean; paymentMethod: string; amount: number | undefined }> {
  const siteId = process.env.CINETPAY_SITE_ID;
  const apiKey = process.env.CINETPAY_API_KEY;
  if (!siteId || !apiKey) return { configured: false, accepted: false, paymentMethod: "", amount: undefined };
  try {
    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: transactionId }),
    });
    const data = await response.json() as { code?: string; data?: { status?: string; payment_method?: string; amount?: number | string } };
    return {
      configured: true,
      accepted: data.code === "00" && data.data?.status === "ACCEPTED",
      paymentMethod: data.data?.payment_method ?? "",
      amount: data.data?.amount === undefined ? undefined : Number(data.data.amount),
    };
  } catch {
    return { configured: true, accepted: false, paymentMethod: "", amount: undefined };
  }
}

export const cinetpayFlightPaymentRouter = router({
  initiateFlightOnlinePayment: publicProcedure
    .input(z.object({ requestId: z.number().int().positive(), candidateEmail: z.string().email().max(320) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      const refusal = ownershipRefusal(existing, input.candidateEmail);
      if (refusal) throw new TRPCError({ code: "FORBIDDEN", message: refusal });
      if (existing.onlinePaymentStatus === "SUCCESS") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette réservation est déjà réglée en ligne." });

      const amount = amountFromFlightData(existing.flightData);
      if (amount === null) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun tarif relevé pour cette réservation : le paiement en ligne ne peut pas être initié." });

      const transactionId = `3M-FL-${existing.requestRef}-${randomBytes(8).toString("hex")}`;
      await db.update(flightBookingRequests).set({
        onlinePaymentStatus: "PENDING",
        onlinePaymentTransactionId: transactionId,
        onlinePaymentAmount: amount,
        onlinePaymentCurrency: PAYMENT_CURRENCY,
        onlinePaymentMethod: null,
      }).where(eq(flightBookingRequests.id, input.requestId));

      return { success: true, transactionId, amount, currency: PAYMENT_CURRENCY, requestRef: existing.requestRef, email: existing.candidateEmail };
    }),

  getFlightOnlinePaymentInfo: publicProcedure
    .input(z.object({ requestId: z.number().int().positive(), candidateEmail: z.string().email().max(320) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      // Lecture seule : on n'y refuse jamais l'accès pour l'état de la réservation (émise, annulée) — seule une adresse
      // e-mail différente protège ces données personnelles. Sans ça, un identifiant de réservation en clair (séquentiel)
      // suffisait à lire nom, itinéraire et montant de N'IMPORTE QUELLE réservation déjà payée.
      if (emailMismatch(existing, input.candidateEmail)) throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé à cette réservation." });
      const flight = (existing.flightData && typeof existing.flightData === "object" ? existing.flightData as Record<string, unknown> : {});
      const passenger = (Array.isArray(existing.passengerData) ? existing.passengerData[0] : null) as Record<string, unknown> | null;
      return {
        success: true,
        requestRef: existing.requestRef,
        status: existing.onlinePaymentStatus,
        // Montant recalculé en direct (utile avant même d'avoir initié le paiement) ; celui déjà enregistré fait foi une fois SUCCESS.
        amount: existing.onlinePaymentStatus === "SUCCESS" ? existing.onlinePaymentAmount : amountFromFlightData(existing.flightData),
        currency: existing.onlinePaymentCurrency ?? PAYMENT_CURRENCY,
        passengerName: typeof passenger?.fullName === "string" ? passenger.fullName : "",
        originCity: typeof flight.originCity === "string" ? flight.originCity : typeof flight.origin === "string" ? flight.origin : "",
        destinationCity: typeof flight.destinationCity === "string" ? flight.destinationCity : typeof flight.destination === "string" ? flight.destination : "",
      };
    }),

  verifyFlightOnlinePaymentStatus: publicProcedure
    .input(z.object({ transactionId: z.string().min(12).max(180) }))
    .query(async ({ input }) => {
      const result = await confirmFlightOnlinePaymentByTransactionId(input.transactionId);
      if (result.outcome === "not_found") throw new TRPCError({ code: "NOT_FOUND", message: "Transaction introuvable." });
      if (result.outcome === "unavailable") return { success: false, error: "Vérification CinetPay non configurée" };
      return { success: true, status: result.outcome === "success" ? "SUCCESS" as const : "PENDING" as const };
    }),
});

export type FlightOnlinePaymentConfirmOutcome = "not_found" | "success" | "pending" | "unavailable";

/**
 * Confirme (ou non) un paiement en ligne CinetPay par sa référence de transaction, en revérifiant directement auprès de
 * CinetPay — jamais sur la seule foi d'un appel entrant. Appelée depuis DEUX chemins qui doivent aboutir au même
 * résultat : le sondage du client après la fermeture du guichet CinetPay (verifyFlightOnlinePaymentStatus ci-dessus) ET
 * le webhook serveur-à-serveur de CinetPay (server/routers/cinetpayWebhook.ts), qui reste la seule confirmation fiable
 * si le navigateur du client se ferme avant la fin du sondage.
 */
export async function confirmFlightOnlinePaymentByTransactionId(transactionId: string): Promise<{ outcome: FlightOnlinePaymentConfirmOutcome }> {
  const db = await getDb();
  if (!db) return { outcome: "unavailable" };
  const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.onlinePaymentTransactionId, transactionId)).limit(1);
  if (!existing) return { outcome: "not_found" };
  if (existing.onlinePaymentStatus === "SUCCESS") return { outcome: "success" };

  const verification = await verifyWithCinetPay(transactionId);
  if (!verification.configured) return { outcome: "unavailable" };
  const amountMatches = verification.amount === undefined || verification.amount === existing.onlinePaymentAmount;
  if (!verification.accepted || !amountMatches) return { outcome: "pending" };

  await db.update(flightBookingRequests).set({
    onlinePaymentStatus: "SUCCESS",
    onlinePaymentMethod: verification.paymentMethod || null,
    onlinePaymentDate: new Date(),
    // Aligné sur la déclaration manuelle : signale qu'un règlement est arrivé, sans jamais poser "issued" ici (émission = action admin séparée).
    status: existing.status === "pending_review" || existing.status === "assigned" || existing.status === "needs_info" || existing.status === "revalidated" ? "awaiting_payment" : existing.status,
  }).where(eq(flightBookingRequests.id, existing.id));

  await db.insert(flightBookingRequestHistory).values({
    requestId: existing.id,
    action: "online_payment_confirmed",
    changedBy: existing.candidateEmail,
    oldValue: existing.status,
    newValue: "awaiting_payment",
    details: `Paiement en ligne CinetPay confirmé. Référence : ${transactionId}.`,
  });

  try {
    const siteUrl = (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
    const alert = buildOnlinePaymentConfirmedAlert({
      requestRef: existing.requestRef,
      clientEmail: existing.candidateEmail,
      amountXaf: existing.onlinePaymentAmount ?? 0,
      transactionId,
      adminUrl: `${siteUrl}/admin?section=flights`,
    });
    await sendEmail({ to: resolveDeskRecipients(process.env).join(","), subject: alert.subject, html: alert.html });
  } catch (error) {
    console.error("[FlightOnlinePayment] desk alert failed", error);
  }
  await notifyAdmins({
    type: "payment_received",
    title: "Paiement en ligne confirmé",
    message: `${existing.requestRef} — CinetPay — ${transactionId}`,
    relatedId: existing.requestRef,
    targetAdminType: "accompagnement",
  });

  return { outcome: "success" };
}
