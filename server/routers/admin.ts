/**
 * Routeur tRPC — Gestion Admin Spécialisée
 * Permet de gérer les 3 types d'admins : Évaluation, Accompagnement, Procédures
 */

import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { richTextToPlainText, sanitizeRichTextHtml } from "../services/richText";
import { emailErrorPatterns, summarizeEmailDeliveryLogs } from "../services/emailDelivery";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { evaluations, users, applications, profileEvaluations, aiReportHistory, clientDocuments, candidateFiles, candidates, agencyDossiers, bilans, adminActivityLogs, emailDeliveryLogs, advisorAlertThresholds, emailDeliveryIncidents, incidentComments, passportVerificationAudits, cases, caseDocuments, documentRequirements, caseTasks, caseAdminNotes, caseActivityLogs, caseStatusHistory, clientNotifications, candidateMessages, adminAccounts, unifiedClientRequests, unifiedClientRequestHistory, evaluationBilanVersions } from "../../drizzle/schema";
// (imports précédemment retirés par erreur lors d'un nettoyage — tables réellement utilisées ci-dessous, restaurées)
import { sendEmail as sendGenericEmail, SendEmailOptions } from "../_core/email";
import { createEvisaCommunicationSnapshot } from "../services/evisaCommunicationSnapshot";
import { listDestinationDocuments, addDestinationDocument, deleteDestinationDocument } from "../destinationDocumentService";
import { storagePut } from "../storage";
import { ADMIN_DOCUMENT_TYPES, suggestAdminDocumentMetadata } from "../services/adminDocumentRecognitionAssistant";
import { eq, desc, asc, like, or, and, isNull, isNotNull, inArray } from "drizzle-orm";

export type CandidateActivationStatus = "active" | "pending" | "expired" | "failed" | "not_registered";

/** Masque les coordonnées dans les aperçus de remise consultés au back-office. */
export function redactEmailPreviewHtml(contentPreviewHtml: string | null | undefined) {
  return (contentPreviewHtml ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail masqué]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[numéro masqué]");
}

// Alias public conservé pour les intégrations administratives historiques.
export const saveEmailDeliveryAdvisorThreshold = "Seuil d’échecs e-mail atteint";

/** Compare les remises des sept derniers jours, sans exposer de contenu d’e-mail. */
export function weeklySuccessRateComparison(logs: Array<{ status: string; createdAt: Date }>) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekly = logs.filter((log) => log.createdAt.getTime() >= cutoff);
  const total = weekly.length;
  const sent = weekly.filter((log) => log.status === "sent").length;
  return { total, sent, successRate: total ? Math.round((sent / total) * 100) : 0 };
}

export function dailyFailures(logs: Array<{ status: string; createdAt: Date }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return logs.filter((log) => log.status === "failed" && log.createdAt.getTime() >= today.getTime()).length;
}

export function deliverySuccessRates30Days(logs: Array<{ status: string; createdAt: Date }>) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = logs.filter((log) => log.createdAt.getTime() >= cutoff);
  const sent = recent.filter((log) => log.status === "sent").length;
  return { total: recent.length, sent, successRate: recent.length ? Math.round((sent / recent.length) * 100) : 0 };
}

export function lastSuccessfulByType(logs: Array<{ status: string; createdAt: Date; deliveryType?: string | null }>) {
  return logs.filter((log) => log.status === "sent").reduce<Record<string, Date>>((result, log) => {
    const type = log.deliveryType ?? "general";
    if (!result[type] || result[type].getTime() < log.createdAt.getTime()) result[type] = log.createdAt;
    return result;
  }, {});
}

export const resendFailedEmailsBulkContract = z.object({ logIds: z.array(z.number().int().positive()).max(25), confirmed: z.literal(true) });
export const resendFailedEmailsBulk = "resendFailedEmailsBulk";
export const EMAIL_DELIVERY_DEMO_ARCHIVE_LABEL = "ARCHIVÉ DÉMONSTRATION REMISE E-MAIL";
export const EMAIL_DELIVERY_DEMO_NOTE = "Ne pas utiliser pour un client";

export function classifyEmailDeliveryType(subject: string, explicitType?: string | null) {
  if (explicitType) return explicitType;
  const normalized = subject.toLowerCase();
  if (normalized.includes("assurance")) return "insurance";
  if (normalized.includes("visa")) return "evisa";
  if (normalized.includes("billet") || normalized.includes("pnr")) return "flight";
  if (normalized.includes("évaluation")) return "evaluation";
  return "general";
}

export function deriveCandidateActivationStatus(
  candidate: { emailVerified: boolean; verificationToken?: string | null; verificationExpiresAt?: Date | null },
  latestActivationEmail?: { status?: string | null },
  now = new Date(),
): CandidateActivationStatus {
  if (candidate.emailVerified) return "active";
  if (latestActivationEmail?.status === "failed") return "failed";
  if (candidate.verificationExpiresAt && candidate.verificationExpiresAt.getTime() <= now.getTime()) return "expired";
  if (candidate.verificationToken) return "pending";
  return "not_registered";
}

export function parseAdminCandidateReference(reference: string): { source: "online" | "agency"; id: number } | null {
  const match = /^(online|agency)_(\d+)$/.exec(reference.trim());
  if (!match) return null;
  const id = Number(match[2]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return { source: match[1] as "online" | "agency", id };
}

const candidate360WorkflowStatuses = ["new", "qualifying", "waiting_customer", "documents_review", "payment_review", "processing", "submitted", "completed", "closed", "rejected"] as const;

/**
 * Source-of-truth mapping for the client space. The 360° case status is an
 * operational status, while applications and agency_dossiers use legacy
 * business statuses. Both records must move together when an admin advances a
 * case from the office workspace.
 */
export const CANDIDATE360_LEGACY_STATUS_MAP = {
  new: { application: "nouveau", agency: "nouveau", label: "Dossier créé" },
  qualifying: { application: "en_evaluation", agency: "en_cours", label: "Évaluation en cours" },
  waiting_customer: { application: "en_attente_documents", agency: "documents_requis", label: "Action attendue du candidat" },
  documents_review: { application: "en_attente_documents", agency: "documents_requis", label: "Documents à compléter" },
  payment_review: { application: "en_attente_paiement", agency: "en_cours", label: "Paiement à confirmer" },
  processing: { application: "en_cours_recrutement", agency: "en_cours", label: "Dossier en traitement" },
  submitted: { application: "soumis_agences", agency: "soumis", label: "Dossier soumis" },
  completed: { application: "visa_approuve", agency: "approuve", label: "Dossier approuvé" },
  closed: { application: "visa_approuve", agency: "approuve", label: "Dossier clôturé" },
  rejected: { application: "refuse", agency: "refuse", label: "Dossier à revoir" },
} as const;

export function mapCandidate360Status(status: (typeof candidate360WorkflowStatuses)[number], source: "online" | "agency") {
  return CANDIDATE360_LEGACY_STATUS_MAP[status][source === "online" ? "application" : "agency"];
}

const COUNTRY_DOCUMENT_CHECKLISTS: Record<string, Array<{ documentType: string; comment: string }>> = {
  canada: [
    { documentType: "Passeport", comment: "Passeport valide couvrant la durée prévue du séjour." },
    { documentType: "CV", comment: "CV détaillé et à jour, adapté au projet." },
    { documentType: "Test linguistique", comment: "Résultat officiel TCF/TEF ou IELTS si applicable." },
    { documentType: "Diplômes et relevés", comment: "Copies lisibles des diplômes et relevés académiques." },
    { documentType: "Justificatifs financiers", comment: "Relevés bancaires et preuves de fonds selon le programme." },
    { documentType: "Casier judiciaire", comment: "Extrait de casier judiciaire récent, selon les exigences en vigueur." },
  ],
  luxembourg: [
    { documentType: "Passeport", comment: "Passeport valide et pages d’identité lisibles." },
    { documentType: "CV", comment: "CV détaillé en français ou en anglais." },
    { documentType: "Diplômes et certifications", comment: "Diplômes, équivalences et attestations professionnelles." },
    { documentType: "Justificatifs d’expérience", comment: "Attestations d’emploi ou certificats de travail." },
    { documentType: "Assurance médicale", comment: "Assurance couvrant la période de séjour selon la procédure." },
    { documentType: "Justificatif d’hébergement", comment: "Réservation ou attestation d’hébergement si requis." },
  ],
  default: [
    { documentType: "Passeport", comment: "Passeport valide, lisible et couvrant la durée du projet." },
    { documentType: "Photo d’identité", comment: "Photo récente, nette et conforme aux exigences de la destination." },
    { documentType: "CV", comment: "CV à jour mettant en valeur l’expérience pertinente." },
    { documentType: "Justificatifs financiers", comment: "Preuves de ressources selon la destination et la procédure." },
    { documentType: "Documents civils", comment: "Acte de naissance, mariage ou documents familiaux si applicables." },
  ],
};

const PROCEDURE_DOCUMENT_CHECKLISTS: Record<string, { label: string; documents: Array<{ documentType: string; comment: string }> }> = {
  permanent_residence: { label: "Résidence permanente", documents: [{ documentType: "Formulaires d’immigration", comment: "Formulaires officiels complétés selon le programme retenu." }, { documentType: "Évaluation des diplômes", comment: "Évaluation WES, ENIC-NARIC ou équivalent lorsque le programme l’exige." }, { documentType: "Preuves d’expérience qualifiée", comment: "Attestations d’emploi détaillant les fonctions, la période et la rémunération." }] },
  work_permit: { label: "Visa / permis de travail", documents: [{ documentType: "Offre d’emploi ou contrat", comment: "Offre signée, contrat ou référence employeur lorsque disponible." }, { documentType: "Certificats professionnels", comment: "Certificats, licences ou formations liés au poste visé." }, { documentType: "Attestations d’emploi", comment: "Justificatifs d’expérience professionnelle correspondant au métier." }] },
  study_permit: { label: "Études", documents: [{ documentType: "Lettre d’admission", comment: "Lettre d’admission ou preuve d’inscription de l’établissement." }, { documentType: "Projet d’études", comment: "Lettre motivant le choix de formation et le projet professionnel." }, { documentType: "Preuves de prise en charge", comment: "Ressources du répondant financier et preuves de lien si applicable." }] },
  visitor_visa: { label: "Visite / tourisme", documents: [{ documentType: "Itinéraire de voyage", comment: "Dates, hébergement et programme de séjour cohérents." }, { documentType: "Preuves d’attaches", comment: "Emploi, activité, famille ou biens démontrant le retour prévu." }, { documentType: "Lettre d’invitation", comment: "À fournir lorsqu’un hôte ou un proche reçoit le candidat." }] },
  family_reunification: { label: "Regroupement familial", documents: [{ documentType: "Preuve du lien familial", comment: "Acte de mariage, naissance ou autre preuve officielle du lien." }, { documentType: "Statut du répondant", comment: "Titre de séjour, passeport ou justificatif de statut du proche à l’étranger." }, { documentType: "Preuves de ressources du répondant", comment: "Revenus, logement et prise en charge selon les règles applicables." }] },
  evisa: { label: "e‑Visa / autorisation électronique", documents: [{ documentType: "Réservation de voyage", comment: "Vol, hébergement ou itinéraire selon le portail officiel." }, { documentType: "Assurance voyage", comment: "Assurance médicale conforme à la durée et à la destination." }, { documentType: "Photo numérique", comment: "Photo récente conforme au format électronique du portail." }] },
};

export function countryChecklistFor(destination?: string | null) {
  const normalized = String(destination || "").trim().toLowerCase();
  if (normalized.includes("canada")) return COUNTRY_DOCUMENT_CHECKLISTS.canada;
  if (normalized.includes("luxembourg")) return COUNTRY_DOCUMENT_CHECKLISTS.luxembourg;
  return COUNTRY_DOCUMENT_CHECKLISTS.default;
}

export function procedureChecklistFor(procedureType?: string | null, destination?: string | null) {
  const countryDocuments = countryChecklistFor(destination);
  const template = procedureType ? PROCEDURE_DOCUMENT_CHECKLISTS[procedureType] : undefined;
  const unique = new Map([...countryDocuments, ...(template?.documents ?? [])].map((item) => [item.documentType.toLowerCase(), item]));
  return { label: template?.label ?? "Procédure standard", documents: Array.from(unique.values()) };
}

export function parseCandidate360Labels(value: string | null | undefined) {
  try {
    const labels = JSON.parse(value ?? "[]");
    return Array.isArray(labels) ? labels.filter((label): label is string => typeof label === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}

function parseEvaluationProjectDetails(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function determineCandidate360NextAction(input: { workflowStatus: string; paymentStatus?: string | null; pendingDocuments: number; openTasks: number; dueAt?: Date | null }) {
  if (input.paymentStatus && !["SUCCESS", "success", "completed", "paye"].includes(input.paymentStatus)) {
    return { key: "payment", label: "Vérifier le paiement", description: "Le paiement ou son justificatif doit être contrôlé avant la suite du dossier.", urgency: "high" as const };
  }
  if (input.pendingDocuments > 0) {
    return { key: "documents", label: "Contrôler les documents", description: `${input.pendingDocuments} pièce(s) requise(s) restent à recevoir ou valider.`, urgency: "high" as const };
  }
  if (input.workflowStatus === "new" || input.workflowStatus === "qualifying") {
    return { key: "evaluation", label: "Préparer l’évaluation", description: "Qualifier le projet, compléter le bilan puis choisir l’envoi immédiat ou programmé.", urgency: "normal" as const };
  }
  if (input.openTasks > 0) {
    return { key: "task", label: "Terminer les actions ouvertes", description: `${input.openTasks} action(s) opérationnelle(s) restent à traiter.`, urgency: "normal" as const };
  }
  if (input.workflowStatus === "submitted") {
    return { key: "partner", label: "Suivre la soumission", description: "Relancer le partenaire ou consigner la décision reçue.", urgency: "normal" as const };
  }
  return { key: "follow_up", label: "Planifier le suivi", description: "Le dossier est à jour. Programmez la prochaine relance ou clôturez le traitement.", urgency: "low" as const };
}

async function ensureOperationalCase(db: any, reference: { source: "online" | "agency"; id: number }) {
  const [existing] = await db.select().from(cases).where(reference.source === "online" ? eq(cases.legacyApplicationId, reference.id) : eq(cases.legacyAgencyDossierId, reference.id)).limit(1);
  if (existing) return existing;

  if (reference.source === "online") {
    const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
    if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
    await db.insert(cases).values({
      caseNumber: application.dossierNumber,
      candidateId: application.candidateId,
      legacyApplicationId: application.id,
      sourceChannel: "online",
      countryTarget: application.destination,
      caseType: application.formulaChosen,
      visaType: application.visaType,
      currentStatus: application.dossierStatus,
      openedAt: application.createdAt,
    });
    const [created] = await db.select().from(cases).where(eq(cases.legacyApplicationId, application.id)).limit(1);
    if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Création du dossier opérationnel impossible." });
    return created;
  }

  const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
  if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
  const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, dossier.email)).limit(1);
  const caseNumber = `3M-AGN-${dossier.id.toString().padStart(4, "0")}`;
  await db.insert(cases).values({
    caseNumber,
    candidateId: candidate?.id ?? null,
    legacyAgencyDossierId: dossier.id,
    sourceChannel: "agency_manual",
    countryTarget: dossier.destination,
    caseType: "integral",
    visaType: dossier.visaType,
    currentStatus: dossier.status,
    openedAt: dossier.createdAt,
  });
  const [created] = await db.select().from(cases).where(eq(cases.legacyAgencyDossierId, dossier.id)).limit(1);
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Création du dossier opérationnel impossible." });
  return created;
}

export const adminRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN ÉVALUATION — Gestion des CV et rapports IA
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les rapports IA en attente de révision
   */
  getEvaluationPendingReports: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const reports = await db
          .select()
          .from(aiReportHistory)
          .where(eq(aiReportHistory.sendStatus, "pending"))
          .orderBy(desc(aiReportHistory.createdAt))
          .limit(50);

        const evals = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.status, "pending"))
          .orderBy(desc(evaluations.createdAt))
          .limit(50);

        return {
          success: true,
          reports,
          evaluations: evals,
          count: reports.length + evals.length,
        };
      } catch (err) {
        console.error("[Admin Evaluation] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des rapports",
        });
      }
    }),

  /**
   * Récupérer les statistiques d'évaluation
   */
  getEvaluationStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allReports = await db.select().from(aiReportHistory);
        const sentReports = allReports.filter(r => r.sendStatus === "sent");
        const failedReports = allReports.filter(r => r.sendStatus === "failed");
        const pendingReports = allReports.filter(r => r.sendStatus === "pending");

        return {
          success: true,
          stats: {
            total: allReports.length,
            sent: sentReports.length,
            failed: failedReports.length,
            pending: pendingReports.length,
            successRate: allReports.length > 0 ? Math.round((sentReports.length / allReports.length) * 100) : 0,
          },
        };
      } catch (err) {
        console.error("[Admin Evaluation Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN ACCOMPAGNEMENT — Gestion de l'avancement des dossiers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Avancer rapidement le statut d'une évaluation
   */
  advanceEvaluationStatus: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      evaluationId: z.number().int(),
      newStatus: z.enum(["pending", "reviewed", "contacted", "closed"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const eval_ = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        await db
          .update(evaluations)
          .set({
            status: input.newStatus,
          })
          .where(eq(evaluations.id, input.evaluationId));

        return {
          success: true,
          message: `Évaluation avancée au statut: ${input.newStatus}`,
        };
      } catch (err) {
        console.error("[Admin Advance] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'avancement de l'évaluation",
        });
      }
    }),

  /**
   * Récupérer les évaluations en attente de contact
   */
  getEvaluationsAwaitingContact: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.status, "reviewed"))
          .orderBy(desc(evaluations.updatedAt))
          .limit(50);

        return {
          success: true,
          evaluations: evals,
          count: evals.length,
        };
      } catch (err) {
        console.error("[Admin Contact] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des évaluations",
        });
      }
    }),

  /**
   * Ajouter des notes à une évaluation
   */
  addEvaluationNotes: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      evaluationId: z.number().int(),
      notes: z.string().min(10),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const eval_ = await db
          .select()
          .from(evaluations)
          .where(eq(evaluations.id, input.evaluationId))
          .limit(1);

        if (eval_.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation non trouvée" });
        }

        const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' });
        const newNote = `[${timestamp}] ${input.notes}`;

        return {
          success: true,
          message: "Note ajoutée à l'évaluation",
        };
      } catch (err) {
        console.error("[Admin Notes] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'ajout de notes",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN PROCÉDURES — Gestion des procédures par pays
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les statistiques par destination
   */
  getEvaluationsByDestination: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db.select().from(evaluations);

        // Grouper par destination
        const byDestination: Record<string, any> = {};
        evals.forEach(eval_ => {
          const dest = eval_.destinationCountry || "Non spécifiée";
          if (!byDestination[dest]) {
            byDestination[dest] = {
              destination: dest,
              total: 0,
              pending: 0,
              reviewed: 0,
              contacted: 0,
              closed: 0,
            };
          }
          byDestination[dest].total++;
          byDestination[dest][eval_.status]++;
        });

        return {
          success: true,
          destinations: Object.values(byDestination),
        };
      } catch (err) {
        console.error("[Admin Procedures] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques",
        });
      }
    }),

  /**
   * Récupérer les évaluations par destination
   */
  getEvaluationsByDestinationName: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      destination: z.string(),
      status: z.enum(["pending", "reviewed", "contacted", "closed"]).optional(),
    }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        let query: any = db.select().from(evaluations).where(eq(evaluations.destinationCountry, input.destination));

        if (input.status) {
          query = query.where(eq(evaluations.status, input.status));
        }

        const evals = await query.orderBy(desc(evaluations.createdAt)).limit(100);

        return {
          success: true,
          evaluations: evals,
          count: evals.length,
        };
      } catch (err) {
        console.error("[Admin Destination] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des évaluations",
        });
      }
    }),

  /**
   * Récupérer les statistiques du dashboard admin
   * Retourne : pending, reviewed, contacted, closed
   */
  getDashboardStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allEvals = await db.select().from(evaluations);
        
        return {
          success: true,
          stats: {
            pending: allEvals.filter(e => e.status === "pending").length,
            reviewed: allEvals.filter(e => e.status === "reviewed").length,
            contacted: allEvals.filter(e => e.status === "contacted").length,
            closed: allEvals.filter(e => e.status === "closed").length,
            total: allEvals.length,
          },
        };
      } catch (err) {
        console.error("[Admin Dashboard Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques du dashboard",
        });
      }
    }),

  /**
   * Récupérer les statistiques globales
   */
  getGlobalStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const evals = await db.select().from(evaluations);
        const reports = await db.select().from(aiReportHistory);

        const stats = {
          totalEvaluations: evals.length,
          evaluationsByStatus: {
            pending: evals.filter(e => e.status === "pending").length,
            reviewed: evals.filter(e => e.status === "reviewed").length,
            contacted: evals.filter(e => e.status === "contacted").length,
            closed: evals.filter(e => e.status === "closed").length,
          },
          aiReports: {
            total: reports.length,
            sent: reports.filter(r => r.sendStatus === "sent").length,
            failed: reports.filter(r => r.sendStatus === "failed").length,
            pending: reports.filter(r => r.sendStatus === "pending").length,
          },
          conversionRate: evals.length > 0 ? Math.round((evals.filter(e => e.status !== "pending").length / evals.length) * 100) : 0,
        };

        return {
          success: true,
          stats,
        };
      } catch (err) {
        console.error("[Admin Global Stats] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques globales",
        });
      }
    }),

  /**
   * Valider un document
   */
  approveDocument: publicProcedure
    .input(z.object({ sessionToken: z.string(), documentId: z.number(), comment: z.string().optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const verifiedAt = new Date();
        await db
          .update(clientDocuments)
          .set({
            verificationStatus: "approved",
            verificationComment: input.comment || null,
            verifiedByAdmin: admin.email,
            verifiedAt,
          })
          .where(eq(clientDocuments.id, input.documentId));

        const [document] = await db
          .select({ evaluationId: clientDocuments.evaluationId })
          .from(clientDocuments)
          .where(eq(clientDocuments.id, input.documentId))
          .limit(1);
        await db.insert(passportVerificationAudits).values({
          documentId: input.documentId,
          applicationId: document?.evaluationId ?? null,
          adminEmail: admin.email,
          decision: "approved",
          comment: input.comment || null,
          createdAt: verifiedAt,
        });

        return { success: true, message: "Document approuvé", humanVerified: true, verifiedBy: admin.email, verifiedAt };
      } catch (err) {
        console.error("[Admin Approve Document] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'approbation du document",
        });
      }
    }),

  /**
   * Rejeter un document
   */
  rejectDocument: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      documentId: z.number(),
      comment: z.string().min(3),
      markerAnnotations: z.record(z.string(), z.string()).optional(),
      notifyCandidate: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const [document] = await db
          .select()
          .from(clientDocuments)
          .where(eq(clientDocuments.id, input.documentId))
          .limit(1);

        if (!document) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        }

        const existingIssues = document.readabilityIssues && typeof document.readabilityIssues === "object"
          ? document.readabilityIssues as Record<string, unknown>
          : {};
        const readabilityIssues = {
          ...existingIssues,
          adminAnnotations: input.markerAnnotations ?? (existingIssues as any).adminAnnotations ?? {},
          returnedToCandidateAt: new Date().toISOString(),
          returnedByAdmin: admin.email,
        };

        const verifiedAt = new Date();
        await db
          .update(clientDocuments)
          .set({
            verificationStatus: "rejected",
            status: "rejected",
            verificationComment: input.comment,
            verifiedByAdmin: admin.email,
            verifiedAt,
            readabilityIssues,
          })
          .where(eq(clientDocuments.id, input.documentId));

        await db.insert(passportVerificationAudits).values({
          documentId: input.documentId,
          applicationId: document.evaluationId,
          adminEmail: admin.email,
          decision: "rejected",
          comment: input.comment,
          createdAt: verifiedAt,
        });

        let notificationSent = false;
        if (input.notifyCandidate) {
          try {
            const annotationItems = Object.entries(input.markerAnnotations ?? {})
              .filter(([, value]) => value.trim().length > 0)
              .map(([markerId, value]) => `<li><strong>${markerId}</strong> : ${value}</li>`)
              .join("");
            await sendGenericEmail({
              to: document.candidateEmail,
              subject: "Action requise : votre document doit être corrigé — 3M Travel & Services",
              html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937">
                <div style="background:#1E3A8A;padding:24px;text-align:center;color:#fff"><h1 style="margin:0;font-size:22px">3M Travel & Services</h1></div>
                <div style="padding:28px"><p>Bonjour,</p><p>Votre document <strong>${document.documentName}</strong> nécessite une nouvelle version avant validation.</p>
                <div style="background:#fff7ed;border-left:4px solid #f97316;padding:14px;margin:18px 0"><strong>Commentaire du conseiller :</strong><br/>${input.comment}</div>
                ${annotationItems ? `<p><strong>Zones à corriger :</strong></p><ul>${annotationItems}</ul>` : ""}
                <p>Connectez-vous à votre espace pour consulter les annotations visuelles et remplacer le document.</p>
                <a href="https://www.3mtravelagency.com/documents" style="display:inline-block;background:#1E3A8A;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700">Accéder à mes documents</a>
                </div></div>`,
            });
            notificationSent = true;
          } catch (emailError) {
            console.error("[Admin Reject Document] Notification failed:", emailError);
          }
        }

        return { success: true, message: "Document rejeté", notificationSent, humanVerified: true, verifiedBy: admin.email, verifiedAt };
      } catch (err) {
        console.error("[Admin Reject Document] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du rejet du document",
        });
      }
    }),

  /** Enregistrer les commentaires d’un administrateur sur les marqueurs de lisibilité. */
  savePassportMarkerAnnotations: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      documentId: z.number(),
      annotations: z.record(z.string(), z.string().max(600)),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const [document] = await db.select().from(clientDocuments).where(eq(clientDocuments.id, input.documentId)).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });

      const current = document.readabilityIssues && typeof document.readabilityIssues === "object"
        ? document.readabilityIssues as Record<string, unknown>
        : {};
      const previousAnnotations = (current.adminAnnotations && typeof current.adminAnnotations === "object")
        ? current.adminAnnotations as Record<string, string>
        : {};
      const existingHistory = Array.isArray(current.annotationHistory) ? current.annotationHistory : [];
      const changes = Object.entries(input.annotations)
        .filter(([markerId, message]) => message.trim().length > 0 && previousAnnotations[markerId] !== message)
        .map(([markerId, message]) => ({
          markerId,
          message: message.trim(),
          author: admin.email,
          role: "admin",
          createdAt: new Date().toISOString(),
        }));
      await db.update(clientDocuments).set({
        readabilityIssues: {
          ...current,
          adminAnnotations: input.annotations,
          annotationHistory: [...existingHistory, ...changes],
          annotationUpdatedAt: new Date().toISOString(),
          annotationUpdatedBy: admin.email,
        },
      }).where(eq(clientDocuments.id, input.documentId));

      return { success: true, message: "Annotations enregistrées" };
    }),

  /**
   * Récupérer les détails complets d'un utilisateur avec tous ses dossiers et documents
   */
  getUserDetailsWithDocuments: publicProcedure
    .input(z.object({ sessionToken: z.string(), userId: z.number() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const user = await db.select().from(users).where(eq(users.id, input.userId));
        if (!user.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur non trouvé" });
        }

        const userApps = await db
          .select()
          .from(applications)
          .where(eq(applications.candidateId, input.userId));

        // Récupérer les documents pour chaque dossier
        const appsWithDocs = await Promise.all(
          userApps.map(async (app) => {
            return { ...app, documents: [] };
          })
        );

        return {
          success: true,
          user: user[0],
          applications: appsWithDocs,
        };
      } catch (err) {
        console.error("[Admin User Details] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des détails utilisateur",
        });
      }
    }),

  /**
   * Récupérer la liste des utilisateurs avec leurs dossiers
   */
  getAllUsersWithApplications: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      search: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allUsers = await db.select().from(users).limit(input.limit).offset(input.offset);

        // Récupérer les dossiers pour chaque utilisateur
        const usersWithApps = await Promise.all(
          allUsers.map(async (user) => {
            const userApps = await db
              .select()
              .from(applications)
              .where(eq(applications.candidateId, user.id));

            return {
              ...user,
              applications: userApps,
              applicationCount: userApps.length,
              lastApplication: userApps.length > 0 ? userApps[0] : null,
              email: user.email || "",
            };
          })
        );

        return {
          success: true,
          users: usersWithApps,
          total: allUsers.length,
        };
      } catch (err) {
        console.error("[Admin Users] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des utilisateurs",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // GESTION DES BILANS D'ADMISSIBILITÉ
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer les bilans en attente de validation
   */
  getPendingBilans: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const pendingBilans = await db
          .select()
          .from(bilans)
          .where(eq(bilans.status, "draft"))
          .orderBy(desc(bilans.generatedAt))
          .limit(50);

        return pendingBilans;
      } catch (err) {
        console.error("[Admin Get Pending Bilans] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des bilans",
        });
      }
    }),

  /**
   * Valider et envoyer un bilan au candidat
   */
  validateAndSendBilan: publicProcedure
    .input(z.object({ sessionToken: z.string(), bilanId: z.number() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Récupérer le bilan
        const bilan = await db.select().from(bilans).where(eq(bilans.id, input.bilanId)).limit(1);
        if (!bilan || bilan.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bilan non trouvé" });
        }

        // Mettre à jour le statut
        await db
          .update(bilans)
          .set({
            status: "sent",
            validatedBy: admin.fullName || "Admin",
            validatedAt: new Date(),
            sentAt: new Date(),
          })
          .where(eq(bilans.id, input.bilanId));

        return { success: true, message: "Bilan validé et envoyé" };
      } catch (err) {
        console.error("[Admin Validate Bilan] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la validation du bilan",
        });
      }
    }),

  /**
   * Rejeter un bilan
   */
  rejectBilan: publicProcedure
    .input(z.object({ sessionToken: z.string(), bilanId: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(bilans)
          .set({
            status: "rejected",
            adminNotes: input.reason,
            validatedBy: admin.fullName || "Admin",
            validatedAt: new Date(),
          })
          .where(eq(bilans.id, input.bilanId));

        return { success: true, message: "Bilan rejeté" };
      } catch (err) {
        console.error("[Admin Reject Bilan] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du rejet du bilan",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // GESTION DES DOSSIERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer tous les dossiers
   */
  getAllApplications: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const allApps = await db
          .select()
          .from(applications)
          .orderBy(desc(applications.createdAt))
          .limit(100);

        return allApps;
      } catch (err) {
        console.error("[Admin Get All Applications] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des dossiers",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'un dossier
   */
  updateApplicationStatus: publicProcedure
    .input(z.object({ sessionToken: z.string(), applicationId: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        await db
          .update(applications)
          .set({
            dossierStatus: input.status as any,
            lastStatusUpdateAt: new Date(),
            lastStatusUpdatedBy: admin.fullName || "Admin",
          })
          .where(eq(applications.id, input.applicationId));

        return { success: true, message: "Statut du dossier mis à jour" };
      } catch (err) {
        console.error("[Admin Update Application Status] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Modifier les donnees d'une application (par l'admin)
   */
  updateApplicationData: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      applicationId: z.number(),
      data: z.object({
      sessionToken: z.string(),
        destinationCountry: z.string().optional(),
        projectType: z.string().optional(),
        studyLevel: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        adminNotes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const updateData: any = {};
        if (input.data.destinationCountry) updateData.destinationCountry = input.data.destinationCountry;
        if (input.data.projectType) updateData.projectType = input.data.projectType;
        if (input.data.studyLevel) updateData.studyLevel = input.data.studyLevel;
        if (input.data.fieldOfStudy) updateData.fieldOfStudy = input.data.fieldOfStudy;
        if (input.data.adminNotes) updateData.adminNotes = input.data.adminNotes;
        updateData.lastStatusUpdateAt = new Date();
        updateData.lastStatusUpdatedBy = admin.fullName || "Admin";

        await db
          .update(applications)
          .set(updateData)
          .where(eq(applications.id, input.applicationId));

        return { success: true, message: "Donnees du dossier mises a jour" };
      } catch (err) {
        console.error("[Admin Update Application Data] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise a jour des donnees",
        });
      }
    }),

  /**
   * Recuperer les details complets d'une application
   */
  /**
   * Récupérer les statistiques de satisfaction de la FAQ (votes Utile / Non utile)
   */
  getFaqSatisfactionStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const rows = await db.execute(`SELECT questionKey, helpful, COUNT(*) as count FROM faq_feedback GROUP BY questionKey, helpful`);
        const rawResults: any = rows[0] || [];

        let totalHelpful = 0;
        let totalNotHelpful = 0;
        const perQuestionMap: Record<string, { helpful: number; notHelpful: number }> = {};

        for (const row of rawResults) {
          const qKey = row.questionKey || row.question_key;
          const isHelpful = row.helpful === 1 || row.helpful === true || row.helpful === "1";
          const cnt = Number(row.count) || 0;

          if (!perQuestionMap[qKey]) {
            perQuestionMap[qKey] = { helpful: 0, notHelpful: 0 };
          }

          if (isHelpful) {
            totalHelpful += cnt;
            perQuestionMap[qKey].helpful += cnt;
          } else {
            totalNotHelpful += cnt;
            perQuestionMap[qKey].notHelpful += cnt;
          }
        }

        const totalVotes = totalHelpful + totalNotHelpful;
        const satisfactionRate = totalVotes > 0 ? Math.round((totalHelpful / totalVotes) * 100) : 100;

        const questionsBreakdown = Object.entries(perQuestionMap).map(([questionKey, stats]) => {
          const qTotal = stats.helpful + stats.notHelpful;
          const qRate = qTotal > 0 ? Math.round((stats.helpful / qTotal) * 100) : 100;
          return {
            questionKey,
            helpful: stats.helpful,
            notHelpful: stats.notHelpful,
            total: qTotal,
            satisfactionRate: qRate,
          };
        }).sort((a, b) => b.total - a.total);

        return {
          success: true,
          stats: {
            totalVotes,
            totalHelpful,
            totalNotHelpful,
            satisfactionRate,
            questionsBreakdown,
          },
        };
      } catch (err) {
        console.error("[Admin FAQ Satisfaction] Error:", err);
        return {
          success: true,
          stats: {
            totalVotes: 0,
            totalHelpful: 0,
            totalNotHelpful: 0,
            satisfactionRate: 100,
            questionsBreakdown: [],
          },
        };
      }
    }),

  getApplicationDetails: publicProcedure
    .input(z.object({ sessionToken: z.string(), applicationId: z.number() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const app = await db
          .select()
          .from(applications)
          .where(eq(applications.id, input.applicationId))
          .limit(1);

        if (app.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Application non trouvee" });
        }

        // Récupérer les documents du candidat
        const documents = await db
          .select()
          .from(clientDocuments)
          .where(eq(clientDocuments.candidateEmail, app[0].email))
          .limit(50);

        const reports = await db
          .select()
          .from(aiReportHistory)
          .where(eq(aiReportHistory.applicationId, input.applicationId))
          .orderBy(desc(aiReportHistory.createdAt))
          .limit(10);

        return {
          success: true,
          application: app[0],
          documents,
          reports,
        };
      } catch (err) {
        console.error("[Admin Get Application Details] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la recuperation des details",
        });
      }
    }),

  /**
   * Publier le bilan vers l'espace personnel du client
   */
  publishBilanToClient: publicProcedure
    .input(z.object({ sessionToken: z.string(), bilanId: z.number() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const bilan = await db
          .select()
          .from(bilans)
          .where(eq(bilans.id, input.bilanId))
          .limit(1);

        if (bilan.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bilan non trouve" });
        }

        await db
          .update(bilans)
          .set({
            status: "sent",
            sentAt: new Date(),
          })
          .where(eq(bilans.id, input.bilanId));

        return {
          success: true,
          message: "Bilan publie avec succes",
          publishedAt: new Date(),
        };
      } catch (err) {
        console.error("[Admin Publish Bilan] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la publication du bilan",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD ADMIN — Gestion unifiée des candidats (toutes sources)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lister tous les candidats pour le dashboard admin
   * Combine les dossiers en ligne (applications) + dossiers agence (agencyDossiers)
   */
  listCandidates: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      search: z.string().optional(),
       status: z.string().optional(),
       activationStatus: z.enum(["ALL", "active", "pending", "expired", "failed", "not_registered"]).optional(),
       limit: z.number().int().min(1).max(200).default(100),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Récupérer les dossiers en ligne (table applications)
        const onlineApps = await db
          .select()
          .from(applications)
          .orderBy(desc(applications.createdAt))
          .limit(input.limit);

        // Récupérer les dossiers agence (table agencyDossiers)
        const agencyApps = await db
          .select()
          .from(agencyDossiers)
          .orderBy(desc(agencyDossiers.createdAt))
          .limit(input.limit);

        const candidateRows = await db
          .select({
            id: candidates.id,
            email: candidates.email,
            fullName: candidates.fullName,
            phone: candidates.phone,
            destination: candidates.destination,
            dossierStatus: candidates.dossierStatus,
            evaluationDeclarationStatus: candidates.evaluationDeclarationStatus,
            evaluationDeclaredAt: candidates.evaluationDeclaredAt,
            createdAt: candidates.createdAt,
            updatedAt: candidates.updatedAt,
            emailVerified: candidates.emailVerified,
            verificationToken: candidates.verificationToken,
            verificationExpiresAt: candidates.verificationExpiresAt,
          })
          .from(candidates)
          .limit(10000);
        const activationLogs = await db
          .select({
            recipientEmail: emailDeliveryLogs.recipientEmail,
            subject: emailDeliveryLogs.subject,
            status: emailDeliveryLogs.status,
          })
          .from(emailDeliveryLogs)
          .orderBy(desc(emailDeliveryLogs.createdAt))
          .limit(10000);
        const latestActivationLogByEmail = new Map<string, { status: string | null }>();
        for (const log of activationLogs) {
          const subject = log.subject.toLowerCase();
          const isActivationEmail = subject.includes("activation") || subject.includes("confirmation") || subject.includes("vérification") || subject.includes("verification") || subject.includes("verify");
          const email = log.recipientEmail.toLowerCase();
          if (isActivationEmail && !latestActivationLogByEmail.has(email)) {
            latestActivationLogByEmail.set(email, { status: log.status });
          }
        }
        const activationStatusByEmail = new Map<string, CandidateActivationStatus>();
        for (const candidate of candidateRows) {
          const email = candidate.email.toLowerCase();
          activationStatusByEmail.set(
            email,
            deriveCandidateActivationStatus(candidate, latestActivationLogByEmail.get(email)),
          );
        }
        const getActivationStatus = (email: string): CandidateActivationStatus =>
          activationStatusByEmail.get(email.toLowerCase()) ?? "not_registered";
        const candidateByEmail = new Map(candidateRows.map((candidate) => [candidate.email.toLowerCase(), candidate]));

        // Mapper les statuts internes vers les statuts admin
        const mapDossierStatus = (status: string): string => {
          const mapping: Record<string, string> = {
            "nouveau": "PENDING_48H",
            "en_evaluation": "PENDING_48H",
            "bilan_envoye": "PUBLISHED",
            "en_attente_paiement": "PUBLISHED",
            "paye": "DOCUMENTS_CHECK",
            "en_attente_documents": "DOCUMENTS_CHECK",
            "documents_recus": "SUBMITTED",
            "soumis_agences": "SUBMITTED",
            "en_cours_recrutement": "SUBMITTED",
            "contrat_obtenu": "APPROVED",
            "visa_approuve": "APPROVED",
            "refuse": "APPROVED",
          };
          return mapping[status] || "PENDING_48H";
        };

        const mapAgencyStatus = (status: string): string => {
          const mapping: Record<string, string> = {
            "nouveau": "PENDING_48H",
            "en_cours": "DOCUMENTS_CHECK",
            "documents_requis": "DOCUMENTS_CHECK",
            "soumis": "SUBMITTED",
            "approuve": "APPROVED",
            "refuse": "APPROVED",
          };
          return mapping[status] || "PENDING_48H";
        };

        // Normaliser les dossiers en ligne
        const normalizedOnline = onlineApps.map(app => ({
          id: `online_${app.id}`,
          internalId: app.id,
          folderCode: app.dossierNumber,
          fullName: app.fullName,
          email: app.email,
          whatsapp: app.whatsappNumber || "",
          city: app.currentCity || "Non renseignée",
          destinationCountry: app.destination || "Non spécifiée",
          projectType: app.visaType || "Non spécifié",
          status: mapDossierStatus(app.dossierStatus),
          internalStatus: app.dossierStatus,
          source: "WEB" as const,
          scoringTotal: app.scoringTotal,
          scoringBadge: app.scoringBadge,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          activationStatus: getActivationStatus(app.email),
          evaluationDeclarationStatus: candidateByEmail.get(app.email.toLowerCase())?.evaluationDeclarationStatus ?? "not_declared",
          evaluationDeclaredAt: candidateByEmail.get(app.email.toLowerCase())?.evaluationDeclaredAt ?? null,
        }));

        // Normaliser les dossiers agence
        const normalizedAgency = agencyApps.map(app => ({
          id: `agency_${app.id}`,
          internalId: app.id,
          folderCode: `3M-AGN-${app.id.toString().padStart(4, "0")}`,
          fullName: app.fullName,
          email: app.email,
          whatsapp: app.phone || "",
          city: "Yaoundé",
          destinationCountry: app.destination || "Non spécifiée",
          projectType: app.visaType || "Non spécifié",
          status: mapAgencyStatus(app.status),
          internalStatus: app.status,
          source: "AGENCY_PHYSICAL" as const,
          scoringTotal: null,
          scoringBadge: null,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          activationStatus: getActivationStatus(app.email),
          evaluationDeclarationStatus: candidateByEmail.get(app.email.toLowerCase())?.evaluationDeclarationStatus ?? "not_declared",
          evaluationDeclaredAt: candidateByEmail.get(app.email.toLowerCase())?.evaluationDeclaredAt ?? null,
        }));

        const dossierEmails = new Set([...onlineApps, ...agencyApps].map((record) => record.email.toLowerCase()));
        const normalizedAccounts = candidateRows
          .filter((candidate) => !dossierEmails.has(candidate.email.toLowerCase()))
          .map((candidate) => ({
            id: `account_${candidate.id}`,
            internalId: candidate.id,
            folderCode: `COMPTE-${String(candidate.id).padStart(5, "0")}`,
            fullName: candidate.fullName,
            email: candidate.email,
            whatsapp: candidate.phone || "",
            city: "Compte en ligne",
            destinationCountry: candidate.destination || "Non spécifiée",
            projectType: "À qualifier",
            status: mapDossierStatus(candidate.dossierStatus),
            internalStatus: candidate.dossierStatus,
            source: "ACCOUNT_ONLY" as const,
            scoringTotal: null,
            scoringBadge: null,
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt,
            activationStatus: getActivationStatus(candidate.email),
            evaluationDeclarationStatus: candidate.evaluationDeclarationStatus,
            evaluationDeclaredAt: candidate.evaluationDeclaredAt,
          }));

        // Combiner et trier par date de création
        let allCandidates = [...normalizedOnline, ...normalizedAgency, ...normalizedAccounts].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Filtrer par statut
        if (input.status && input.status !== "ALL") {
          allCandidates = allCandidates.filter(c => c.status === input.status);
        }
        if (input.activationStatus && input.activationStatus !== "ALL") {
          allCandidates = allCandidates.filter(c => c.activationStatus === input.activationStatus);
        }

        // Filtrer par recherche
        if (input.search && input.search.trim()) {
          const query = input.search.toLowerCase().trim();
          allCandidates = allCandidates.filter(c =>
            c.folderCode?.toLowerCase().includes(query) ||
            c.fullName?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query) ||
            c.destinationCountry?.toLowerCase().includes(query)
          );
        }

        return {
          success: true,
          candidates: allCandidates,
          total: allCandidates.length,
        };
      } catch (err) {
        console.error("[Admin List Candidates] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des candidats",
        });
      }
    }),

  /**
   * Mettre à jour le statut d'un candidat et notifier le client
   */
  updateCandidateStatus: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      candidateId: z.string(), // Format: "online_123" ou "agency_456"
      newStatus: z.enum(["PENDING_48H", "PUBLISHED", "DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"]),
      notifyClient: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const reference = parseAdminCandidateReference(input.candidateId);
        if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
        const { source, id } = reference;

        // Mapper le statut admin vers le statut interne
        const statusLabels: Record<string, string> = {
          "PENDING_48H": "Évaluation sous 48h",
          "PUBLISHED": "Bilan Consulaire Disponible",
          "DOCUMENTS_CHECK": "Collecte des documents",
          "SUBMITTED": "Soumission consulaire",
          "APPROVED": "Visa Accordé",
        };

        let candidateEmail = "";
        let candidateName = "";
        let folderCode = "";

        if (source === "online") {
          // Mapper vers le statut interne applications
          const internalStatusMap: Record<string, string> = {
            "PENDING_48H": "en_evaluation",
            "PUBLISHED": "bilan_envoye",
            "DOCUMENTS_CHECK": "en_attente_documents",
            "SUBMITTED": "soumis_agences",
            "APPROVED": "visa_approuve",
          };

          const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
          if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

          await db.update(applications)
            .set({
              dossierStatus: internalStatusMap[input.newStatus] as any,
              lastStatusUpdateAt: new Date(),
              lastStatusUpdatedBy: admin.fullName || "Admin",
            })
            .where(eq(applications.id, id));

          candidateEmail = app.email;
          candidateName = app.fullName;
          folderCode = app.dossierNumber;
        } else if (source === "agency") {
          // Mapper vers le statut interne agencyDossiers
          const internalStatusMap: Record<string, string> = {
            "PENDING_48H": "nouveau",
            "PUBLISHED": "en_cours",
            "DOCUMENTS_CHECK": "documents_requis",
            "SUBMITTED": "soumis",
            "APPROVED": "approuve",
          };

          const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, id)).limit(1);
          if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable" });

          await db.update(agencyDossiers)
            .set({
              status: internalStatusMap[input.newStatus] as any,
              lastStatusChangeAt: new Date(),
              lastStatusChangeBy: admin.fullName || "Admin",
            })
            .where(eq(agencyDossiers.id, id));

          candidateEmail = dossier.email;
          candidateName = dossier.fullName;
          folderCode = `3M-AGN-${id.toString().padStart(4, "0")}`;
        }

        // Envoyer une notification email au client si demandé
        if (input.notifyClient && candidateEmail) {
          try {
            const statusLabel = statusLabels[input.newStatus] || input.newStatus;
            const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #fff; font-size: 22px; margin: 0;">3M Travel & Services</h1>
                  <p style="color: #bfdbfe; font-size: 13px; margin: 6px 0 0;">Mise à jour de votre dossier</p>
                </div>
                <div style="padding: 32px 28px;">
                  <p style="color: #374151;">Bonjour <strong>${candidateName}</strong>,</p>
                  <p style="color: #374151;">Le statut de votre dossier <strong>${folderCode}</strong> vient d'être mis à jour :</p>
                  <div style="background: #eff6ff; border-left: 4px solid #2563EB; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1E3A8A;">📋 ${statusLabel}</p>
                  </div>
                  <p style="color: #374151;">Vous pouvez consulter votre espace client pour plus de détails :</p>
                  <a href="https://3mtravelagency.click/mon-espace" style="display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0;">Accéder à mon espace</a>
                </div>
                <div style="background: #f8faff; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                  <p>3M Travel & Services — RC/YAO/2019/A/2567 | NIU : M112417203369H</p>
                  <p>Yaoundé, Cameroun | +237 620-996-045 | contact@3mtravelagency.click</p>
                </div>
              </div>
            `;

            await sendGenericEmail({
              to: candidateEmail,
              subject: `📋 Mise à jour de votre dossier ${folderCode} - 3M Travel & Services`,
              html: htmlContent
            });
          } catch (emailErr) {
            console.error("[Admin Update Status] Email notification failed:", emailErr);
            // Ne pas bloquer la mise à jour si l'email échoue
          }
        }

        return {
          success: true,
          message: `Statut mis à jour : ${statusLabels[input.newStatus]}`,
          notificationSent: input.notifyClient,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin Update Candidate Status] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut",
        });
      }
    }),

  /**
   * Importer un dossier physique d'agence
   */
  listDestinationDocumentsAdmin: publicProcedure
    .input(z.object({ sessionToken: z.string(), search: z.string().optional() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      return await listDestinationDocuments(input.search);
    }),

  /**
   * Modifier directement le statut d'un document (validé, rejeté, en attente) avec notification e-mail automatique au candidat
   */
  updateDocumentStatus: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      documentId: z.number().int(),
      source: z.enum(["client", "candidate"]).default("client"),
      status: z.enum(["pending", "approved", "rejected"]),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        let candidateEmail = "";
        let candidateName = "";
        let documentName = "";

        if (input.source === "client") {
          const [doc] = await db.select().from(clientDocuments).where(eq(clientDocuments.id, input.documentId)).limit(1);
          if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });

          await db.update(clientDocuments)
            .set({
              verificationStatus: input.status as any,
              status: input.status === "approved" ? "verified" : input.status === "rejected" ? "rejected" : "pending",
              verificationComment: input.comment || null,
              verifiedByAdmin: admin.email || "Admin",
              verifiedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(clientDocuments.id, input.documentId));

          candidateEmail = doc.candidateEmail;
          documentName = doc.documentName;

          // Récupérer le nom du candidat
          const [app] = await db.select().from(applications).where(eq(applications.email, doc.candidateEmail)).limit(1);
          candidateName = app?.fullName || doc.candidateEmail.split("@")[0];
        } else {
          const [fileRec] = await db.select().from(candidateFiles).where(eq(candidateFiles.id, input.documentId)).limit(1);
          if (!fileRec) throw new TRPCError({ code: "NOT_FOUND", message: "Fichier candidat introuvable" });

          const newFileStatus = input.status === "approved" ? "verified" : input.status === "rejected" ? "rejected" : "uploaded";

          await db.update(candidateFiles)
            .set({
              status: newFileStatus as any,
              rejectionReason: input.comment || null,
            })
            .where(eq(candidateFiles.id, input.documentId));

          documentName = fileRec.fileName;
          const [cand] = await db.select().from(candidates).where(eq(candidates.id, fileRec.candidateId)).limit(1);
          candidateEmail = cand?.email || "";
          candidateName = cand?.fullName || "Candidat";
        }

        // Envoyer la notification e-mail automatique au candidat
        if (candidateEmail) {
          try {
            const statusLabels: Record<string, { label: string; color: string; badge: string }> = {
              approved: { label: "Validé & Approuvé", color: "#16a34a", badge: "✓ VALIDÉ" },
              rejected: { label: "Refusé / À corriger", color: "#dc2626", badge: "✗ REJETÉ" },
              pending: { label: "Remis en attente", color: "#d97706", badge: "⏳ EN ATTENTE" },
            };

            const info = statusLabels[input.status] || statusLabels.pending;

            const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #fff; font-size: 22px; margin: 0;">3M Travel Agency</h1>
                  <p style="color: #bfdbfe; font-size: 13px; margin: 6px 0 0;">Mise à jour du statut de votre document</p>
                </div>
                <div style="padding: 32px 28px;">
                  <p style="color: #374151;">Bonjour <strong>${candidateName}</strong>,</p>
                  <p style="color: #374151;">Le statut de vérification de votre document <strong>${documentName}</strong> a été mis à jour par l'administration :</p>
                  
                  <div style="background: #f8fafc; border-left: 4px solid ${info.color}; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: ${info.color};">${info.badge}</p>
                    ${input.comment ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;"><strong>Note de l'agence :</strong> ${input.comment}</p>` : ""}
                  </div>

                  <p style="color: #374151; font-size: 14px;">Vous pouvez consulter votre espace candidat pour suivre l'évolution complète de vos démarches :</p>
                  <a href="https://3mtravelagency.click/mon-espace" style="display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0;">Accéder à mon espace</a>
                </div>
                <div style="background: #f8faff; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                  <p>3M Travel Agency — RC/YAO/2019/A/2567 | NIU : M112417203369H</p>
                  <p>Yaoundé, Cameroun | +237 620-996-045 | hello@3mtravelagency.com</p>
                </div>
              </div>
            `;

            await sendGenericEmail({
              to: candidateEmail,
              subject: `📄 Document ${documentName} : ${info.badge} - 3M Travel Agency`,
              html: htmlContent,
            });
          } catch (emailErr) {
            console.error("[Admin Update Document Status] Email notification failed:", emailErr);
          }
        }

        return {
          success: true,
          message: "Statut du document mis à jour avec succès",
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin Update Document Status] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du statut du document",
        });
      }
    }),

  addDestinationDocumentAdmin: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      title: z.string().min(2),
      country: z.string().min(2),
      category: z.string().min(2),
      fileUrl: z.string().url(),
      fileKey: z.string().min(2),
      extractedText: z.string().optional(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      return await addDestinationDocument({
        title: input.title,
        country: input.country,
        category: input.category,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        extractedText: input.extractedText,
        fileSize: input.fileSize,
      });
    }),

  deleteDestinationDocumentAdmin: publicProcedure
    .input(z.object({ sessionToken: z.string(), id: z.number() }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      return await deleteDestinationDocument(input.id);
    }),

  importAgencyDossier: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      fullName: z.string().min(2),
      email: z.string().email(),
      whatsapp: z.string().min(5),
      city: z.string().default("Yaoundé"),
      destinationCountry: z.string().min(2),
      projectType: z.string().min(2),
      initialStatus: z.enum(["PENDING_48H", "PUBLISHED", "DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"]).default("DOCUMENTS_CHECK"),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Mapper le statut initial
        const internalStatusMap: Record<string, string> = {
          "PENDING_48H": "nouveau",
          "PUBLISHED": "en_cours",
          "DOCUMENTS_CHECK": "documents_requis",
          "SUBMITTED": "soumis",
          "APPROVED": "approuve",
        };

        const result = await db.insert(agencyDossiers).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.whatsapp,
          destination: input.destinationCountry,
          visaType: input.projectType,
          status: internalStatusMap[input.initialStatus] as any,
          createdByAdmin: admin.email || "admin",
          source: "manual_admin" as any,
          adminNotes: `Dossier physique importé par ${admin.fullName || "Admin"} le ${new Date().toLocaleDateString("fr-FR")}`,
        });

        const dossierId = (result as any)[0]?.insertId || 0;
        const folderCode = `3M-AGN-${dossierId.toString().padStart(4, "0")}`;

        // Envoyer un email de bienvenue
        try {
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: #fff; font-size: 22px; margin: 0;">3M Travel & Services</h1>
                <p style="color: #bfdbfe; font-size: 13px; margin: 6px 0 0;">Votre partenaire mobilité internationale</p>
              </div>
              <div style="padding: 32px 28px;">
                <p style="color: #374151;">Bonjour <strong>${input.fullName}</strong>,</p>
                <p style="color: #374151;">Votre dossier a été créé avec succès dans notre système.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 4px 0;"><strong>N° de dossier :</strong> ${folderCode}</p>
                  <p style="margin: 4px 0;"><strong>Destination :</strong> ${input.destinationCountry}</p>
                  <p style="margin: 4px 0;"><strong>Type de projet :</strong> ${input.projectType}</p>
                </div>
                <p style="color: #374151;">Notre équipe vous contactera sous peu pour les prochaines étapes.</p>
                <a href="https://3mtravelagency.click/mon-espace" style="display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0;">Accéder à mon espace</a>
              </div>
              <div style="background: #f8faff; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                <p>3M Travel & Services — Yaoundé, Cameroun | +237 620-996-045</p>
              </div>
            </div>
          `;
          await sendGenericEmail({
            to: input.email,
            subject: `📋 Votre dossier ${folderCode} a été créé - 3M Travel & Services`,
            html: htmlContent
          });
        } catch (emailErr) {
          console.error("[Import Agency Dossier] Email failed:", emailErr);
        }

        return {
          success: true,
          folderCode,
          dossierId,
          message: `Dossier agence créé avec succès : ${folderCode}`,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin Import Agency Dossier] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'importation du dossier agence",
        });
      }
    }),

  /**
   * Récupérer les détails complets d'un candidat pour la fiche admin
   */
  getCandidateDetails: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      candidateId: z.string(), // Format: "online_123" ou "agency_456"
    }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const accountMatch = /^account_(\d+)$/.exec(input.candidateId.trim());
        if (accountMatch) {
          const candidateId = Number(accountMatch[1]);
          const [account] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
          if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable" });
          const docs = await db.select().from(candidateFiles).where(eq(candidateFiles.candidateId, account.id)).limit(50);
          return {
            success: true,
            candidate: {
              id: `account_${account.id}`,
              internalId: account.id,
              folderCode: `COMPTE-${String(account.id).padStart(5, "0")}`,
              fullName: account.fullName,
              email: account.email,
              whatsapp: account.phone || "",
              city: "Compte en ligne",
              destinationCountry: account.destination || "Non spécifiée",
              projectType: "À qualifier",
              status: "PENDING_48H",
              internalStatus: account.dossierStatus,
              source: "ACCOUNT_ONLY" as const,
              scoringTotal: null,
              scoringBadge: null,
              scoringData: null,
              avatarUrl: account.avatarUrl || null,
              evaluationDeclarationStatus: account.evaluationDeclarationStatus,
              evaluationDeclaredAt: account.evaluationDeclaredAt,
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            },
            documents: docs,
          };
        }
        const reference = parseAdminCandidateReference(input.candidateId);
        if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
        const { source, id } = reference;

        if (source === "online") {
          const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
          if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

          const [candRec] = await db.select().from(candidates).where(eq(candidates.email, app.email)).limit(1);
          const avatarUrl = candRec?.avatarUrl || null;

          const docs = await db.select().from(clientDocuments)
            .where(eq(clientDocuments.candidateEmail, app.email))
            .limit(50);

          const mapStatus = (status: string): string => {
            const mapping: Record<string, string> = {
              "nouveau": "PENDING_48H",
              "en_evaluation": "PENDING_48H",
              "bilan_envoye": "PUBLISHED",
              "en_attente_paiement": "PUBLISHED",
              "paye": "DOCUMENTS_CHECK",
              "en_attente_documents": "DOCUMENTS_CHECK",
              "documents_recus": "SUBMITTED",
              "soumis_agences": "SUBMITTED",
              "en_cours_recrutement": "SUBMITTED",
              "contrat_obtenu": "APPROVED",
              "visa_approuve": "APPROVED",
              "refuse": "APPROVED",
            };
            return mapping[status] || "PENDING_48H";
          };

          let scoringData = null;
          if (app.scoringDetails) {
            try { scoringData = JSON.parse(app.scoringDetails); } catch {}
          }

          return {
            success: true,
            candidate: {
              id: `online_${app.id}`,
              internalId: app.id,
              folderCode: app.dossierNumber,
              fullName: app.fullName,
              email: app.email,
              whatsapp: app.whatsappNumber || "",
              city: app.currentCity || "Non renseignée",
              destinationCountry: app.destination || "Non spécifiée",
              projectType: app.visaType || "Non spécifié",
              status: mapStatus(app.dossierStatus),
              internalStatus: app.dossierStatus,
              source: "WEB" as const,
              scoringTotal: app.scoringTotal,
              scoringBadge: app.scoringBadge,
              scoringData,
              avatarUrl,
              createdAt: app.createdAt,
              updatedAt: app.updatedAt,
            },
            documents: docs,
          };
        } else if (source === "agency") {
          const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, id)).limit(1);
          if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable" });

          let avatarUrl = null;
          if (dossier.email) {
            const [candRec] = await db.select().from(candidates).where(eq(candidates.email, dossier.email)).limit(1);
            avatarUrl = candRec?.avatarUrl || null;
          }

          const mapStatus = (status: string): string => {
            const mapping: Record<string, string> = {
              "nouveau": "PENDING_48H",
              "en_cours": "DOCUMENTS_CHECK",
              "documents_requis": "DOCUMENTS_CHECK",
              "soumis": "SUBMITTED",
              "approuve": "APPROVED",
              "refuse": "APPROVED",
            };
            return mapping[status] || "PENDING_48H";
          };

          return {
            success: true,
            candidate: {
              id: `agency_${dossier.id}`,
              internalId: dossier.id,
              folderCode: `3M-AGN-${dossier.id.toString().padStart(4, "0")}`,
              fullName: dossier.fullName,
              email: dossier.email,
              whatsapp: dossier.phone || "",
              city: "Yaoundé",
              destinationCountry: dossier.destination || "Non spécifiée",
              projectType: dossier.visaType || "Non spécifié",
              status: mapStatus(dossier.status),
              internalStatus: dossier.status,
              source: "AGENCY_PHYSICAL" as const,
              scoringTotal: null,
              scoringBadge: null,
              scoringData: null,
              avatarUrl,
              createdAt: dossier.createdAt,
              updatedAt: dossier.updatedAt,
            },
            documents: [],
          };
        }

        throw new TRPCError({ code: "BAD_REQUEST", message: "Format d'ID invalide" });
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin Get Candidate Details] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des détails du candidat",
        });
      }

    }),
  /**
   * Répartition des candidats par pays de destination.
   * Les emails sont dédupliqués afin qu'un même candidat ne soit pas compté
   * plusieurs fois lorsqu'il possède plusieurs demandes dans le système.
   */
  getCandidateCountryDistribution: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      limit: z.number().int().min(1).max(30).default(15),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const [applicationRows, evaluationRows, profileRows, agencyRows] = await Promise.all([
          db.select({ id: applications.id, email: applications.email, country: applications.destination }).from(applications),
          db.select({ id: evaluations.id, email: evaluations.email, country: evaluations.destinationCountry }).from(evaluations),
          db.select({ id: profileEvaluations.id, email: profileEvaluations.email, country: profileEvaluations.destination }).from(profileEvaluations),
          db.select({ id: agencyDossiers.id, email: agencyDossiers.email, country: agencyDossiers.destination }).from(agencyDossiers),
        ]);

        const countryCandidates = new Map<string, Set<string>>();
        const uniqueCandidates = new Set<string>();
        const addRows = (rows: Array<{ id: number; email: string; country: string | null | undefined }>, source: string) => {
          rows.forEach((row) => {
            const country = String(row.country ?? "").trim();
            if (!country) return;
            const candidateKey = row.email?.trim().toLowerCase() || `${source}:${row.id}`;
            uniqueCandidates.add(candidateKey);
            const bucket = countryCandidates.get(country) ?? new Set<string>();
            bucket.add(candidateKey);
            countryCandidates.set(country, bucket);
          });
        };

        addRows(applicationRows, "application");
        addRows(evaluationRows, "evaluation");
        addRows(profileRows, "profile");
        addRows(agencyRows, "agency");

        const data = Array.from(countryCandidates.entries())
          .map(([country, candidateKeys]) => ({ country, count: candidateKeys.size }))
          .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country, "fr"))
          .slice(0, input.limit);

        return {
          success: true,
          totalCandidates: uniqueCandidates.size,
          totalCountries: countryCandidates.size,
          data,
        };
      } catch (error) {
        console.error("[Admin Country Distribution] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors du calcul de la répartition par pays" });
      }
    }),

  /**
   * Export CSV de l'historique des activités administrateur.
   * Les détails exportés ne contiennent ni mot de passe ni jeton de session.
   */
  exportActivityReportCsv: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      limit: z.number().int().min(1).max(5000).default(1000),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        const rows = await db
          .select({
            id: adminActivityLogs.id,
            adminEmail: adminActivityLogs.adminEmail,
            action: adminActivityLogs.action,
            evaluationType: adminActivityLogs.evaluationType,
            evaluationId: adminActivityLogs.evaluationId,
            oldStatus: adminActivityLogs.oldStatus,
            newStatus: adminActivityLogs.newStatus,
            resultCount: adminActivityLogs.resultCount,
            details: adminActivityLogs.details,
            createdAt: adminActivityLogs.createdAt,
          })
          .from(adminActivityLogs)
          .orderBy(desc(adminActivityLogs.createdAt))
          .limit(input.limit);

        const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""').replace(/\\r?\\n/g, " ")}"`;
        const headers = ["ID", "Administrateur", "Action", "Type", "Identifiant", "Ancien statut", "Nouveau statut", "Résultats", "Détails", "Date"];
        const csvRows = rows.map((row) => [
          row.id,
          row.adminEmail,
          row.action,
          row.evaluationType,
          row.evaluationId,
          row.oldStatus,
          row.newStatus,
          row.resultCount,
          row.details,
          row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : "",
        ]);
        const content = "\\uFEFF" + [headers, ...csvRows].map((row) => row.map(escapeCsv).join(",")).join("\\r\\n");
        const fileName = `rapport-activite-admin-${new Date().toISOString().slice(0, 10)}.csv`;

        await db.insert(adminActivityLogs).values({
          adminEmail: admin.email,
          action: "csv_exported",
          resultCount: rows.length,
          details: "Export du rapport d'activité administrateur",
        });

        return { success: true, fileName, content, rowCount: rows.length };
      } catch (error) {
        console.error("[Admin Activity CSV] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la génération du rapport CSV" });
      }
    }),

  /** Valider un document du flux candidat authentifié. */
  approveCandidateFile: publicProcedure
    .input(z.object({ sessionToken: z.string(), fileId: z.number().int().positive(), comment: z.string().max(2000).optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const [file] = await db.select({ id: candidateFiles.id }).from(candidateFiles).where(eq(candidateFiles.id, input.fileId)).limit(1);
      if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "Document candidat introuvable" });
      await db.update(candidateFiles).set({ status: "verified", rejectionReason: input.comment?.trim() || null }).where(eq(candidateFiles.id, input.fileId));
      return { success: true, verifiedBy: admin.email };
    }),

  /** Rejeter un document du flux candidat authentifié et conserver le motif. */
  rejectCandidateFile: publicProcedure
    .input(z.object({ sessionToken: z.string(), fileId: z.number().int().positive(), comment: z.string().min(3).max(2000), notifyCandidate: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const [file] = await db.select({ id: candidateFiles.id, fileName: candidateFiles.fileName, candidateEmail: candidates.email }).from(candidateFiles).leftJoin(candidates, eq(candidateFiles.candidateId, candidates.id)).where(eq(candidateFiles.id, input.fileId)).limit(1);
      if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "Document candidat introuvable" });
      await db.update(candidateFiles).set({ status: "rejected", rejectionReason: input.comment.trim() }).where(eq(candidateFiles.id, input.fileId));
      let notificationSent = false;
      if (input.notifyCandidate && file.candidateEmail) {
        try {
          await sendGenericEmail({
            to: file.candidateEmail,
            subject: "Action requise : document à remplacer — 3M Travel & Services",
            html: "<div><h1>3M Travel & Services</h1><p>Bonjour,</p><p>Votre document <strong>" + file.fileName + "</strong> doit être remplacé.</p><p><strong>Motif :</strong> " + input.comment.trim() + "</p><p>Connectez-vous à votre espace candidat pour déposer une nouvelle version.</p></div>",
          });
          notificationSent = true;
        } catch (error) {
          console.error("[Admin Reject Candidate File] Notification failed:", error);
        }
      }
      return { success: true, rejectedBy: admin.email, notificationSent };
    }),

  /**
   * Lister les documents issus des deux flux persistés : client_documents et candidate_files.
   */
  listDocuments: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      search: z.string().optional(),
      verificationStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      aiClassification: z.string().max(120).optional(),
      sortBy: z.enum(["uploadedAt", "documentName", "verificationStatus", "aiClassification"]).default("uploadedAt"),
      sortDirection: z.enum(["asc", "desc"]).default("desc"),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      try {
        const [clientRows, candidateRows] = await Promise.all([
          db.select().from(clientDocuments).orderBy(desc(clientDocuments.receiptGeneratedAt)).limit(1000),
          db.select({
            id: candidateFiles.id,
            candidateId: candidateFiles.candidateId,
            candidateName: candidates.fullName,
            candidateEmail: candidates.email,
            fileType: candidateFiles.fileType,
            fileName: candidateFiles.fileName,
            fileUrl: candidateFiles.fileUrl,
            status: candidateFiles.status,
            rejectionReason: candidateFiles.rejectionReason,
            uploadedAt: candidateFiles.uploadedAt,
            extractedData: candidateFiles.extractedData,
            replacesFileId: candidateFiles.replacesFileId,
          }).from(candidateFiles).leftJoin(candidates, eq(candidateFiles.candidateId, candidates.id)).orderBy(desc(candidateFiles.uploadedAt)).limit(1000),
        ]);
        const candidateIds = Array.from(new Set(candidateRows.map((row) => row.candidateId).filter((id): id is number => typeof id === "number")));
        const applicationRows = candidateIds.length
          ? await db.select({ candidateId: applications.candidateId, dossierNumber: applications.dossierNumber, createdAt: applications.createdAt }).from(applications).where(inArray(applications.candidateId, candidateIds)).orderBy(desc(applications.createdAt)).limit(2000)
          : [];
        const dossierByCandidate = new Map<number, string>();
        for (const row of applicationRows) if (row.candidateId && !dossierByCandidate.has(row.candidateId)) dossierByCandidate.set(row.candidateId, row.dossierNumber);

        const documents = [
          ...clientRows.map((doc: any) => ({
            id: doc.id, source: "client" as const, candidateId: null, candidateEmail: doc.candidateEmail, dossierNumber: "N/A", candidateName: doc.candidateEmail || "N/A", documentType: doc.documentType, documentName: doc.documentName, documentUrl: doc.documentUrl, status: doc.status, verificationStatus: doc.verificationStatus, submittedAt: doc.receiptGeneratedAt || doc.createdAt, verifiedAt: doc.verifiedAt, verifiedByAdmin: doc.verifiedByAdmin, humanVerified: Boolean(doc.verifiedAt && doc.verifiedByAdmin), verificationComment: doc.verificationComment, receiptNumber: doc.receiptNumber, replacesId: doc.replacesDocumentId ?? null, aiClassification: doc.aiClassification ?? null, aiClassificationConfidence: doc.aiClassificationConfidence ?? null, aiClassifiedAt: doc.aiClassifiedAt ?? null, suggestedFolder: doc.suggestedFolder ?? null, extractedData: doc.extractedData ?? null, readabilityScore: doc.readabilityScore ?? null, readabilityIssues: doc.readabilityIssues ?? null,
          })),
          ...candidateRows.map((doc) => ({
            id: doc.id, source: "candidate" as const, candidateId: doc.candidateId, candidateEmail: doc.candidateEmail, dossierNumber: doc.candidateId ? (dossierByCandidate.get(doc.candidateId) || "N/A") : "N/A", candidateName: doc.candidateName || doc.candidateEmail || "N/A", documentType: doc.fileType, documentName: doc.fileName, documentUrl: doc.fileUrl, status: doc.status === "verified" ? "verified" : doc.status === "rejected" ? "rejected" : "pending", verificationStatus: doc.status === "verified" ? "approved" : doc.status === "rejected" ? "rejected" : "pending", submittedAt: doc.uploadedAt, verifiedAt: undefined, verifiedByAdmin: undefined, humanVerified: false, verificationComment: doc.rejectionReason, receiptNumber: null, replacesId: doc.replacesFileId ?? null, aiClassification: null, aiClassificationConfidence: null, aiClassifiedAt: null, suggestedFolder: null, extractedData: doc.extractedData ?? null, readabilityScore: null, readabilityIssues: null,
          })),
        ];
        const normalizedSearch = input.search?.trim().toLowerCase();
        let filtered = documents.filter((doc) => {
          if (input.verificationStatus && doc.verificationStatus !== input.verificationStatus) return false;
          if (input.aiClassification && !String(doc.aiClassification ?? "").toLowerCase().includes(input.aiClassification.toLowerCase())) return false;
          if (!normalizedSearch) return true;
          return [doc.dossierNumber, doc.candidateName, doc.documentType, doc.documentName, doc.verificationStatus].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
        });
        filtered.sort((a, b) => {
          const left = input.sortBy === "documentName" ? a.documentName : input.sortBy === "verificationStatus" ? a.verificationStatus : input.sortBy === "aiClassification" ? String(a.aiClassification ?? "") : new Date(a.submittedAt || 0).getTime();
          const right = input.sortBy === "documentName" ? b.documentName : input.sortBy === "verificationStatus" ? b.verificationStatus : input.sortBy === "aiClassification" ? String(b.aiClassification ?? "") : new Date(b.submittedAt || 0).getTime();
          const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "fr");
          return input.sortDirection === "asc" ? comparison : -comparison;
        });
        return filtered.slice(input.offset, input.offset + input.limit);
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Admin List Documents] Error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de la récupération des documents" });
      }
    }),

  uploadDocumentForCandidate: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.number().int().positive(),
      fileType: z.enum(["cv", "passeport", "diplome", "releve_notes", "photo", "justificatif_domicile", "extrait_naissance", "casier_judiciaire", "justificatif_paiement", "autre"]),
      fileName: z.string().min(1).max(255),
      mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
      sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
      dataUrl: z.string().max(15_000_000),
      recognition: z.object({
        documentType: z.enum(ADMIN_DOCUMENT_TYPES), confidence: z.number().min(0).max(100), suggestedFolder: z.string().max(120), summary: z.string().max(500), reviewRequired: z.literal(true),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const candidate = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Candidat introuvable." });
      const match = input.dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
      if (!match || match[1] !== input.mimeType) throw new TRPCError({ code: "BAD_REQUEST", message: "Format de fichier invalide." });
      const buffer = Buffer.from(match[2], "base64");
      if (!buffer.length || buffer.length !== input.sizeBytes || buffer.length > 10 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier doit peser au maximum 10 Mo." });
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "document";
      const stored = await storagePut(`admin-documents/${input.candidateId}/${Date.now()}-${safeName}`, buffer, input.mimeType);
      await db.insert(candidateFiles).values({
        candidateId: input.candidateId,
        fileType: input.fileType,
        fileName: input.fileName,
        fileUrl: stored.url,
        fileKey: stored.key,
        fileSizeBytes: buffer.length,
        mimeType: input.mimeType,
        status: "uploaded",
        correctionComment: `Document déposé par l’administration (${admin.email || "administrateur"}).`,
        extractedData: input.recognition ? JSON.stringify({ source: "admin_ai_suggestion", ...input.recognition }) : null,
      });
      return { success: true, url: stored.url };
    }),

  suggestDroppedDocumentMetadata: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1), fileName: z.string().min(1).max(255),
      mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
      dataUrl: z.string().max(15_000_000),
    }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      if (!input.dataUrl.startsWith(`data:${input.mimeType};base64,`)) throw new TRPCError({ code: "BAD_REQUEST", message: "Fichier à analyser invalide." });
      return suggestAdminDocumentMetadata(input);
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // GESTION DES MODÈLES D'EMAIL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupérer la prévisualisation d'un modèle d'email
   */
  getEmailTemplatePreview: publicProcedure
    .input(
      z.object({
      sessionToken: z.string(),
        templateId: z.enum(["verification", "otp", "password-reset", "welcome", "dossier-confirmation"]),
        testEmail: z.string().email("Email invalide"),
        testName: z.string().min(2, "Nom trop court"),
      })
    )
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const { templateId, testEmail, testName } = input;

      try {
        let html = "";

        switch (templateId) {
          case "verification": {
            const testToken = "test-token-" + Date.now();
            const verifyUrl = `https://3mtravelagency.click/verify-email-link?token=${testToken}`;
            html = generateVerificationEmailHtml(testName, verifyUrl);
            break;
          }
          case "otp": {
            const testOtp = "123456";
            html = generateOtpEmailHtml(testName, testOtp);
            break;
          }
          case "password-reset": {
            const testToken = "test-token-" + Date.now();
            const resetUrl = `https://3mtravelagency.click/reset-password?token=${testToken}`;
            html = generatePasswordResetEmailHtml(testName, resetUrl);
            break;
          }
          case "welcome": {
            html = generateWelcomeEmailHtml(testName, "canada");
            break;
          }
          case "dossier-confirmation": {
            const testDossierNumber = `DOS-${Date.now()}`;
            html = generateDossierConfirmationEmailHtml(testName, testDossierNumber, "CANADA", 500000);
            break;
          }
          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: "Type de modèle invalide" });
        }

        return { html, templateId, testEmail, testName };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[getEmailTemplatePreview] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la génération de la prévisualisation",
        });
      }
    }),

  /**
   * Envoyer un email de test
   */
  sendTestEmail: publicProcedure
    .input(
      z.object({
      sessionToken: z.string(),
        templateId: z.enum(["verification", "otp", "password-reset", "welcome", "dossier-confirmation"]),
        email: z.string().email("Email invalide"),
        testName: z.string().min(2, "Nom trop court"),
      })
    )
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);

      const { templateId, email, testName } = input;

      try {
        const { sendVerificationLink, sendVerificationOtp, sendPasswordResetEmail, sendWelcomeEmail, sendDossierConfirmationEmail } = await import("../emailService");

        switch (templateId) {
          case "verification": {
            const testToken = "test-token-" + Date.now();
            await sendVerificationLink(email, testName, testToken);
            break;
          }
          case "otp": {
            const testOtp = "123456";
            await sendVerificationOtp(email, testName, testOtp);
            break;
          }
          case "password-reset": {
            const testToken = "test-token-" + Date.now();
            await sendPasswordResetEmail(email, testName, testToken);
            break;
          }
          case "welcome": {
            await sendWelcomeEmail(email, testName, "canada");
            break;
          }
          case "dossier-confirmation": {
            const testDossierNumber = `DOS-TEST-${Date.now()}`;
            await sendDossierConfirmationEmail(email, testName, testDossierNumber, "CANADA", 500000);
            break;
          }
          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: "Type de modèle invalide" });
        }

        return { success: true, message: `Email de test envoyé à ${email}` };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[sendTestEmail] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'envoi de l'email de test",
        });
      }
    }),

  /**
   * Récupérer l'historique de délivrabilité des e-mails
   */
  getEmailDeliveryDemo: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const demo = (await db.select().from(emailDeliveryLogs).where(like(emailDeliveryLogs.subject, "%3M-DEMO-90001%")).orderBy(desc(emailDeliveryLogs.createdAt)).limit(1))[0];
      if (!demo || demo.status === "archived") return null;
      return { folderCode: "3M-DEMO-90001", readyForDeliveryTest: demo.status === "prepared", status: demo.status, createdAt: demo.createdAt };
    }),

  prepareEmailDeliveryDemo: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const existing = (await db.select().from(emailDeliveryLogs).where(and(like(emailDeliveryLogs.subject, "%3M-DEMO-90001%"), eq(emailDeliveryLogs.status, "prepared"))).limit(1))[0];
      if (existing) return { folderCode: "3M-DEMO-90001", created: false };
      await db.insert(emailDeliveryLogs).values({ recipientEmail: process.env.SMTP_FROM ?? "3mtravelandservices@gmail.com", subject: "3M-DEMO-90001 · Remise interne à tester", status: "prepared", errorDetails: `Préparé par ${admin.email}` });
      return { folderCode: "3M-DEMO-90001", created: true };
    }),

  sendEmailDeliveryDemo: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const demo = (await db.select().from(emailDeliveryLogs).where(and(like(emailDeliveryLogs.subject, "%3M-DEMO-90001%"), eq(emailDeliveryLogs.status, "prepared"))).orderBy(desc(emailDeliveryLogs.createdAt)).limit(1))[0];
      if (!demo) throw new TRPCError({ code: "NOT_FOUND", message: "Préparez d’abord le dossier de démonstration." });
      const recipientEmail = process.env.SMTP_FROM ?? "3mtravelandservices@gmail.com";
      try {
        await sendGenericEmail({ to: recipientEmail, subject: demo.subject, html: `<p>Test interne de remise 3M Travel préparé par ${admin.email}. Aucun client n’est concerné.</p>` });
        await db.update(emailDeliveryLogs).set({ status: "sent", errorDetails: `Remise interne déclenchée par ${admin.email}` }).where(eq(emailDeliveryLogs.id, demo.id));
      } catch (error) {
        await db.update(emailDeliveryLogs).set({ status: "failed", errorDetails: error instanceof Error ? error.message.slice(0, 1000) : "Échec de remise interne" }).where(eq(emailDeliveryLogs.id, demo.id));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La remise interne a échoué." });
      }
      return { folderCode: "3M-DEMO-90001" };
    }),

  archiveEmailDeliveryDemo: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      await db.update(emailDeliveryLogs).set({ status: "archived" }).where(like(emailDeliveryLogs.subject, "%3M-DEMO-90001%"));
      return { folderCode: "3M-DEMO-90001" };
    }),

  getEmailDeliveryLogs: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      limit: z.number().int().min(1).max(200).default(100),
      status: z.enum(["all", "sent", "failed", "pending"]).default("all"),
      errorType: z.enum(["all", "invalid_recipient", "domain_unverified", "rate_limit", "configuration"]).default("all"),
      search: z.string().trim().max(120).optional(),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const conditions = [];
      if (input.status !== "all") conditions.push(eq(emailDeliveryLogs.status, input.status));
      if (input.search) {
        conditions.push(or(
          like(emailDeliveryLogs.recipientEmail, `%${input.search}%`),
          like(emailDeliveryLogs.subject, `%${input.search}%`),
        ));
      }
      if (input.errorType !== "all") {
        const patterns = emailErrorPatterns[input.errorType as keyof typeof emailErrorPatterns] ?? [];
        conditions.push(or(...patterns.map((pattern) => like(emailDeliveryLogs.errorDetails, `%${pattern}%`))));
      }
      const logs = await db
        .select()
        .from(emailDeliveryLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(emailDeliveryLogs.createdAt))
        .limit(input.limit);

      return {
        logs,
        summary: summarizeEmailDeliveryLogs(logs),
      };
    }),

  updateEmailDeliveryRecipient: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      logId: z.number().int().positive(),
      recipientEmail: z.string().trim().email("Adresse e-mail invalide").max(320),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const log = (await db.select().from(emailDeliveryLogs).where(eq(emailDeliveryLogs.id, input.logId)).limit(1))[0];
      if (!log) throw new TRPCError({ code: "NOT_FOUND", message: "Journal e-mail introuvable." });
      if (log.recipientEmail === input.recipientEmail) return { success: true, recipientEmail: input.recipientEmail, updatedRecords: 0 };

      try {
        await db.transaction(async (tx) => {
          await tx.update(candidates).set({ email: input.recipientEmail }).where(eq(candidates.email, log.recipientEmail));
          await tx.update(applications).set({ email: input.recipientEmail }).where(eq(applications.email, log.recipientEmail));
          await tx.update(agencyDossiers).set({ email: input.recipientEmail }).where(eq(agencyDossiers.email, log.recipientEmail));
          await tx.update(emailDeliveryLogs).set({ recipientEmail: input.recipientEmail }).where(eq(emailDeliveryLogs.id, input.logId));
          await tx.insert(adminActivityLogs).values({
            adminEmail: admin.email,
            action: "status_changed",
            evaluationType: "email_delivery",
            evaluationId: String(input.logId),
            details: JSON.stringify({ action: "recipient_updated", previousEmail: log.recipientEmail, recipientEmail: input.recipientEmail }),
          });
        });
      } catch (error) {
        throw new TRPCError({ code: "CONFLICT", message: "Cette adresse e-mail est déjà utilisée ou ne peut pas être enregistrée." });
      }

      return { success: true, recipientEmail: input.recipientEmail, updatedRecords: 1 };
    }),

  resendFailedEmail: publicProcedure
    .input(z.object({ sessionToken: z.string(), logId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const log = (await db.select().from(emailDeliveryLogs).where(eq(emailDeliveryLogs.id, input.logId)).limit(1))[0];
      if (!log) throw new TRPCError({ code: "NOT_FOUND", message: "Journal e-mail introuvable." });
      if (log.status !== "failed") throw new TRPCError({ code: "BAD_REQUEST", message: "Seuls les e-mails en échec peuvent être relancés." });

      try {
        await sendGenericEmail({
          to: log.recipientEmail,
          subject: log.subject,
          html: "<p>Bonjour,</p><p>Votre message 3M Travel & Services est renvoyé après correction de vos coordonnées.</p><p>Cordialement,<br>L’équipe 3M Travel & Services</p>",
        });
        await db.insert(adminActivityLogs).values({
          adminEmail: admin.email,
          action: "status_changed",
          evaluationType: "email_delivery",
          evaluationId: String(input.logId),
          details: JSON.stringify({ action: "email_resent", recipientEmail: log.recipientEmail, subject: log.subject }),
        });
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le renvoi a échoué. Consultez le nouveau journal de délivrabilité." });
      }

      return { success: true, recipientEmail: log.recipientEmail };
    }),

  getAdvisorThresholds: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      return db.select().from(advisorAlertThresholds).orderBy(asc(advisorAlertThresholds.advisorEmail));
    }),

  setAdvisorThreshold: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), advisorEmail: z.string().email(), failureThreshold: z.number().int().min(1).max(100), isActive: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const existing = (await db.select().from(advisorAlertThresholds).where(eq(advisorAlertThresholds.advisorEmail, input.advisorEmail)).limit(1))[0];
      if (existing) {
        await db.update(advisorAlertThresholds).set({ failureThreshold: input.failureThreshold, isActive: input.isActive, updatedBy: admin.email }).where(eq(advisorAlertThresholds.id, existing.id));
      } else {
        await db.insert(advisorAlertThresholds).values({ advisorEmail: input.advisorEmail, failureThreshold: input.failureThreshold, isActive: input.isActive, updatedBy: admin.email });
      }
      return { success: true, triggeredByAdminEmail: admin.email };
    }),

  getEmailIncidents: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const incidents = await db.select().from(emailDeliveryIncidents).orderBy(desc(emailDeliveryIncidents.createdAt));
      const comments = await db.select().from(incidentComments).orderBy(desc(incidentComments.createdAt));
      return incidents.map((incident) => ({ ...incident, comments: comments.filter((comment) => comment.incidentId === incident.id) }));
    }),

  acknowledgeIncident: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), incidentId: z.number().int().positive(), resolve: z.boolean().default(false) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const now = new Date();
      await db.update(emailDeliveryIncidents).set({ status: input.resolve ? "resolved" : "acknowledged", acknowledgedBy: admin.email, acknowledgedAt: now, resolvedAt: input.resolve ? now : null }).where(eq(emailDeliveryIncidents.id, input.incidentId));
      return { success: true };
    }),

  addIncidentComment: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), incidentId: z.number().int().positive(), comment: z.string().trim().min(2).max(3000) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      await db.insert(incidentComments).values({ incidentId: input.incidentId, authorEmail: admin.email, comment: input.comment });
      return { success: true };
    }),

  getResolutionMetrics: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const resolved = (await db.select().from(emailDeliveryIncidents)).filter((incident) => incident.status === "resolved" && incident.resolvedAt);
      const byAdvisor = new Map<string, { total: number; hours: number }>();
      for (const incident of resolved) {
        const advisor = incident.advisorEmail;
        const current = byAdvisor.get(advisor) ?? { total: 0, hours: 0 };
        current.total += 1;
        current.hours += (incident.resolvedAt!.getTime() - incident.createdAt.getTime()) / 3_600_000;
        byAdvisor.set(advisor, current);
      }
      return Array.from(byAdvisor, ([advisorEmail, values]) => ({ advisorEmail, resolvedCount: values.total, averageResolutionHours: values.total ? values.hours / values.total : 0 }));
    }),

  // Alias de compatibilité pour les rapports et interfaces historiques.
  acknowledgeEmailDeliveryIncident: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), incidentId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      await db.update(emailDeliveryIncidents).set({ status: "acknowledged", acknowledgedBy: admin.email, acknowledgedAt: new Date() }).where(eq(emailDeliveryIncidents.id, input.incidentId));
      return { success: true };
    }),

  addEmailDeliveryIncidentComment: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), incidentId: z.number().int().positive(), comment: z.string().trim().min(2).max(3000) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      await db.insert(incidentComments).values({ incidentId: input.incidentId, authorEmail: admin.email, comment: input.comment });
      return { success: true };
    }),

  emailDeliveryIncidentsHistory: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      return db.select().from(emailDeliveryIncidents).orderBy(desc(emailDeliveryIncidents.createdAt));
    }),

  incidentResolutionByAdvisor: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const incidents = await db.select().from(emailDeliveryIncidents);
      return incidents.filter((incident) => incident.status === "resolved").map((incident) => ({ advisorEmail: incident.advisorEmail, resolvedAt: incident.resolvedAt }));
    }),

  getCandidate360: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.string().min(1) }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
      const operationalCase = await ensureOperationalCase(db, reference);
      const sourceRecord = reference.source === "online"
        ? (await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1))[0]
        : (await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1))[0];
      if (!sourceRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable." });
      const email = sourceRecord.email;
      const candidateRecord = (await db.select().from(candidates).where(eq(candidates.email, email)).limit(1))[0];
      const [requirements, operationalDocuments, legacyDocuments, tasks, notes, statusHistory, activityLogs, notifications, messages, advisors, requestHistory, latestEvaluations] = await Promise.all([
        db.select().from(documentRequirements).where(eq(documentRequirements.caseId, operationalCase.id)).orderBy(asc(documentRequirements.requestedAt)),
        db.select().from(caseDocuments).where(eq(caseDocuments.caseId, operationalCase.id)).orderBy(desc(caseDocuments.uploadedAt)),
        db.select().from(clientDocuments).where(eq(clientDocuments.candidateEmail, email)).orderBy(desc(clientDocuments.uploadedAt)).limit(100),
        db.select().from(caseTasks).where(eq(caseTasks.caseId, operationalCase.id)).orderBy(asc(caseTasks.dueAt)),
        db.select().from(caseAdminNotes).where(eq(caseAdminNotes.caseId, operationalCase.id)).orderBy(desc(caseAdminNotes.createdAt)),
        db.select().from(caseStatusHistory).where(eq(caseStatusHistory.caseId, operationalCase.id)).orderBy(desc(caseStatusHistory.createdAt)),
        db.select().from(caseActivityLogs).where(eq(caseActivityLogs.caseId, operationalCase.id)).orderBy(desc(caseActivityLogs.createdAt)),
        candidateRecord ? db.select().from(clientNotifications).where(eq(clientNotifications.candidateId, candidateRecord.id)).orderBy(desc(clientNotifications.createdAt)).limit(30) : Promise.resolve([]),
        candidateRecord ? db.select().from(candidateMessages).where(eq(candidateMessages.candidateId, candidateRecord.id)).orderBy(desc(candidateMessages.createdAt)).limit(30) : Promise.resolve([]),
        db.select({ id: adminAccounts.id, fullName: adminAccounts.fullName, email: adminAccounts.email, adminType: adminAccounts.adminType }).from(adminAccounts).where(eq(adminAccounts.status, "active")).orderBy(asc(adminAccounts.fullName)),
        db.select().from(unifiedClientRequestHistory).where(eq(unifiedClientRequestHistory.requestId, operationalCase.id)).orderBy(desc(unifiedClientRequestHistory.createdAt)).limit(30),
        db.select().from(evaluations).where(eq(evaluations.email, email)).orderBy(desc(evaluations.createdAt)).limit(1),
      ]);
      const pendingDocuments = requirements.filter((requirement) => ["pending", "rejected"].includes(requirement.status)).length;
      const openTasks = tasks.filter((task) => ["open", "in_progress"].includes(task.taskStatus)).length;
      const paymentSnapshot = reference.source === "online" ? {
        status: (sourceRecord as typeof applications.$inferSelect).paymentStatus,
        amount: (sourceRecord as typeof applications.$inferSelect).paymentAmount,
        currency: (sourceRecord as typeof applications.$inferSelect).paymentCurrency,
        method: (sourceRecord as typeof applications.$inferSelect).paymentMethod,
        reference: (sourceRecord as typeof applications.$inferSelect).paymentTransactionId,
        paidAt: (sourceRecord as typeof applications.$inferSelect).paymentDate,
      } : null;
      const evaluationVersions = reference.source === "online"
        ? await db.select().from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, reference.id)).orderBy(desc(evaluationBilanVersions.versionNumber))
        : [];
      const nextAction = determineCandidate360NextAction({ workflowStatus: operationalCase.currentStatus, paymentStatus: paymentSnapshot?.status, pendingDocuments, openTasks, dueAt: operationalCase.dueAt });
      const latestEvaluation = latestEvaluations[0];
      const projectDetails = parseEvaluationProjectDetails(latestEvaluation?.projectDetailsJson);
      const procedureLabel = [projectDetails.procedureName, projectDetails.procedureLabel, projectDetails.selectedProcedureLabel, projectDetails.procedure]
        .find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? latestEvaluation?.visaType ?? null;
      return {
        operationalCase: { ...operationalCase, labels: parseCandidate360Labels(operationalCase.labelsJson) },
        nextAction,
        metrics: { pendingDocuments, openTasks, unreadNotifications: notifications.filter((item) => !item.isRead).length, totalDocuments: operationalDocuments.length + legacyDocuments.length, totalMessages: messages.length },
        requirements,
        documents: [
          ...operationalDocuments,
          ...legacyDocuments.filter((document) => !operationalDocuments.some((operational) => operational.fileName === document.documentName)).map((document) => ({
            id: `legacy-${document.id}`,
            documentType: document.documentType,
            fileName: document.documentName,
            uploadedAt: document.uploadedAt,
            uploadedByRole: document.source === "online" ? "candidate" : "admin",
            reviewStatus: document.verificationStatus,
            reviewNote: document.verificationComment,
            source: document.source,
          })),
        ],
        payments: paymentSnapshot ? [paymentSnapshot] : [],
        tasks,
        notes,
        statusHistory,
        activity: [...activityLogs.map((item) => ({ type: item.actionType, description: item.description, createdAt: item.createdAt, actor: item.actorRole })), ...requestHistory.map((item) => ({ type: item.actionType, description: item.comment, createdAt: item.createdAt, actor: "admin" }))].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 50),
        communications: { notifications, messages },
        evaluationVersions,
        evaluationContext: latestEvaluation ? {
          projectType: latestEvaluation.projectType ?? null,
          destinationCountry: latestEvaluation.destinationCountry ?? null,
          visaType: latestEvaluation.visaType ?? null,
          procedureLabel,
          submittedAt: latestEvaluation.createdAt,
          details: projectDetails,
        } : null,
        advisors,
        currentAdmin: { id: admin.id, fullName: admin.fullName, email: admin.email },
      };
    }),

  updateCandidate360Workflow: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().min(1),
      workflowStatus: z.enum(candidate360WorkflowStatuses),
      priority: z.enum(["low", "normal", "high", "urgent"]),
      assignedAdminId: z.number().int().positive().nullable(),
      dueAt: z.date().nullable(),
      labels: z.array(z.string().trim().min(1).max(32)).max(12),
      comment: z.string().trim().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
      const operationalCase = await ensureOperationalCase(db, reference);
      const sourceRecord = reference.source === "online"
        ? (await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1))[0]
        : (await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1))[0];
      if (!sourceRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier source introuvable." });

      const now = new Date();
      const clientStatus = CANDIDATE360_LEGACY_STATUS_MAP[input.workflowStatus];
      const legacyStatus = mapCandidate360Status(input.workflowStatus, reference.source);
      const previousWorkflowStatus = operationalCase.currentStatus;
      await db.update(cases).set({ currentStatus: input.workflowStatus, priority: input.priority, assignedAdminId: input.assignedAdminId, labelsJson: JSON.stringify(input.labels), dueAt: input.dueAt }).where(eq(cases.id, operationalCase.id));

      // Keep the source table in lockstep: the client space reads applications
      // and agency_dossiers, not only the operational `cases` table.
      if (reference.source === "online") {
        await db.update(applications).set({
          dossierStatus: legacyStatus as any,
          lastStatusUpdateAt: now,
          lastStatusUpdatedBy: admin.fullName || "Admin",
          ...(input.comment ? { adminNote: input.comment } : {}),
        }).where(eq(applications.id, reference.id));
      } else {
        await db.update(agencyDossiers).set({
          status: legacyStatus as any,
          lastStatusChangeAt: now,
          lastStatusChangeBy: admin.email || admin.fullName || "Admin",
          ...(input.comment ? { adminNotes: input.comment } : {}),
        }).where(eq(agencyDossiers.id, reference.id));
      }

      if (input.comment) await db.insert(caseAdminNotes).values({ caseId: operationalCase.id, adminId: admin.id, note: input.comment, isPrivate: true });
      await db.insert(caseStatusHistory).values({ caseId: operationalCase.id, oldStatus: previousWorkflowStatus, newStatus: input.workflowStatus, changedByRole: "admin", changedById: admin.id, comment: input.comment ?? "Paramètres opérationnels mis à jour." });
      await db.insert(caseActivityLogs).values({ caseId: operationalCase.id, actorRole: "admin", actorId: admin.id, actionType: "workflow_updated", entityType: "case", entityId: String(operationalCase.id), description: `Étape ${input.workflowStatus} synchronisée vers ${legacyStatus}, priorité ${input.priority}, conseiller ${input.assignedAdminId ?? "non attribué"}.` });

      const candidateId = reference.source === "online"
        ? (sourceRecord as typeof applications.$inferSelect).candidateId
        : (await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, sourceRecord.email)).limit(1))[0]?.id ?? null;
      let notificationCreated = false;
      if (candidateId && (previousWorkflowStatus !== input.workflowStatus || Boolean(input.comment))) {
        await db.insert(clientNotifications).values({
          candidateId,
          caseId: operationalCase.id,
          type: "status_update",
          title: `Mise à jour de votre dossier ${operationalCase.caseNumber}`,
          body: input.comment ? `${clientStatus.label}. Message de l’administration : ${input.comment}` : `${clientStatus.label}. Consultez votre espace client pour voir la prochaine action.`,
          actionUrl: "/mon-espace?section=overview",
          isRead: false,
          isArchived: false,
        });
        notificationCreated = true;
      }

      return { success: true, legacyStatus, clientStatusLabel: clientStatus.label, notificationCreated };
    }),

  addCandidate360Task: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.string().min(1), title: z.string().trim().min(2).max(255), description: z.string().trim().max(1000).optional(), assignedAdminId: z.number().int().positive().nullable(), dueAt: z.date().nullable() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
      const operationalCase = await ensureOperationalCase(db, reference);
      await db.insert(caseTasks).values({ caseId: operationalCase.id, title: input.title, description: input.description ?? null, assignedAdminId: input.assignedAdminId, dueAt: input.dueAt, taskStatus: "open", createdByAdminId: admin.id });
      await db.insert(caseActivityLogs).values({ caseId: operationalCase.id, actorRole: "admin", actorId: admin.id, actionType: "task_created", entityType: "task", description: input.title });
      return { success: true };
    }),

  completeCandidate360Task: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), taskId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const [task] = await db.select().from(caseTasks).where(eq(caseTasks.id, input.taskId)).limit(1);
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Action introuvable." });
      await db.update(caseTasks).set({ taskStatus: "completed" }).where(eq(caseTasks.id, task.id));
      await db.insert(caseActivityLogs).values({ caseId: task.caseId, actorRole: "admin", actorId: admin.id, actionType: "task_completed", entityType: "task", entityId: String(task.id), description: task.title });
      return { success: true };
    }),

  createCountryDocumentChecklist: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().min(1),
      destination: z.string().trim().min(2).max(100).optional(),
      procedureType: z.enum(["permanent_residence", "work_permit", "study_permit", "visitor_visa", "family_reunification", "evisa"]).optional(),
      customDocuments: z.array(z.string().trim().min(2).max(120)).max(12).optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
      const operationalCase = await ensureOperationalCase(db, reference);
      const template = procedureChecklistFor(input.procedureType, input.destination);
      const customDocuments = (input.customDocuments ?? []).map((documentType) => ({ documentType, comment: "Pièce ajoutée spécifiquement par l’administration pour cette procédure." }));
      const checklist = [...template.documents, ...customDocuments];
      const existing = await db.select({ documentType: documentRequirements.documentType }).from(documentRequirements).where(eq(documentRequirements.caseId, operationalCase.id));
      const existingTypes = new Set(existing.map((item) => item.documentType.toLowerCase()));
      const missing = checklist.filter((item) => !existingTypes.has(item.documentType.toLowerCase()));
      if (missing.length) await db.insert(documentRequirements).values(missing.map((item) => ({ caseId: operationalCase.id, documentType: item.documentType, isRequired: true, status: "pending" as const, adminComment: item.comment })));
      await db.insert(caseActivityLogs).values({ caseId: operationalCase.id, actorRole: "admin", actorId: admin.id, actionType: "procedure_checklist_created", entityType: "document_requirement", description: `Checklist ${template.label} · ${input.destination || "destination standard"} créée : ${missing.length} pièce(s) ajoutée(s).` });
      return { success: true, added: missing.length, country: input.destination || "Standard", procedure: template.label };
    }),

  sendCandidate360DocumentReminder: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
      const operationalCase = await ensureOperationalCase(db, reference);
      const requirements = await db.select().from(documentRequirements).where(eq(documentRequirements.caseId, operationalCase.id));
      const missing = requirements.filter((item) => !["approved", "waived"].includes(item.status));
      if (!missing.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune pièce manquante à relancer pour ce dossier." });
      const record = reference.source === "online"
        ? (await db.select({ fullName: applications.fullName, email: applications.email, dossierNumber: applications.dossierNumber, candidateId: applications.candidateId }).from(applications).where(eq(applications.id, reference.id)).limit(1))[0]
        : (await db.select({ fullName: agencyDossiers.fullName, email: agencyDossiers.email, dossierNumber: agencyDossiers.id, candidateId: candidates.id }).from(agencyDossiers).leftJoin(candidates, eq(candidates.email, agencyDossiers.email)).where(eq(agencyDossiers.id, reference.id)).limit(1))[0];
      if (!record?.email) throw new TRPCError({ code: "NOT_FOUND", message: "Adresse e-mail du candidat introuvable." });
      const documentList = missing.map((item) => `<li><strong>${item.documentType}</strong>${item.adminComment ? ` — ${item.adminComment}` : ""}</li>`).join("");
      await sendGenericEmail({ to: record.email, subject: `Documents à compléter — Dossier ${String(record.dossierNumber)}`, html: `<p>Bonjour ${record.fullName},</p><p>Votre dossier nécessite encore les pièces suivantes :</p><ul>${documentList}</ul><p>Connectez-vous à votre espace 3M Travel pour déposer les documents ou répondre à votre conseiller.</p>` });
      if (record.candidateId) await db.insert(clientNotifications).values({ candidateId: record.candidateId, caseId: operationalCase.id, type: "documents_reminder", title: "Documents manquants à compléter", body: `${missing.length} pièce(s) restent à déposer ou à corriger. Consultez votre espace candidat.`, actionUrl: "/mon-espace?section=documents", isRead: false });
      await db.insert(caseActivityLogs).values({ caseId: operationalCase.id, actorRole: "admin", actorId: admin.id, actionType: "documents_reminder_sent", entityType: "case", entityId: String(operationalCase.id), description: `Relance envoyée pour ${missing.length} document(s) manquant(s).` });
      return { success: true, count: missing.length };
    }),

  sendCandidate360Message: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().min(1),
      content: z.string().trim().min(3).max(12_000),
      attachmentUrl: z.string().optional(),
      attachmentName: z.string().optional(),
      attachmentMimeType: z.string().optional(),
      attachmentSizeBytes: z.number().int().optional(),
      evisaSnapshots: z.array(z.object({
        destinationId: z.string().trim().min(1).max(80),
        country: z.string().trim().min(1).max(160),
        officialPortalUrl: z.string().trim().max(1_000),
        officialPortalLabel: z.string().trim().max(255),
        officialVerifiedAt: z.string().trim().max(80),
        requirements: z.string().trim().min(1).max(4_000),
        fee: z.string().trim().max(255),
        delay: z.string().trim().max(255),
        procedureUrl: z.string().trim().min(1).max(1_000),
      })).max(5).optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });

      const operationalCase = await ensureOperationalCase(db, reference);
      const sourceRecord = reference.source === "online"
        ? (await db.select({ email: applications.email, fullName: applications.fullName }).from(applications).where(eq(applications.id, reference.id)).limit(1))[0]
        : (await db.select({ email: agencyDossiers.email, fullName: agencyDossiers.fullName }).from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1))[0];
      if (!sourceRecord?.email) throw new TRPCError({ code: "NOT_FOUND", message: "Adresse e-mail du candidat introuvable." });

      const messageHtml = sanitizeRichTextHtml(input.content.trim());
      const messageBody = richTextToPlainText(messageHtml);
      if (messageBody.length < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "Le message doit contenir au moins trois caractères lisibles." });
      const evisaSnapshotJson = input.evisaSnapshots?.length
        ? createEvisaCommunicationSnapshot(input.evisaSnapshots, messageBody, admin.id)
        : null;
      const candidateRecord = (await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, sourceRecord.email)).limit(1))[0];
      if (candidateRecord) {
        const notificationResult = await db.insert(clientNotifications).values({
          candidateId: candidateRecord.id,
          caseId: operationalCase.id,
          type: "admin_message",
          title: "Nouveau message de Prime Travel Service",
          body: messageBody,
          actionUrl: "/mon-espace",
          isRead: false,
        });
        const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
        await db.insert(candidateMessages).values({
          candidateId: candidateRecord.id,
          notificationId: notificationId || null,
          senderRole: "advisor",
          content: messageBody,
          attachmentUrl: input.attachmentUrl || null,
          attachmentName: input.attachmentName || null,
          attachmentMimeType: input.attachmentMimeType || null,
          attachmentSizeBytes: input.attachmentSizeBytes || null,
          evisaSnapshotJson,
          isRead: false,
        });
      }

      let emailSent = false;
      try {
        const attachmentHtml = input.attachmentName && input.attachmentUrl
          ? `<p><strong>Pièce jointe :</strong> <a href="${input.attachmentUrl}" target="_blank">${input.attachmentName}</a></p>`
          : "";
        await sendGenericEmail({
          to: sourceRecord.email,
          subject: "Nouveau message concernant votre dossier 3M Travel",
          html: `<p>Bonjour ${sourceRecord.fullName},</p><div>${messageHtml}</div>${attachmentHtml}<p>Connectez-vous à votre espace 3M Travel pour consulter votre dossier et répondre à votre conseiller.</p>`,
        });
        emailSent = true;
      } catch (error) {
        console.error("[Candidate360] Envoi e-mail impossible après enregistrement du message", error);
      }

      await db.insert(caseActivityLogs).values({
        caseId: operationalCase.id,
        actorRole: "admin",
        actorId: admin.id,
        actionType: "candidate_message_sent",
        entityType: "communication",
        entityId: String(candidateRecord?.id ?? "email"),
        description: `Message envoyé au candidat${emailSent ? " par e-mail et espace client" : " dans l’espace client"}${messageHtml !== messageBody ? " avec mise en forme enrichie" : ""}${input.evisaSnapshots?.length ? ` avec instantané e‑Visa (${input.evisaSnapshots.map((item) => item.country).join(", ")})` : ""}.`,
      });
      return { success: true, emailSent, deliveredToClientSpace: Boolean(candidateRecord) };
    }),

  recordCandidate360CommunicationExport: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
      const operationalCase = await ensureOperationalCase(db, reference);
      await db.insert(caseActivityLogs).values({
        caseId: operationalCase.id,
        actorRole: "admin",
        actorId: admin.id,
        actionType: "communications_pdf_exported",
        entityType: "communication",
        entityId: String(operationalCase.id),
        description: "Historique complet des communications et instantanés e‑Visa exporté au format PDF.",
      });
      return { success: true };
    }),
});

// ─── Générateurs HTML des modèles ─────────────────────────────────────────────

function generateVerificationEmailHtml(fullName: string, verifyUrl: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.header h1{font-size:28px;margin:12px 0 0;font-weight:900}.body{padding:40px 32px}.greeting{font-size:16px;color:#1f2937;margin-bottom:24px;line-height:1.6}.cta-section{background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border-left:4px solid #2563EB;padding:20px;border-radius:8px;margin:28px 0}.cta-text{color:#1f2937;font-size:15px;line-height:1.6;margin-bottom:16px}.btn{display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px}.btn-center{text-align:center}.security-badge{background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:20px 0;font-size:13px;color:#92400e}.footer{background:linear-gradient(to bottom,#f9fafb,#f3f4f6);padding:32px 32px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Votre partenaire mobilité internationale</p></div><div class="body"><p class="greeting">Bonjour <strong>${fullName}</strong>,</p><p class="cta-text">Bienvenue dans votre <strong>Espace Candidat 3M Travel</strong> ! 🎉</p><p class="cta-text">Pour finaliser votre inscription, confirmez votre email :</p><div class="cta-section"><div class="btn-center"><a href="${verifyUrl}" class="btn">✓ Confirmer mon email</a></div></div><div class="security-badge">🔒 <strong>Sécurité :</strong> Ce lien est personnel et valable 24 heures.</div><p class="cta-text">Cordialement,<br><strong>L'équipe 3M Travel & Services</strong></p></div><div class="footer"><p>© 2024 3M Travel & Services. Tous droits réservés.</p></div></div></div></body></html>`;
}

function generateOtpEmailHtml(fullName: string, otp: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.body{padding:40px 32px}.otp-box{background:#eff6ff;border:2px dashed #2563EB;border-radius:12px;padding:20px;text-align:center;margin:24px 0}.otp-code{font-size:40px;font-weight:900;color:#1E3A8A;letter-spacing:12px}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Code de Vérification</p></div><div class="body"><p>Bonjour <strong>${fullName}</strong>,</p><p>Voici votre code de vérification :</p><div class="otp-box"><div class="otp-code">${otp}</div><div style="font-size:13px;color:#6b7280;margin-top:8px;">Ce code expire dans 15 minutes</div></div><p style="font-size:13px;color:#6b7280;">Pour votre sécurité, ne partagez jamais ce code.</p></div><div class="footer"><p>© 2024 3M Travel & Services</p></div></div></div></body></html>`;
}

function generatePasswordResetEmailHtml(fullName: string, resetUrl: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.body{padding:40px 32px}.btn{display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700}.btn-center{text-align:center}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Réinitialisation de Mot de Passe</p></div><div class="body"><p>Bonjour <strong>${fullName}</strong>,</p><p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez ci-dessous :</p><div class="btn-center" style="margin:24px 0"><a href="${resetUrl}" class="btn">🔑 Réinitialiser mon mot de passe</a></div><p style="font-size:13px;color:#6b7280;">Ce lien est valable 1 heure.</p></div><div class="footer"><p>© 2024 3M Travel & Services</p></div></div></div></body></html>`;
}

function generateWelcomeEmailHtml(fullName: string, destination: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.body{padding:40px 32px}.btn{display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700}.btn-center{text-align:center}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Bienvenue!</p></div><div class="body"><p>Bonjour <strong>${fullName}</strong>,</p><p>🎉 Votre compte 3M Travel est maintenant <strong>activé</strong> !</p><p>Vous pouvez maintenant :</p><ul style="margin:16px 0;padding-left:20px;color:#374151;line-height:2"><li>📁 Uploader vos documents</li><li>💬 Contacter votre conseiller</li><li>📊 Suivre votre dossier</li></ul><div class="btn-center" style="margin:24px 0"><a href="https://3mtravelagency.click/dashboard" class="btn">🚀 Accéder à mon espace</a></div></div><div class="footer"><p>© 2024 3M Travel & Services</p></div></div></div></body></html>`;
}

function generateDossierConfirmationEmailHtml(fullName: string, dossierNumber: string, destination: string, amount: number): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f2460 0%,#1e3a8a 50%,#2563eb 100%);margin:0;padding:20px}.wrapper{max-width:600px;margin:0 auto}.container{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(30,58,138,0.2)}.header{background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%);padding:40px 32px;text-align:center;color:#fff}.body{padding:40px 32px}.dossier-box{background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:20px;text-align:center;margin:24px 0}.dossier-number{font-size:32px;font-weight:900;color:#15803d;letter-spacing:6px}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}</style></head><body><div class="wrapper"><div class="container"><div class="header"><h1>3M Travel & Services</h1><p>Confirmation de Dossier</p></div><div class="body"><p>Bonjour <strong>${fullName}</strong>,</p><p>✅ Votre dossier a été <strong>créé avec succès</strong> !</p><div class="dossier-box"><div style="font-size:13px;color:#6b7280;margin-bottom:6px">NUMÉRO DE DOSSIER</div><div class="dossier-number">${dossierNumber}</div></div><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px;background:#f8faff;font-size:13px;color:#6b7280">Destination</td><td style="padding:8px;font-weight:700">${destination}</td></tr><tr><td style="padding:8px;background:#f8faff;font-size:13px;color:#6b7280">Montant</td><td style="padding:8px;font-weight:700">${amount.toLocaleString("fr-FR")} FCFA</td></tr></table><p style="font-size:13px;color:#6b7280">Un conseiller vous contactera sous 24h.</p></div><div class="footer"><p>© 2024 3M Travel & Services</p></div></div></div></body></html>`;
}
