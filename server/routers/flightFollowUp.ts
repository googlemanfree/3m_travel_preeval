import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { flightBookingRequestHistory, flightBookingRequests, type FlightBookingRequest } from "../../drizzle/schema";
import { compareFares, describeFareComparison } from "../../shared/flightFareCheck";
import { CHANGE_KINDS, DESK_THRESHOLDS, HISTORY, STALE_LABELS, collectChangeRequests, computeDeskStats, computeFunnel, currentOptionDeadline, findStaleRequests, type ChangeKind, type DeskRequest, type HistoryRow } from "../../shared/flightFollowUps";
import { flightNextStep, flightStatusLabel } from "../../shared/flightRequestStatus";
import { assessTravelers, checkTraveler, expectedTravelerCount, extractTravelers, lastTravelDateOf, normalizePassportNumber } from "../../shared/flightTravelerCheck";
import { getDb } from "../db";
import { sendEmail } from "../_core/email";
import { createSubmissionGuard } from "../_core/publicRateLimit";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { notifyAdmins } from "./adminNotifications";
import { candidateProcedure } from "./candidate";
import { recheckLiveFare } from "./flights";
import { resolveDeskRecipients } from "../services/flightDeskAlert";
import { payLink } from "../services/flightWorkflow";
import { buildChangeHandledEmail, buildChangeRequestAckEmail, buildChangeRequestDeskAlert } from "../services/flightFollowUpEmails";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const WHATSAPP_DISPLAY = "+237 6 98 10 48 32";
const siteUrl = () => (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");

const travelerSchema = z.object({
  fullName: z.string().trim().max(120),
  passportNumber: z.string().trim().max(24),
  passportExpiry: z.string().trim().max(10),
  dateOfBirth: z.string().trim().max(10),
  nationality: z.string().trim().max(60).optional(),
});

// Suivi public par référence + e-mail : plafonds par connexion, par adresse et au total, pour ne pas servir à deviner des références.
const trackGuard = createSubmissionGuard({
  perClient: { limit: 30, windowMs: 60 * 60_000 },
  perEmail: { limit: 10, windowMs: 60 * 60_000 },
  global: { limit: 600, windowMs: 60 * 60_000 },
});
const trackInput = z.object({ requestRef: z.string().trim().min(6).max(40), email: z.string().trim().toLowerCase().email().max(320) });
const TRACK_NOT_FOUND = "Aucune réservation ne correspond à cette référence et à cette adresse e-mail.";

async function findTracked(db: Db, requestRef: string, email: string): Promise<FlightBookingRequest> {
  const [row] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.requestRef, requestRef)).limit(1);
  // Même réponse pour « référence inconnue » et « e-mail différent » : rien ne confirme l'existence d'une référence.
  if (!row || row.candidateEmail.trim().toLowerCase() !== email) throw new TRPCError({ code: "NOT_FOUND", message: TRACK_NOT_FOUND });
  return row;
}

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

const historyRows = (rows: Array<typeof flightBookingRequestHistory.$inferSelect>): HistoryRow[] => rows.map((row) => ({ id: row.id, requestId: row.requestId, action: row.action, oldValue: row.oldValue, newValue: row.newValue, details: row.details, createdAt: row.createdAt }));

/** Enregistre les voyageurs dans la demande (liste `travelerDetails` du premier passager, sans migration) après contrôle : aucune erreur tolérée. */
async function saveTravelers(db: Db, request: FlightBookingRequest, travelers: z.infer<typeof travelerSchema>[], actorEmail: string, now: Date): Promise<{ warnings: string[] }> {
  if (request.status === "issued" || request.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette réservation est terminée : les données voyageurs ne peuvent plus être modifiées ici." });
  const expected = expectedTravelerCount(request.flightData, request.passengerData);
  if (travelers.length < expected) throw new TRPCError({ code: "BAD_REQUEST", message: `${expected} voyageur(s) attendu(s) : renseignez-les tous.` });
  const lastTravelDate = lastTravelDateOf(request.flightData);
  const errors: string[] = [];
  const warnings: string[] = [];
  travelers.forEach((traveler, index) => {
    const label = travelers.length > 1 ? `Voyageur ${index + 1} : ` : "";
    for (const issue of checkTraveler(traveler, { lastTravelDate, today: now })) (issue.severity === "error" ? errors : warnings).push(`${label}${issue.message}`);
  });
  if (errors.length > 0) throw new TRPCError({ code: "BAD_REQUEST", message: errors.slice(0, 4).join(" ") });

  const passengers = Array.isArray(request.passengerData) ? (request.passengerData as Array<Record<string, unknown>>).map((entry) => ({ ...entry })) : [{}];
  const normalized = travelers.map((traveler) => ({ fullName: traveler.fullName.replace(/\s+/g, " "), passportNumber: normalizePassportNumber(traveler.passportNumber), passportExpiry: traveler.passportExpiry, dateOfBirth: traveler.dateOfBirth, ...(traveler.nationality ? { nationality: traveler.nationality } : {}) }));
  passengers[0] = { ...(passengers[0] ?? {}), travelerDetails: normalized };
  await db.update(flightBookingRequests).set({ passengerData: passengers }).where(eq(flightBookingRequests.id, request.id));
  await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.travelerDetails, changedBy: actorEmail, oldValue: null, newValue: String(normalized.length), details: `Données passeport de ${normalized.length} voyageur(s) enregistrées par ${actorEmail}.${warnings.length ? ` Avertissements : ${warnings.join(" ")}` : ""}`.slice(0, 2000) });
  return { warnings };
}

export const flightFollowUpRouter = router({
  // ─── Côté client ──────────────────────────────────────────────────────────────────────────────────────────────

  /** Pour chaque réservation du client : voyageurs (attendus, saisis, contrôle) et demandes de modification. */
  myOverview: candidateProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const now = new Date();
    const requests = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.candidateId, ctx.candidate.id)).orderBy(desc(flightBookingRequests.createdAt)).limit(50);
    if (requests.length === 0) return [];
    const rows = await db.select().from(flightBookingRequestHistory).where(and(inArray(flightBookingRequestHistory.requestId, requests.map((request) => request.id)), inArray(flightBookingRequestHistory.action, [HISTORY.changeRequest, HISTORY.changeHandled]))).limit(500);
    const changes = collectChangeRequests(historyRows(rows));
    return requests.map((request) => {
      const readiness = assessTravelers({ flightData: request.flightData, passengerData: request.passengerData, today: now });
      return {
        requestId: request.id,
        travelers: { expected: readiness.expected, provided: readiness.provided, complete: readiness.complete, messages: readiness.messages.slice(0, 6), details: extractTravelers(request.passengerData) },
        changeRequests: changes.filter((change) => change.requestId === request.id).slice(0, 5).map((change) => ({ id: change.id, kind: change.kind, message: change.message, createdAt: change.createdAt.toISOString(), handled: Boolean(change.handledAt), handledNote: change.handledNote })),
      };
    });
  }),

  submitTravelers: candidateProcedure
    .input(z.object({ requestId: z.number().int().positive(), travelers: z.array(travelerSchema).min(1).max(9) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [request] = await db.select().from(flightBookingRequests).where(and(eq(flightBookingRequests.id, input.requestId), eq(flightBookingRequests.candidateId, ctx.candidate.id))).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      const result = await saveTravelers(db, request, input.travelers, ctx.candidate.email, new Date());
      await notifyAdmins({ type: "new_contact_message", title: "Passeports reçus pour une réservation de vol", message: `${request.requestRef} — ${input.travelers.length} voyageur(s) : données à contrôler avant l’émission`, relatedId: request.requestRef, targetAdminType: "accompagnement" });
      return { success: true, warnings: result.warnings };
    }),

  /** Le client demande une modification ou une annulation : rien n'est modifié, le comptoir traite selon les conditions de la compagnie. */
  requestChange: candidateProcedure
    .input(z.object({ requestId: z.number().int().positive(), kind: z.enum(CHANGE_KINDS), message: z.string().trim().min(10, "Décrivez votre demande en quelques mots.").max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [request] = await db.select().from(flightBookingRequests).where(and(eq(flightBookingRequests.id, input.requestId), eq(flightBookingRequests.candidateId, ctx.candidate.id))).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      if (request.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette réservation est déjà annulée." });
      const existing = await db.select().from(flightBookingRequestHistory).where(and(eq(flightBookingRequestHistory.requestId, request.id), inArray(flightBookingRequestHistory.action, [HISTORY.changeRequest, HISTORY.changeHandled]))).limit(200);
      if (collectChangeRequests(historyRows(existing)).some((change) => !change.handledAt)) throw new TRPCError({ code: "BAD_REQUEST", message: "Une demande de modification est déjà en cours de traitement pour cette réservation." });
      await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.changeRequest, changedBy: ctx.candidate.email, oldValue: input.kind, newValue: null, details: input.message });
      await notifyAdmins({ type: "new_contact_message", title: "Demande de modification d’une réservation de vol", message: `${request.requestRef} — ${input.kind}`, relatedId: request.requestRef, targetAdminType: "accompagnement" });
      let deskNotified = false;
      try {
        const alert = buildChangeRequestDeskAlert({ requestRef: request.requestRef, clientEmail: ctx.candidate.email, kind: input.kind, message: input.message, adminUrl: `${siteUrl()}/admin` });
        await sendEmail({ to: resolveDeskRecipients(process.env).join(","), subject: alert.subject, html: alert.html });
        deskNotified = true;
      } catch (error) {
        console.error("[FlightFollowUp] change request desk alert failed", error);
      }
      try {
        const ack = buildChangeRequestAckEmail({ requestRef: request.requestRef, kind: input.kind, whatsappDisplay: WHATSAPP_DISPLAY });
        await sendEmail({ to: request.candidateEmail, subject: ack.subject, html: ack.html });
      } catch (error) {
        console.error("[FlightFollowUp] change request acknowledgement failed", error);
      }
      return { success: true, deskNotified };
    }),

  // ─── Suivi sans compte (référence + e-mail) ───────────────────────────────────────────────────────────────────
  // POST et non GET : l'adresse e-mail ne doit jamais apparaître dans une URL.

  track: publicProcedure.input(trackInput).mutation(async ({ ctx, input }) => {
    trackGuard.assertAllowed(ctx?.req as any, input.email);
    const db = await requireDb();
    const request = await findTracked(db, input.requestRef, input.email);
    const readiness = assessTravelers({ flightData: request.flightData, passengerData: request.passengerData, today: new Date() });
    const flight = (request.flightData && typeof request.flightData === "object" ? request.flightData : {}) as Record<string, any>;
    const text = (value: unknown, fallback: string) => (typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : fallback);
    const payable = (request.status === "revalidated" || request.status === "awaiting_payment") && !request.clientValidated;
    return {
      requestRef: request.requestRef,
      status: request.status,
      statusLabel: flightStatusLabel(request.status),
      route: `${text(flight.originCity, text(flight.origin, "Départ"))} → ${text(flight.destinationCity, text(flight.destination, "Destination"))}`,
      departureDate: text(flight.departureDate, ""),
      returnDate: text(flight.returnFlight?.departureDate, ""),
      lastTravelDate: lastTravelDateOf(request.flightData),
      nextStep: flightNextStep({ status: request.status, clientValidated: request.clientValidated, travelersComplete: readiness.complete }),
      payUrl: payable ? payLink(siteUrl(), request.requestRef) : null,
      travelers: { expected: readiness.expected, provided: readiness.provided, complete: readiness.complete, editable: request.status !== "issued" && request.status !== "cancelled" },
      ticketSent: request.status === "issued" && Boolean(request.issuedPdfUrl),
    };
  }),

  /** Un invité (sans compte) renseigne les passeports depuis le suivi : mêmes contrôles, réservation retrouvée par référence + e-mail. */
  trackSubmitTravelers: publicProcedure
    .input(trackInput.extend({ travelers: z.array(travelerSchema).min(1).max(9) }))
    .mutation(async ({ ctx, input }) => {
      trackGuard.assertAllowed(ctx?.req as any, input.email);
      const db = await requireDb();
      const request = await findTracked(db, input.requestRef, input.email);
      const result = await saveTravelers(db, request, input.travelers, request.candidateEmail, new Date());
      await notifyAdmins({ type: "new_contact_message", title: "Passeports reçus pour une réservation de vol", message: `${request.requestRef} — ${input.travelers.length} voyageur(s) : données à contrôler avant l’émission`, relatedId: request.requestRef, targetAdminType: "accompagnement" });
      return { success: true, warnings: result.warnings };
    }),

  // ─── Côté administration ──────────────────────────────────────────────────────────────────────────────────────

  /** Échéance de l'option de réservation posée auprès de la compagnie (saisie par le conseiller) ; `null` l'efface. */
  setOptionDeadline: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), deadline: z.string().max(40).nullable(), note: z.string().trim().max(300).optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const [request] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      if (request.status === "issued" || request.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Le billet est déjà émis ou la demande annulée : plus d’option à suivre." });
      let value: string | null = null;
      if (input.deadline) {
        const parsed = new Date(input.deadline);
        if (Number.isNaN(parsed.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: "Date d’échéance invalide." });
        if (parsed.getTime() < Date.now() - 60_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette échéance est déjà passée." });
        value = parsed.toISOString();
      }
      await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.optionDeadline, changedBy: admin.email, oldValue: null, newValue: value, details: (value ? `Option de réservation valable jusqu’au ${value}.` : "Échéance d’option effacée.") + (input.note ? ` ${input.note}` : "") });
      return { success: true, deadline: value };
    }),

  /** Relève de nouveau le tarif chez le fournisseur et le compare à celui présenté au client ; le résultat est journalisé. */
  recheckFare: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const [request] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      if (request.status === "issued" || request.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Le billet est déjà émis ou la demande annulée : aucun contrôle de tarif à faire." });
      const flight = (request.flightData && typeof request.flightData === "object" ? request.flightData : {}) as Record<string, any>;
      const oldTotal = Number(flight.totalPrice);
      if (!Number.isFinite(oldTotal) || oldTotal <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Le tarif initial n’est pas enregistré dans la demande : contrôle impossible." });
      const live = await recheckLiveFare(flight);
      const comparison = compareFares(oldTotal, live.status === "checked" && live.found ? live.newTotal : null, live.status === "checked");
      const description = describeFareComparison(comparison);
      await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.fareChecked, changedBy: admin.email, oldValue: String(Math.round(oldTotal)), newValue: comparison.kind, details: `${description}${live.status === "unavailable" ? ` (${live.reason})` : ""}`.slice(0, 2000) });
      return { comparison, description, retrievedAt: live.status === "checked" ? live.retrievedAt : null };
    }),

  /** Saisie des données voyageurs par le comptoir (client venu en agence ou par téléphone) : mêmes contrôles que côté client. */
  adminSaveTravelers: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), travelers: z.array(travelerSchema).min(1).max(9) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const [request] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      const result = await saveTravelers(db, request, input.travelers, admin.email, new Date());
      return { success: true, warnings: result.warnings };
    }),

  /** Tableau de bord du comptoir : délais médians réels, demandes qui attendent une action, demandes de modification ouvertes. */
  deskOverview: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), days: z.number().int().min(7).max(365).default(90) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const now = new Date();
      const since = new Date(now.getTime() - input.days * 86_400_000);
      const requests = await db.select().from(flightBookingRequests).where(gte(flightBookingRequests.createdAt, since)).orderBy(desc(flightBookingRequests.createdAt)).limit(1000);
      const rows = requests.length ? await db.select().from(flightBookingRequestHistory).where(inArray(flightBookingRequestHistory.requestId, requests.map((request) => request.id))).limit(20000) : [];
      const history = historyRows(rows);
      const desk: DeskRequest[] = requests.map((request) => ({ id: request.id, requestRef: request.requestRef, status: request.status, priority: request.priority, clientValidated: request.clientValidated, assignedAgentEmail: request.assignedAgentEmail, createdAt: request.createdAt, pnrReference: request.pnrReference, issuedPdfUrl: request.issuedPdfUrl, flightData: request.flightData }));
      const refById = new Map(requests.map((request) => [request.id, request.requestRef]));
      return {
        days: input.days,
        stats: computeDeskStats(desk, history),
        funnel: computeFunnel(desk, history),
        optionAlertHours: DESK_THRESHOLDS.optionWarningHours,
        options: desk.filter((request) => request.status !== "issued" && request.status !== "cancelled").flatMap((request) => { const deadline = currentOptionDeadline(history.filter((row) => row.requestId === request.id)); return deadline ? [{ requestId: request.id, requestRef: request.requestRef, deadline: deadline.toISOString() }] : []; }).sort((a, b) => a.deadline.localeCompare(b.deadline)),
        stale: findStaleRequests(desk, history, now).slice(0, 30).map((item) => ({ ...item, label: STALE_LABELS[item.reason] })),
        openChanges: collectChangeRequests(history).filter((change) => !change.handledAt).slice(0, 30).map((change) => ({ historyId: change.id, requestId: change.requestId, requestRef: refById.get(change.requestId) ?? "", kind: change.kind, message: change.message, createdAt: change.createdAt.toISOString() })),
      };
    }),

  /** Clôt une demande de modification et prévient le client (avec la réponse de l'agence). */
  resolveChange: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), historyId: z.number().int().positive(), note: z.string().trim().max(1000).default("") }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const [request] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      const rows = await db.select().from(flightBookingRequestHistory).where(and(eq(flightBookingRequestHistory.requestId, request.id), inArray(flightBookingRequestHistory.action, [HISTORY.changeRequest, HISTORY.changeHandled]))).limit(200);
      const change = collectChangeRequests(historyRows(rows)).find((item) => item.id === input.historyId);
      if (!change) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de modification introuvable." });
      if (change.handledAt) return { success: true, alreadyHandled: true, notified: false };
      await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.changeHandled, changedBy: admin.email, oldValue: null, newValue: String(input.historyId), details: input.note || null });
      let notified = false;
      try {
        const email = buildChangeHandledEmail({ requestRef: request.requestRef, kind: change.kind as ChangeKind, note: input.note });
        await sendEmail({ to: request.candidateEmail, subject: email.subject, html: email.html });
        notified = true;
      } catch (error) {
        console.error("[FlightFollowUp] change handled notification failed", error);
      }
      return { success: true, alreadyHandled: false, notified };
    }),
});
