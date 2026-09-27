import { eq, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { agencyDossiers, agencySettings, applications, candidates, customerReviews, evaluations, flightBookingRequests } from "../../drizzle/schema";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
import { PRIVACY_DELETION_REQUEST_PREFIX, parsePrivacyDeletionRequest, privacyDeletionRequestKey, type PrivacyDeletionRequest } from "../../shared/privacyRequests";
import { getDb } from "../db";
import { sendEmail } from "../_core/email";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { notifyAdmins } from "./adminNotifications";
import { candidateProcedure } from "./candidate";
import { buildDeletionRequestAckEmail, buildDeletionRequestHandledEmail } from "../services/privacyEmails";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

export const candidatePrivacyRouter = router({
  /**
   * Export de ses propres données (portabilité) : tout ce que l'agence conserve, filtré strictement par identifiant ou
   * e-mail du candidat connecté. Les documents restent téléchargeables depuis leurs sections habituelles (nom, type et
   * date sont donnés ici, pas le contenu binaire, pour rester léger et immédiat).
   */
  myDataExport: candidateProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const email = ctx.candidate.email.trim().toLowerCase();
    const [profile] = await db.select().from(candidates).where(eq(candidates.id, ctx.candidate.id)).limit(1);
    const { passwordHash: _profileHash, ...profileWithoutSecret } = (profile ?? ctx.candidate) as Record<string, unknown> & { passwordHash?: unknown };
    const onlineApplications = await db.select().from(applications).where(eq(applications.candidateId, ctx.candidate.id)).limit(200);
    const agencyDossierRows = await db.select().from(agencyDossiers).where(eq(agencyDossiers.email, ctx.candidate.email)).limit(200);
    const evaluationRows = await db.select().from(evaluations).where(eq(evaluations.email, ctx.candidate.email)).limit(200);
    const flightRequests = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.candidateId, ctx.candidate.id)).limit(200);
    const reviews = await db.select().from(customerReviews).where(eq(customerReviews.email, ctx.candidate.email)).limit(50);
    return {
      exportedAt: new Date().toISOString(),
      profile: profileWithoutSecret,
      onlineApplications: onlineApplications.map((row) => ({ dossierNumber: row.dossierNumber, destination: row.destination, dossierStatus: row.dossierStatus, createdAt: row.createdAt, updatedAt: row.updatedAt })),
      agencyDossiers: agencyDossierRows.map((row) => ({ fullName: row.fullName, destination: row.destination, visaType: row.visaType, status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt })),
      evaluations: evaluationRows.map((row) => ({ createdAt: row.createdAt, projectType: row.projectType, destinationCountry: row.destinationCountry, finalResponseSentAt: row.finalResponseSentAt })),
      flightBookingRequests: flightRequests.map((row) => ({ requestRef: row.requestRef, status: row.status, flightData: row.flightData, passengerData: row.passengerData, createdAt: row.createdAt })),
      reviews: reviews.map((row) => ({ rating: row.rating, reviewText: row.reviewText, status: row.status, createdAt: row.createdAt })),
      note: "Cet export couvre vos données structurées. Vos documents déposés restent téléchargeables depuis les sections où vous les avez envoyés.",
    };
  }),

  /**
   * Demande de suppression de compte : n'efface rien. Un conseiller vérifie d'abord les obligations de conservation
   * (dossier en cours, comptabilité) avant toute suppression réelle, effectuée à part.
   */
  requestDeletion: candidateProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    const key = privacyDeletionRequestKey(ctx.candidate.id);
    const [existing] = await db.select({ id: agencySettings.id, settingValue: agencySettings.settingValue }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
    const existingRequest = existing ? parsePrivacyDeletionRequest(existing.settingValue) : null;
    if (existingRequest?.status === "pending") return { success: true, alreadyPending: true };

    const request: PrivacyDeletionRequest = { candidateId: ctx.candidate.id, email: ctx.candidate.email, fullName: ctx.candidate.fullName, requestedAt: new Date().toISOString(), status: "pending" };
    if (existing) await db.update(agencySettings).set({ settingValue: JSON.stringify(request) }).where(eq(agencySettings.id, existing.id));
    else await db.insert(agencySettings).values({ settingKey: key, settingValue: JSON.stringify(request) });

    await notifyAdmins({ type: "new_contact_message", title: "Demande de suppression de compte", message: `${ctx.candidate.fullName} (${ctx.candidate.email}) demande la suppression de son compte.`, relatedId: String(ctx.candidate.id), targetAdminType: "accompagnement" });
    let acknowledged = false;
    try {
      const ack = buildDeletionRequestAckEmail({ fullName: ctx.candidate.fullName, whatsappDisplay: COMPANY_PROFILE.offices.cameroon.whatsappDisplay });
      await sendEmail({ to: ctx.candidate.email, subject: ack.subject, html: ack.html });
      acknowledged = true;
    } catch (error) {
      console.error("[CandidatePrivacy] deletion request acknowledgement failed", error);
    }
    return { success: true, alreadyPending: false, acknowledged };
  }),

  // ─── Côté administration ──────────────────────────────────────────────────────────────────────────────────────

  /** Demandes de suppression en attente, pour que l'équipe les traite manuellement. */
  listDeletionRequests: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const rows = await db.select({ settingKey: agencySettings.settingKey, settingValue: agencySettings.settingValue }).from(agencySettings).where(like(agencySettings.settingKey, `${PRIVACY_DELETION_REQUEST_PREFIX}%`)).limit(500);
      const parsed = rows.map((row) => parsePrivacyDeletionRequest(row.settingValue)).filter((request): request is PrivacyDeletionRequest => Boolean(request));
      return parsed.filter((request) => request.status === "pending").sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
    }),

  /** Clôt une demande avec une réponse au candidat ; n'exécute aucune suppression elle-même. */
  resolveDeletionRequest: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.number().int().positive(), note: z.string().trim().max(1000).default("") }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await requireDb();
      const key = privacyDeletionRequestKey(input.candidateId);
      const [existing] = await db.select({ id: agencySettings.id, settingValue: agencySettings.settingValue }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
      const request = existing ? parsePrivacyDeletionRequest(existing.settingValue) : null;
      if (!existing || !request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de suppression introuvable." });
      if (request.status === "done") return { success: true, alreadyHandled: true, notified: false };
      const resolved: PrivacyDeletionRequest = { ...request, status: "done", handledBy: admin.email, handledAt: new Date().toISOString(), note: input.note };
      await db.update(agencySettings).set({ settingValue: JSON.stringify(resolved) }).where(eq(agencySettings.id, existing.id));
      let notified = false;
      try {
        const email = buildDeletionRequestHandledEmail({ fullName: request.fullName, note: input.note });
        await sendEmail({ to: request.email, subject: email.subject, html: email.html });
        notified = true;
      } catch (error) {
        console.error("[CandidatePrivacy] deletion request resolution notification failed", error);
      }
      return { success: true, alreadyHandled: false, notified };
    }),
});
