import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import crypto from "node:crypto";
import { z } from "zod";
import { and, desc, eq, isNull, isNotNull, like, sql } from "drizzle-orm";
import { applications, agencyDossiers, agencyDossierDocuments, agencyDossierHistory, agencySettings, clientDocuments, candidateFiles, candidateMessages, candidates, evaluations, paymentAuditLogs, paymentReceiptApprovals } from "../../drizzle/schema";
import { caseActivityLogs, caseStatusHistory, cases, clientNotifications } from "../../drizzle/caseTrackingSchema";
import { getDb } from "../db";
import { requireAdminSessionFromCookie, requireValidAdminSession } from "./adminAuth";
import { sendClientNotificationEmail, sendDossierConfirmationEmail } from "../emailService";
import { describeDossierProgress, progressText } from "../../shared/dossierProgress";
import { sendReceiptAndProtocol } from "../services/paymentPackage";
import { archiveRedundantPreAccounts, loadEmailsWithActiveDossier, loadRedundantPreAccounts } from "../services/redundantPreAccountsStore";
import { loadPilotageQueue } from "../services/pilotageQueueStore";
import { accountReference, agencyDossierReference, referenceChangeSentence, resolveClientReference } from "../../shared/caseReference";
import { buildAdminReferenceView } from "../../shared/adminReferenceDisplay";
import { buildNoEvaluationOutreachDraft } from "../../shared/noEvaluationOutreach";
import {
  buildCandidateCockpit,
  cockpitQueueCategory,
  COCKPIT_QUEUE_LABELS,
  type CockpitQueueCategory,
} from "../../shared/candidateCockpit";
import { resolveDossierProcedureSelection } from "../../shared/dossierProcedureSelection";
import { seedCountryProcedureChecklist } from "../services/seedCountryProcedureCase";
import { sendEmail as sendGenericEmail } from "../_core/email";
import { storagePut } from "../storage";
import { buildPaymentReceiptEmailHtml, buildPaymentReceiptPdf } from "../utils/paymentReceipt";
import { AGREEMENT_PROTOCOL_VERSION } from "../../shared/agreementProtocolContent";
import { buildProtocolOneRichText, buildProtocolTwoRichText } from "../../shared/agreementProtocolCountryTemplates";
import { createAgreementProtocolOnePdf } from "../agreementProtocolPdfService";
import { storageKeyFromStoredUrl } from "../../shared/storedFileUrl";
import { SECOND_AGREEMENT_PROTOCOL_VERSION, dualOpportunityHandoffMessage } from "../../shared/secondAgreementProtocol";

const candidateFilterSchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  status: z.string().max(50).optional().default("all"),
  paymentStatus: z.enum(["all", "paye", "en_attente", "non_paye"]).default("all"),
  scoreBand: z.enum(["all", "excellent", "bon", "moyen", "faible"]).default("all"),
  destination: z.string().trim().max(100).optional().default("all"),
  portraitStatus: z.enum(["all", "missing", "pending", "verified", "rejected"]).default("all"),
  sortBy: z.enum(["createdAt", "fullName", "score"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
});

type CandidateFilter = z.infer<typeof candidateFilterSchema>;

type AdminCandidate = {
  id: string;
  applicationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  destination: string;
  visaType: string;
  scoringTotal: number;
  scoringBadge: "excellent" | "bon" | "moyen" | "faible";
  status: string;
  paymentStatus: "paye" | "en_attente" | "non_paye";
  createdAt: Date;
  documentsCount: number;
  source: "web" | "agence";
  avatarUrl?: string | null;
  avatarVerificationStatus: "missing" | "pending" | "verified" | "rejected";
  avatarVerificationReason?: string | null;
  avatarFaceCount: number;
};

function escapeAgreementHtml(value: string): string {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function createReceiptSignatureHash(input: { source: "online" | "agency"; paymentId: number; dossierNumber: string; candidateEmail: string; amount: string; currency: string; approvedByEmail: string; approvedAt: Date }) {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function toUiScoreBand(badge: string | null): "excellent" | "bon" | "moyen" | "faible" {
  if (badge === "eligible") return "excellent";
  if (badge === "admissible") return "bon";
  return "faible";
}

export function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? "").replace(/\r?\n/g, " ");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function parseAdminCandidateReference(candidateId: string): { source: "online" | "agency"; id: number } | null {
  const match = /^(online|agency)_(\d+)$/.exec(candidateId);
  if (!match) return null;
  const id = Number(match[2]);
  return Number.isInteger(id) && id > 0 ? { source: match[1] as "online" | "agency", id } : null;
}

export function paginateCandidates<T>(records: T[], requestedPage: number, pageSize: number) {
  const total = records.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;
  return { records: records.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

/** Texte des conditions d'ouverture du dossier officiel : les mêmes messages servent à refuser l'activation et à expliquer à l'administrateur ce qui manque. */
const ACTIVATION_MESSAGES = {
  alreadyActive: "Ce compte possède déjà un dossier actif.",
  evaluation: "L’évaluation doit être validée par un conseiller avant l’ouverture du dossier officiel.",
  payment: "Le paiement doit être validé par un administrateur avant l’ouverture du dossier officiel.",
} as const;

/**
 * Confirmation du paiement des frais d'ouverture pour un compte qui n'a encore AUCUN dossier (ni en ligne, ni agence) :
 * stockée dans agency_settings (clé OPENING_PAYMENT_KEY_PREFIX + candidateId), sans migration, sur le même modèle que
 * les autres états ponctuels du projet (ex. payment_instructions, review_invited:<clé>). Un dossier agence ou en ligne
 * existant garde son propre mécanisme de validation (onglet Paiements) ; celui-ci ne sert qu'à l'étape "pas encore de
 * dossier" où cet onglet n'a justement rien à montrer.
 */
const OPENING_PAYMENT_KEY_PREFIX = "opening_payment:";
const PENDING_OPENING_PAYMENT_KEY_PREFIX = "opening_payment_pending:";

type OpeningPaymentRecord = {
  candidateId: number;
  validatedAt: string;
  validatedBy: string;
  reference: string | null;
  proofFileUrl: string | null;
  confirmedAmount: number | null;
  additionalPayment?: {
    reference: string;
    proofFileUrl: string | null;
    confirmedAmount: number | null;
  };
};

export type PendingOpeningPaymentProof = {
  candidateId: number;
  proofFileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  fileName?: string;
  mimeType?: string;
};

async function getOpeningPaymentRecord(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, candidateId: number): Promise<OpeningPaymentRecord | null> {
  const [row] = await db.select({ settingValue: agencySettings.settingValue }).from(agencySettings)
    .where(eq(agencySettings.settingKey, `${OPENING_PAYMENT_KEY_PREFIX}${candidateId}`))
    .limit(1);
  if (!row) return null;
  try {
    return JSON.parse(row.settingValue) as OpeningPaymentRecord;
  } catch {
    return null;
  }
}

async function setOpeningPaymentRecord(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, record: OpeningPaymentRecord): Promise<void> {
  const key = `${OPENING_PAYMENT_KEY_PREFIX}${record.candidateId}`;
  const settingValue = JSON.stringify(record);
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
  if (existing) {
    await db.update(agencySettings).set({ settingValue, updatedAt: new Date() }).where(eq(agencySettings.id, existing.id));
  } else {
    await db.insert(agencySettings).values({ settingKey: key, settingValue });
  }
}

export async function setPendingOpeningPaymentProof(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, proof: PendingOpeningPaymentProof): Promise<void> {
  const settingKey = `${PENDING_OPENING_PAYMENT_KEY_PREFIX}${proof.candidateId}`;
  const settingValue = JSON.stringify(proof);
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, settingKey)).limit(1);
  if (existing) await db.update(agencySettings).set({ settingValue, updatedAt: new Date() }).where(eq(agencySettings.id, existing.id));
  else await db.insert(agencySettings).values({ settingKey, settingValue });
}

async function getPendingOpeningPaymentProof(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, candidateId: number): Promise<PendingOpeningPaymentProof | null> {
  const [row] = await db.select({ settingValue: agencySettings.settingValue }).from(agencySettings).where(eq(agencySettings.settingKey, `${PENDING_OPENING_PAYMENT_KEY_PREFIX}${candidateId}`)).limit(1);
  if (!row) return null;
  try { return JSON.parse(row.settingValue) as PendingOpeningPaymentProof; } catch { return null; }
}

async function clearPendingOpeningPaymentProof(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, candidateId: number): Promise<void> {
  await db.delete(agencySettings).where(eq(agencySettings.settingKey, `${PENDING_OPENING_PAYMENT_KEY_PREFIX}${candidateId}`));
}

/**
 * Le paiement des frais d'ouverture est validé quand un administrateur l'a confirmé : paiement en ligne « SUCCESS » validé par un
 * nom d'administrateur, ou paiement du pré-dossier agence confirmé dans le journal d'audit des paiements. Ne regarde PAS
 * OpeningPaymentRecord (compte sans dossier) : les appelants le vérifient eux-mêmes avant d'appeler cette fonction, pour ne
 * jamais imposer son ordre de lecture aux tests qui ciblent uniquement les dossiers en ligne/agence.
 */
async function isOpeningPaymentValidated(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, candidate: { id: number; email: string }): Promise<boolean> {
  const [latestApplication] = await db.select({ paymentStatus: applications.paymentStatus, paymentValidatedAt: applications.paymentValidatedAt, paymentValidatedBy: applications.paymentValidatedBy }).from(applications)
    .where(eq(applications.candidateId, candidate.id))
    .orderBy(desc(applications.createdAt))
    .limit(1);
  if (latestApplication?.paymentStatus === "SUCCESS" && Boolean(latestApplication.paymentValidatedAt) && Boolean(latestApplication.paymentValidatedBy?.trim())) return true;
  const [paidAgencyDossier] = await db.select({ id: agencyDossiers.id, email: agencyDossiers.email }).from(agencyDossiers)
    .where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(${agencyDossiers.email}) = LOWER(${candidate.email})`, eq(agencyDossiers.initialPaymentStatus, "paid")))
    .orderBy(desc(agencyDossiers.createdAt))
    .limit(1);
  if (!paidAgencyDossier) return false;
  const [confirmedAudit] = await db.select({ id: paymentAuditLogs.id }).from(paymentAuditLogs)
    .where(and(eq(paymentAuditLogs.paymentId, paidAgencyDossier.id), eq(paymentAuditLogs.candidateEmail, paidAgencyDossier.email), eq(paymentAuditLogs.action, "confirmed")))
    .orderBy(desc(paymentAuditLogs.createdAt))
    .limit(1);
  return Boolean(confirmedAudit);
}

async function resolveCandidateIdForAdmin(candidateId: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  const reference = parseAdminCandidateReference(candidateId);
  if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });

  if (reference.source === "online") {
    const [application] = await db.select({ candidateId: applications.candidateId, email: applications.email }).from(applications).where(eq(applications.id, reference.id)).limit(1);
    if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
    if (application.candidateId) return application.candidateId;
    const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(sql`LOWER(TRIM(${candidates.email})) = LOWER(TRIM(${application.email}))`).limit(1);
    return candidate?.id ?? null;
  }

  const [dossier] = await db.select({ email: agencyDossiers.email }).from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
  if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
  const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(sql`LOWER(TRIM(${candidates.email})) = LOWER(TRIM(${dossier.email}))`).limit(1);
  return candidate?.id ?? null;
}

export async function requireAdminTreatmentSession(cookieHeader: string | undefined, sessionToken: string) {
  try {
    return await requireAdminSessionFromCookie(cookieHeader);
  } catch {
    // Repli sécurisé pour les aperçus intégrés qui ne transmettent pas le cookie HttpOnly.
    // Le jeton est validé côté serveur et ne porte aucune identité fournie par le navigateur.
    return requireValidAdminSession(sessionToken);
  }
}

async function loadCandidates(filter: CandidateFilter, sourceLimit = 5000) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

  const [online, agency, documents, candidateRows] = await Promise.all([
    db.select().from(applications).orderBy(desc(applications.createdAt)).limit(sourceLimit),
    db.select().from(agencyDossiers).orderBy(desc(agencyDossiers.createdAt)).limit(sourceLimit),
    db.select().from(clientDocuments).limit(Math.min(sourceLimit * 2, 10000)),
    db.select().from(candidates).limit(sourceLimit),
  ]);
  const candidateByEmail = new Map<string, typeof candidates.$inferSelect>();
  for (const candidate of candidateRows as Array<typeof candidates.$inferSelect>) {
    candidateByEmail.set(candidate.email.toLowerCase(), candidate);
  }
  const documentCounts = new Map<string, number>();
  documents.forEach(document => documentCounts.set(document.candidateEmail.toLowerCase(), (documentCounts.get(document.candidateEmail.toLowerCase()) ?? 0) + 1));

  const onlineCandidates: AdminCandidate[] = online.map(application => ({
      id: `online_${application.id}`,
      applicationNumber: application.dossierNumber,
      fullName: application.fullName,
      email: application.email,
      phone: application.whatsappNumber,
      destination: application.destination || "Non spécifiée",
      visaType: application.visaType || "Non spécifié",
      scoringTotal: application.scoringTotal ?? application.evaluationScore ?? 0,
      scoringBadge: toUiScoreBand(application.scoringBadge),
      status: application.dossierStatus,
      paymentStatus: application.paymentStatus === "SUCCESS" ? "paye" : application.paymentStatus === "PENDING" ? "en_attente" : "non_paye",
      createdAt: application.createdAt,
      documentsCount: documentCounts.get(application.email.toLowerCase()) ?? 0,
      source: "web" as const,
      avatarUrl: candidateByEmail.get(application.email.toLowerCase())?.avatarUrl ?? null,
      avatarVerificationStatus: candidateByEmail.get(application.email.toLowerCase())?.avatarVerificationStatus ?? "missing",
      avatarVerificationReason: candidateByEmail.get(application.email.toLowerCase())?.avatarVerificationReason ?? null,
      avatarFaceCount: candidateByEmail.get(application.email.toLowerCase())?.avatarFaceCount ?? 0,
    }) as AdminCandidate);
  const agencyCandidates: AdminCandidate[] = agency.map(dossier => ({
      id: `agency_${dossier.id}`,
      applicationNumber: `3M-AGN-${String(dossier.id).padStart(4, "0")}`,
      fullName: dossier.fullName,
      email: dossier.email,
      phone: dossier.phone,
      destination: dossier.destination || "Non spécifiée",
      visaType: dossier.visaType || "Non spécifié",
      scoringTotal: 0,
      scoringBadge: "faible" as const,
      status: dossier.status,
      paymentStatus: "non_paye" as const,
      createdAt: dossier.createdAt,
      documentsCount: documentCounts.get(dossier.email.toLowerCase()) ?? 0,
      source: "agence" as const,
      avatarUrl: candidateByEmail.get(dossier.email.toLowerCase())?.avatarUrl ?? null,
      avatarVerificationStatus: candidateByEmail.get(dossier.email.toLowerCase())?.avatarVerificationStatus ?? "missing",
      avatarVerificationReason: candidateByEmail.get(dossier.email.toLowerCase())?.avatarVerificationReason ?? null,
      avatarFaceCount: candidateByEmail.get(dossier.email.toLowerCase())?.avatarFaceCount ?? 0,
    }) as AdminCandidate);
  let candidateRecords: AdminCandidate[] = onlineCandidates.concat(agencyCandidates);

  const query = filter.search.toLowerCase();
  if (query) candidateRecords = candidateRecords.filter(candidate => [candidate.fullName, candidate.email, candidate.applicationNumber, candidate.destination, candidate.visaType].some(value => value.toLowerCase().includes(query)));
  if (filter.status !== "all") candidateRecords = candidateRecords.filter(candidate => candidate.status === filter.status);
  if (filter.paymentStatus !== "all") candidateRecords = candidateRecords.filter(candidate => candidate.paymentStatus === filter.paymentStatus);
  if (filter.scoreBand !== "all") candidateRecords = candidateRecords.filter(candidate => candidate.scoringBadge === filter.scoreBand);
  if (filter.destination !== "all") candidateRecords = candidateRecords.filter(candidate => candidate.destination.toLowerCase() === filter.destination.toLowerCase());
  if (filter.portraitStatus !== "all") candidateRecords = candidateRecords.filter(candidate => candidate.avatarVerificationStatus === filter.portraitStatus);

  candidateRecords.sort((left, right) => {
    const direction = filter.sortDirection === "asc" ? 1 : -1;
    if (filter.sortBy === "score") return direction * (left.scoringTotal - right.scoringTotal);
    if (filter.sortBy === "fullName") return direction * left.fullName.localeCompare(right.fullName, "fr");
    return direction * (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  });

  return candidateRecords;
}

export const adminCandidateManagementRouter = router({
  /** File de pilotage prioritaire : dossiers prêts à activer, pièces à contrôler, dossiers sans mouvement (lecture seule). */
  getPilotageQueue: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      return loadPilotageQueue(db);
    }),

  /**
   * Tableau de contrôle total : files actionnables dérivées du cockpit
   * (e-mail, évaluation, paiement, activation, protocole, documents).
   */
  listCockpitControlBoard: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const [accountRows, evaluationRows, paidApps, receiptRows, pendingDocs, openingPaymentRows] = await Promise.all([
        db.select({
          id: candidates.id,
          fullName: candidates.fullName,
          email: candidates.email,
          emailVerified: candidates.emailVerified,
          evaluationDeclarationStatus: candidates.evaluationDeclarationStatus,
          destination: candidates.destination,
          visaType: candidates.visaType,
          preferredDestinations: candidates.preferredDestinations,
          dossierStatus: candidates.dossierStatus,
          createdAt: candidates.createdAt,
          updatedAt: candidates.updatedAt,
        }).from(candidates).where(isNull(candidates.deletedAt)).orderBy(desc(candidates.updatedAt)).limit(1500),
        db.select({ email: evaluations.email }).from(evaluations).limit(10000),
        db.select({
          id: applications.id,
          dossierNumber: applications.dossierNumber,
          fullName: applications.fullName,
          email: applications.email,
          destination: applications.destination,
          visaType: applications.visaType,
          agreementSigned: applications.agreementSigned,
          paymentValidatedAt: applications.paymentValidatedAt,
          candidateId: applications.candidateId,
          dossierStatus: applications.dossierStatus,
        }).from(applications).where(and(eq(applications.paymentStatus, "SUCCESS"), isNull(applications.deletedAt))).orderBy(desc(applications.paymentValidatedAt)).limit(800),
        db.select({
          dossierNumber: paymentReceiptApprovals.dossierNumber,
          candidateEmail: paymentReceiptApprovals.candidateEmail,
        }).from(paymentReceiptApprovals).limit(3000),
        db.select({
          candidateId: candidateFiles.candidateId,
          uploadedAt: candidateFiles.uploadedAt,
        }).from(candidateFiles).where(eq(candidateFiles.status, "uploaded")).limit(5000),
        // Batch unique des paiements d'ouverture — évite N× getOpeningPaymentRecord.
        db.select({
          settingKey: agencySettings.settingKey,
        }).from(agencySettings).where(like(agencySettings.settingKey, `${OPENING_PAYMENT_KEY_PREFIX}%`)).limit(5000),
      ]);

      const evaluatedEmails = new Set(evaluationRows.map((row) => row.email.trim().toLowerCase()));
      const receiptByDossier = new Set(receiptRows.map((row) => row.dossierNumber.trim().toUpperCase()));
      const receiptByEmail = new Set(receiptRows.map((row) => row.candidateEmail.trim().toLowerCase()));
      const openingPaidIds = new Set<number>();
      for (const row of openingPaymentRows) {
        const id = Number(String(row.settingKey).slice(OPENING_PAYMENT_KEY_PREFIX.length));
        if (Number.isFinite(id) && id > 0) openingPaidIds.add(id);
      }
      const pendingDocCount = new Map<number, number>();
      const oldestPendingDoc = new Map<number, Date>();
      for (const doc of pendingDocs) {
        pendingDocCount.set(doc.candidateId, (pendingDocCount.get(doc.candidateId) ?? 0) + 1);
        const prev = oldestPendingDoc.get(doc.candidateId);
        if (!prev || new Date(doc.uploadedAt).getTime() < prev.getTime()) {
          oldestPendingDoc.set(doc.candidateId, new Date(doc.uploadedAt));
        }
      }

      const activeEmails = await loadEmailsWithActiveDossier(db);
      const items: Array<{
        id: string;
        openId: string;
        reference: string;
        fullName: string;
        email: string;
        category: CockpitQueueCategory;
        categoryLabel: string;
        stageLabel: string;
        nextActionLabel: string;
        urgency: "high" | "normal" | "low";
        blockers: string[];
        progressPercent: number;
      }> = [];

      for (const account of accountRows) {
        const emailKey = account.email.trim().toLowerCase();
        const paymentConfirmed = account.dossierStatus !== "nouveau" || openingPaidIds.has(account.id);
        const cockpit = buildCandidateCockpit({
          emailVerified: account.emailVerified,
          evaluationStatus: account.evaluationDeclarationStatus,
          hasEvaluationRecord: evaluatedEmails.has(emailKey),
          paymentConfirmed,
          receiptApproved: receiptByEmail.has(emailKey),
          protocolSigned: false,
          dossierActivated: account.dossierStatus !== "nouveau" || activeEmails.has(emailKey),
          pendingDocuments: pendingDocCount.get(account.id) ?? 0,
          destination: account.destination,
          visaType: account.visaType,
          workflowStatus: account.dossierStatus,
        });
        const category = cockpitQueueCategory(cockpit.stage);
        if (!category) continue;
        items.push({
          id: `account:${account.id}:${category}`,
          openId: `account_${account.id}`,
          reference: accountReference(account.id),
          fullName: account.fullName,
          email: account.email,
          category,
          categoryLabel: COCKPIT_QUEUE_LABELS[category],
          stageLabel: cockpit.stageLabel,
          nextActionLabel: cockpit.nextAction.label,
          urgency: cockpit.nextAction.urgency,
          blockers: cockpit.blockers.map((item) => item.message),
          progressPercent: cockpit.progressPercent,
        });
      }

      for (const app of paidApps) {
        const emailKey = app.email.trim().toLowerCase();
        const receiptApproved = receiptByDossier.has(app.dossierNumber.trim().toUpperCase()) || receiptByEmail.has(emailKey);
        const cockpit = buildCandidateCockpit({
          emailVerified: true,
          evaluationStatus: "validated",
          hasEvaluationRecord: true,
          paymentConfirmed: true,
          receiptApproved,
          protocolSigned: Boolean(app.agreementSigned),
          dossierActivated: true,
          pendingDocuments: app.candidateId ? (pendingDocCount.get(app.candidateId) ?? 0) : 0,
          destination: app.destination,
          visaType: app.visaType,
          workflowStatus: app.dossierStatus,
        });
        const category = cockpitQueueCategory(cockpit.stage);
        if (!category || category === "no_evaluation" || category === "email_unverified") continue;
        items.push({
          id: `online:${app.id}:${category}`,
          openId: `online_${app.id}`,
          reference: app.dossierNumber,
          fullName: app.fullName,
          email: app.email,
          category,
          categoryLabel: COCKPIT_QUEUE_LABELS[category],
          stageLabel: cockpit.stageLabel,
          nextActionLabel: cockpit.nextAction.label,
          urgency: cockpit.nextAction.urgency,
          blockers: cockpit.blockers.map((item) => item.message),
          progressPercent: cockpit.progressPercent,
        });
      }

      const urgencyRank = { high: 0, normal: 1, low: 2 } as const;
      items.sort((left, right) => urgencyRank[left.urgency] - urgencyRank[right.urgency] || left.fullName.localeCompare(right.fullName, "fr"));

      const counts = {
        email_unverified: 0,
        no_evaluation: 0,
        payment_pending: 0,
        ready_to_activate: 0,
        protocol_pending: 0,
        documents_pending: 0,
        high: items.filter((item) => item.urgency === "high").length,
        total: items.length,
      } as Record<CockpitQueueCategory | "high" | "total", number>;
      for (const item of items) counts[item.category] += 1;

      return { counts, items: items.slice(0, 200), labels: COCKPIT_QUEUE_LABELS };
    }),

  /**
   * Pré-comptes redondants : pré-dossiers ou comptes sans dossier propre dont la personne a déjà un dossier actif.
   * Lecture seule (aperçu) : rien n'est modifié tant que l'administrateur n'a pas confirmé la mise en corbeille.
   */
  listRedundantPreAccounts: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const items = await loadRedundantPreAccounts(db);
      return { items, certain: items.filter((item) => item.confidence === "certain").length, probable: items.filter((item) => item.confidence === "probable").length };
    }),

  archiveRedundantPreAccounts: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1).max(512),
      items: z.array(z.object({ kind: z.enum(["agency_pre_dossier", "account"]), id: z.number().int().positive() })).min(1).max(200),
      confirmation: z.literal("CORBEILLE"),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const result = await archiveRedundantPreAccounts(db, { items: input.items, adminEmail: admin.email });
      return { success: true, archivedCount: result.archived.length, skippedCount: result.skipped.length, archived: result.archived.map((item) => item.reference), message: "Placés dans la corbeille réversible (restauration possible depuis l'administration)." };
    }),

  listPreDossierAccounts: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), search: z.string().trim().max(120).optional().default("") }))
    .query(async ({ input, ctx }) => {
      await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      // Un pré-compte déjà mis en corbeille n'est plus à ouvrir, et celui dont la personne a déjà un dossier actif non plus :
      // il n'est ni supprimé ni modifié, seulement retiré de cette liste (le nombre masqué est annoncé à l'administrateur).
      const [allAccounts, files, evaluationRows, activeEmails] = await Promise.all([
        db.select().from(candidates).where(and(eq(candidates.dossierStatus, "nouveau"), isNull(candidates.deletedAt))).orderBy(desc(candidates.createdAt)).limit(500),
        db.select({ candidateId: candidateFiles.candidateId, fileType: candidateFiles.fileType }).from(candidateFiles).limit(5000),
        db.select({ email: evaluations.email, cvFileUrl: evaluations.cvFileUrl }).from(evaluations).limit(10000),
        loadEmailsWithActiveDossier(db),
      ]);
      const accounts = allAccounts.filter((account) => !activeEmails.has(account.email.trim().toLowerCase()));
      const coveredByActiveDossier = allAccounts.length - accounts.length;
      const documentsByCandidate = new Map<number, number>();
      const cvByCandidate = new Set<number>();
      files.forEach((file) => {
        documentsByCandidate.set(file.candidateId, (documentsByCandidate.get(file.candidateId) ?? 0) + 1);
        if (file.fileType === "cv") cvByCandidate.add(file.candidateId);
      });
      const cvByEmail = new Set(
        evaluationRows
          .filter((row) => Boolean(row.cvFileUrl?.trim()))
          .map((row) => row.email.trim().toLowerCase()),
      );
      const query = input.search.toLowerCase();
      const filtered = accounts.filter((account) => !query || [account.fullName, account.email, account.phone ?? "", account.destination ?? ""].some((value) => value.toLowerCase().includes(query)));
      const openingPaymentByCandidate = new Map<number, OpeningPaymentRecord | null>();
      await Promise.all(filtered.map(async (account) => {
        openingPaymentByCandidate.set(account.id, await getOpeningPaymentRecord(db, account.id));
      }));
      return {
        total: filtered.length,
        coveredByActiveDossier,
        accounts: filtered.map((account) => {
          const emailKey = account.email.trim().toLowerCase();
          const hasCv = cvByCandidate.has(account.id) || cvByEmail.has(emailKey);
          const evaluationValidated = account.evaluationDeclarationStatus === "validated";
          const evaluationPending = account.evaluationDeclarationStatus === "pending_validation";
          return {
            id: account.id,
            fullName: account.fullName,
            email: account.email,
            phone: account.phone,
            destinationPreference: account.destination,
            dossierStatus: account.dossierStatus,
            emailVerified: account.emailVerified,
            createdAt: account.createdAt,
            lastLoginAt: account.lastLoginAt,
            documentsCount: documentsByCandidate.get(account.id) ?? 0,
            hasCv,
            /** Déclaration / validation hors ligne sans CV en fichier — dossier à ouvrir ensuite selon pays + visa. */
            evaluationWithoutCv: (evaluationValidated || evaluationPending) && !hasCv,
            pendingEvaluationReference: evaluationPending ? (hasCv ? "Évaluation externe à valider" : "Évaluation sans CV à valider") : null,
            evaluationDeclarationStatus: account.evaluationDeclarationStatus,
            evaluationReviewedAt: account.evaluationReviewedAt,
            evaluationReviewedBy: account.evaluationReviewedBy,
            evaluationReviewNote: account.evaluationReviewNote,
            evaluationValidated,
            paymentValidated: Boolean(openingPaymentByCandidate.get(account.id)),
            paymentProofUrl: openingPaymentByCandidate.get(account.id)?.proofFileUrl ?? null,
            paymentReference: openingPaymentByCandidate.get(account.id)?.reference ?? null,
            paymentValidatedAt: openingPaymentByCandidate.get(account.id)?.validatedAt ?? null,
            accountReference: accountReference(account.id),
            referenceView: buildAdminReferenceView({ candidateId: account.id }),
            preferredDestinations: (() => {
              try {
                const parsed = JSON.parse(account.preferredDestinations || "[]");
                return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
              } catch {
                return [] as string[];
              }
            })(),
            visaType: account.visaType,
          };
        }),
      };
    }),

  /**
   * Comptes inscrits sans évaluation (ni déclaration validée, ni ligne evaluations).
   * Sert le brouillon d’e-mail intelligent pays + type d’accompagnement.
   */
  listCandidatesWithoutEvaluation: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      search: z.string().trim().max(120).optional().default(""),
      onlyUnverifiedEmail: z.boolean().optional().default(false),
    }))
    .query(async ({ input, ctx }) => {
      await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const [accountRows, evaluationRows] = await Promise.all([
        db.select({
          id: candidates.id,
          fullName: candidates.fullName,
          email: candidates.email,
          phone: candidates.phone,
          destination: candidates.destination,
          preferredDestinations: candidates.preferredDestinations,
          visaType: candidates.visaType,
          emailVerified: candidates.emailVerified,
          evaluationDeclarationStatus: candidates.evaluationDeclarationStatus,
          dossierStatus: candidates.dossierStatus,
          createdAt: candidates.createdAt,
          lastLoginAt: candidates.lastLoginAt,
        }).from(candidates).where(and(
          isNull(candidates.deletedAt),
          eq(candidates.evaluationDeclarationStatus, "not_declared"),
        )).orderBy(desc(candidates.createdAt)).limit(2000),
        db.select({ email: evaluations.email }).from(evaluations).limit(10000),
      ]);

      const evaluatedEmails = new Set(evaluationRows.map((row) => row.email.trim().toLowerCase()));
      const query = input.search.toLowerCase();
      const rows = accountRows
        .filter((account) => !evaluatedEmails.has(account.email.trim().toLowerCase()))
        .filter((account) => !input.onlyUnverifiedEmail || !account.emailVerified)
        .filter((account) => !query || [account.fullName, account.email, account.phone ?? "", account.destination ?? "", account.visaType ?? ""].some((value) => value.toLowerCase().includes(query)))
        .map((account) => {
          let preferredDestinations: string[] = [];
          try {
            const parsed = JSON.parse(account.preferredDestinations || "[]");
            preferredDestinations = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
          } catch {
            preferredDestinations = [];
          }
          const accountRef = accountReference(account.id);
          const draft = buildNoEvaluationOutreachDraft({
            fullName: account.fullName,
            accountReference: accountRef,
            preferredDestinations,
            destinationPreference: account.destination,
            visaType: account.visaType,
            emailVerified: account.emailVerified,
          });
          return {
            id: account.id,
            fullName: account.fullName,
            email: account.email,
            phone: account.phone,
            emailVerified: account.emailVerified,
            dossierStatus: account.dossierStatus,
            createdAt: account.createdAt,
            lastLoginAt: account.lastLoginAt,
            accountReference: accountRef,
            preferredDestinations,
            destinationPreference: account.destination,
            visaType: account.visaType,
            draft,
          };
        });

      return { total: rows.length, candidates: rows };
    }),

  sendNoEvaluationOutreach: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.number().int().positive(),
      subject: z.string().trim().min(5).max(255),
      message: z.string().trim().min(40).max(12_000),
      confirmed: z.literal(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });

      const body = input.message.trim();
      const notificationResult = await db.insert(clientNotifications).values({
        candidateId: candidate.id,
        type: "admin_remark",
        title: input.subject.trim(),
        body,
        actionUrl: "/evaluation",
        isRead: false,
      });
      const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
      await db.insert(candidateMessages).values({
        candidateId: candidate.id,
        notificationId: notificationId || null,
        senderRole: "advisor",
        content: body,
        isRead: false,
      });

      const emailSent = await sendClientNotificationEmail({
        to: candidate.email,
        fullName: candidate.fullName,
        title: input.subject.trim(),
        body,
        actionUrl: "/evaluation",
        sourceLabel: "3M TRAVEL AGENCY",
      });
      if (emailSent && notificationId > 0) {
        await db.update(clientNotifications).set({ emailSentAt: new Date() }).where(eq(clientNotifications.id, notificationId));
      }

      await db.insert(paymentAuditLogs).values({
        adminName: admin.email || "Administrateur",
        adminEmail: admin.email || "",
        action: "no_evaluation_outreach_sent",
        paymentId: candidate.id,
        candidateEmail: candidate.email,
        amount: "0",
        details: `Relance « sans évaluation » envoyée (${emailSent ? "e-mail OK" : "e-mail en échec"}) — objet : ${input.subject.trim()}`,
      });

      return { success: true, emailSent, sentBy: admin.email, accountReference: accountReference(candidate.id) };
    }),

  /** Tableau de bord reçus + protocoles pour un pilotage transparent. */
  contractsReceiptsDesk: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const [awaitingProtocol, paidApps, receiptApprovals, recentAudit] = await Promise.all([
        db.select({
          id: applications.id,
          dossierNumber: applications.dossierNumber,
          fullName: applications.fullName,
          email: applications.email,
          destination: applications.destination,
          paymentValidatedAt: applications.paymentValidatedAt,
          paymentAmount: applications.paymentAmount,
          agreementSigned: applications.agreementSigned,
        }).from(applications).where(and(
          eq(applications.paymentStatus, "SUCCESS"),
          eq(applications.agreementSigned, false),
          isNull(applications.deletedAt),
        )).orderBy(desc(applications.paymentValidatedAt)).limit(200),
        db.select({
          id: applications.id,
          dossierNumber: applications.dossierNumber,
          fullName: applications.fullName,
          email: applications.email,
          agreementSigned: applications.agreementSigned,
          paymentValidatedAt: applications.paymentValidatedAt,
          candidateId: applications.candidateId,
        }).from(applications).where(and(
          eq(applications.paymentStatus, "SUCCESS"),
          isNull(applications.deletedAt),
        )).orderBy(desc(applications.paymentValidatedAt)).limit(300),
        db.select({
          dossierNumber: paymentReceiptApprovals.dossierNumber,
          candidateEmail: paymentReceiptApprovals.candidateEmail,
          approvedAt: paymentReceiptApprovals.approvedAt,
        }).from(paymentReceiptApprovals).orderBy(desc(paymentReceiptApprovals.approvedAt)).limit(2000),
        db.select({
          id: paymentAuditLogs.id,
          action: paymentAuditLogs.action,
          candidateEmail: paymentAuditLogs.candidateEmail,
          adminEmail: paymentAuditLogs.adminEmail,
          details: paymentAuditLogs.details,
          createdAt: paymentAuditLogs.createdAt,
        }).from(paymentAuditLogs).orderBy(desc(paymentAuditLogs.createdAt)).limit(40),
      ]);

      const receiptByDossier = new Set(receiptApprovals.map((row) => row.dossierNumber.trim().toUpperCase()));
      const receiptByEmail = new Set(receiptApprovals.map((row) => row.candidateEmail.trim().toLowerCase()));

      const agencyByEmail = new Map<string, { id: number; status: string | null }>();
      const agencyRows = await db.select({
        id: agencyDossiers.id,
        email: agencyDossiers.email,
        status: agencyDossiers.status,
      }).from(agencyDossiers).where(isNull(agencyDossiers.deletedAt)).orderBy(desc(agencyDossiers.updatedAt)).limit(2000);
      for (const row of agencyRows) {
        const key = row.email.trim().toLowerCase();
        if (!agencyByEmail.has(key)) agencyByEmail.set(key, { id: row.id, status: row.status });
      }

      const pipeline = paidApps.map((app) => {
        const agency = agencyByEmail.get(app.email.trim().toLowerCase()) ?? null;
        const reference = app.candidateId
          ? resolveClientReference({
            candidateId: app.candidateId,
            agencyDossier: agency,
            onlineApplication: {
              dossierNumber: app.dossierNumber,
              paymentStatus: "SUCCESS",
              paymentValidatedAt: app.paymentValidatedAt,
            },
          })
          : { reference: app.dossierNumber, kind: "active_dossier" as const, formerAccountReference: null, activated: true };
        const receiptAvailable = receiptByDossier.has(app.dossierNumber.trim().toUpperCase())
          || receiptByEmail.has(app.email.trim().toLowerCase());
        return {
          candidateId: `online_${app.id}`,
          dossierNumber: app.dossierNumber,
          workingReference: reference.reference,
          formerAccountReference: reference.formerAccountReference,
          fullName: app.fullName,
          email: app.email,
          paymentConfirmed: true,
          receiptAvailable,
          protocolSigned: Boolean(app.agreementSigned),
          stage: !receiptAvailable
            ? "receipt_pending"
            : !app.agreementSigned
              ? "protocol_pending"
              : "complete",
        };
      });

      return {
        counts: {
          awaitingProtocol: awaitingProtocol.length,
          receiptPending: pipeline.filter((row) => row.stage === "receipt_pending").length,
          protocolPending: pipeline.filter((row) => row.stage === "protocol_pending").length,
          complete: pipeline.filter((row) => row.stage === "complete").length,
        },
        awaitingProtocol: awaitingProtocol.map((row) => ({
          candidateId: `online_${row.id}`,
          dossierNumber: row.dossierNumber,
          fullName: row.fullName,
          email: row.email,
          destination: row.destination,
          paymentConfirmedAt: row.paymentValidatedAt,
          paymentAmount: row.paymentAmount,
          receiptAvailable: receiptByDossier.has(row.dossierNumber.trim().toUpperCase())
            || receiptByEmail.has(row.email.trim().toLowerCase()),
        })),
        pipeline: pipeline.slice(0, 80),
        recentAudit: recentAudit.filter((row) => /receipt|protocol|agreement|no_evaluation|force|reference/i.test(row.action)),
      };
    }),

  validateOfflineEvaluation: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      // « account_N » = compte sans dossier (pré-dossier) : son évaluation doit pouvoir être confirmée comme les autres.
      candidateId: z.string().regex(/^(online|agency|account)_\d+$/),
      channel: z.enum(["appel", "agence", "email"]),
      note: z.string().trim().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const accountMatch = /^account_(\d+)$/.exec(input.candidateId);
      const reference = accountMatch ? null : parseAdminCandidateReference(input.candidateId);
      const candidateId = accountMatch ? Number(accountMatch[1]) : await resolveCandidateIdForAdmin(input.candidateId);
      const [candidate] = candidateId
        ? await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1)
        : [null];
      if (!candidate && reference?.source !== "agency") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable pour ce dossier. Vérifiez le rattachement par e-mail avant de valider l’évaluation." });
      }
      if (candidate && (candidate.evaluationDeclarationStatus === "validated" || candidate.evaluationReviewedAt)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cette évaluation est déjà validée par ${candidate.evaluationReviewedBy || "un conseiller"} le ${candidate.evaluationReviewedAt ? new Date(candidate.evaluationReviewedAt).toLocaleString("fr-FR") : "à une date enregistrée"}.` });
      }
      if (!candidate && reference?.source === "agency") {
        const [agencyDossier] = await db.select({ evaluationValidatedAt: agencyDossiers.evaluationValidatedAt, evaluationValidatedBy: agencyDossiers.evaluationValidatedBy }).from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
        if (!agencyDossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        if (agencyDossier.evaluationValidatedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Cette évaluation agence est déjà validée par ${agencyDossier.evaluationValidatedBy || "un conseiller"} le ${new Date(agencyDossier.evaluationValidatedAt).toLocaleString("fr-FR")}.` });
        }
      }
      const reviewedAt = new Date();
      const channelLabel = input.channel === "appel" ? "appel téléphonique" : input.channel === "agence" ? "bureau en agence" : "e-mail";
      const traceNote = `Évaluation validée hors ligne — canal : ${channelLabel} ; conseiller : ${admin.email} ; date : ${reviewedAt.toISOString()}.${input.note?.trim() ? ` Note : ${input.note.trim()}` : ""}`;
      if (reference?.source === "agency") {
        await db.update(agencyDossiers).set({
          evaluationValidatedAt: reviewedAt,
          evaluationValidatedBy: admin.email,
          evaluationValidationNote: traceNote,
        }).where(eq(agencyDossiers.id, reference.id));
      }
      if (candidate) {
        await db.update(candidates).set({
          evaluationDeclarationStatus: "validated",
          evaluationDeclaredAt: candidate.evaluationDeclaredAt ?? reviewedAt,
          evaluationReviewedAt: reviewedAt,
          evaluationReviewedBy: admin.email,
          evaluationReviewNote: traceNote,
        }).where(eq(candidates.id, candidate.id));
        const visibleMessage = "Votre évaluation a été validée par un conseiller 3M TRAVEL AGENCY. Les prochaines étapes de votre dossier sont maintenant accessibles selon votre parcours.";
        const notificationResult = await db.insert(clientNotifications).values({ candidateId: candidate.id, type: "evaluation_delivered", title: "Évaluation validée", body: visibleMessage, actionUrl: "/mon-espace", isRead: false });
        const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
        await db.insert(candidateMessages).values({ candidateId: candidate.id, notificationId: notificationId || null, senderRole: "advisor", content: visibleMessage, isRead: false });
      }
      return { success: true, reviewedAt, reviewedBy: admin.email, channel: input.channel, candidateLinked: Boolean(candidate) };
    }),
  reviewEvaluationDeclaration: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.number().int().positive(),
      decision: z.enum(["validate", "refuse", "request_correction"]),
      note: z.string().trim().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      if (candidate.evaluationDeclarationStatus === "not_declared") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce candidat n’a pas déclaré d’évaluation externe à vérifier." });
      }
      if (candidate.evaluationDeclarationStatus === "validated" && input.decision === "validate") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cette évaluation est déjà validée par ${candidate.evaluationReviewedBy || "un conseiller"} le ${candidate.evaluationReviewedAt ? new Date(candidate.evaluationReviewedAt).toLocaleString("fr-FR") : "à une date enregistrée"}.` });
      }
      if (input.decision !== "validate" && !input.note?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Une note de correction ou de refus est requise." });
      }

      const nextStatus = input.decision === "validate"
        ? "validated"
        : input.decision === "refuse"
          ? "refused"
          : "pending_validation";
      const reviewedAt = new Date();
      await db.update(candidates).set({
        evaluationDeclarationStatus: nextStatus,
        evaluationReviewedAt: reviewedAt,
        evaluationReviewedBy: admin.email,
        evaluationReviewNote: input.note?.trim() || null,
      }).where(eq(candidates.id, candidate.id));

      const visibleMessage = input.decision === "validate"
        ? "Votre évaluation transmise avant la création du compte a été vérifiée par notre équipe. Votre dossier peut poursuivre son traitement selon les étapes confirmées."
        : input.decision === "refuse"
          ? "Notre équipe n’a pas pu valider l’évaluation déclarée. Consultez la prochaine action indiquée et contactez-nous si vous disposez d’un document complémentaire."
          : "Notre équipe a besoin d’un complément pour vérifier l’évaluation déclarée avant la poursuite de votre dossier.";
      const notificationResult = await db.insert(clientNotifications).values({
        candidateId: candidate.id,
        type: "admin_remark",
        title: input.decision === "validate" ? "Évaluation vérifiée" : "Vérification de votre évaluation",
        body: visibleMessage,
        actionUrl: "/mon-espace",
        isRead: false,
      });
      const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
      await db.insert(candidateMessages).values({
        candidateId: candidate.id,
        notificationId: notificationId || null,
        senderRole: "advisor",
        content: visibleMessage,
        isRead: false,
      });
      return { success: true, status: nextStatus, reviewedAt, reviewedBy: admin.email };
    }),

  deliverValidatedEvaluation: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.number().int().positive(),
      subject: z.string().trim().min(5).max(255),
      message: z.string().trim().min(20).max(12_000),
      confirmed: z.literal(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      const body = input.message.trim();
      const manualReviewNote = "Évaluation préparée, vérifiée et validée manuellement par l’administration lors de la remise au candidat.";
      if (candidate.evaluationDeclarationStatus !== "validated" || !candidate.evaluationReviewedAt) {
        await db.update(candidates).set({
          evaluationDeclarationStatus: "validated",
          evaluationDeclaredAt: candidate.evaluationDeclaredAt ?? new Date(),
          evaluationReviewedAt: new Date(),
          evaluationReviewedBy: admin.email,
          evaluationReviewNote: manualReviewNote,
        }).where(eq(candidates.id, candidate.id));
      }

      const notificationResult = await db.insert(clientNotifications).values({
        candidateId: candidate.id,
        type: "evaluation_delivered",
        title: input.subject.trim(),
        body,
        actionUrl: "/mon-espace",
        isRead: false,
      });
      const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
      await db.insert(candidateMessages).values({
        candidateId: candidate.id,
        notificationId: notificationId || null,
        senderRole: "advisor",
        content: body,
        isRead: false,
      });

      const emailSent = await sendClientNotificationEmail({
        to: candidate.email,
        fullName: candidate.fullName,
        title: input.subject.trim(),
        body,
        actionUrl: "/mon-espace",
        sourceLabel: "3M TRAVEL AGENCY",
      });
      if (emailSent && notificationId > 0) {
        await db.update(clientNotifications).set({ emailSentAt: new Date() }).where(eq(clientNotifications.id, notificationId));
      }

      return { success: true, deliveredToClientSpace: true, emailSent, deliveredBy: admin.email, evaluationValidatedManually: true, reviewNote: manualReviewNote };
    }),

  /** Conditions d'ouverture du dossier officiel pour un compte : l'écran d'activation les affiche AVANT le clic au lieu d'un refus muet. */
  preDossierActivationReadiness: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      const alreadyActive = candidate.dossierStatus !== "nouveau";
      const evaluationValidated = candidate.evaluationDeclarationStatus === "validated" && Boolean(candidate.evaluationReviewedAt);
      // Preuve saisie directement sur ce compte (sans dossier) ; consultée en premier pour éviter d'interroger
      // dossiers en ligne/agence quand elle suffit déjà, et exposée telle quelle à l'écran d'activation.
      const openingPayment = alreadyActive ? null : await getOpeningPaymentRecord(db, candidate.id);
      const paymentValidated = alreadyActive ? true : Boolean(openingPayment) || (await isOpeningPaymentValidated(db, candidate));
      const blockers: Array<{ code: "already_active" | "evaluation" | "payment"; message: string }> = [];
      if (alreadyActive) blockers.push({ code: "already_active", message: ACTIVATION_MESSAGES.alreadyActive });
      else {
        if (!evaluationValidated) blockers.push({ code: "evaluation", message: ACTIVATION_MESSAGES.evaluation });
        if (!paymentValidated) blockers.push({ code: "payment", message: ACTIVATION_MESSAGES.payment });
      }
      return { candidateId: candidate.id, accountReference: accountReference(candidate.id), alreadyActive, evaluationValidated, paymentValidated, openingPayment, canActivate: blockers.length === 0, blockers };
    }),
  getOpeningPaymentHistory: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.string().regex(/^(online|agency)_\d+$/) }))
    .query(async ({ input, ctx }) => {
      await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });
      const sourceRecord = reference.source === "online"
        ? (await db.select({ email: applications.email, fullName: applications.fullName }).from(applications).where(eq(applications.id, reference.id)).limit(1))[0]
        : (await db.select({ email: agencyDossiers.email, fullName: agencyDossiers.fullName }).from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1))[0];
      if (!sourceRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable." });
      const candidate = (await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, sourceRecord.email)).limit(1))[0];
      const record = candidate ? await getOpeningPaymentRecord(db, candidate.id) : null;
      const pendingProof = candidate ? await getPendingOpeningPaymentProof(db, candidate.id) : null;
      const auditRows = await db.select().from(paymentAuditLogs)
        .where(and(eq(paymentAuditLogs.paymentId, candidate?.id ?? reference.id), eq(paymentAuditLogs.candidateEmail, sourceRecord.email)))
        .orderBy(desc(paymentAuditLogs.createdAt)).limit(100);
      const payments = record ? [
        { key: "primary", label: "Frais d’ouverture — procédure principale", reference: record.reference, amount: record.confirmedAmount, proofFileUrl: record.proofFileUrl, validatedAt: record.validatedAt, validatedBy: record.validatedBy },
        ...(record.additionalPayment ? [{ key: "additional", label: "Second frais d’ouverture — procédure supplémentaire", reference: record.additionalPayment.reference, amount: record.additionalPayment.confirmedAmount, proofFileUrl: record.additionalPayment.proofFileUrl, validatedAt: record.validatedAt, validatedBy: record.validatedBy }] : []),
      ] : [];
      return { candidateId: input.candidateId, fullName: sourceRecord.fullName, email: sourceRecord.email, payments, auditRows, pendingProof };
    }),

  /**
   * Confirme le paiement des frais d'ouverture directement sur un compte sans dossier : l'admin saisit soit une
   * référence/ID de transaction, soit joint une preuve (photo ou vidéo de la facture, déposée via
   * /api/admin/opening-payment-proof puis fournie ici comme adresse de stockage), soit les deux. Refusé si aucune
   * des deux n'est fournie : on ne valide jamais un paiement "à l'aveugle".
   */
  confirmOpeningPaymentForAccount: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.number().int().positive(),
      paymentReference: z.string().trim().max(255).optional(),
      proofFileUrl: z.string().max(1000).optional(),
      confirmedAmount: z.number().int().positive().max(100000000).optional(),
      additionalPaymentReference: z.string().trim().max(255).optional(),
      additionalConfirmedAmount: z.number().int().positive().max(100000000).optional(),
    }).refine((value) => Boolean(value.paymentReference?.trim()) || Boolean(value.proofFileUrl?.trim()), {
      message: "Indiquez une référence de transaction ou joignez une preuve (photo ou vidéo de la facture).",
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      if (candidate.dossierStatus !== "nouveau") throw new TRPCError({ code: "CONFLICT", message: ACTIVATION_MESSAGES.alreadyActive });
      const existing = await getOpeningPaymentRecord(db, candidate.id);
      if (existing && !input.additionalPaymentReference?.trim()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Le paiement a déjà été confirmé par ${existing.validatedBy} le ${new Date(existing.validatedAt).toLocaleString("fr-FR")}. Aucune seconde validation n'est nécessaire.` });
      }
      // La preuve doit être un fichier déposé POUR CE COMPTE par la route de dépôt dédiée : une adresse de notre stockage ne suffit
      // pas (sinon une pièce d'un autre candidat, un passeport par exemple, pourrait être jointe comme « preuve »).
      if (input.proofFileUrl && !(storageKeyFromStoredUrl(input.proofFileUrl) ?? "").startsWith(`candidates/opening-payment-proof/${candidate.id}/`)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Preuve de paiement invalide : redéposez la photo ou la vidéo." });
      }
      const now = new Date().toISOString();
      const record: OpeningPaymentRecord = existing
        ? {
            ...existing,
            additionalPayment: {
              reference: input.additionalPaymentReference!.trim(),
              proofFileUrl: input.proofFileUrl?.trim() || null,
              confirmedAmount: input.additionalConfirmedAmount ?? input.confirmedAmount ?? null,
            },
          }
        : {
            candidateId: candidate.id,
            validatedAt: now,
            validatedBy: admin.email || "Administrateur",
            reference: input.paymentReference?.trim() || null,
            proofFileUrl: input.proofFileUrl?.trim() || null,
            confirmedAmount: input.confirmedAmount ?? null,
            ...(input.additionalPaymentReference?.trim()
              ? {
                  additionalPayment: {
                    reference: input.additionalPaymentReference.trim(),
                    proofFileUrl: null,
                    confirmedAmount: input.additionalConfirmedAmount ?? null,
                  },
                }
              : {}),
          };
      await setOpeningPaymentRecord(db, record);
      await clearPendingOpeningPaymentProof(db, candidate.id);
      await db.insert(paymentAuditLogs).values({
        adminName: admin.email || "Administrateur",
        adminEmail: admin.email || "",
        action: "confirmed",
        paymentId: candidate.id,
        candidateEmail: candidate.email,
        amount: `${input.confirmedAmount ?? 65000} XAF`,
        details: `Paiement d'ouverture confirmé pour ${accountReference(candidate.id)} depuis le dialogue d'activation · ${record.reference ?? "sans référence"}${record.proofFileUrl ? " · preuve jointe" : ""}${record.additionalPayment ? ` · seconde procédure : ${record.additionalPayment.reference} (${record.additionalPayment.confirmedAmount ?? 65000} XAF)` : ""}.`,
      });
      if (record.additionalPayment) {
        await db.insert(paymentAuditLogs).values({
          adminName: admin.email || "Administrateur",
          adminEmail: admin.email || "",
          action: "confirmed",
          paymentId: candidate.id,
          candidateEmail: candidate.email,
          amount: `${record.additionalPayment.confirmedAmount ?? 65000} XAF`,
          details: `Second paiement d'ouverture confirmé pour une seconde procédure de ${accountReference(candidate.id)} · ${record.additionalPayment.reference}.`,
        });
      }
      return { success: true, record };
    }),

  activatePreDossierAccount: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.number().int().positive(),
      destination: z.string().trim().min(2).max(100),
      visaType: z.string().trim().min(2).max(100),
      adminNotes: z.string().trim().max(5000).optional(),
      additionalProcedure: z.object({
        destination: z.string().trim().min(2).max(100),
        visaType: z.string().trim().min(2).max(100),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      if (candidate.dossierStatus !== "nouveau") throw new TRPCError({ code: "CONFLICT", message: ACTIVATION_MESSAGES.alreadyActive });
      if (candidate.evaluationDeclarationStatus !== "validated" || !candidate.evaluationReviewedAt) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: ACTIVATION_MESSAGES.evaluation });
      }
      const openingPayment = await getOpeningPaymentRecord(db, candidate.id);
      if (!openingPayment && !(await isOpeningPaymentValidated(db, candidate))) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: ACTIVATION_MESSAGES.payment });
      }
      if (input.additionalProcedure && !openingPayment?.additionalPayment) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le second paiement d'ouverture doit être validé avant d'ajouter la seconde procédure." });
      }
      const primaryProcedure = resolveDossierProcedureSelection({
        destination: input.destination,
        visaType: input.visaType,
      });
      if (!primaryProcedure.recognized || !primaryProcedure.destination) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choisissez un pays de destination reconnu (ex. Canada, France, Luxembourg). Les catégories larges (europe, golfe…) ne suffisent plus pour créer un dossier dynamique.",
        });
      }
      const additionalProcedure = input.additionalProcedure
        ? resolveDossierProcedureSelection({
          destination: input.additionalProcedure.destination,
          visaType: input.additionalProcedure.visaType,
        })
        : null;
      if (additionalProcedure && !additionalProcedure.recognized) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La seconde destination doit aussi être un pays reconnu du catalogue.",
        });
      }
      // Un seul pré-dossier actif est rattaché : comparaison insensible à la casse,
      // exclusion de la corbeille et sélection du plus récent pour éviter un ancien doublon.
      const existing = await db.select({ id: agencyDossiers.id }).from(agencyDossiers)
        .where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(${agencyDossiers.email}) = LOWER(${candidate.email})`))
        .orderBy(desc(agencyDossiers.createdAt))
        .limit(1);
      const linkedExistingDossier = existing.length > 0;
      let agencyDossierId: number;
      if (linkedExistingDossier) {
        agencyDossierId = existing[0].id;
        await db.update(agencyDossiers).set({
          destination: primaryProcedure.destination,
          visaType: primaryProcedure.visaType,
          status: "en_cours",
          assignedToAdmin: admin.email,
          ...(input.adminNotes ? { adminNotes: input.adminNotes } : {}),
        }).where(eq(agencyDossiers.id, agencyDossierId));
      } else {
        const inserted = await db.insert(agencyDossiers).values({
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone ?? "Non renseigné",
          dateOfBirth: candidate.dateOfBirth,
          nationality: candidate.nationality,
          destination: primaryProcedure.destination,
          visaType: primaryProcedure.visaType,
          status: "nouveau",
          createdByAdmin: admin.email,
          assignedToAdmin: admin.email,
          adminNotes: input.adminNotes ?? null,
          source: "manual_admin",
        });
        agencyDossierId = Number((inserted as any)[0]?.insertId || 0);
      }
      await db.update(candidates).set({
        dossierStatus: "documents",
        destination: primaryProcedure.coarseCategory,
        visaType: primaryProcedure.visaType,
        preferredDestinations: JSON.stringify(primaryProcedure.preferredDestinations),
        dossierNote: input.adminNotes ?? null,
      }).where(eq(candidates.id, candidate.id));
      await db.insert(agencyDossierHistory).values({
        dossierId: agencyDossierId,
        action: "account_linked",
        changedBy: admin.email || "unknown",
        oldValue: linkedExistingDossier ? "pré-dossier sans compte" : null,
        newValue: JSON.stringify({ candidateId: candidate.id, email: candidate.email }),
        details: "Compte candidat rattaché au pré-dossier agence après validation administrative",
      });
      // Le compte (COMPTE-…) devient un dossier actif (3M-…) : le changement est tracé, annoncé dans l'espace client et par e-mail.
      const previousAccountReference = accountReference(candidate.id);
      const dossierReference = agencyDossierReference(agencyDossierId);
      await db.insert(agencyDossierHistory).values({
        dossierId: agencyDossierId,
        action: "reference_changed",
        changedBy: admin.email || "unknown",
        oldValue: previousAccountReference,
        newValue: dossierReference,
        details: "Référence de compte remplacée par le numéro de dossier actif après paiement des frais d’ouverture validé et activation par l’administration",
      });
      let additionalAgencyDossierId: number | null = null;
      let additionalDossierReference: string | null = null;
      if (additionalProcedure) {
        // Statut « en_cours » (pas « nouveau ») : procédure parallèle intentionnelle,
        // jamais traitée comme pré-dossier redondant à mettre en corbeille.
        const additionalInserted = await db.insert(agencyDossiers).values({
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone ?? "Non renseigné",
          dateOfBirth: candidate.dateOfBirth,
          nationality: candidate.nationality,
          destination: additionalProcedure.destination,
          visaType: additionalProcedure.visaType,
          status: "en_cours",
          createdByAdmin: admin.email,
          assignedToAdmin: admin.email,
          adminNotes: input.adminNotes
            ? `${input.adminNotes}\n[Procédure parallèle intentionnelle]`
            : "Procédure parallèle intentionnelle (traitement simultané avec le dossier principal).",
          source: "manual_admin",
        });
        additionalAgencyDossierId = Number((additionalInserted as any)[0]?.insertId || 0);
        additionalDossierReference = agencyDossierReference(additionalAgencyDossierId);
        await db.insert(agencyDossierHistory).values({
          dossierId: additionalAgencyDossierId,
          action: "account_linked",
          changedBy: admin.email || "unknown",
          oldValue: null,
          newValue: JSON.stringify({
            candidateId: candidate.id,
            email: candidate.email,
            procedure: 2,
            parallelWith: dossierReference,
            destination: additionalProcedure.destination,
            visaType: additionalProcedure.visaType,
          }),
          details: `Seconde procédure parallèle (${additionalProcedure.destination} · ${additionalProcedure.visaType}) — traitement simultané avec ${dossierReference}`,
        });
      }
      // Case opérationnel + checklist pays/procédure dès l’activation (pilotage dynamique immédiat).
      let checklistSeed: { caseId: number; added: number; label: string } | null = null;
      try {
        checklistSeed = await seedCountryProcedureChecklist(db, {
          source: "agency",
          id: agencyDossierId,
          destination: primaryProcedure.destination,
          visaType: primaryProcedure.visaType,
          actorAdminId: admin.id ?? null,
        });
        if (additionalAgencyDossierId && additionalProcedure) {
          await seedCountryProcedureChecklist(db, {
            source: "agency",
            id: additionalAgencyDossierId,
            destination: additionalProcedure.destination,
            visaType: additionalProcedure.visaType,
            actorAdminId: admin.id ?? null,
          });
        }
      } catch (err) {
        console.error("[activatePreDossierAccount] Seed checklist pays/procédure non effectué:", err);
      }
      try {
        await db.insert(clientNotifications).values({
          candidateId: candidate.id,
          type: "admin_status_update",
          title: "Votre dossier est activé",
          body: referenceChangeSentence(previousAccountReference, dossierReference),
          actionUrl: "/mon-espace",
          isRead: false,
        });
      } catch (err) {
        console.error("[activatePreDossierAccount] Notification de changement de référence non enregistrée:", err);
      }
      let emailSent = false;
      try {
        emailSent = await sendDossierConfirmationEmail(candidate.email, candidate.fullName, dossierReference, primaryProcedure.destination, 0, previousAccountReference);
      } catch (err) {
        console.error("[activatePreDossierAccount] Échec de l'e-mail de confirmation d'activation:", err);
        emailSent = false;
      }
      // Les pré-dossiers agence « nouveau » qui portent la même adresse e-mail que ce dossier désormais actif sont des doublons
      // certains : mise en corbeille réversible et journalisée (même règle que le panneau des pré-comptes redondants).
      // Jamais bloquant : l'activation est déjà faite, un échec ici est seulement consigné.
      let archivedDuplicates: string[] = [];
      try {
        const protectedIds = new Set(
          [agencyDossierId, additionalAgencyDossierId].filter((id): id is number => typeof id === "number" && id > 0),
        );
        const duplicates = (await loadRedundantPreAccounts(db)).filter((item) => (
          item.kind === "agency_pre_dossier"
          && item.confidence === "certain"
          && item.activeDossierReference === dossierReference
          && !protectedIds.has(item.id)
        ));
        if (duplicates.length > 0) {
          const archivedResult = await archiveRedundantPreAccounts(db, { items: duplicates.map((item) => ({ kind: item.kind, id: item.id })), adminEmail: admin.email || "unknown" });
          archivedDuplicates = archivedResult.archived.map((item) => item.reference);
        }
      } catch (err) {
        console.error("[activatePreDossierAccount] Nettoyage des doublons non effectué:", err);
      }
      return {
        success: true,
        emailSent,
        linkedExistingDossier,
        agencyDossierId,
        dossierReference,
        previousAccountReference,
        archivedDuplicates,
        additionalAgencyDossierId,
        additionalDossierReference,
        simultaneousProcedures: Boolean(additionalAgencyDossierId),
        procedure: {
          destination: primaryProcedure.destination,
          visaType: primaryProcedure.visaType,
          checklistKey: primaryProcedure.checklistKey,
          checklistAdded: checklistSeed?.added ?? 0,
          checklistLabel: checklistSeed?.label ?? null,
        },
        additionalProcedure: additionalProcedure && additionalDossierReference
          ? {
            destination: additionalProcedure.destination,
            visaType: additionalProcedure.visaType,
            dossierReference: additionalDossierReference,
            agencyDossierId: additionalAgencyDossierId,
          }
          : null,
      };
    }),

  list: publicProcedure.input(candidateFilterSchema).query(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const candidates = await loadCandidates(input);
    const pagination = paginateCandidates(candidates, input.page, input.pageSize);
    return {
      candidates: pagination.records,
      total: pagination.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
    };
  }),

  exportCsv: publicProcedure.input(candidateFilterSchema).mutation(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const candidates = await loadCandidates(input, 10000);
    const headers = ["Référence", "Nom", "E-mail", "Téléphone", "Destination", "Visa", "Score", "Statut", "Paiement", "Documents", "Source", "Créé le"];
    const rows = candidates.map(candidate => [
      candidate.applicationNumber, candidate.fullName, candidate.email, candidate.phone,
      candidate.destination, candidate.visaType, candidate.scoringTotal, candidate.status,
      candidate.paymentStatus, candidate.documentsCount, candidate.source,
      new Date(candidate.createdAt).toLocaleString("fr-FR"),
    ].map(escapeCsvCell).join(","));
    return { csv: `﻿${headers.map(escapeCsvCell).join(",")}\n${rows.join("\n")}`, count: candidates.length };
  }),

  reviewPortrait: publicProcedure
    .input(z.object({
      candidateId: z.string().regex(/^(online|agency)_\d+$/),
      decision: z.enum(["approve", "reject", "request_new"]),
      reason: z.string().trim().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const candidateId = await resolveCandidateIdForAdmin(input.candidateId);
      if (!candidateId) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun compte candidat lié à ce dossier." });
      const [candidate] = await db.select({ id: candidates.id, avatarUrl: candidates.avatarUrl }).from(candidates).where(eq(candidates.id, candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      if (input.decision === "approve" && !candidate.avatarUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible de valider un portrait absent." });
      }
      const status = input.decision === "approve" ? "verified" : input.decision === "reject" ? "rejected" : "pending";
      const reason = input.reason || (input.decision === "approve" ? `Portrait validé manuellement par ${admin.email}.` : "Merci de reprendre votre portrait selon les consignes.");
      await db.update(candidates).set({
        avatarVerificationStatus: status,
        avatarVerificationReason: reason,
        avatarVerifiedAt: input.decision === "approve" ? new Date() : null,
      }).where(eq(candidates.id, candidateId));
      return { success: true, status, candidateId };
    }),

  updateCandidate: publicProcedure
    .input(z.object({
      candidateId: z.string().regex(/^(online|agency)_\d+$/),
      status: z.string().min(1).max(50),
      adminNotes: z.string().max(5000).optional(),
      fullName: z.string().trim().min(2).max(255).optional(),
      email: z.string().email().max(320).optional(),
      phone: z.string().trim().max(50).optional(),
      destination: z.string().trim().max(120).optional(),
      visaType: z.string().trim().max(120).optional(),
      dossierNumber: z.string().trim().max(64).optional(),
      gdsReference: z.string().trim().max(64).optional(),
      ticketNumber: z.string().trim().max(64).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });
      const { source, id } = reference;
      let candidateIdForMessage: number | null = null;
      let candidateEmailForNotification = "";
      let candidateNameForNotification = "";
      let dossierNumberForMessage = input.candidateId;
      let previousStatus = "";
      let progressContext: { destination: string | null; visaType: string | null } = { destination: null, visaType: null };
      const profilePatch = {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.destination !== undefined ? { destination: input.destination } : {}),
        ...(input.visaType !== undefined ? { visaType: input.visaType } : {}),
      };

      if (source === "online") {
        const allowed = ["nouveau", "en_evaluation", "bilan_envoye", "en_attente_paiement", "paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve", "refuse"] as const;
        if (!(allowed as readonly string[]).includes(input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Statut de dossier en ligne invalide." });
        const [record] = await db.select({ candidateId: applications.candidateId, email: applications.email, fullName: applications.fullName, dossierNumber: applications.dossierNumber, dossierStatus: applications.dossierStatus, destination: applications.destination, visaType: applications.visaType }).from(applications).where(eq(applications.id, id)).limit(1);
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        candidateIdForMessage = record.candidateId ?? null;
        candidateEmailForNotification = record.email;
        candidateNameForNotification = record.fullName;
        dossierNumberForMessage = input.dossierNumber || record.dossierNumber;
        previousStatus = record.dossierStatus;
        progressContext = { destination: record.destination, visaType: record.visaType };
        if (!candidateIdForMessage) {
          const [linkedCandidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, record.email)).limit(1);
          candidateIdForMessage = linkedCandidate?.id ?? null;
        }
        const result = await db.update(applications).set({
          dossierStatus: input.status as any,
          ...(input.dossierNumber !== undefined ? { dossierNumber: input.dossierNumber } : {}),
          ...(input.adminNotes !== undefined ? { adminNote: input.adminNotes } : {}),
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.phone !== undefined ? { whatsappNumber: input.phone } : {}),
          ...(input.destination !== undefined ? { destination: input.destination as any } : {}),
          ...(input.visaType !== undefined ? { visaType: input.visaType } : {}),
          ...(input.gdsReference !== undefined ? { gdsReference: input.gdsReference } : {}),
          ...(input.ticketNumber !== undefined ? { ticketNumber: input.ticketNumber } : {}),
          lastStatusUpdateAt: new Date(),
          lastStatusUpdatedBy: admin.email,
        }).where(eq(applications.id, id));

        const affectedRows = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
        if (affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
      } else {
        const allowed = ["nouveau", "en_cours", "documents_requis", "soumis", "approuve", "refuse"] as const;
        if (!(allowed as readonly string[]).includes(input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Statut de dossier agence invalide." });
        const [record] = await db.select({ email: agencyDossiers.email, fullName: agencyDossiers.fullName, status: agencyDossiers.status, destination: agencyDossiers.destination, visaType: agencyDossiers.visaType }).from(agencyDossiers).where(eq(agencyDossiers.id, id)).limit(1);
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        previousStatus = record.status;
        progressContext = { destination: record.destination, visaType: record.visaType };
        candidateEmailForNotification = record.email;
        candidateNameForNotification = record.fullName;
        const [linkedCandidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, record.email)).limit(1);
        candidateIdForMessage = linkedCandidate?.id ?? null;
        dossierNumberForMessage = `3M-AGN-${id.toString().padStart(4, "0")}`;
        const result = await db.update(agencyDossiers).set({
          status: input.status as any,
          ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.destination !== undefined ? { destination: input.destination } : {}),
          ...(input.visaType !== undefined ? { visaType: input.visaType } : {}),
          lastStatusChangeAt: new Date(),
          lastStatusChangeBy: admin.email,
        }).where(eq(agencyDossiers.id, id));
        const affectedRows = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
        if (affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
      }

      const [existingCase] = source === "online"
        ? await db.select({ id: cases.id }).from(cases).where(eq(cases.legacyApplicationId, id)).limit(1)
        : await db.select({ id: cases.id }).from(cases).where(eq(cases.legacyAgencyDossierId, id)).limit(1);
      let synchronizedCaseId = existingCase?.id ?? null;
      if (synchronizedCaseId) {
        await db.update(cases).set({
          currentStatus: input.status,
          ...(input.destination !== undefined ? { countryTarget: input.destination } : {}),
          ...(input.visaType !== undefined ? { visaType: input.visaType } : {}),
        }).where(eq(cases.id, synchronizedCaseId));
      } else {
        const [caseInsert] = await db.insert(cases).values({
          caseNumber: dossierNumberForMessage,
          candidateId: candidateIdForMessage,
          sourceChannel: source === "online" ? "online" : "agency_manual",
          ...(source === "online" ? { legacyApplicationId: id } : { legacyAgencyDossierId: id }),
          countryTarget: input.destination ?? null,
          caseType: source === "online" ? "procedure_en_ligne" : "procedure_agence",
          visaType: input.visaType ?? null,
          currentStatus: input.status,
          openedAt: new Date(),
        });
        synchronizedCaseId = Number(caseInsert.insertId);
      }

      if (synchronizedCaseId && previousStatus !== input.status) {
        await db.insert(caseStatusHistory).values({
          caseId: synchronizedCaseId,
          oldStatus: previousStatus || null,
          newStatus: input.status,
          changedByRole: "admin",
          comment: "Statut de procédure synchronisé depuis le back-office.",
        });
        await db.insert(caseActivityLogs).values({
          caseId: synchronizedCaseId,
          actorRole: "admin",
          actionType: "procedure_status_synchronized",
          entityType: source === "online" ? "application" : "agency_dossier",
          entityId: String(id),
          description: `Statut synchronisé de ${previousStatus || "non défini"} vers ${input.status} par ${admin.email}.`,
        });
      }

      if (candidateIdForMessage && Object.keys(profilePatch).length > 0) {
        await db.update(candidates).set(profilePatch as any).where(eq(candidates.id, candidateIdForMessage));
      }

      if (candidateIdForMessage && (previousStatus !== input.status || Object.keys(profilePatch).length > 0)) {
        // Même vocabulaire et même « étape N sur M » que l'espace client et l'e-mail de changement d'étape.
        const progress = describeDossierProgress({ destination: input.destination ?? progressContext.destination, visaType: input.visaType ?? progressContext.visaType, dossierStatus: input.status });
        const visibleBody = `Mise à jour du dossier ${dossierNumberForMessage}${previousStatus !== input.status ? `\n\n${progressText(progress)}` : ""}${Object.keys(profilePatch).length > 0 ? "\n\nL’équipe a également actualisé certaines informations de votre profil." : ""}${input.adminNotes ? `\n\nNote de l’équipe : ${input.adminNotes}` : ""}`;
        const agencyResponse = ["soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve", "approuve", "soumis"].includes(input.status);
        const notificationResult = await db.insert(clientNotifications).values({
          candidateId: candidateIdForMessage,
          caseId: synchronizedCaseId,
          type: agencyResponse ? "agency_response" : input.adminNotes ? "admin_remark" : "admin_status_update",
          title: agencyResponse ? "Réponse de l’agence de placement" : input.adminNotes ? "Nouvelle remarque de l’administration" : "Mise à jour de votre dossier",
          body: visibleBody,
          actionUrl: "/mon-espace",
          isRead: false,
        });
        const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
        await db.insert(candidateMessages).values({
          candidateId: candidateIdForMessage,
          notificationId: notificationId || null,
          senderRole: "advisor",
          content: visibleBody,
          isRead: false,
        });
        const emailSent = candidateEmailForNotification
          ? await sendClientNotificationEmail({
              to: candidateEmailForNotification,
              fullName: candidateNameForNotification,
              title: agencyResponse ? "Réponse de l’agence de placement" : input.adminNotes ? "Nouvelle remarque de l’administration" : "Mise à jour de votre dossier",
              body: visibleBody,
              actionUrl: "/mon-espace",
              sourceLabel: agencyResponse ? "Agence de placement" : "Prime Travel Service",
            })
          : false;
        if (emailSent && notificationId > 0) {
          await db.update(clientNotifications).set({ emailSentAt: new Date() }).where(eq(clientNotifications.id, notificationId));
        }
      }

      return { success: true, notifiedCandidate: Boolean(candidateIdForMessage && (previousStatus !== input.status || Object.keys(profilePatch).length > 0)) };
    }),

  getMessages: publicProcedure
    .input(z.object({ candidateId: z.string().regex(/^(online|agency)_\d+$/) }))
    .query(async ({ input, ctx }) => {
      await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const candidateId = await resolveCandidateIdForAdmin(input.candidateId);
      if (!candidateId) return [];
      const messages = await db.select().from(candidateMessages).where(eq(candidateMessages.candidateId, candidateId)).orderBy(candidateMessages.createdAt).limit(500);
      await db.update(candidateMessages).set({ isRead: true }).where(eq(candidateMessages.candidateId, candidateId));
      return messages;
    }),

  replyToCandidate: publicProcedure
    .input(z.object({ candidateId: z.string().regex(/^(online|agency)_\d+$/), content: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const candidateId = await resolveCandidateIdForAdmin(input.candidateId);
      if (!candidateId) throw new TRPCError({ code: "NOT_FOUND", message: "Ce dossier n’est pas encore relié à un compte candidat." });
      const messageBody = input.content.trim();
      const notificationResult = await db.insert(clientNotifications).values({
        candidateId,
        type: "admin_message",
        title: "Nouveau message de Prime Travel Service",
        body: messageBody,
        actionUrl: "/mon-espace",
        isRead: false,
      });
      const [candidateProfile] = await db.select({ email: candidates.email, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, candidateId)).limit(1);
      const emailSent = candidateProfile
        ? await sendClientNotificationEmail({
            to: candidateProfile.email,
            fullName: candidateProfile.fullName,
            title: "Nouveau message de Prime Travel Service",
            body: messageBody,
            actionUrl: "/mon-espace",
            sourceLabel: "Prime Travel Service",
          })
        : false;
      const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
      await db.insert(candidateMessages).values({
        candidateId,
        notificationId: notificationId || null,
        senderRole: "advisor",
        content: messageBody,
        isRead: false,
      });
      if (emailSent && notificationId > 0) {
        await db.update(clientNotifications).set({ emailSentAt: new Date() }).where(eq(clientNotifications.id, notificationId));
      }
      return { success: true, adminEmail: admin.email, emailSent };
    }),

  confirmPaymentForCandidate: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().regex(/^(online|agency)_\d+$/),
      paymentReference: z.string().trim().max(255).optional(),
      confirmedAmount: z.number().int().nonnegative().max(100000000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });
      const validatedAt = new Date();
      const referenceLabel = input.paymentReference?.trim() || "VALIDATION_MANUELLE";
      const amount = input.confirmedAmount ?? 65000;
      let dossierNumber: string;
      let candidateEmail: string;
      let fullName: string;
      let alreadyConfirmed = false;

      if (reference.source === "online") {
        const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        alreadyConfirmed = application.paymentStatus === "SUCCESS";
        if (alreadyConfirmed) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Le paiement du dossier ${application.dossierNumber} est déjà confirmé. Aucune seconde validation n’est nécessaire.` });
        }
        dossierNumber = application.dossierNumber;
        candidateEmail = application.email;
        fullName = application.fullName;
        await db.update(applications).set({
          paymentStatus: "SUCCESS",
          paymentDate: application.paymentDate ?? validatedAt,
          paymentMethod: application.paymentMethod || "VALIDATION_AGENCE",
          paymentTransactionId: application.paymentTransactionId || referenceLabel,
          paymentExpectedAmount: application.paymentExpectedAmount ?? application.paymentAmount ?? 65000,
          paymentConfirmedAmount: application.paymentConfirmedAmount ?? amount,
          paymentValidatedAt: application.paymentValidatedAt ?? validatedAt,
          paymentValidatedBy: application.paymentValidatedBy ?? (admin.email || "Administrateur"),
        }).where(eq(applications.id, application.id));
      } else {
        const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
        if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        alreadyConfirmed = dossier.initialPaymentStatus === "paid";
        if (alreadyConfirmed) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Le paiement du dossier 3M-AGN-${reference.id.toString().padStart(4, "0")} est déjà confirmé. Aucune seconde validation n’est nécessaire.` });
        }
        dossierNumber = `3M-AGN-${reference.id.toString().padStart(4, "0")}`;
        candidateEmail = dossier.email;
        fullName = dossier.fullName;
        const auditNote = `[Paiement confirmé] ${referenceLabel} · ${admin.email || "Administrateur"} · ${validatedAt.toISOString()}`;
        await db.update(agencyDossiers).set({
          initialPaymentStatus: "paid",
          lastStatusChangeAt: dossier.lastStatusChangeAt ?? validatedAt,
          lastStatusChangeBy: dossier.lastStatusChangeBy ?? (admin.email || "Administrateur"),
          adminNotes: dossier.adminNotes ? `${dossier.adminNotes}\n${auditNote}` : auditNote,
        }).where(eq(agencyDossiers.id, dossier.id));
      }

      await db.insert(paymentAuditLogs).values({
        adminName: admin.email || "Administrateur",
        adminEmail: admin.email || "",
        action: alreadyConfirmed ? "confirmed_again" : "confirmed",
        paymentId: reference.id,
        candidateEmail,
        amount: `${amount} XAF`,
        details: `Dossier ${dossierNumber} · ${referenceLabel} · validation en un clic depuis la fiche candidat.`,
      });

      // Dès que le paiement est confirmé, le reçu et le Protocole d'accord N°01 partent ENSEMBLE, dans un seul e-mail.
      // Un échec d'envoi n'annule pas la confirmation : le bouton « Envoyer reçu + protocole » permet de relancer.
      let packageSent = false;
      let packageError: string | null = null;
      try {
        packageSent = (await sendReceiptAndProtocol(db, reference, { email: admin.email || "Administrateur" })).sent;
      } catch (error) {
        packageError = error instanceof TRPCError ? error.message : "Le reçu et le protocole n’ont pas pu être envoyés.";
        console.error("[Payment] receipt + protocol package failed", { dossierNumber, error });
      }

      return { success: true, alreadyConfirmed, dossierNumber, candidateEmail, fullName, validatedBy: admin.email || "Administrateur", validatedAt, packageSent, packageError };
    }),
  /** Envoie (ou renvoie) le reçu et le Protocole d'accord N°01 ensemble, dans un seul e-mail, pour un paiement déjà confirmé. */
  sendReceiptAndProtocol: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().regex(/^(online|agency)_\d+$/),
      resend: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });
      return sendReceiptAndProtocol(db, reference, { email: admin.email || "Administrateur" }, { resend: input.resend });
    }),
  approvePaymentReceipt: publicProcedure
    .input(z.object({
      sessionToken: z.string().max(512).optional().default(""),
      candidateId: z.string().regex(/^(online|agency)_\d+$/),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });

      let dossierNumber = input.candidateId;
      let candidateEmail = "";
      let amount = "65000";
      let currency = "XAF";
      if (reference.source === "agency") {
        const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
        if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        if (dossier.initialPaymentStatus !== "paid") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Validez d’abord le paiement avant de signer le reçu." });
        dossierNumber = `3M-AGN-${String(dossier.id).padStart(4, "0")}`;
        candidateEmail = dossier.email;
        const [latestAudit] = await db.select().from(paymentAuditLogs).where(and(eq(paymentAuditLogs.paymentId, dossier.id), eq(paymentAuditLogs.candidateEmail, dossier.email))).orderBy(desc(paymentAuditLogs.createdAt)).limit(1);
        amount = latestAudit?.amount ? String(latestAudit.amount).replace(/[^0-9]/g, "") || amount : amount;
      } else {
        const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        if (application.paymentStatus !== "SUCCESS") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Validez d’abord le paiement avant de signer le reçu." });
        dossierNumber = application.dossierNumber;
        candidateEmail = application.email;
        amount = String(application.paymentConfirmedAmount ?? application.paymentAmount ?? 65000);
        currency = application.paymentCurrency ?? currency;
      }
      if (!candidateEmail) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune adresse e-mail client n’est disponible pour ce dossier." });

      const approvedAt = new Date();
      const approvedByEmail = admin.email || "Administrateur";
      const approvedByName = approvedByEmail;
      const signatureLabel = `3M TRAVEL AGENCY · ${approvedByName}`;
      const signatureHash = createReceiptSignatureHash({ source: reference.source, paymentId: reference.id, dossierNumber, candidateEmail, amount, currency, approvedByEmail, approvedAt });
      const [approval] = await db.insert(paymentReceiptApprovals).values({ source: reference.source, paymentId: reference.id, dossierNumber, candidateEmail, amount: `${amount} ${currency}`, currency, approvedByName, approvedByEmail, approvedAt, signatureLabel, signatureHash }).$returningId();
      await db.insert(paymentAuditLogs).values({ adminName: approvedByName, adminEmail: approvedByEmail, action: "receipt_approved_signed", paymentId: reference.id, candidateEmail, amount: `${amount} ${currency}`, details: `Reçu validé et signé électroniquement pour ${dossierNumber}. Empreinte ${signatureHash}.` });
      return { success: true, approvalId: Number(approval?.id ?? 0), dossierNumber, approvedByName, approvedByEmail, approvedAt, signatureLabel, signatureHash };
    }),

  sendPaymentReceiptForCandidate: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().regex(/^(online|agency)_\d+$/),
      deliveryMode: z.enum(["initial", "resend"]).default("initial"),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });

      let email = "";
      let fullName = "";
      let dossierNumber = input.candidateId;
      let amount = 65000;
      let currency = "XAF";
      let paymentDate = new Date();
      let paymentMethod = "Validation administrative";
      let paymentReference: string | null = null;
      let destination: string | null = null;
      let visaType: string | null = null;

      if (reference.source === "agency") {
        const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
        if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        if (dossier.initialPaymentStatus !== "paid") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le reçu ne peut être envoyé qu’après confirmation du paiement." });
        email = dossier.email;
        fullName = dossier.fullName;
        dossierNumber = `3M-AGN-${String(dossier.id).padStart(4, "0")}`;
        paymentDate = dossier.lastStatusChangeAt ?? dossier.updatedAt ?? dossier.createdAt ?? paymentDate;
        paymentMethod = "Paiement en agence / validation administrative";
        destination = dossier.destination;
        visaType = dossier.visaType;
        const [latestAudit] = await db.select().from(paymentAuditLogs).where(and(eq(paymentAuditLogs.paymentId, dossier.id), eq(paymentAuditLogs.candidateEmail, dossier.email))).orderBy(desc(paymentAuditLogs.createdAt)).limit(1);
        if (latestAudit?.amount) amount = Number(String(latestAudit.amount).replace(/[^0-9]/g, "")) || amount;
        paymentReference = latestAudit?.details?.includes("·") ? "Validation manuelle / agence" : null;
      } else {
        const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        if (application.paymentStatus !== "SUCCESS") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le reçu ne peut être envoyé qu’après confirmation du paiement." });
        email = application.email;
        fullName = application.fullName;
        dossierNumber = application.dossierNumber;
        amount = Number(application.paymentConfirmedAmount ?? application.paymentAmount ?? amount);
        currency = application.paymentCurrency ?? currency;
        paymentDate = application.paymentDate ?? application.paymentValidatedAt ?? paymentDate;
        paymentMethod = application.paymentMethod || paymentMethod;
        paymentReference = application.paymentTransactionId;
        destination = application.destination;
        visaType = application.visaType;
      }
      if (!email) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune adresse e-mail client n’est disponible pour ce dossier." });
      const [approval] = await db.select().from(paymentReceiptApprovals).where(and(eq(paymentReceiptApprovals.source, reference.source), eq(paymentReceiptApprovals.paymentId, reference.id), eq(paymentReceiptApprovals.candidateEmail, email))).orderBy(desc(paymentReceiptApprovals.approvedAt)).limit(1);
      if (!approval) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le reçu doit être validé et signé par un administrateur avant son envoi." });

      const receiptInput = { dossierNumber, fullName, email, amount, currency, paymentDate, paymentMethod, paymentReference, validatedBy: admin.email || "Administrateur", destination, visaType, receiptApprovedAt: approval.approvedAt, receiptSignatureLabel: approval.signatureLabel, receiptSignatureHash: approval.signatureHash };
      try {
        const receiptPdf = await buildPaymentReceiptPdf(receiptInput);
        await sendGenericEmail({
          to: email,
          subject: `Reçu de confirmation de paiement — Dossier ${dossierNumber}`,
          html: buildPaymentReceiptEmailHtml(receiptInput),
          attachments: [{ filename: `Recu-paiement-${dossierNumber}.pdf`, content: receiptPdf, contentType: "application/pdf" }],
        });
      } catch (error) {
        console.error("[Payment Receipt] Delivery failed", { dossierNumber, error });
        await db.insert(paymentAuditLogs).values({ adminName: admin.email || "Administrateur", adminEmail: admin.email || "", action: "receipt_failed", paymentId: reference.id, candidateEmail: email, amount: `${amount} ${currency}`, details: `Échec d’envoi du reçu PDF pour ${dossierNumber}.` });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le reçu PDF n’a pas pu être envoyé. Vérifiez le service e-mail et réessayez." });
      }
      await db.insert(paymentAuditLogs).values({ adminName: admin.email || "Administrateur", adminEmail: admin.email || "", action: input.deliveryMode === "resend" ? "receipt_resent" : "receipt_sent", paymentId: reference.id, candidateEmail: email, amount: `${amount} ${currency}`, details: `${input.deliveryMode === "resend" ? "Reçu PDF renvoyé" : "Reçu PDF envoyé"} pour ${dossierNumber}.` });
      return { success: true, dossierNumber, email, deliveryMode: input.deliveryMode };
    }),

  sendAgreementProtocol: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().regex(/^(online|agency)_\d+$/),
      subject: z.string().trim().min(5).max(255).optional(),
      content: z.string().trim().min(50).max(12000),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });
      let email = "";
      let fullName = "";
      let dossierNumber = input.candidateId;
      let paymentConfirmed = false;
      let agencyDossierId: number | null = null;
      let applicationId: number | null = null;
      let destination = "";
      let whatsapp = "";
      let paymentMethodLabel = "";
      let paymentTimestamp: Date | null = null;
      if (reference.source === "agency") {
        const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
        if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        email = dossier.email;
        fullName = dossier.fullName;
        dossierNumber = `3M-AGN-${String(dossier.id).padStart(4, "0")}`;
        paymentConfirmed = dossier.initialPaymentStatus === "paid";
        agencyDossierId = dossier.id;
        destination = dossier.destination || "";
        whatsapp = dossier.phone || "";
      } else {
        const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        email = application.email;
        fullName = application.fullName;
        dossierNumber = application.dossierNumber;
        paymentConfirmed = application.paymentStatus === "SUCCESS";
        applicationId = application.id;
        destination = application.destination || "";
        whatsapp = application.whatsappNumber || "";
        paymentMethodLabel = application.paymentMethod || "";
        paymentTimestamp = application.paymentValidatedAt || application.paymentDate || null;
      }
      if (!paymentConfirmed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le protocole ne peut être envoyé qu’après confirmation du paiement." });
      // Le protocole est genere automatiquement selon le pays de destination du candidat
      // (COUNTRY_PROTOCOL_PROFILES) sauf si l'administrateur a fourni un texte personnalise.
      const empreinteSha = crypto.createHash("sha256").update(`${dossierNumber}|${email}|${destination}|${Date.now()}`).digest("hex").slice(0, 24);
      const protocolVariables = {
        clientNomComplet: fullName,
        dossierRef: dossierNumber,
        destinationProjet: destination || "Non spécifiée",
        clientTelephoneWhatsapp: whatsapp || undefined,
        clientEmail: email,
        modePaiement: paymentMethodLabel || "Validation manuelle par un conseiller",
        dateHeurePaiement: paymentTimestamp ? paymentTimestamp.toLocaleString("fr-FR", { timeZone: "Africa/Douala" }) : "Non renseignée",
        conseillerEmail: admin.email || "",
        empreinteSha,
        clientIpAddress: "Non applicable (envoi initié par l'agence, signature à venir dans l'espace client)",
        dateDuJour: new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" }),
      };
      const autoProtocolText = buildProtocolOneRichText(protocolVariables, destination);
      const protocolText = input.content.trim().length >= 50 ? input.content : autoProtocolText;
      const protocolPdf = await createAgreementProtocolOnePdf({
        dossierNumber,
        fullName,
        destination,
        variables: protocolVariables,
        content: protocolText,
      });
      const paragraphs = protocolText.split(/\n\s*\n/).map((paragraph) => `<p>${escapeAgreementHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
      const siteUrl = process.env.SITE_URL || "https://www.3mtravelagency.com";
      const logoUrl = `${siteUrl}/favicon.png`;
      const generatedOn = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
      const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Protocole d’accord — ${escapeAgreementHtml(dossierNumber)}</title></head><body style="margin:0;padding:0;background:#eef2f7;">
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #eef2f7; padding: 24px;">
  <div style="background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(15,36,96,0.12);">
    <div style="background: linear-gradient(135deg, #0f2460 0%, #1E3A8A 55%, #2563EB 100%); padding: 36px 30px 28px; text-align: center;">
      <img src="${logoUrl}" alt="3M TRAVEL AGENCY" width="72" height="72" style="width:72px;height:72px;border-radius:50%;background:#ffffff;padding:6px;box-shadow:0 4px 14px rgba(0,0,0,0.25);" />
      <p style="display:inline-block;margin:18px 0 0;background:rgba(255,255,255,0.15);color:#dbeafe;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Protocole d’accord officiel</p>
      <h1 style="color:#ffffff;font-size:24px;margin:14px 0 0;">3M TRAVEL AGENCY</h1>
      <div style="width:60px;height:3px;background:#c9972b;margin:14px auto 0;border-radius:2px;"></div>
    </div>
    <div style="padding: 32px 30px;">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:11px;font-weight:bold;color:#2563EB;text-transform:uppercase;letter-spacing:0.5px;">Dossier</p>
        <p style="margin:2px 0 10px;font-size:16px;font-weight:bold;color:#0f2460;">${escapeAgreementHtml(dossierNumber)}</p>
        <p style="margin:0;font-size:11px;font-weight:bold;color:#2563EB;text-transform:uppercase;letter-spacing:0.5px;">Candidat</p>
        <p style="margin:2px 0 0;font-size:16px;font-weight:bold;color:#0f2460;">${escapeAgreementHtml(fullName)}</p>
        <p style="margin:12px 0 0;font-size:11px;color:#64748b;">Version du protocole : ${AGREEMENT_PROTOCOL_VERSION}</p>
      </div>
      <div style="color:#1f2937;font-size:14px;line-height:1.7;">
        ${paragraphs}
      </div>
      <p style="font-size:12px;color:#64748b;margin-top:24px;">Document préparé par ${escapeAgreementHtml(admin.email)}. Signature autorisée uniquement après paiement confirmé.</p>
      <div style="text-align:center;margin-top:30px;">
        <a href="${siteUrl}/mon-espace" style="background:linear-gradient(135deg,#0f2460,#2563EB);color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block;box-shadow:0 6px 16px rgba(37,99,235,0.35);">Accéder à mon espace</a>
      </div>
    </div>
    <div style="border-top:2px solid #f1f5f9;padding:20px 30px;text-align:center;background:#fafbfc;">
      <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">Ce document est une preuve officielle de votre engagement. Conservez-le précieusement.</p>
      <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">3M TRAVEL AGENCY — RC/YAO/2019/A/2567 | NIU : M112417203369H</p>
      <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">Yaoundé, Cameroun • hello@3mtravelagency.com</p>
      <p style="margin:0;font-size:11px;color:#c7cdd6;">Document généré le ${generatedOn}</p>
    </div>
  </div>
</div>
</body></html>`;
      const storageKey = `agreements/${reference.source}/${reference.id}/${Date.now()}-protocole.html`;
      const stored = await storagePut(storageKey, Buffer.from(html, "utf8"), "text/html; charset=utf-8");
      if (agencyDossierId) {
        await db.insert(agencyDossierDocuments).values({ dossierId: agencyDossierId, documentType: "protocole_accord", documentName: `Protocole d’accord — ${dossierNumber}.html`, documentUrl: stored.url, fileSize: Buffer.byteLength(html), source: "admin_upload", uploadedBy: admin.email, verificationStatus: "verified", verificationComment: `Protocole ${AGREEMENT_PROTOCOL_VERSION} préparé et validé par l’administrateur avant diffusion.`, });
        await db.insert(agencyDossierDocuments).values({ dossierId: agencyDossierId, documentType: "protocole_accord", documentName: `Protocole d’accord — ${dossierNumber}.pdf`, documentUrl: protocolPdf.url, fileSize: protocolPdf.bytes.length, source: "admin_upload", uploadedBy: admin.email, verificationStatus: "verified", verificationComment: `PDF du Protocole ${AGREEMENT_PROTOCOL_VERSION} déposé après validation du paiement.`, });
      } else if (applicationId) {
        await db.insert(clientDocuments).values({ evaluationId: applicationId, candidateEmail: email, documentType: "other", documentName: `Protocole d’accord — ${dossierNumber}.html`, documentUrl: stored.url, fileSize: Buffer.byteLength(html), source: "manual_admin", uploadedByAdmin: admin.email, receivedByAdmin: true, status: "verified", verificationStatus: "approved", verifiedByAdmin: admin.email, verifiedAt: new Date(), adminNotes: `Protocole éditable (${AGREEMENT_PROTOCOL_VERSION}) préparé par l’administrateur et déposé après paiement confirmé.`, });
        await db.insert(clientDocuments).values({ evaluationId: applicationId, candidateEmail: email, documentType: "other", documentName: `Protocole d’accord — ${dossierNumber}.pdf`, documentUrl: protocolPdf.url, fileSize: protocolPdf.bytes.length, source: "manual_admin", uploadedByAdmin: admin.email, receivedByAdmin: true, status: "verified", verificationStatus: "approved", verifiedByAdmin: admin.email, verifiedAt: new Date(), adminNotes: `PDF du Protocole ${AGREEMENT_PROTOCOL_VERSION} déposé après validation du paiement.`, });
      }
      try {
        await sendGenericEmail({
          to: email,
          subject: input.subject?.trim() || `Protocole d’accord — ${dossierNumber}`,
          html,
          attachments: [{ filename: `Protocole-accord-01-${dossierNumber}.pdf`, content: protocolPdf.bytes, contentType: "application/pdf" }],
        });
      } catch (error) {
        console.error("[Agreement] Email delivery failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le protocole a été déposé dans l’espace client, mais l’e-mail n’a pas pu être envoyé. Relancez l’envoi après vérification SMTP." });
      }
      return { success: true, emailSent: true, documentUrl: stored.url, dossierNumber, preparedBy: admin.email };
    }),

  /**
   * Valide la sélection candidat et débloque le Protocole N°02 dans l’espace client.
   * Employeur + poste obligatoires ; notification e-mail avec lien mon-espace.
   */
  activateSecondAgreementProtocol: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().regex(/^online_\d+$/),
      employerName: z.string().trim().min(2).max(255),
      positionTitle: z.string().trim().min(2).max(255),
      notifyClient: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference || reference.source !== "online") throw new TRPCError({ code: "BAD_REQUEST", message: "Dossier en ligne requis." });
      const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable." });
      if (application.paymentStatus !== "SUCCESS") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Paiement confirmé requis avant le Protocole N°02." });
      if (!application.agreementSigned) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le Protocole N°01 doit être signé avant d’activer le Protocole N°02." });
      if (application.secondAgreementSigned) throw new TRPCError({ code: "CONFLICT", message: "Le Protocole N°02 est déjà signé." });

      const readyAt = new Date();
      await db.update(applications).set({
        secondAgreementReadyAt: readyAt,
        secondAgreementReadyBy: admin.email,
        secondAgreementEmployer: input.employerName.trim(),
        secondAgreementPosition: input.positionTitle.trim(),
        recruitmentPartnerName: input.employerName.trim(),
        dossierStatus: application.dossierStatus === "visa_approuve" ? application.dossierStatus : "contrat_obtenu",
        lastStatusUpdateAt: readyAt,
        lastStatusUpdatedBy: admin.fullName || admin.email,
      }).where(eq(applications.id, application.id));

      const protocolPreview = buildProtocolTwoRichText({
        clientNomComplet: application.fullName,
        clientTelephoneWhatsapp: application.whatsappNumber || undefined,
        clientEmail: application.email,
        dossierRef: application.dossierNumber,
        employeurNom: input.employerName.trim(),
        posteRetenu: input.positionTitle.trim(),
        systemTimestamp: readyAt.toISOString(),
        clientIpAddress: "Signature à venir dans l’espace client",
        dateDuJour: readyAt.toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" }),
      }, application.destination);

      const siblingOnline = await db.select({
        id: applications.id,
        dossierNumber: applications.dossierNumber,
        visaType: applications.visaType,
        destination: applications.destination,
      }).from(applications).where(and(eq(applications.email, application.email), isNull(applications.deletedAt))).limit(10);
      const handoff = dualOpportunityHandoffMessage({
        currentProcedure: application.visaType,
        siblingProcedures: siblingOnline
          .filter((row) => row.id !== application.id)
          .map((row) => ({ projectType: row.visaType, folderCode: row.dossierNumber, destinationCountry: row.destination })),
      });

      if (input.notifyClient && application.email) {
        const siteUrl = process.env.SITE_URL || "https://www.3mtravelagency.com";
        const safeName = escapeAgreementHtml(application.fullName);
        const safeDossier = escapeAgreementHtml(application.dossierNumber);
        const safeEmployer = escapeAgreementHtml(input.employerName.trim());
        const safePosition = escapeAgreementHtml(input.positionTitle.trim());
        const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#eef2f7;padding:24px;font-family:Arial,sans-serif"><div style="max-width:640px;margin:auto;background:#fff;border-radius:18px;overflow:hidden"><div style="background:#0f2460;color:#fff;padding:28px;text-align:center"><strong style="font-size:22px">3M TRAVEL AGENCY</strong><p style="margin:8px 0 0;color:#dbeafe">Sélection confirmée — Protocole N°02</p></div><div style="padding:30px;color:#1f2937"><p>Bonjour ${safeName},</p><p>Votre dossier <strong>${safeDossier}</strong> a été retenu pour une proposition concrète :</p><ul><li>Employeur / partenaire : <strong>${safeEmployer}</strong></li><li>Poste / projet : <strong>${safePosition}</strong></li></ul><p>Connectez-vous à votre espace client pour lire et signer le Protocole d’accord N°02 (formules tarifaires selon destination, sans garantie de résultat).</p><p style="text-align:center;margin:28px 0"><a href="${siteUrl}/mon-espace" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:9px;padding:13px 24px;font-weight:bold">Signer le Protocole N°02</a></p><p style="font-size:12px;color:#64748b">Version ${SECOND_AGREEMENT_PROTOCOL_VERSION}. Les décisions finales restent celles des autorités et partenaires compétents.</p></div><div style="border-top:2px solid #f1f5f9;padding:18px;text-align:center;color:#64748b;font-size:11px">3M TRAVEL AGENCY — Yaoundé · hello@3mtravelagency.com</div></div></body></html>`;
        try {
          await sendGenericEmail({ to: application.email, subject: `Sélection confirmée — Protocole N°02 · ${application.dossierNumber}`, html });
        } catch (error) {
          console.error("[Protocol02] Email delivery failed", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sélection enregistrée, mais l’e-mail n’a pas pu être envoyé. Relancez la notification." });
        }
      }

      await db.insert(paymentAuditLogs).values({
        adminName: admin.email || "Administrateur",
        adminEmail: admin.email || "",
        action: "second_agreement_activated",
        paymentId: application.id,
        candidateEmail: application.email,
        amount: "",
        details: `Protocole N°02 activé pour ${application.dossierNumber} · ${input.employerName.trim()} / ${input.positionTitle.trim()}.`,
      });

      return {
        success: true,
        dossierNumber: application.dossierNumber,
        employerName: input.employerName.trim(),
        positionTitle: input.positionTitle.trim(),
        protocolPreview,
        dualOpportunityHandoff: handoff,
        version: SECOND_AGREEMENT_PROTOCOL_VERSION,
      };
    }),

  resendAgreementSignatureReminder: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.string().regex(/^online_\d+$/) }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference || reference.source !== "online") throw new TRPCError({ code: "BAD_REQUEST", message: "Dossier en ligne requis pour cette relance." });
      const [application] = await db.select({ id: applications.id, dossierNumber: applications.dossierNumber, fullName: applications.fullName, email: applications.email, destination: applications.destination, paymentStatus: applications.paymentStatus, agreementSigned: applications.agreementSigned }).from(applications).where(eq(applications.id, reference.id)).limit(1);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
      if (application.paymentStatus !== "SUCCESS") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La relance n’est possible qu’après confirmation du paiement." });
      if (application.agreementSigned) throw new TRPCError({ code: "CONFLICT", message: "Ce protocole est déjà signé. La relance est désactivée." });
      if (!application.email) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune adresse e-mail client n’est disponible pour ce dossier." });
      const siteUrl = process.env.SITE_URL || "https://www.3mtravelagency.com";
      const safeName = escapeAgreementHtml(application.fullName);
      const safeDossier = escapeAgreementHtml(application.dossierNumber);
      const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#eef2f7;padding:24px;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;overflow:hidden"><div style="background:#0f2460;color:#fff;padding:28px;text-align:center"><strong style="font-size:22px">3M TRAVEL AGENCY</strong><p style="margin:8px 0 0;color:#dbeafe">Rappel : signature de votre protocole d’accord</p></div><div style="padding:30px;color:#1f2937"><p>Bonjour ${safeName},</p><p>Votre paiement est confirmé, mais votre protocole d’accord n’est pas encore signé. Pour poursuivre votre dossier <strong>${safeDossier}</strong>, connectez-vous à votre espace client et finalisez la signature.</p><p style="text-align:center;margin:28px 0"><a href="${siteUrl}/mon-espace" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:9px;padding:13px 24px;font-weight:bold">Ouvrir mon espace client</a></p><p style="font-size:12px;color:#64748b">Ne répondez pas avec des informations bancaires. L’équipe 3M TRAVEL AGENCY reste disponible pour vous accompagner.</p></div><div style="border-top:2px solid #f1f5f9;padding:18px;text-align:center;color:#64748b;font-size:11px">3M TRAVEL AGENCY — Yaoundé, Cameroun · hello@3mtravelagency.com</div></div></body></html>`;
      try {
        await sendGenericEmail({ to: application.email, subject: `Rappel — signature du protocole ${application.dossierNumber}`, html });
      } catch (error) {
        console.error("[Agreement reminder] Email delivery failed", { dossierNumber: application.dossierNumber, error });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La relance n’a pas pu être envoyée. Vérifiez le service e-mail et réessayez." });
      }
      await db.insert(paymentAuditLogs).values({ adminName: admin.email || "Administrateur", adminEmail: admin.email || "", action: "agreement_signature_reminder_sent", paymentId: application.id, candidateEmail: application.email, amount: "", details: `Relance de signature du protocole envoyée pour ${application.dossierNumber}.` });
      return { success: true, dossierNumber: application.dossierNumber, email: application.email };
    }),
  // Liste de rattrapage : dossiers en ligne dont le paiement est confirme mais dont le
  // Protocole d'Accord N01 n'a pas encore ete signe (bug historique corrige cote candidat.ts :
  // certains dossiers plus anciens restent a regulariser manuellement depuis le back-office).
  listCandidatesAwaitingAgreementProtocol: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const rows = await db
        .select({
          id: applications.id,
          dossierNumber: applications.dossierNumber,
          fullName: applications.fullName,
          email: applications.email,
          destination: applications.destination,
          paymentValidatedAt: applications.paymentValidatedAt,
          paymentDate: applications.paymentDate,
          paymentAmount: applications.paymentAmount,
          dossierStatus: applications.dossierStatus,
        })
        .from(applications)
        .where(and(eq(applications.paymentStatus, "SUCCESS"), eq(applications.agreementSigned, false)))
        .orderBy(desc(applications.paymentValidatedAt))
        .limit(500);
      return {
        count: rows.length,
        candidates: rows.map((row) => ({
          candidateId: `online_${row.id}`,
          dossierNumber: row.dossierNumber,
          fullName: row.fullName,
          email: row.email,
          destination: row.destination,
          paymentConfirmedAt: row.paymentValidatedAt ?? row.paymentDate ?? null,
          paymentAmount: row.paymentAmount,
          dossierStatus: row.dossierStatus,
        })),
      };
    }),
  // Detecte, puis (si demande) archive dans la corbeille reversible les
  // pre-comptes en doublon : une ligne "applications" anonyme et jamais payee
  // (creee par l'evaluation gratuite, candidateId null) qui partage l'email
  // d'une ligne reelle deja rattachee a un compte candidat. Ces doublons
  // saturent la liste des dossiers cote admin (ex. un meme candidat apparaissant
  // deux fois avec deux numeros de dossier differents). Utilise le meme
  // mecanisme reversible que admin.archiveDuplicateRecord (deletedAt/
  // deletedBy/deletionReason) : rien n'est jamais supprime physiquement, tout
  // reste restaurable depuis Corbeille / doublons. Toujours un dry-run par
  // defaut : l'admin doit explicitement demander l'archivage apres avoir vu
  // le nombre concerne.
  cleanupOrphanedPreAccounts: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), confirmDelete: z.boolean().default(false) }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const orphans = await db.select({
        id: applications.id,
        dossierNumber: applications.dossierNumber,
        fullName: applications.fullName,
        email: applications.email,
        createdAt: applications.createdAt,
      }).from(applications).where(and(isNull(applications.candidateId), eq(applications.paymentStatus, "PENDING"), isNull(applications.deletedAt))).limit(2000);

      const linkedRows = await db.select({ email: applications.email }).from(applications).where(and(isNotNull(applications.candidateId), isNull(applications.deletedAt))).limit(5000);
      const linkedEmails = new Set(linkedRows.map((row) => row.email.trim().toLowerCase()));

      const duplicates = orphans.filter((row) => linkedEmails.has(row.email.trim().toLowerCase()));

      if (input.confirmDelete && duplicates.length > 0) {
        for (const row of duplicates) {
          await db.update(applications).set({
            deletedAt: new Date(),
            deletedBy: admin.email || "Administrateur",
            deletionReason: "Pré-dossier anonyme et non payé, en doublon avec un compte réel existant pour le même e-mail (nettoyage groupé).",
          }).where(eq(applications.id, row.id));
        }
        await db.insert(paymentAuditLogs).values({
          adminName: admin.email || "Administrateur",
          adminEmail: admin.email || "",
          action: "orphaned_pre_accounts_archived",
          paymentId: 0,
          candidateEmail: "multiple",
          amount: "0",
          details: `${duplicates.length} pré-dossier(s) anonyme(s) et jamais payé(s) archivé(s) (corbeille réversible) car un compte réel existe déjà pour le même e-mail : ${duplicates.map((row) => row.dossierNumber).join(", ")}.`,
        });
      }

      return {
        count: duplicates.length,
        deleted: input.confirmDelete,
        duplicates: duplicates.map((row) => ({ dossierNumber: row.dossierNumber, fullName: row.fullName, email: row.email, createdAt: row.createdAt })),
      };
    }),
  resendConfirmation: publicProcedure
    .input(z.object({ candidateId: z.string().regex(/^(online|agency)_\d+$/) }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });

      let recipientEmail: string;
      let fullName: string;
      let dossierNumber: string;
      let destination: string;
      let amount: number;
      if (reference.source === "online") {
        const record = (await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1))[0];
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        recipientEmail = record.email;
        fullName = record.fullName;
        dossierNumber = record.dossierNumber;
        destination = record.destination || "International";
        amount = record.paymentAmount ?? 65000;
      } else {
        const record = (await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1))[0];
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        recipientEmail = record.email;
        fullName = record.fullName;
        dossierNumber = `3M-AGN-${reference.id.toString().padStart(4, "0")}`;
        destination = record.destination || "International";
        amount = 0;
      }
      if (!recipientEmail || !fullName) throw new TRPCError({ code: "BAD_REQUEST", message: "Le dossier ne contient pas d’adresse e-mail exploitable." });
      const sent = await sendDossierConfirmationEmail(recipientEmail, fullName, dossierNumber, destination, amount);
      if (!sent) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "L’envoi a échoué. Consultez le journal de délivrabilité." });
      }
      console.info(`[Admin Email] Confirmation renvoyée par ${admin.email} pour ${input.candidateId}`);
      return { success: true, recipientEmail, dossierNumber };
    }),
});
