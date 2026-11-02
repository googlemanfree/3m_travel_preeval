import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { agencySettings, applications, flightBookingRequestHistory, flightBookingRequests } from "../../drizzle/schema";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
import {
  MANUAL_METHOD_CODES,
  MANUAL_METHOD_IDS,
  parsePaymentInstructions,
  sanitizePaymentInstructions,
  toPublicInstructions,
  type AgencyFacts,
  type ManualMethodId,
  type PaymentInstructions,
} from "../../shared/paymentMethods";
import { createSubmissionGuard } from "../_core/publicRateLimit";
import { sendEmail } from "../_core/email";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { buildManualPaymentAgencyEmail, buildManualPaymentClientEmail, buildPaymentSettingsChangedEmail } from "../services/manualPaymentEmails";
import { requireValidAdminSession } from "./adminAuth";
import { notifyAdmins } from "./adminNotifications";
import { candidateProcedure } from "./candidate";

export const PAYMENT_INSTRUCTIONS_KEY = "payment_instructions";
const DEFAULT_DOSSIER_AMOUNT = 65000;

const office = COMPANY_PROFILE.offices.cameroon;
const AGENCY_FACTS: AgencyFacts = {
  address: office.addressLines.join(", "),
  hours: office.openingHours.join(" · "),
  whatsappNumber: office.whatsappNumber,
  whatsappDisplay: office.whatsappDisplay,
  phoneDisplay: office.phoneDisplay,
};

// Chaque demande envoie deux e-mails : plafond par client, par adresse e-mail et global.
const manualPaymentGuard = createSubmissionGuard({
  perClient: { limit: 10, windowMs: 60 * 60_000 },
  perEmail: { limit: 6, windowMs: 60 * 60_000 },
  global: { limit: 200, windowMs: 60 * 60_000 },
});

const onlineGatewayConfigured = (env: Record<string, string | undefined> = process.env): boolean => Boolean(env.CINETPAY_SITE_ID && env.CINETPAY_API_KEY);

async function loadInstructions(): Promise<PaymentInstructions> {
  const db = await getDb();
  if (!db) return parsePaymentInstructions(null);
  const rows = await db.select().from(agencySettings).where(eq(agencySettings.settingKey, PAYMENT_INSTRUCTIONS_KEY)).limit(1);
  return parsePaymentInstructions(rows[0]?.settingValue);
}

const instructionsInput = z.object({
  bankTransfer: z.object({ bankName: z.string().max(200), accountHolder: z.string().max(200), iban: z.string().max(80), bic: z.string().max(40), accountNumber: z.string().max(80), note: z.string().max(1000) }).partial(),
  mobileMoney: z.array(z.object({ operator: z.string().max(20), number: z.string().max(60), accountName: z.string().max(200) }).partial()).max(6),
  agency: z.object({ address: z.string().max(400), hours: z.string().max(300), note: z.string().max(1000) }).partial(),
  generalNote: z.string().max(1200),
}).partial();

function changedSections(before: PaymentInstructions, after: PaymentInstructions): string[] {
  const sections: Array<[string, unknown, unknown]> = [
    ["virement bancaire", before.bankTransfer, after.bankTransfer],
    ["Mobile Money", before.mobileMoney, after.mobileMoney],
    ["agence", before.agency, after.agency],
    ["note générale", before.generalNote, after.generalNote],
  ];
  return sections.filter(([, a, b]) => JSON.stringify(a) !== JSON.stringify(b)).map(([name]) => name);
}

export const paymentInstructionsRouter = router({
  /** Coordonnées de paiement à afficher au public + état réel de la passerelle en ligne (jamais de clé). */
  getPublic: publicProcedure.query(async () => {
    const instructions = await loadInstructions();
    return { instructions: toPublicInstructions(instructions), onlineEnabled: onlineGatewayConfigured(), agency: AGENCY_FACTS };
  }),

  getForAdmin: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return { instructions: await loadInstructions(), onlineEnabled: onlineGatewayConfigured(), agency: AGENCY_FACTS };
  }),

  update: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512), instructions: instructionsInput })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const { value, issues } = sanitizePaymentInstructions(input.instructions);
    if (issues.length > 0) throw new TRPCError({ code: "BAD_REQUEST", message: issues.map((issue) => issue.message).join(" ") });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

    const before = await loadInstructions();
    const saved: PaymentInstructions = { ...value, updatedAt: new Date().toISOString(), updatedBy: admin.email || "administrateur" };
    const serialized = JSON.stringify(saved);
    const existing = await db.select().from(agencySettings).where(eq(agencySettings.settingKey, PAYMENT_INSTRUCTIONS_KEY)).limit(1);
    if (existing.length > 0) await db.update(agencySettings).set({ settingValue: serialized }).where(eq(agencySettings.settingKey, PAYMENT_INSTRUCTIONS_KEY));
    else await db.insert(agencySettings).values({ settingKey: PAYMENT_INSTRUCTIONS_KEY, settingValue: serialized });

    // Alerte anti-fraude : quiconque modifie ces coordonnées, l'agence en est prévenue par e-mail.
    try {
      const alert = buildPaymentSettingsChangedEmail({ adminEmail: admin.email || "administrateur", changedSections: changedSections(before, saved), at: new Date() });
      await sendEmail({ to: COMPANY_PROFILE.publicEmail, subject: alert.subject, html: alert.html });
    } catch (error) {
      console.error("[PaymentInstructions] alerte de modification non envoyée", error);
    }
    return { success: true, instructions: saved };
  }),

  /**
   * Règlement manuel (virement, dépôt Mobile Money, agence), choisi par le client ou proposé après l'échec d'un paiement
   * en ligne. Enregistre le mode sur le dossier ou la réservation, envoie les instructions au client et signale le suivi
   * à l'agence. Ne valide JAMAIS un paiement : seule la confirmation de réception par l'agence le fait.
   */
  requestManualPayment: candidateProcedure
    .input(z.object({
      kind: z.enum(["dossier", "flight"]),
      reference: z.string().trim().min(3).max(60),
      method: z.enum(MANUAL_METHOD_IDS as unknown as [ManualMethodId, ...ManualMethodId[]]),
      trigger: z.enum(["chosen", "online_failed"]).default("chosen"),
    }))
    .mutation(async ({ ctx, input }) => {
      manualPaymentGuard.assertAllowed(ctx?.req as any, ctx.candidate.email);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const candidateEmail = ctx.candidate.email.trim().toLowerCase();
      const code = MANUAL_METHOD_CODES[input.method];

      let fullName = "";
      let amount: number | null = null;
      let currency = "XAF";

      if (input.kind === "dossier") {
        const [application] = await db.select().from(applications).where(eq(applications.dossierNumber, input.reference)).limit(1);
        // Même message pour « introuvable » et « pas à vous » : on ne révèle pas l'existence d'un dossier.
        if (!application || application.email.trim().toLowerCase() !== candidateEmail) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable." });
        if (application.paymentStatus === "SUCCESS") throw new TRPCError({ code: "BAD_REQUEST", message: "Le paiement de ce dossier est déjà confirmé." });
        fullName = application.fullName;
        amount = application.paymentAmount ?? DEFAULT_DOSSIER_AMOUNT;
        currency = application.paymentCurrency ?? "XAF";
        await db.update(applications).set({ paymentMethod: code }).where(eq(applications.id, application.id));
      } else {
        const [booking] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.requestRef, input.reference)).limit(1);
        if (!booking || (booking.candidateId !== ctx.candidate.id && booking.candidateEmail.trim().toLowerCase() !== candidateEmail)) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
        if (booking.status === "issued" || booking.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette réservation est terminée : aucun règlement n'est attendu." });
        const flight = (booking.flightData ?? {}) as Record<string, unknown>;
        const passenger = (Array.isArray(booking.passengerData) ? booking.passengerData[0] : {}) as Record<string, unknown>;
        fullName = typeof passenger?.fullName === "string" ? passenger.fullName : ctx.candidate.email;
        amount = typeof flight.quotedTotalPrice === "number" ? flight.quotedTotalPrice : typeof flight.totalPrice === "number" ? flight.totalPrice : null;
        currency = typeof flight.currency === "string" ? flight.currency : "XAF";
        await db.update(flightBookingRequests).set({ paymentMethod: code }).where(eq(flightBookingRequests.id, booking.id));
        await db.insert(flightBookingRequestHistory).values({
          requestId: booking.id,
          action: "manual_payment_requested",
          changedBy: ctx.candidate.email,
          oldValue: booking.paymentMethod ?? null,
          newValue: code,
          details: input.trigger === "online_failed" ? "Paiement en ligne non abouti : règlement manuel demandé par le client." : "Règlement manuel choisi par le client.",
        });
      }

      const instructions = await loadInstructions();
      const site = (process.env.SITE_URL || COMPANY_PROFILE.website).replace(/\/+$/, "");
      let clientEmailSent = false;
      try {
        const clientEmail = buildManualPaymentClientEmail({ reference: input.reference, fullName, amount, currency, method: input.method, trigger: input.trigger, instructions, agency: AGENCY_FACTS });
        await sendEmail({ to: ctx.candidate.email, subject: clientEmail.subject, html: clientEmail.html });
        clientEmailSent = true;
      } catch (error) {
        console.error("[PaymentInstructions] e-mail client non envoyé", error);
      }
      await notifyAdmins({ type: "new_contact_message", title: "Paiement manuel à suivre", message: `${fullName} — ${input.reference} — ${MANUAL_METHOD_CODES[input.method]}`, relatedId: input.reference, targetAdminType: "accompagnement" });
      try {
        const agencyEmail = buildManualPaymentAgencyEmail({ reference: input.reference, kind: input.kind, fullName, email: ctx.candidate.email, amount, currency, method: input.method, trigger: input.trigger, adminUrl: `${site}/admin` });
        await sendEmail({ to: COMPANY_PROFILE.publicEmail, subject: agencyEmail.subject, html: agencyEmail.html });
      } catch (error) {
        console.error("[PaymentInstructions] alerte agence non envoyée", error);
      }
      return { success: true, reference: input.reference, method: input.method, amount, currency, clientEmailSent, instructions: toPublicInstructions(instructions), agency: AGENCY_FACTS };
    }),
});
