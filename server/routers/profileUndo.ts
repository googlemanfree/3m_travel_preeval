import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { agencySettings, applications, candidates } from "../../drizzle/schema";
import { isActivatedStatus } from "../../shared/candidateStatus";
import { UNDO_ACTIONS_FOR_ROUTER, availableUndos, validateUndoRequest, type ProfileFacts, type UndoAction } from "../../shared/profileUndo";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getOpeningPaymentEvidence } from "../services/openingPaymentEvidence";
import { deactivateCandidateDossier } from "../services/deactivateDossier";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireSuperAdminSession, requireValidAdminSession } from "./adminAuth";

const session = z.string().min(1).max(512);
type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const DECISION_PREFIX = "evaluation_decision:";

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

async function loadState(db: Db, candidateId: number) {
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte introuvable." });
  const [application] = await db.select().from(applications).where(eq(applications.candidateId, candidateId)).orderBy(desc(applications.createdAt)).limit(1);
  let advisorValidated = false;
  try { advisorValidated = JSON.parse(application?.scoringDetails || "{}")?.adminDraft?.advisorValidated === true; } catch { /* brouillon illisible : considéré non validé */ }
  const [decisionRow] = application ? await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, `${DECISION_PREFIX}${application.id}`)).limit(1) : [];
  const evidence = await getOpeningPaymentEvidence(db, { id: candidate.id, email: candidate.email }).catch(() => ({ ok: false as const }));
  const facts: ProfileFacts = {
    bilanSent: application?.evaluationDeliveryStatus === "sent",
    advisorValidated,
    hasClientDecision: Boolean(decisionRow),
    openingRequested: Boolean(application?.activationRequestedAt),
    activated: isActivatedStatus(candidate.dossierStatus),
    paid: application?.paymentStatus === "SUCCESS" || Boolean((evidence as { ok?: boolean }).ok),
    evaluationDeclared: candidate.evaluationDeclarationStatus !== "not_declared",
    reopenable: application?.evaluationDeliveryStatus === "sent" && application.paymentStatus !== "SUCCESS" && ["bilan_envoye", "en_attente_paiement"].includes(application.dossierStatus),
  };
  return { candidate, application: application ?? null, facts, decisionId: decisionRow?.id ?? null };
}

export const profileUndoRouter = router({
  /** Ce qui peut être annulé pour ce compte, d'après son état réel. */
  options: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { candidate, facts } = await loadState(db, input.candidateId);
    return { fullName: candidate.fullName, facts, options: availableUndos(facts) };
  }),

  run: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive(), action: z.enum(UNDO_ACTIONS_FOR_ROUTER), reason: z.string().trim().max(500), confirmation: z.string().trim().max(40).nullish() })).mutation(async ({ input }) => {
    // Authentification d'abord : aucune lecture de la base ni message d'erreur propre au compte avant d'avoir vérifié la session.
    const baseAdmin = await requireValidAdminSession(input.sessionToken);
    const action = input.action as UndoAction;
    const problem = validateUndoRequest({ reason: input.reason, action, confirmation: input.confirmation });
    if (problem) throw new TRPCError({ code: "BAD_REQUEST", message: problem });
    const db = await requireDb();
    const { candidate, application, facts, decisionId } = await loadState(db, input.candidateId);
    const option = availableUndos(facts).find((item) => item.action === action);
    if (!option) throw new TRPCError({ code: "CONFLICT", message: "Cette annulation n'est plus possible : l'état du compte a changé." });
    const admin = option.superAdminOnly ? await requireSuperAdminSession(input.sessionToken) : baseAdmin;
    const done: string[] = [];
    const actorEmail = admin.email ?? adminLabel(admin);

    const undoDecision = async () => {
      if (!application) return;
      if (decisionId) await db.delete(agencySettings).where(eq(agencySettings.id, decisionId));
      if (application.activationRequestedAt || application.paymentOpeningRequestedAt) {
        await db.update(applications).set({ activationRequestedAt: null, paymentOpeningRequestedAt: null, ...(application.dossierStatus === "en_attente_paiement" ? { dossierStatus: "bilan_envoye" as const } : {}), updatedAt: new Date() }).where(eq(applications.id, application.id));
      }
      done.push("réponse du candidat annulée");
    };
    const undoValidation = async () => {
      if (!application || facts.bilanSent) return;
      try {
        const details = JSON.parse(application.scoringDetails || "{}");
        if (details.adminDraft) {
          details.adminDraft = { ...details.adminDraft, advisorValidated: false, advisorValidatedAt: null, advisorValidatedByAdminId: null };
          await db.update(applications).set({ scoringDetails: JSON.stringify(details), updatedAt: new Date() }).where(eq(applications.id, application.id));
          done.push("validation du bilan annulée");
        }
      } catch { /* brouillon illisible : rien à annuler */ }
    };
    const reopenBilan = async () => {
      if (!application || !facts.reopenable) return;
      let scoringDetails = application.scoringDetails;
      try {
        const details = JSON.parse(application.scoringDetails || "{}");
        if (details.adminDraft) scoringDetails = JSON.stringify({ ...details, adminDraft: { ...details.adminDraft, advisorValidated: false, advisorValidatedAt: null, advisorValidatedByAdminId: null } });
      } catch { /* brouillon illisible : conservé tel quel */ }
      if (decisionId) await db.delete(agencySettings).where(eq(agencySettings.id, decisionId));
      await db.update(applications).set({ evaluationDeliveryStatus: "draft", evaluationReportViewedAt: null, evaluationClientConfirmedAt: null, activationRequestedAt: null, paymentOpeningRequestedAt: null, dossierStatus: "en_evaluation", scoringDetails, updatedAt: new Date() }).where(eq(applications.id, application.id));
      done.push("bilan rouvert pour correction (versions précédentes conservées)");
    };
    const undoActivation = async () => {
      const result = await deactivateCandidateDossier(db, { candidateId: candidate.id, actorEmail, reason: input.reason });
      if (result.ok) done.push("activation annulée (compte repassé en pré-compte)");
    };

    if (action === "undo_client_decision") await undoDecision();
    else if (action === "undo_advisor_validation") await undoValidation();
    else if (action === "reopen_bilan") await reopenBilan();
    else if (action === "undo_activation") await undoActivation();
    else {
      if (facts.activated) await undoActivation();
      if (facts.hasClientDecision || facts.openingRequested) await undoDecision();
      if (facts.advisorValidated && !facts.bilanSent) await undoValidation();
      if (facts.evaluationDeclared) {
        await db.update(candidates).set({ evaluationDeclarationStatus: "not_declared", evaluationReviewedAt: null, evaluationReviewedBy: null, evaluationReviewNote: null }).where(eq(candidates.id, candidate.id));
        done.push("déclaration d'évaluation effacée");
      }
      if (candidate.dossierStatus === "evaluation") {
        await db.update(candidates).set({ dossierStatus: "nouveau" }).where(eq(candidates.id, candidate.id));
        done.push("statut remis à « nouveau »");
      }
    }
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: `profile.${action}`, resourceType: "candidate", resourceId: candidate.id, details: `${input.reason.slice(0, 200)} — ${done.join(" ; ") || "rien à modifier"}` });
    return { ok: true as const, done, message: done.length ? `Fait : ${done.join(", ")}.` : "Rien à modifier : l'état était déjà à jour." };
  }),
});
