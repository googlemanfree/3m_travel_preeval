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
import { runOpeningPaymentAutomation } from "../services/openingPaymentAutomation";
import { generateReceiptA5HTML } from "../receiptA5Service";
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
import { ensureAgencyActiveReference } from "../services/canonicalizeActiveDossier";
import { hasPassportPhotoDeposited, isPassportPhotoRequestReason, isWorkVisaForPassportPhoto } from "../../shared/passportPhotoRequirement";
import {
  buildRegistrationInfoClientSpaceContent,
  buildRegistrationInfoRequest,
  isEvaluationCompleteForJustificatifs,
  registrationInfoRequestEmailHtml,
  registrationInfoRequestPlainBody,
} from "../../shared/registrationInfoRequest";
import { evaluationRequiresCv } from "../../shared/evaluationVisaCv";
import { flagPassportPhotoRequirement } from "../passportPhotoRequirementService";
import {
  notifyAgreementSignatureReminderWhatsApp,
  notifyPaymentReceiptApprovedWhatsApp,
} from "../services/clientWhatsAppNotify";
import { resendClientAccessLink as issueClientAccessLinkResend } from "../services/resendClientAccessLink";
import {
  loadAgencyAgreementSignature,
  loadAgencyAgreementSignaturesByIds,
  loadAgencyProtocolSignedDocIds,
} from "../services/agencyAgreementSignature";

// Contrat partagé de la notification passport_photo_request, utilisé par le service
// pour publier la demande dans l’espace client et envoyer l’e-mail correspondant.
const PASSPORT_PHOTO_REQUEST_TITLE = "Photo de profil type passeport requise";
const PASSPORT_PHOTO_REQUEST_BODY = "Pour une exploitation optimale de votre dossier dans les espaces employeur et agences de placement, merci de déposer une photo de profil type passeport.";

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
  const accountMatch = /^account_(\d+)$/.exec(candidateId.trim());
  if (accountMatch) {
    const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, Number(accountMatch[1]))).limit(1);
    return candidate?.id ?? null;
  }
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
          phone: candidates.phone,
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
          whatsappNumber: applications.whatsappNumber,
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
        phone: string | null;
        candidateId: number | null;
        visaType: string | null;
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
          phone: account.phone?.trim() || null,
          candidateId: account.id,
          visaType: account.visaType?.trim() || null,
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
          phone: app.whatsappNumber?.trim() || null,
          candidateId: app.candidateId ?? null,
          visaType: app.visaType?.trim() || null,
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
        db.select({
          candidateId: candidateFiles.candidateId,
          fileType: candidateFiles.fileType,
          fileUrl: candidateFiles.fileUrl,
          fileName: candidateFiles.fileName,
        }).from(candidateFiles).limit(5000),
        db.select({
          email: evaluations.email,
          cvFileUrl: evaluations.cvFileUrl,
          cvFileName: evaluations.cvFileName,
          createdAt: evaluations.createdAt,
        }).from(evaluations).limit(10000),
        loadEmailsWithActiveDossier(db),
      ]);
      const accounts = allAccounts.filter((account) => !activeEmails.has(account.email.trim().toLowerCase()));
      const coveredByActiveDossier = allAccounts.length - accounts.length;
      const documentsByCandidate = new Map<number, number>();
      const cvByCandidate = new Set<number>();
      const cvFileByCandidate = new Map<number, { url: string; fileName: string }>();
      files.forEach((file) => {
        documentsByCandidate.set(file.candidateId, (documentsByCandidate.get(file.candidateId) ?? 0) + 1);
        if (file.fileType === "cv") {
          cvByCandidate.add(file.candidateId);
          if (file.fileUrl?.trim() && !cvFileByCandidate.has(file.candidateId)) {
            cvFileByCandidate.set(file.candidateId, { url: file.fileUrl, fileName: file.fileName || "CV" });
          }
        }
      });
      const cvByEmail = new Map<string, { url: string; fileName: string; createdAtMs: number }>();
      for (const row of evaluationRows) {
        if (!row.cvFileUrl?.trim()) continue;
        const key = row.email.trim().toLowerCase();
        const createdAtMs = new Date(row.createdAt).getTime();
        const existing = cvByEmail.get(key);
        if (!existing || createdAtMs > existing.createdAtMs) {
          cvByEmail.set(key, {
            url: row.cvFileUrl,
            fileName: row.cvFileName || "CV soumis à l’évaluation",
            createdAtMs,
          });
        }
      }
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
          const evalCv = cvByEmail.get(emailKey);
          const fileCv = cvFileByCandidate.get(account.id);
          const hasCv = Boolean(fileCv || evalCv);
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
            cvFileUrl: fileCv?.url ?? evalCv?.url ?? null,
            cvFileName: fileCv?.fileName ?? evalCv?.fileName ?? null,
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

  /**
   * Relance dynamique : compose un message professionnel (modèle + IA),
   * le dépose dans l’espace client (entête) et l’envoie par e-mail brandé.
   * WhatsApp : retourne l’URL préremplie (même texte).
   */
  sendDynamicRelance: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      /** `account_123`, `online_123`, `agency_123` ou id numérique de compte. */
      candidateId: z.union([z.string().min(1).max(50), z.number().int().positive()]),
      stage: z.string().trim().min(2).max(64),
      channel: z.enum(["email", "whatsapp", "both"]).default("email"),
      useAi: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const rawId = typeof input.candidateId === "number" ? `account_${input.candidateId}` : input.candidateId.trim();
      const accountMatch = /^account_(\d+)$/.exec(rawId);
      const onlineMatch = /^online_(\d+)$/.exec(rawId);
      const agencyMatch = /^agency_(\d+)$/.exec(rawId);
      const numericOnly = /^\d+$/.exec(rawId);
      const emailLookup = rawId.includes("@") ? rawId.toLowerCase() : null;

      let candidateRow: typeof candidates.$inferSelect | null = null;
      let reference = "";
      let destination: string | null = null;
      let visaType: string | null = null;
      let phone: string | null = null;

      if (emailLookup) {
        const [row] = await db.select().from(candidates).where(and(sql`LOWER(TRIM(${candidates.email})) = ${emailLookup}`, isNull(candidates.deletedAt))).limit(1);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable pour cet e-mail." });
        candidateRow = row;
        reference = accountReference(row.id);
        destination = row.destination || null;
        visaType = row.visaType || null;
        phone = row.phone || null;
      } else if (accountMatch || numericOnly) {
        const id = Number((accountMatch ?? numericOnly)![1]);
        const [row] = await db.select().from(candidates).where(and(eq(candidates.id, id), isNull(candidates.deletedAt))).limit(1);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
        candidateRow = row;
        reference = accountReference(row.id);
        destination = row.destination || null;
        visaType = row.visaType || null;
        phone = row.phone || null;
      } else if (onlineMatch) {
        const id = Number(onlineMatch[1]);
        const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
        if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        const [row] = await db.select().from(candidates).where(eq(candidates.email, app.email)).limit(1);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Compte lié au dossier introuvable." });
        candidateRow = row;
        reference = app.dossierNumber || accountReference(row.id);
        destination = app.destination || row.destination || null;
        visaType = app.visaType || row.visaType || null;
        phone = app.whatsappNumber || row.phone || null;
      } else if (agencyMatch) {
        const id = Number(agencyMatch[1]);
        const [dossier] = await db.select().from(agencyDossiers).where(and(eq(agencyDossiers.id, id), isNull(agencyDossiers.deletedAt))).limit(1);
        if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        const [row] = await db.select().from(candidates).where(eq(candidates.email, dossier.email)).limit(1);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Compte lié au dossier agence introuvable." });
        candidateRow = row;
        reference = agencyDossierReference(dossier.id);
        destination = dossier.destination || row.destination || null;
        visaType = dossier.visaType || row.visaType || null;
        phone = dossier.phone || row.phone || null;
      } else {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide pour la relance." });
      }

      const { composeDynamicRelance, buildWhatsAppUrlFromBody } = await import("../services/dynamicRelance");
      const composed = await composeDynamicRelance({
        stage: input.stage,
        name: candidateRow.fullName,
        reference,
        email: candidateRow.email,
        phone,
        visaType,
        projectType: visaType,
        destination,
        useAi: input.useAi !== false,
      });

      const notificationResult = await db.insert(clientNotifications).values({
        candidateId: candidateRow.id,
        type: "admin_relance",
        title: composed.subject,
        body: composed.body,
        actionUrl: "/mon-espace",
        isRead: false,
      });
      const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
      await db.insert(candidateMessages).values({
        candidateId: candidateRow.id,
        notificationId: notificationId || null,
        senderRole: "advisor",
        content: composed.clientSpaceContent,
        isRead: false,
      });

      let emailSent = false;
      if (input.channel === "email" || input.channel === "both") {
        emailSent = await sendClientNotificationEmail({
          to: candidateRow.email,
          fullName: candidateRow.fullName,
          title: composed.subject,
          body: composed.body,
          actionUrl: "/mon-espace",
          sourceLabel: "3M TRAVEL AGENCY",
        });
        if (emailSent && notificationId > 0) {
          await db.update(clientNotifications).set({ emailSentAt: new Date() }).where(eq(clientNotifications.id, notificationId));
        }
      }

      const whatsappUrl = (input.channel === "whatsapp" || input.channel === "both")
        ? buildWhatsAppUrlFromBody(phone, composed.body)
        : null;

      await db.insert(paymentAuditLogs).values({
        adminName: admin.email || "Administrateur",
        adminEmail: admin.email || "",
        action: "dynamic_relance_sent",
        paymentId: candidateRow.id,
        candidateEmail: candidateRow.email,
        amount: "0",
        details: JSON.stringify({
          stage: composed.stage,
          channel: input.channel,
          aiEnhanced: composed.aiEnhanced,
          emailSent,
          whatsappPrepared: Boolean(whatsappUrl),
          subject: composed.subject,
          sentBy: admin.email,
        }),
      });

      return {
        success: true,
        emailSent,
        deliveredToClientSpace: true,
        aiEnhanced: composed.aiEnhanced,
        subject: composed.subject,
        body: composed.body,
        label: composed.label,
        whatsappUrl,
        reference,
        message: emailSent
          ? `Relance « ${composed.label} » envoyée (espace client + e-mail)${composed.aiEnhanced ? " — message IA" : ""}.`
          : input.channel === "whatsapp"
            ? `Relance « ${composed.label} » déposée dans l’espace client${whatsappUrl ? " — WhatsApp prêt" : " (téléphone manquant)"}.`
            : `Relance « ${composed.label} » déposée dans l’espace client (e-mail non délivré — à relancer).`,
      };
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

      const onlinePipeline = paidApps.map((app) => {
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
          stage: (!receiptAvailable
            ? "receipt_pending"
            : !app.agreementSigned
              ? "protocol_pending"
              : "complete") as "receipt_pending" | "protocol_pending" | "complete",
        };
      });

      // Dossiers agence payés (walk-in) : même chaîne reçu → protocole, sans rewrite de statut.
      const paidAgency = await db.select({
        id: agencyDossiers.id,
        fullName: agencyDossiers.fullName,
        email: agencyDossiers.email,
        status: agencyDossiers.status,
        updatedAt: agencyDossiers.updatedAt,
        createdAt: agencyDossiers.createdAt,
      }).from(agencyDossiers).where(and(
        eq(agencyDossiers.initialPaymentStatus, "paid"),
        isNull(agencyDossiers.deletedAt),
      )).orderBy(desc(agencyDossiers.updatedAt)).limit(200);

      const onlineEmails = new Set(onlinePipeline.map((row) => row.email.trim().toLowerCase()));
      const agencyOnly = paidAgency.filter((dossier) => !onlineEmails.has(dossier.email.trim().toLowerCase()));
      const agencyIds = agencyOnly.map((dossier) => dossier.id);
      const [agencySignatures, agencySignedDocs] = await Promise.all([
        loadAgencyAgreementSignaturesByIds(db, agencyIds),
        loadAgencyProtocolSignedDocIds(db, agencyIds),
      ]);
      const agencyPipeline = agencyOnly.map((dossier) => {
        const dossierNumber = `3M-AGN-${String(dossier.id).padStart(4, "0")}`;
        const receiptAvailable = receiptByDossier.has(dossierNumber.trim().toUpperCase())
          || receiptByEmail.has(dossier.email.trim().toLowerCase());
        const protocolSigned = agencySignatures.has(dossier.id) || agencySignedDocs.has(dossier.id);
        return {
          candidateId: `agency_${dossier.id}`,
          dossierNumber,
          workingReference: dossierNumber,
          formerAccountReference: null as string | null,
          fullName: dossier.fullName,
          email: dossier.email,
          paymentConfirmed: true,
          receiptAvailable,
          protocolSigned,
          stage: (!receiptAvailable
            ? "receipt_pending"
            : !protocolSigned
              ? "protocol_pending"
              : "complete") as "receipt_pending" | "protocol_pending" | "complete",
        };
      });

      const pipeline = [...onlinePipeline, ...agencyPipeline]
        .sort((a, b) => Number(a.receiptAvailable) - Number(b.receiptAvailable) || a.fullName.localeCompare(b.fullName, "fr"));

      return {
        counts: {
          awaitingProtocol: awaitingProtocol.length + agencyPipeline.filter((row) => !row.receiptAvailable || !row.protocolSigned).length,
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
      // 1 dossier = 1 paiement : le frais d’ouverture déjà validé est reporté
      // sur la ligne agence créée/liée (jamais hérité « par compte » côté client).
      if (linkedExistingDossier) {
        agencyDossierId = existing[0].id;
        await db.update(agencyDossiers).set({
          destination: primaryProcedure.destination,
          visaType: primaryProcedure.visaType,
          status: "en_cours",
          initialPaymentStatus: "paid",
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
          initialPaymentStatus: "paid",
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
        // Second dossier = second paiement déjà exigé plus haut (additionalPayment).
        const additionalInserted = await db.insert(agencyDossiers).values({
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone ?? "Non renseigné",
          dateOfBirth: candidate.dateOfBirth,
          nationality: candidate.nationality,
          destination: additionalProcedure.destination,
          visaType: additionalProcedure.visaType,
          status: "en_cours",
          initialPaymentStatus: "paid",
          createdByAdmin: admin.email,
          assignedToAdmin: admin.email,
          adminNotes: input.adminNotes
            ? `${input.adminNotes}\n[Procédure parallèle intentionnelle · second frais d’ouverture validé]`
            : "Procédure parallèle intentionnelle (traitement simultané avec le dossier principal) · second frais d’ouverture validé.",
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
      // CV d’évaluation → documents compte / dossier (si absent).
      try {
        const { syncEvaluationCvToCandidate } = await import("../services/syncEvaluationCvToCandidate");
        const { publishCandidateFilesToCase } = await import("../services/publishCandidateFilesToCase");
        const synced = await syncEvaluationCvToCandidate(db, {
          email: candidate.email,
          candidateId: candidate.id,
          agencyDossierId,
        });
        if (synced.candidateFileInserted) {
          await publishCandidateFilesToCase(db, {
            candidateId: candidate.id,
            actorAdminId: admin.id ?? null,
            actorRole: "admin",
          });
        }
        if (additionalAgencyDossierId) {
          await syncEvaluationCvToCandidate(db, {
            email: candidate.email,
            candidateId: candidate.id,
            agencyDossierId: additionalAgencyDossierId,
          });
        }
      } catch (err) {
        console.error("[activatePreDossierAccount] Sync CV évaluation non effectué:", err);
      }
      try {
        const { deliverCountryEvaluationForm } = await import("../services/deliverCountryEvaluationForm");
        await deliverCountryEvaluationForm(db, {
          destination: primaryProcedure.destination,
          email: candidate.email,
          fullName: candidate.fullName,
          candidateId: candidate.id,
          caseId: checklistSeed?.caseId ?? null,
          agencyDossierId,
          sendEmail: true,
        });
        if (additionalAgencyDossierId && additionalProcedure) {
          await deliverCountryEvaluationForm(db, {
            destination: additionalProcedure.destination,
            email: candidate.email,
            fullName: candidate.fullName,
            candidateId: candidate.id,
            agencyDossierId: additionalAgencyDossierId,
            sendEmail: false,
          });
        }
      } catch (err) {
        console.error("[activatePreDossierAccount] Livraison formulaire d’évaluation pays non effectuée:", err);
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
      // Dossier activé → référence 3M-AGN obligatoire + suppression du miroir EVAL-AG.
      try {
        await ensureAgencyActiveReference(db, {
          agencyDossierId,
          email: candidate.email,
          adminEmail: admin.email,
        });
        if (additionalAgencyDossierId) {
          await ensureAgencyActiveReference(db, {
            agencyDossierId: additionalAgencyDossierId,
            email: candidate.email,
            adminEmail: admin.email,
          });
        }
      } catch (err) {
        console.error("[activatePreDossierAccount] Canonicalisation 3M-AGN non effectuée:", err);
      }
      // Visa travail (tous pays) : photo type passeport obligatoire → remplace le profil.
      let passportPhotoRequested = false;
      let passportPhotoEmailSent = false;
      if (
        isWorkVisaForPassportPhoto(primaryProcedure.visaType)
        || isWorkVisaForPassportPhoto(input.visaType)
        || (additionalProcedure && isWorkVisaForPassportPhoto(additionalProcedure.visaType))
      ) {
        try {
          const passportResult = await flagPassportPhotoRequirement(db, {
            candidateId: candidate.id,
            email: candidate.email,
            fullName: candidate.fullName,
            currentReason: candidate.avatarVerificationReason,
            sendEmail: true,
          });
          passportPhotoRequested = passportResult.flagged;
          passportPhotoEmailSent = passportResult.emailSent;
        } catch (err) {
          console.error("[activatePreDossierAccount] Exigence photo passeport non enregistrée:", err);
        }
      }
      return {
        success: true,
        emailSent,
        passportPhotoRequested,
        passportPhotoEmailSent,
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
      sessionToken: z.string().min(1).max(512).optional(),
      candidateId: z.string().min(1).max(80),
      decision: z.enum(["approve", "reject", "request_new", "request_passport"]),
      reason: z.string().trim().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      let admin;
      try {
        admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      } catch {
        if (!input.sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session administrateur requise." });
        admin = await requireValidAdminSession(input.sessionToken);
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const candidateId = await resolveCandidateIdForAdmin(input.candidateId);
      if (!candidateId) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun compte candidat lié à ce dossier." });
      const [candidate] = await db.select({
        id: candidates.id,
        avatarUrl: candidates.avatarUrl,
        email: candidates.email,
        fullName: candidates.fullName,
        avatarVerificationReason: candidates.avatarVerificationReason,
      }).from(candidates).where(eq(candidates.id, candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      if (input.decision === "approve" && !candidate.avatarUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible de valider un portrait absent." });
      }
      if (
        input.decision === "approve"
        && isPassportPhotoRequestReason(candidate.avatarVerificationReason)
        && !hasPassportPhotoDeposited(candidate.avatarVerificationReason)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Une photo type passeport est encore attendue. Ne validez pas l’ancien selfie : attendez le dépôt candidat, ou relancez la demande.",
        });
      }
      if (input.decision === "request_passport") {
        const result = await flagPassportPhotoRequirement(db, {
          candidateId,
          email: candidate.email,
          fullName: candidate.fullName,
          currentReason: null,
          sendEmail: true,
          customReason: input.reason?.trim() || PASSPORT_PHOTO_REQUEST_BODY,
        });
        return {
          success: true,
          status: "pending" as const,
          candidateId,
          emailSent: result.emailSent,
          message: result.emailSent
            ? "Demande de photo type passeport envoyée par e-mail et publiée dans l’espace client."
            : "Demande publiée dans l’espace client ; l’e-mail n’a pas pu partir.",
        };
      }
      if (input.decision === "request_new") {
        const reason = input.reason?.trim() || "Merci de reprendre votre portrait selon les consignes (fond uni, visage de face).";
        await db.update(candidates).set({
          avatarVerificationStatus: "pending",
          avatarVerificationReason: reason,
          avatarVerifiedAt: null,
        }).where(eq(candidates.id, candidateId));
        return {
          success: true,
          status: "pending" as const,
          candidateId,
          emailSent: false,
          message: "Demande de nouvelle photo enregistrée.",
        };
      }
      const status = input.decision === "approve" ? "verified" : "rejected";
      const reason = input.reason?.trim()
        || (input.decision === "approve"
          ? `Portrait validé manuellement par ${admin.email}.`
          : "Merci de reprendre votre portrait selon les consignes.");
      await db.update(candidates).set({
        avatarVerificationStatus: status,
        avatarVerificationReason: reason,
        avatarVerifiedAt: input.decision === "approve" ? new Date() : null,
      }).where(eq(candidates.id, candidateId));
      return {
        success: true,
        status,
        candidateId,
        emailSent: false,
        message: input.decision === "approve" ? "Portrait validé." : "Décision enregistrée.",
      };
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
              sourceLabel: agencyResponse ? "Agence de placement" : "3M TRAVEL AGENCY",
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
        title: "Nouveau message de 3M TRAVEL AGENCY",
        body: messageBody,
        actionUrl: "/mon-espace",
        isRead: false,
      });
      const [candidateProfile] = await db.select({ email: candidates.email, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, candidateId)).limit(1);
      const emailSent = candidateProfile
        ? await sendClientNotificationEmail({
            to: candidateProfile.email,
            fullName: candidateProfile.fullName,
            title: "Nouveau message de 3M TRAVEL AGENCY",
            body: messageBody,
            actionUrl: "/mon-espace",
            sourceLabel: "3M TRAVEL AGENCY",
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

      // Dès que le paiement est confirmé : pack reçu+protocole + purge miroir EVAL (Vague 1).
      // Un échec d'envoi n'annule pas la confirmation : le bouton « Envoyer reçu + protocole » permet de relancer.
      let packageSent = false;
      let packageError: string | null = null;
      let evalPurged = 0;
      try {
        const automation = await runOpeningPaymentAutomation(db, reference, admin.email || "Administrateur");
        packageSent = automation.packageSent;
        packageError = automation.packageError;
        evalPurged = automation.evalPurged;
      } catch (error) {
        packageError = error instanceof TRPCError ? error.message : "Le reçu et le protocole n’ont pas pu être envoyés.";
        console.error("[Payment] receipt + protocol package failed", { dossierNumber, error });
      }

      return {
        success: true,
        alreadyConfirmed,
        dossierNumber,
        candidateEmail,
        fullName,
        validatedBy: admin.email || "Administrateur",
        validatedAt,
        packageSent,
        packageError,
        evalPurged,
        receiptA5Ready: true,
        amount,
        currency: "XAF",
      };
    }),

  /** HTML imprimable du reçu A5 (caisse) pour un paiement déjà confirmé. */
  getPaymentReceiptA5Html: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().regex(/^(online|agency)_\d+$/),
    }))
    .query(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });

      let fullName = "";
      let dossierNumber = "";
      let amount = "65000";
      let paymentMethod = "Paiement en agence";
      let paymentReference: string | null = null;
      let paid = false;
      let paidAt = new Date();

      if (reference.source === "online") {
        const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        paid = application.paymentStatus === "SUCCESS";
        fullName = application.fullName;
        dossierNumber = application.dossierNumber;
        amount = String(application.paymentConfirmedAmount ?? application.paymentAmount ?? 65000);
        paymentMethod = application.paymentMethod || "Validation administrative";
        paymentReference = application.paymentTransactionId || null;
        paidAt = application.paymentDate ?? application.paymentValidatedAt ?? new Date();
      } else {
        const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
        if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        paid = dossier.initialPaymentStatus === "paid";
        fullName = dossier.fullName;
        dossierNumber = `3M-AGN-${String(dossier.id).padStart(4, "0")}`;
        const [latestAudit] = await db.select().from(paymentAuditLogs)
          .where(and(eq(paymentAuditLogs.paymentId, dossier.id), eq(paymentAuditLogs.candidateEmail, dossier.email)))
          .orderBy(desc(paymentAuditLogs.createdAt))
          .limit(1);
        const audited = latestAudit?.amount ? String(latestAudit.amount).replace(/[^0-9]/g, "") : "";
        amount = audited || "65000";
        paymentMethod = "Espèces / Mobile Money — agence";
        paymentReference = latestAudit?.details?.match(/(?:référence|reference)\s*[:：]?\s*([A-Z0-9_-]+)/i)?.[1]
          ?? latestAudit?.details?.match(/\b(OM|MTN|VIR|TX)[-A-Z0-9]+/i)?.[0]
          ?? null;
        paidAt = dossier.lastStatusChangeAt ?? dossier.updatedAt ?? new Date();
      }

      if (!paid) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Validez d’abord le paiement avant d’imprimer le reçu A5." });
      }

      const html = generateReceiptA5HTML({
        receiptNumber: `REC-A5-${dossierNumber.replace(/[^A-Z0-9-]/gi, "")}`,
        date: paidAt,
        time: paidAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" }),
        candidateName: fullName,
        amount,
        currency: "XAF",
        paymentMethod,
        paymentReference,
        agentName: admin.fullName || admin.email || "Conseiller 3M",
        agencyLocation: "Yaoundé — Biyem-Assi",
        description: `Frais de dossier ${dossierNumber}`,
      });

      return { success: true, dossierNumber, html, amount, paymentReference };
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
      let fullName = "";
      let phone: string | null = null;
      let amount = "65000";
      let currency = "XAF";
      if (reference.source === "agency") {
        const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
        if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        if (dossier.initialPaymentStatus !== "paid") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Validez d’abord le paiement avant de signer le reçu." });
        dossierNumber = `3M-AGN-${String(dossier.id).padStart(4, "0")}`;
        candidateEmail = dossier.email;
        fullName = dossier.fullName;
        phone = dossier.phone || null;
        const [latestAudit] = await db.select().from(paymentAuditLogs).where(and(eq(paymentAuditLogs.paymentId, dossier.id), eq(paymentAuditLogs.candidateEmail, dossier.email))).orderBy(desc(paymentAuditLogs.createdAt)).limit(1);
        amount = latestAudit?.amount ? String(latestAudit.amount).replace(/[^0-9]/g, "") || amount : amount;
      } else {
        const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        if (application.paymentStatus !== "SUCCESS") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Validez d’abord le paiement avant de signer le reçu." });
        dossierNumber = application.dossierNumber;
        candidateEmail = application.email;
        fullName = application.fullName;
        phone = application.whatsappNumber || null;
        amount = String(application.paymentConfirmedAmount ?? application.paymentAmount ?? 65000);
        currency = application.paymentCurrency ?? currency;
      }
      if (!candidateEmail) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune adresse e-mail client n’est disponible pour ce dossier." });

      const [linkedCandidate] = await db.select({ id: candidates.id, phone: candidates.phone, fullName: candidates.fullName }).from(candidates).where(eq(candidates.email, candidateEmail)).limit(1);
      if (!phone) phone = linkedCandidate?.phone || null;
      if (!fullName) fullName = linkedCandidate?.fullName || candidateEmail;

      const approvedAt = new Date();
      const approvedByEmail = admin.email || "Administrateur";
      const approvedByName = approvedByEmail;
      const signatureLabel = `3M TRAVEL AGENCY · ${approvedByName}`;
      const signatureHash = createReceiptSignatureHash({ source: reference.source, paymentId: reference.id, dossierNumber, candidateEmail, amount, currency, approvedByEmail, approvedAt });
      const [approval] = await db.insert(paymentReceiptApprovals).values({ source: reference.source, paymentId: reference.id, dossierNumber, candidateEmail, amount: `${amount} ${currency}`, currency, approvedByName, approvedByEmail, approvedAt, signatureLabel, signatureHash }).$returningId();
      await db.insert(paymentAuditLogs).values({ adminName: approvedByName, adminEmail: approvedByEmail, action: "receipt_approved_signed", paymentId: reference.id, candidateEmail, amount: `${amount} ${currency}`, details: `Reçu validé et signé électroniquement pour ${dossierNumber}. Empreinte ${signatureHash}.` });
      // Notification durable + WhatsApp « au mieux » — n’écrit pas le statut du dossier.
      let whatsappSent = false;
      let whatsappSkippedReason: string | null = null;
      try {
        if (linkedCandidate?.id) {
          await db.insert(clientNotifications).values({
            candidateId: linkedCandidate.id,
            type: "payment_receipt_approved",
            title: "Reçu de paiement validé",
            body: `Votre reçu pour le dossier ${dossierNumber} a été signé par l’agence (${amount} ${currency}). Consultez votre e-mail ou demandez le reçu caisse A5 au comptoir.`,
            actionUrl: "/mon-espace?section=overview",
            isRead: false,
          });
        }
        const wa = await notifyPaymentReceiptApprovedWhatsApp({
          phone,
          candidateName: fullName,
          dossierNumber,
          amount,
          currency,
        });
        whatsappSent = wa.sent;
        whatsappSkippedReason = wa.sent ? null : (wa.error || "WhatsApp non envoyé");
        if (wa.sent) {
          await db.insert(paymentAuditLogs).values({
            adminName: approvedByName,
            adminEmail: approvedByEmail,
            action: "receipt_approved_whatsapp",
            paymentId: reference.id,
            candidateEmail,
            amount: `${amount} ${currency}`,
            details: `WhatsApp reçu signé envoyé pour ${dossierNumber}${wa.phoneE164 ? ` → ${wa.phoneE164}` : ""}.`,
          });
        }
      } catch (notifyError) {
        console.warn("[approvePaymentReceipt] client notification / WhatsApp skipped", notifyError);
        whatsappSkippedReason = notifyError instanceof Error ? notifyError.message : "Notification ignorée";
      }
      return {
        success: true,
        approvalId: Number(approval?.id ?? 0),
        dossierNumber,
        approvedByName,
        approvedByEmail,
        approvedAt,
        signatureLabel,
        signatureHash,
        whatsappSent,
        whatsappSkippedReason,
      };
    }),

  /** Renvoie le lien d’accès espace client (48 h) — e-mail + WhatsApp au mieux. Aucun rewrite de statut dossier. */
  resendClientAccessLink: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      candidateId: z.string().regex(/^(account|online|agency)_\d+$/),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      try {
        return await issueClientAccessLinkResend(db, {
          candidateId: input.candidateId,
          adminEmail: admin.email || "",
          adminName: admin.email || "Administrateur",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Renvoi d’accès impossible.";
        if (message.includes("60 secondes")) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
        }
        if (message.includes("introuvable") || message.includes("invalide") || message.includes("lié")) {
          throw new TRPCError({ code: "BAD_REQUEST", message });
        }
        if (message.includes("e-mail")) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
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
      let visaType = "";
      let whatsapp = "";
      let paymentMethodLabel = "";
      let paymentAmountValue: number | undefined;
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
        visaType = dossier.visaType || "";
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
        visaType = application.visaType || "";
        whatsapp = application.whatsappNumber || "";
        paymentMethodLabel = application.paymentMethod || "";
        paymentTimestamp = application.paymentValidatedAt || application.paymentDate || null;
        paymentAmountValue = Number(application.paymentConfirmedAmount ?? application.paymentAmount) || undefined;
      }
      if (!paymentConfirmed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le protocole ne peut être envoyé qu’après confirmation du paiement." });
      // Protocole généré selon pays + type de visa (guides PDF publiés / COUNTRY_PROTOCOL_PROFILES).
      const empreinteSha = crypto.createHash("sha256").update(`${dossierNumber}|${email}|${destination}|${Date.now()}`).digest("hex").slice(0, 24);
      const protocolVariables = {
        clientNomComplet: fullName,
        dossierRef: dossierNumber,
        destinationProjet: destination || "Non spécifiée",
        clientTelephoneWhatsapp: whatsapp || undefined,
        clientEmail: email,
        montantValide: paymentAmountValue,
        modePaiement: paymentMethodLabel || "Validation manuelle par un conseiller",
        dateHeurePaiement: paymentTimestamp ? paymentTimestamp.toLocaleString("fr-FR", { timeZone: "Africa/Douala" }) : "Non renseignée",
        conseillerEmail: admin.email || "",
        empreinteSha,
        clientIpAddress: "Non applicable (envoi initié par l'agence, signature à venir dans l'espace client)",
        dateDuJour: new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" }),
      };
      const autoProtocolText = buildProtocolOneRichText(protocolVariables, destination, visaType);
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
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.string().regex(/^(online|agency)_\d+$/) }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence dossier invalide pour cette relance." });

      // Relance e-mail + WhatsApp — n’écrit jamais applications.status / agency_dossiers.status.
      let paymentId: number;
      let dossierNumber: string;
      let fullName: string;
      let email: string;
      let phone: string | null = null;

      if (reference.source === "online") {
        const [application] = await db.select({
          id: applications.id,
          dossierNumber: applications.dossierNumber,
          fullName: applications.fullName,
          email: applications.email,
          paymentStatus: applications.paymentStatus,
          agreementSigned: applications.agreementSigned,
          whatsappNumber: applications.whatsappNumber,
        }).from(applications).where(eq(applications.id, reference.id)).limit(1);
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
        if (application.paymentStatus !== "SUCCESS") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La relance n’est possible qu’après confirmation du paiement." });
        if (application.agreementSigned) throw new TRPCError({ code: "CONFLICT", message: "Ce protocole est déjà signé. La relance est désactivée." });
        if (!application.email) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune adresse e-mail client n’est disponible pour ce dossier." });
        paymentId = application.id;
        dossierNumber = application.dossierNumber;
        fullName = application.fullName;
        email = application.email;
        phone = application.whatsappNumber || null;
      } else {
        const [dossier] = await db.select({
          id: agencyDossiers.id,
          fullName: agencyDossiers.fullName,
          email: agencyDossiers.email,
          phone: agencyDossiers.phone,
          initialPaymentStatus: agencyDossiers.initialPaymentStatus,
        }).from(agencyDossiers).where(and(eq(agencyDossiers.id, reference.id), isNull(agencyDossiers.deletedAt))).limit(1);
        if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
        if (dossier.initialPaymentStatus !== "paid") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La relance n’est possible qu’après confirmation du paiement." });
        const alreadySigned = await loadAgencyAgreementSignature(db, dossier.id);
        if (alreadySigned) throw new TRPCError({ code: "CONFLICT", message: "Ce protocole est déjà signé. La relance est désactivée." });
        if (!dossier.email) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune adresse e-mail client n’est disponible pour ce dossier." });
        paymentId = dossier.id;
        dossierNumber = `3M-AGN-${String(dossier.id).padStart(4, "0")}`;
        fullName = dossier.fullName;
        email = dossier.email;
        phone = dossier.phone || null;
      }

      const siteUrl = process.env.SITE_URL || "https://www.3mtravelagency.com";
      const safeName = escapeAgreementHtml(fullName);
      const safeDossier = escapeAgreementHtml(dossierNumber);
      const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#eef2f7;padding:24px;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;overflow:hidden"><div style="background:#0f2460;color:#fff;padding:28px;text-align:center"><strong style="font-size:22px">3M TRAVEL AGENCY</strong><p style="margin:8px 0 0;color:#dbeafe">Rappel : signature de votre protocole d’accord</p></div><div style="padding:30px;color:#1f2937"><p>Bonjour ${safeName},</p><p>Votre paiement est confirmé, mais votre protocole d’accord n’est pas encore signé. Pour poursuivre votre dossier <strong>${safeDossier}</strong>, connectez-vous à votre espace client et finalisez la signature.</p><p style="text-align:center;margin:28px 0"><a href="${siteUrl}/mon-espace" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:9px;padding:13px 24px;font-weight:bold">Ouvrir mon espace client</a></p><p style="font-size:12px;color:#64748b">Ne répondez pas avec des informations bancaires. L’équipe 3M TRAVEL AGENCY reste disponible pour vous accompagner.</p></div><div style="border-top:2px solid #f1f5f9;padding:18px;text-align:center;color:#64748b;font-size:11px">3M TRAVEL AGENCY — Yaoundé, Cameroun · hello@3mtravelagency.com</div></div></body></html>`;
      try {
        await sendGenericEmail({ to: email, subject: `Rappel — signature du protocole ${dossierNumber}`, html });
      } catch (error) {
        console.error("[Agreement reminder] Email delivery failed", { dossierNumber, source: reference.source, error });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La relance n’a pas pu être envoyée. Vérifiez le service e-mail et réessayez." });
      }
      const adminName = admin.email || "Administrateur";
      const adminEmail = admin.email || "";
      await db.insert(paymentAuditLogs).values({
        adminName,
        adminEmail,
        action: "agreement_signature_reminder_sent",
        paymentId,
        candidateEmail: email,
        amount: "",
        details: `Relance de signature du protocole envoyée pour ${dossierNumber} (${reference.source}).`,
      });

      // Notification durable + WhatsApp « au mieux » — n’écrit pas le statut du dossier.
      let whatsappSent = false;
      let whatsappSkippedReason: string | null = null;
      try {
        const emailKey = email.trim().toLowerCase();
        const [linkedCandidate] = await db
          .select({ id: candidates.id, phone: candidates.phone })
          .from(candidates)
          .where(and(sql`LOWER(TRIM(${candidates.email})) = ${emailKey}`, isNull(candidates.deletedAt)))
          .limit(1);
        if (linkedCandidate?.id) {
          await db.insert(clientNotifications).values({
            candidateId: linkedCandidate.id,
            type: "agreement_signature_reminder",
            title: "Protocole d’accord à signer",
            body: `Votre paiement est confirmé pour le dossier ${dossierNumber}. Connectez-vous pour finaliser la signature du protocole.`,
            actionUrl: "/mon-espace?section=dossier",
            isRead: false,
          });
        }
        const waPhone = phone || linkedCandidate?.phone || null;
        const wa = await notifyAgreementSignatureReminderWhatsApp({
          phone: waPhone,
          candidateName: fullName,
          dossierNumber,
        });
        whatsappSent = wa.sent;
        whatsappSkippedReason = wa.sent ? null : (wa.error || "WhatsApp non envoyé");
        if (wa.sent) {
          await db.insert(paymentAuditLogs).values({
            adminName,
            adminEmail,
            action: "agreement_signature_reminder_whatsapp",
            paymentId,
            candidateEmail: email,
            amount: "",
            details: `WhatsApp relance protocole envoyé pour ${dossierNumber}${wa.phoneE164 ? ` → ${wa.phoneE164}` : ""}.`,
          });
        }
      } catch (notifyError) {
        console.warn("[resendAgreementSignatureReminder] client notification / WhatsApp skipped", notifyError);
        whatsappSkippedReason = notifyError instanceof Error ? notifyError.message : "Notification ignorée";
      }

      return {
        success: true,
        dossierNumber,
        email,
        source: reference.source,
        whatsappSent,
        whatsappSkippedReason,
      };
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
  requestRegistrationSupplementaryInfo: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1).max(512),
      candidateId: z.string().min(1).max(80),
      destination: z.string().trim().min(2).max(120).optional(),
      visaType: z.string().trim().min(2).max(120).optional(),
      forceResend: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      let admin;
      try {
        admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      } catch {
        admin = await requireValidAdminSession(input.sessionToken);
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const accountMatch = /^account_(\d+)$/.exec(input.candidateId.trim());
      let candidateId: number | null = null;
      let fullName = "";
      let email = "";
      let destination = input.destination?.trim() || "";
      let visaType = input.visaType?.trim() || "";
      let hasCv = false;
      let referenceLabel = "";
      let evaluationComplete = false;

      if (accountMatch) {
        const id = Number(accountMatch[1]);
        const [account] = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
        if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
        candidateId = account.id;
        fullName = account.fullName;
        email = account.email;
        referenceLabel = accountReference(account.id);
        evaluationComplete = isEvaluationCompleteForJustificatifs({
          evaluationDeclarationStatus: account.evaluationDeclarationStatus,
          evaluationReviewedAt: account.evaluationReviewedAt,
        });
        if (!destination) {
          try {
            const parsed = JSON.parse(account.preferredDestinations || "[]");
            destination = Array.isArray(parsed) && typeof parsed[0] === "string" ? parsed[0] : (account.destination || "");
          } catch {
            destination = account.destination || "";
          }
        }
        if (!visaType) visaType = account.visaType || "";
        const [fileCv] = await db.select({ id: candidateFiles.id }).from(candidateFiles)
          .where(and(eq(candidateFiles.candidateId, account.id), eq(candidateFiles.fileType, "cv")))
          .limit(1);
        const [evalCv] = await db.select({ cvFileUrl: evaluations.cvFileUrl }).from(evaluations)
          .where(sql`LOWER(TRIM(${evaluations.email})) = LOWER(TRIM(${account.email}))`)
          .orderBy(desc(evaluations.createdAt))
          .limit(1);
        hasCv = Boolean(fileCv || evalCv?.cvFileUrl?.trim());
      } else {
        const reference = parseAdminCandidateReference(input.candidateId);
        if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
        if (reference.source === "online") {
          const [app] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
          if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable." });
          fullName = app.fullName;
          email = app.email;
          destination = destination || app.destination || "";
          visaType = visaType || app.visaType || "";
          hasCv = Boolean(app.cvUrl?.trim());
          referenceLabel = app.dossierNumber || `online_${app.id}`;
          const [linked] = await db.select().from(candidates).where(eq(candidates.email, app.email)).limit(1);
          candidateId = linked?.id ?? null;
          evaluationComplete = isEvaluationCompleteForJustificatifs({
            evaluationDeclarationStatus: linked?.evaluationDeclarationStatus,
            evaluationReviewedAt: linked?.evaluationReviewedAt,
            evaluationDeliveryStatus: app.evaluationDeliveryStatus,
            evaluationClientConfirmedAt: app.evaluationClientConfirmedAt,
          });
        } else {
          const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
          if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
          fullName = dossier.fullName;
          email = dossier.email;
          destination = destination || dossier.destination || "";
          visaType = visaType || dossier.visaType || "";
          hasCv = Boolean(dossier.cvFileUrl?.trim() || dossier.cvFileName?.trim());
          referenceLabel = agencyDossierReference(dossier.id);
          const [linked] = await db.select().from(candidates).where(eq(candidates.email, dossier.email)).limit(1);
          candidateId = linked?.id ?? null;
          evaluationComplete = isEvaluationCompleteForJustificatifs({
            evaluationDeclarationStatus: linked?.evaluationDeclarationStatus,
            evaluationReviewedAt: linked?.evaluationReviewedAt,
            evaluationValidatedAt: dossier.evaluationValidatedAt,
          });
        }
      }

      if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "Adresse e-mail candidat introuvable." });
      if (!destination || !visaType) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Destination et type de visa sont requis pour générer la demande d’informations." });
      }

      if (!evaluationComplete) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Les documents justificatifs se demandent après l’évaluation (bilan validé ou envoyé). Finalisez d’abord l’évaluation, puis renvoyez cette demande.",
        });
      }

      if (candidateId && !input.forceResend) {
        const [existing] = await db.select({ id: clientNotifications.id, createdAt: clientNotifications.createdAt }).from(clientNotifications)
          .where(and(eq(clientNotifications.candidateId, candidateId), eq(clientNotifications.type, "registration_info_request")))
          .orderBy(desc(clientNotifications.createdAt))
          .limit(1);
        if (existing) {
          return {
            success: true,
            alreadySent: true,
            emailSent: false,
            itemCount: 0,
            registrationInfoRequestSentAt: existing.createdAt,
            message: "Une demande de documents justificatifs a déjà été envoyée. Utilisez « Renvoyer » pour forcer un nouvel envoi.",
          };
        }
      }

      const request = buildRegistrationInfoRequest({ destination, visaType, hasCv });
      const portalUrl = "/mon-espace?section=documents";
      const plainBody = registrationInfoRequestPlainBody({
        fullName,
        destination: request.destination,
        visaType: request.visaType,
        items: request.items,
        reference: referenceLabel,
      });
      const clientSpaceContent = buildRegistrationInfoClientSpaceContent({
        destination: request.destination,
        visaType: request.visaType,
        reference: referenceLabel,
        body: plainBody,
      });
      const html = registrationInfoRequestEmailHtml({
        fullName,
        destination: request.destination,
        visaType: request.visaType,
        items: request.items,
        portalUrl,
        reference: referenceLabel,
      });

      let emailSent = false;
      try {
        await sendGenericEmail({ to: email, subject: request.subject, html });
        emailSent = true;
      } catch (error) {
        console.error("[registrationInfoRequest] email HTML failed — fallback brandé", error);
        emailSent = await sendClientNotificationEmail({
          to: email,
          fullName,
          title: request.subject.replace(/\s*—\s*3M TRAVEL AGENCY$/i, "").trim() || "Documents justificatifs",
          body: plainBody,
          actionUrl: portalUrl,
          sourceLabel: "3M TRAVEL AGENCY",
        });
      }

      let notificationId = 0;
      if (candidateId) {
        const notificationResult = await db.insert(clientNotifications).values({
          candidateId,
          type: "registration_info_request",
          title: `Documents justificatifs — ${request.destination} · ${request.visaType}`,
          body: `${request.items.length} pièce(s) demandée(s) après évaluation. Consultez Documents dans votre espace.`,
          actionUrl: portalUrl,
          isRead: false,
          emailSentAt: emailSent ? new Date() : null,
        });
        notificationId = Number((notificationResult as any)[0]?.insertId || 0);
        await db.insert(candidateMessages).values({
          candidateId,
          notificationId: notificationId || null,
          senderRole: "advisor",
          content: clientSpaceContent,
          isRead: false,
        });
      }

      await db.insert(paymentAuditLogs).values({
        adminName: admin.email || "Administrateur",
        adminEmail: admin.email || "",
        action: "justificatifs_info_request_sent",
        paymentId: candidateId || 0,
        candidateEmail: email,
        amount: "0",
        details: JSON.stringify({
          destination: request.destination,
          visaType: request.visaType,
          itemCount: request.items.length,
          emailSent,
          forceResend: Boolean(input.forceResend),
          reference: referenceLabel,
          sentBy: admin.email,
        }),
      });

      return {
        success: true,
        alreadySent: false,
        emailSent,
        itemCount: request.items.length,
        requiresCv: evaluationRequiresCv(visaType),
        deliveredToClientSpace: Boolean(candidateId),
        registrationInfoRequestSentAt: new Date(),
        message: emailSent
          ? `Demande professionnelle envoyée (e-mail + espace client, ${request.items.length} pièce(s)).`
          : candidateId
            ? `Demande publiée dans l’espace client (${request.items.length} pièce(s)), mais l’e-mail n’a pas pu partir.`
            : `E-mail ${emailSent ? "envoyé" : "en échec"} — aucun compte lié pour l’espace client.`,
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
