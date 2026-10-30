import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { adminNotifications, agencySettings, applications } from "../../drizzle/schema";
import { DECLINE_REASONS, DECLINE_REASON_KEYS, type DeclineReason } from "../../shared/evaluationDecision";
import { router } from "../_core/trpc";
import { getDb } from "../db";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { candidateProcedure, candidateRouter } from "./candidate";

/**
 * Réponse du candidat à son bilan : « Je valide et j'ouvre mon dossier » ou « Je ne valide pas ».
 * Valider reprend les deux étapes existantes (confirmer la réception du bilan, demander l'ouverture) en un clic ; le paiement des frais d'ouverture
 * et la preuve de paiement restent obligatoires pour l'activation. Refuser ne ferme rien : l'équipe est prévenue et le candidat peut changer d'avis.
 */
export const DECISION_KEY_PREFIX = "evaluation_decision:";
export type StoredDecision = { decision: "accepted" | "declined"; reason: DeclineReason | null; comment: string | null; at: string };

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

async function latestApplication(db: Db, candidateId: number) {
  const [application] = await db.select().from(applications).where(eq(applications.candidateId, candidateId)).orderBy(desc(applications.createdAt)).limit(1);
  return application ?? null;
}

async function readDecision(db: Db, applicationId: number): Promise<StoredDecision | null> {
  try {
    const [row] = await db.select({ settingValue: agencySettings.settingValue }).from(agencySettings).where(eq(agencySettings.settingKey, `${DECISION_KEY_PREFIX}${applicationId}`)).limit(1);
    if (!row?.settingValue) return null;
    const parsed = JSON.parse(row.settingValue) as StoredDecision;
    return parsed && (parsed.decision === "accepted" || parsed.decision === "declined") ? parsed : null;
  } catch {
    return null;
  }
}

async function writeDecision(db: Db, applicationId: number, value: StoredDecision) {
  const key = `${DECISION_KEY_PREFIX}${applicationId}`;
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
  if (existing) await db.update(agencySettings).set({ settingValue: JSON.stringify(value) }).where(eq(agencySettings.id, existing.id));
  else await db.insert(agencySettings).values({ settingKey: key, settingValue: JSON.stringify(value) });
}

async function tellAdmins(db: Db, input: { title: string; message: string; relatedId: string }) {
  try {
    await db.insert(adminNotifications).values({ type: "new_evaluation", title: input.title.slice(0, 255), message: input.message.slice(0, 1000), relatedId: input.relatedId.slice(0, 100), targetAdminType: null, isRead: false });
  } catch { /* la réponse du candidat est enregistrée même si l'alerte interne échoue */ }
}

export const evaluationDecisionRouter = router({
  /** État de la réponse au bilan : rien à répondre tant que le bilan n'a pas été envoyé. */
  myDecision: candidateProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const application = await latestApplication(db, ctx.candidate.id);
    const sent = application?.evaluationDeliveryStatus === "sent";
    if (!application || !sent) return { sent: false as const, decision: null, reason: null, at: null, opening: false };
    const stored = await readDecision(db, application.id);
    return {
      sent: true as const,
      decision: stored?.decision ?? null,
      reason: stored?.reason ?? null,
      at: stored?.at ?? null,
      opening: Boolean(application.activationRequestedAt) || stored?.decision === "accepted",
    };
  }),

  /** « Je valide et j'ouvre mon dossier » : confirme la réception du bilan puis demande l'ouverture (paiement d'ouverture et rendez-vous). */
  accept: candidateProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    const application = await latestApplication(db, ctx.candidate.id);
    if (!application || application.evaluationDeliveryStatus !== "sent") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Votre bilan n'a pas encore été envoyé." });
    const caller = candidateRouter.createCaller(ctx as never);
    const confirmed = await caller.confirmEvaluationReceipt();
    const activation = await caller.requestDossierActivation();
    const previous = await readDecision(db, application.id);
    await writeDecision(db, application.id, { decision: "accepted", reason: null, comment: null, at: new Date().toISOString() });
    if (previous?.decision !== "accepted") {
      await tellAdmins(db, {
        title: "Bilan validé : ouverture de dossier demandée",
        message: `${ctx.candidate.fullName} (${application.dossierNumber}) valide son bilan et demande l'ouverture de son dossier. Prochaine étape : frais d'ouverture, preuve de paiement puis pièces.`,
        relatedId: `evaluation_decision:${application.id}`,
      });
      try {
        await recordPrivacyEvent(db, { actorType: "candidate", actorId: ctx.candidate.id, actorLabel: ctx.candidate.fullName, action: "evaluation.accepted", resourceType: "application", resourceId: application.id, details: "Bilan validé par le candidat, ouverture du dossier demandée" });
      } catch { /* journal facultatif */ }
    }
    return { ok: true as const, alreadyAccepted: previous?.decision === "accepted", message: activation.message ?? confirmed.message };
  }),

  /** « Je ne valide pas » : l'équipe est prévenue pour rappeler le candidat ; rien n'est fermé et il peut valider plus tard. */
  decline: candidateProcedure
    .input(z.object({ reason: z.enum(DECLINE_REASON_KEYS), comment: z.string().trim().max(500).nullish().transform((value) => value || null) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const application = await latestApplication(db, ctx.candidate.id);
      if (!application || application.evaluationDeliveryStatus !== "sent") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Votre bilan n'a pas encore été envoyé." });
      const previous = await readDecision(db, application.id);
      if (previous?.decision === "accepted" || application.activationRequestedAt) throw new TRPCError({ code: "CONFLICT", message: "L'ouverture de votre dossier est déjà demandée : contactez votre conseiller pour la modifier." });
      await writeDecision(db, application.id, { decision: "declined", reason: input.reason, comment: input.comment, at: new Date().toISOString() });
      await tellAdmins(db, {
        title: "Bilan non validé : à rappeler",
        message: `${ctx.candidate.fullName} (${application.dossierNumber}) ne valide pas son bilan. Motif : ${DECLINE_REASONS[input.reason]}.${input.comment ? ` Précision : ${input.comment}` : ""}`,
        relatedId: `evaluation_decision:${application.id}`,
      });
      return { ok: true as const };
    }),
});
