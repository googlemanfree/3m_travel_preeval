import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  adminAccounts,
  agencyDossiers,
  applications,
  candidateFiles,
  candidateMessages,
  candidates,
  consultationRequests,
  contactMessages,
  evaluationEmails,
  evaluations,
  flightBookingRequests,
  insuranceRequests,
  profileEvaluations,
  translationRequests,
  tourismServiceRequests,
} from "../../drizzle/schema";
import { cases, clientNotifications, evaluationBilanVersions, unifiedClientRequestHistory, unifiedClientRequests } from "../../drizzle/caseTrackingSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { generateEvaluationReportHTML } from "../evaluationService";
import { sendEmail } from "../_core/email";
import { createFinalEvaluationPdf } from "../evaluationBilanPdfService";
import { storageGetSignedUrl } from "../storage";
import { evaluationDestinations, generateDestinationEvaluationDraft } from "../services/destinationEvaluationDraft";
import { buildCandidateSpaceAccessUrl } from "../services/candidateAccessLink";
import { richTextToPlainText, sanitizeRichTextHtml } from "../services/richText";
import { appendEvaluationOpenTrackingPixel, buildAdvisorSignatureHtml, escapeHtmlText } from "../services/evaluationEmailCommunication";
import { buildEvaluationReminderEmailHtml, buildEvaluationReminderEmailSubject, type EvaluationReminderLanguage } from "../services/evaluationReminderCommunication";

const sourceTypes = ["application", "evaluation", "consultation", "flight", "insurance", "translation", "contact", "agency_dossier", "tourism"] as const;
const workflowStatuses = ["new", "qualifying", "waiting_customer", "documents_review", "payment_review", "processing", "submitted", "completed", "closed", "rejected"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const evaluationDraftSchema = z.object({
  sourceRecordId: z.number().int().positive(),
  destination: z.enum(evaluationDestinations),
  finalScore: z.number().int().min(0).max(100),
  verdict: z.string().trim().min(2).max(500),
  strengths: z.array(z.string().trim().min(2).max(500)).max(6),
  weaknesses: z.array(z.string().trim().min(2).max(500)).max(6),
  recommendations: z.array(z.string().trim().min(2).max(800)).min(1).max(8),
  message: z.string().trim().max(12000).optional(),
  subject: z.string().trim().min(4).max(255).optional(),
  requiresSecondApproval: z.boolean().default(false),
  language: z.enum(["fr", "en"]).default("fr"),
});

function isProvisionalEvaluationReference(reference: string) {
  return reference.startsWith("EVAL-DRAFT-");
}

function mapCandidateDestination(destination: string | null | undefined): "canada" | "luxembourg" | "pologne" | "europe" | "golfe" | "oceanie" | "caucase" | "autre" {
  if (destination === "canada" || destination === "luxembourg" || destination === "pologne" || destination === "europe" || destination === "golfe" || destination === "oceanie" || destination === "caucase") return destination;
  return "autre";
}

function generateBootstrapEvaluationReference() {
  // applications.dossierNumber est limité à 20 caractères en production.
  return `EVAL-DRAFT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function issueFinalDossierNumber(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, application: { id: number; dossierNumber: string }) {
  if (!isProvisionalEvaluationReference(application.dossierNumber)) return application.dossierNumber;
  const year = new Date().getFullYear();
  const standardNumber = `3M-${year}-${String(application.id).padStart(5, "0")}`;
  const existing = (await db.select({ id: applications.id }).from(applications).where(eq(applications.dossierNumber, standardNumber)).limit(1))[0];
  const dossierNumber = !existing || existing.id === application.id
    ? standardNumber
    : `3M-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
  await db.update(applications).set({ dossierNumber, updatedAt: new Date() }).where(eq(applications.id, application.id));
  await db.update(cases).set({ caseNumber: dossierNumber, updatedAt: new Date() }).where(eq(cases.legacyApplicationId, application.id));
  return dossierNumber;
}

async function resolveEvaluationApplication(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, sourceRecordId: number) {
  const [directApplication] = await db.select().from(applications).where(eq(applications.id, sourceRecordId)).limit(1);
  if (directApplication) return directApplication;

  // The admin dossier list also exposes account-only candidates with their candidate ID.
  // Resolve that ID to the newest linked application before trying legacy evaluation IDs.
  const [candidateAccount] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, sourceRecordId)).limit(1);
  if (candidateAccount) {
    const [accountApplication] = await db.select().from(applications).where(eq(applications.candidateId, candidateAccount.id)).orderBy(desc(applications.createdAt)).limit(1);
    if (accountApplication) return accountApplication;
  }

  const [sourceEvaluation] = await db.select({ candidateId: evaluations.candidateId, email: evaluations.email, fullName: evaluations.fullName }).from(evaluations).where(eq(evaluations.id, sourceRecordId)).limit(1);
  if (!sourceEvaluation) return null;
  const applicationWhere = sourceEvaluation.candidateId
    ? eq(applications.candidateId, sourceEvaluation.candidateId)
    : and(eq(applications.email, sourceEvaluation.email), eq(applications.fullName, sourceEvaluation.fullName));
  const [linkedApplication] = await db.select().from(applications).where(applicationWhere).orderBy(desc(applications.createdAt)).limit(1);
  return linkedApplication ?? null;
}

type SourceType = typeof sourceTypes[number];
type WorkflowStatus = typeof workflowStatuses[number];

type SourceSnapshot = {
  sourceType: SourceType;
  sourceRecordId: number;
  candidateId: number | null;
  displayReference: string;
  fullName: string;
  email: string;
  phone: string | null;
  destination: string | null;
  requestTypeLabel: string;
  sourceStatus: string;
  evaluationApprovalStatus: "not_required" | "pending" | "approved" | "rejected" | null;
  evaluationDeliveryStatus: string | null;
  evaluationReportViewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

 type UnifiedDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function loadLegacyProfileEvaluations(db: UnifiedDb) {
  try {
    return await db.select().from(profileEvaluations).orderBy(desc(profileEvaluations.createdAt)).limit(200);
  } catch (error) {
    console.warn("[UnifiedRequests] Legacy profile_evaluations unavailable; continuing with primary sources.", error instanceof Error ? error.message : String(error));
    return [];
  }
}

async function loadLegacyProfileEvaluationsForEmail(db: UnifiedDb, email: string) {
  try {
    return await db.select({ id: profileEvaluations.id, destination: profileEvaluations.destination, projectType: profileEvaluations.projectType, status: profileEvaluations.status, scoringTotal: profileEvaluations.scoringTotal, createdAt: profileEvaluations.createdAt }).from(profileEvaluations).where(eq(profileEvaluations.email, email)).orderBy(desc(profileEvaluations.createdAt)).limit(20);
  } catch (error) {
    console.warn("[UnifiedRequests] Legacy profile_evaluations unavailable for Customer 360; continuing without legacy evaluations.", error instanceof Error ? error.message : String(error));
    return [];
  }
}

export function inferUnifiedWorkflow(sourceType: SourceType, status: string): WorkflowStatus {
  const normalized = status.toLowerCase();
  if (normalized.includes("rejected") || normalized.includes("cancelled") || normalized === "refuse") return "rejected";
  if (normalized.includes("completed") || normalized.includes("issued") || normalized.includes("approved") || normalized.includes("visa_approuve")) return "completed";
  if (normalized === "bilan_envoye") return "processing";
  if (normalized.includes("payment") || normalized === "paye") return "payment_review";
  if (normalized.includes("document")) return "documents_review";
  if (normalized.includes("submitted") || normalized.includes("soumis")) return "submitted";
  if (normalized.includes("progress") || normalized.includes("assigned") || normalized.includes("review")) return "processing";
  if (sourceType === "contact") return "qualifying";
  return "new";
}

function workflowLabel(status: WorkflowStatus) {
  return {
    new: "Nouvelle demande",
    qualifying: "À qualifier",
    waiting_customer: "En attente du client",
    documents_review: "Documents à vérifier",
    payment_review: "Paiement à vérifier",
    processing: "En traitement",
    submitted: "Transmise",
    completed: "Terminée",
    closed: "Clôturée",
    rejected: "Rejetée",
  }[status];
}

export function getUnifiedSlaState(request: { workflowStatus: WorkflowStatus; firstRespondedAt: Date | null; lastActivityAt: Date; dueAt: Date | null; createdAt: Date }) {
  if (["completed", "closed", "rejected"].includes(request.workflowStatus)) return "closed" as const;
  const now = Date.now();
  const firstReference = request.createdAt.getTime();
  const inactivityHours = (now - request.lastActivityAt.getTime()) / 3_600_000;
  if (!request.firstRespondedAt && now - firstReference > 24 * 3_600_000) return "overdue" as const;
  if (request.dueAt && request.dueAt.getTime() < now) return "overdue" as const;
  if (!request.firstRespondedAt || inactivityHours > 36) return "warning" as const;
  return "on_track" as const;
}

export function canDeliverEvaluation(requiresSecondApproval: boolean, approvalStatus: string, advisorValidated = false): boolean {
  return advisorValidated && (!requiresSecondApproval || approvalStatus === "approved");
}

type EvaluationReviewCandidate = {
  adminAssignedTo: string | null;
  evaluationScheduledAt: Date | null;
  createdAt?: Date;
  updatedAt: Date;
  scoringDetails: string | null;
  evaluationDeliveryStatus: string;
  dossierStatus: string;
};

export function selectEvaluationReviewsForAdvisorToday<T extends EvaluationReviewCandidate>(applicationsToReview: T[], advisor: { email: string; fullName: string }, now = new Date(), filter: "all" | "without_evaluation" = "all"): Array<T & { advisorValidated: boolean; reviewDeadline: Date; reviewOverdue: boolean }> {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  return applicationsToReview.map((application) => {
    let details: Record<string, unknown> = {};
    try { details = JSON.parse(application.scoringDetails || "{}"); } catch { details = {}; }
    const draft = details.adminDraft && typeof details.adminDraft === "object" ? details.adminDraft as Record<string, unknown> : {};
    const advisorValidated = draft.advisorValidated === true;
    const belongsToAdvisor = !application.adminAssignedTo || application.adminAssignedTo === advisor.email || application.adminAssignedTo === advisor.fullName;
    const reviewDeadline = new Date((application.createdAt ?? application.updatedAt).getTime() + 8 * 60 * 60 * 1000);
    const reviewOverdue = !advisorValidated && reviewDeadline <= now;
    const relevantToday = Boolean((application.evaluationScheduledAt && application.evaluationScheduledAt <= end) || (application.updatedAt >= start && application.updatedAt <= end) || reviewOverdue);
    return { ...application, advisorValidated, belongsToAdvisor, relevantToday, hasDraft: Boolean(draft.verdict), reviewDeadline, reviewOverdue };
  }).filter((application) => application.belongsToAdvisor && application.evaluationDeliveryStatus === "draft" && ["nouveau", "en_evaluation"].includes(application.dossierStatus) && !application.advisorValidated && application.relevantToday && (filter === "all" || !application.hasDraft)).map(({ belongsToAdvisor: _belongsToAdvisor, relevantToday: _relevantToday, ...application }) => application as T & { advisorValidated: boolean; reviewDeadline: Date; reviewOverdue: boolean; hasDraft: boolean });
}

export function calculateAdvisorWorkload(
  advisors: Array<{ id: number; fullName: string; email: string }>,
  activeRows: Array<{ assignedAdminAccountId: number | null; priority: string; workflowStatus: string; dueAt: Date | null }>,
  now = new Date(),
) {
  return advisors.map((advisor) => {
    const assigned = activeRows.filter((row) => row.assignedAdminAccountId === advisor.id);
    const overdue = assigned.filter((row) => Boolean(row.dueAt && row.dueAt < now));
    const blocked = assigned.filter((row) => ["waiting_customer", "documents_review", "payment_review"].includes(row.workflowStatus));
    const urgent = assigned.filter((row) => row.priority === "urgent" || row.priority === "high");
    return { ...advisor, total: assigned.length, urgent: urgent.length, overdue: overdue.length, blocked: blocked.length };
  });
}

async function loadSourceSnapshots(): Promise<SourceSnapshot[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

  const [apps, evaluations, consultations, flights, insurances, translations, contacts, agency, tourism] = await Promise.all([
    db.select().from(applications).orderBy(desc(applications.createdAt)).limit(200),
    loadLegacyProfileEvaluations(db),
    db.select().from(consultationRequests).orderBy(desc(consultationRequests.createdAt)).limit(200),
    db.select().from(flightBookingRequests).orderBy(desc(flightBookingRequests.createdAt)).limit(200),
    db.select().from(insuranceRequests).orderBy(desc(insuranceRequests.createdAt)).limit(200),
    db.select().from(translationRequests).orderBy(desc(translationRequests.createdAt)).limit(200),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200),
    db.select().from(agencyDossiers).orderBy(desc(agencyDossiers.createdAt)).limit(200),
    db.select().from(tourismServiceRequests).orderBy(desc(tourismServiceRequests.createdAt)).limit(200),
  ]);

  const firstContactBySession = new Set<string>();
  const contactSnapshots: SourceSnapshot[] = [];
  for (const contact of contacts) {
    if (contact.senderRole !== "visitor" || firstContactBySession.has(contact.sessionId)) continue;
    firstContactBySession.add(contact.sessionId);
    contactSnapshots.push({
      sourceType: "contact", sourceRecordId: contact.id, candidateId: null,
      displayReference: `MSG-${contact.id}`, fullName: contact.visitorName, email: contact.visitorEmail,
      phone: contact.visitorPhone ?? null, destination: null, requestTypeLabel: "Contact / messagerie",
      sourceStatus: "new", evaluationApprovalStatus: null, evaluationDeliveryStatus: null, evaluationReportViewedAt: null, createdAt: contact.createdAt, updatedAt: contact.createdAt,
    });
  }

  return [
    ...apps.map((row) => ({ sourceType: "application" as const, sourceRecordId: row.id, candidateId: row.candidateId, displayReference: row.dossierNumber, fullName: row.fullName, email: row.email, phone: row.whatsappNumber ?? null, destination: row.destination, requestTypeLabel: "Ouverture de dossier", sourceStatus: row.dossierStatus, evaluationApprovalStatus: row.evaluationApprovalStatus, evaluationDeliveryStatus: row.evaluationDeliveryStatus, evaluationReportViewedAt: row.evaluationReportViewedAt, createdAt: row.createdAt, updatedAt: row.updatedAt })),
    ...evaluations.map((row) => ({ sourceType: "evaluation" as const, sourceRecordId: row.id, candidateId: null, displayReference: `EVAL-${row.id}`, fullName: row.fullName, email: row.email, phone: row.whatsappPhone ?? null, destination: row.destination, requestTypeLabel: "Évaluation de profil", sourceStatus: row.status, evaluationApprovalStatus: null, evaluationDeliveryStatus: null, evaluationReportViewedAt: null, createdAt: row.createdAt, updatedAt: row.updatedAt })),
    ...consultations.map((row) => ({ sourceType: "consultation" as const, sourceRecordId: row.id, candidateId: null, displayReference: `CONS-${row.id}`, fullName: row.fullName, email: row.email, phone: row.phone ?? null, destination: row.targetCountry ?? null, requestTypeLabel: "Consultation", sourceStatus: row.status, evaluationApprovalStatus: null, evaluationDeliveryStatus: null, evaluationReportViewedAt: null, createdAt: row.createdAt, updatedAt: row.createdAt })),
    ...flights.map((row) => ({ sourceType: "flight" as const, sourceRecordId: row.id, candidateId: row.candidateId, displayReference: row.requestRef, fullName: "Client réservation de vol", email: row.candidateEmail, phone: row.candidatePhone ?? null, destination: null, requestTypeLabel: "Réservation de vol", sourceStatus: row.status, evaluationApprovalStatus: null, evaluationDeliveryStatus: null, evaluationReportViewedAt: null, createdAt: row.createdAt, updatedAt: row.updatedAt })),
    ...insurances.map((row) => ({ sourceType: "insurance" as const, sourceRecordId: row.id, candidateId: null, displayReference: row.reference, fullName: row.fullName, email: row.email, phone: row.phone, destination: row.destinationCountry, requestTypeLabel: "Assurance voyage", sourceStatus: row.status, evaluationApprovalStatus: null, evaluationDeliveryStatus: null, evaluationReportViewedAt: null, createdAt: row.createdAt, updatedAt: row.updatedAt })),
    ...translations.map((row) => ({ sourceType: "translation" as const, sourceRecordId: row.id, candidateId: null, displayReference: row.invoiceNumber || `TRAD-${row.id}`, fullName: row.candidateName, email: row.candidateEmail, phone: row.candidatePhone ?? null, destination: null, requestTypeLabel: "Traduction certifiée", sourceStatus: row.status, evaluationApprovalStatus: null, evaluationDeliveryStatus: null, evaluationReportViewedAt: null, createdAt: row.createdAt, updatedAt: row.updatedAt })),
    ...contactSnapshots,
    ...agency.map((row) => ({ sourceType: "agency_dossier" as const, sourceRecordId: row.id, candidateId: null, displayReference: `3M-AGN-${row.id.toString().padStart(4, "0")}`, fullName: row.fullName, email: row.email, phone: row.phone ?? null, destination: row.destination ?? null, requestTypeLabel: "Dossier ouvert en agence", sourceStatus: row.status, evaluationApprovalStatus: null, evaluationDeliveryStatus: null, evaluationReportViewedAt: null, createdAt: row.createdAt, updatedAt: row.updatedAt })),
    ...tourism.map((row) => ({ sourceType: "tourism" as const, sourceRecordId: row.id, candidateId: null, displayReference: row.reference, fullName: row.fullName, email: row.email, phone: row.phone ?? null, destination: row.destination ?? null, requestTypeLabel: "Tourisme & Devis", sourceStatus: row.status, evaluationApprovalStatus: null, evaluationDeliveryStatus: null, evaluationReportViewedAt: null, createdAt: row.createdAt, updatedAt: row.updatedAt })),
  ];
}

async function ensureManagedRequest(source: SourceSnapshot) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  const existing = (await db.select().from(unifiedClientRequests).where(and(eq(unifiedClientRequests.sourceType, source.sourceType), eq(unifiedClientRequests.sourceRecordId, source.sourceRecordId))).limit(1))[0];
  if (existing) return existing;
  await db.insert(unifiedClientRequests).values({
    sourceType: source.sourceType,
    sourceRecordId: source.sourceRecordId,
    candidateId: source.candidateId,
    displayReference: source.displayReference,
    fullName: source.fullName,
    email: source.email,
    phone: source.phone,
    destination: source.destination,
    requestTypeLabel: source.requestTypeLabel,
    workflowStatus: inferUnifiedWorkflow(source.sourceType, source.sourceStatus),
    dueAt: new Date(source.createdAt.getTime() + 24 * 3_600_000),
    lastActivityAt: source.updatedAt,
  });
  const created = (await db.select().from(unifiedClientRequests).where(and(eq(unifiedClientRequests.sourceType, source.sourceType), eq(unifiedClientRequests.sourceRecordId, source.sourceRecordId))).limit(1))[0];
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de créer le suivi de la demande." });
  await db.insert(unifiedClientRequestHistory).values({ requestId: created.id, actionType: "request_registered", newValue: created.workflowStatus, comment: "Demande intégrée dans la boîte de réception unifiée." });
  return created;
}

const sessionInput = z.object({ sessionToken: z.string().min(20) });
const evaluationQueueInput = sessionInput.extend({ filter: z.enum(["all", "without_evaluation"]).default("all") });

export const unifiedRequestsRouter = router({
  list: publicProcedure
    .input(sessionInput.extend({ search: z.string().trim().max(120).optional(), sourceType: z.enum(sourceTypes).optional(), workflowStatus: z.enum(workflowStatuses).optional(), assigneeId: z.number().int().positive().optional(), sla: z.enum(["on_track", "warning", "overdue"]).optional(), approvalStatus: z.enum(["not_required", "pending", "approved", "rejected"]).optional() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [sources, managed, advisors] = await Promise.all([
        loadSourceSnapshots(),
        db.select().from(unifiedClientRequests).orderBy(desc(unifiedClientRequests.lastActivityAt)).limit(2000),
        db.select({ id: adminAccounts.id, fullName: adminAccounts.fullName, email: adminAccounts.email }).from(adminAccounts).where(eq(adminAccounts.status, "active")).orderBy(adminAccounts.fullName),
      ]);
      const managedByKey = new Map(managed.map((row) => [`${row.sourceType}:${row.sourceRecordId}`, row]));
      const advisorById = new Map(advisors.map((row) => [row.id, row]));
      const rows = sources.map((source) => {
        const management = managedByKey.get(`${source.sourceType}:${source.sourceRecordId}`);
        const workflowStatus = management?.workflowStatus ?? inferUnifiedWorkflow(source.sourceType, source.sourceStatus);
        const effective = management ?? { workflowStatus, priority: "normal" as const, assignedAdminAccountId: null, firstRespondedAt: null, dueAt: new Date(source.createdAt.getTime() + 24 * 3_600_000), lastActivityAt: source.updatedAt, createdAt: source.createdAt };
        const assigned = effective.assignedAdminAccountId ? advisorById.get(effective.assignedAdminAccountId) : null;
        return { ...source, managedRequestId: management?.id ?? null, workflowStatus, workflowLabel: workflowLabel(workflowStatus), priority: effective.priority, assignedAdminAccountId: effective.assignedAdminAccountId, assignedAdvisor: assigned ? { id: assigned.id, fullName: assigned.fullName, email: assigned.email } : null, sla: getUnifiedSlaState({ ...effective, workflowStatus }), dueAt: effective.dueAt, lastActivityAt: effective.lastActivityAt };
      }).filter((row) => {
        const haystack = `${row.fullName} ${row.email} ${row.displayReference} ${row.destination ?? ""} ${row.requestTypeLabel}`.toLowerCase();
        return (!input.search || haystack.includes(input.search.toLowerCase())) &&
          (!input.sourceType || row.sourceType === input.sourceType) &&
          (!input.workflowStatus || row.workflowStatus === input.workflowStatus) &&
          (!input.assigneeId || row.assignedAdminAccountId === input.assigneeId) &&
          (!input.sla || row.sla === input.sla) &&
          (!input.approvalStatus || row.evaluationApprovalStatus === input.approvalStatus);
      }).sort((left, right) => new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime());
      return { rows, advisors, total: rows.length };
    }),

  assign: publicProcedure
    .input(sessionInput.extend({ sourceType: z.enum(sourceTypes), sourceRecordId: z.number().int().positive(), assignedAdminAccountId: z.number().int().positive().nullable(), priority: z.enum(priorities).optional(), dueAt: z.date().optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === input.sourceType && item.sourceRecordId === input.sourceRecordId);
      if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Demande source introuvable." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      if (input.assignedAdminAccountId) {
        const advisor = (await db.select().from(adminAccounts).where(and(eq(adminAccounts.id, input.assignedAdminAccountId), eq(adminAccounts.status, "active"))).limit(1))[0];
        if (!advisor) throw new TRPCError({ code: "BAD_REQUEST", message: "Conseiller indisponible." });
      }
      const request = await ensureManagedRequest(source);
      const firstResponse = request.firstRespondedAt ?? (input.assignedAdminAccountId ? new Date() : null);
      await db.update(unifiedClientRequests).set({ assignedAdminAccountId: input.assignedAdminAccountId, ...(input.priority ? { priority: input.priority } : {}), ...(input.dueAt ? { dueAt: input.dueAt } : {}), firstRespondedAt: firstResponse, lastActivityAt: new Date() }).where(eq(unifiedClientRequests.id, request.id));
      await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "assignment", previousValue: request.assignedAdminAccountId ? String(request.assignedAdminAccountId) : null, newValue: input.assignedAdminAccountId ? String(input.assignedAdminAccountId) : "unassigned", actorAdminAccountId: admin.id, comment: input.priority ? `Priorité définie : ${input.priority}` : "Attribution mise à jour." });
      return { success: true };
    }),

  bulkAssign: publicProcedure
    .input(sessionInput.extend({ items: z.array(z.object({ sourceType: z.enum(sourceTypes), sourceRecordId: z.number().int().positive() })).min(1).max(100), assignedAdminAccountId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const advisor = (await db.select().from(adminAccounts).where(and(eq(adminAccounts.id, input.assignedAdminAccountId), eq(adminAccounts.status, "active"))).limit(1))[0];
      if (!advisor) throw new TRPCError({ code: "BAD_REQUEST", message: "Conseiller indisponible." });
      const sources = await loadSourceSnapshots();
      let updated = 0;
      for (const item of input.items) {
        const source = sources.find((record) => record.sourceType === item.sourceType && record.sourceRecordId === item.sourceRecordId);
        if (!source) continue;
        const request = await ensureManagedRequest(source);
        await db.update(unifiedClientRequests).set({ assignedAdminAccountId: advisor.id, firstRespondedAt: request.firstRespondedAt ?? new Date(), lastActivityAt: new Date() }).where(eq(unifiedClientRequests.id, request.id));
        await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "bulk_assignment", previousValue: request.assignedAdminAccountId ? String(request.assignedAdminAccountId) : null, newValue: String(advisor.id), comment: `Réattribution groupée vers ${advisor.fullName}.`, actorAdminAccountId: admin.id });
        updated++;
      }
      return { success: true, updated, advisor: advisor.fullName };
    }),

  updateWorkflow: publicProcedure
    .input(sessionInput.extend({ sourceType: z.enum(sourceTypes), sourceRecordId: z.number().int().positive(), workflowStatus: z.enum(workflowStatuses), comment: z.string().trim().max(2000).optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      if (["waiting_customer", "rejected"].includes(input.workflowStatus) && !input.comment) throw new TRPCError({ code: "BAD_REQUEST", message: "Un commentaire est requis pour ce statut." });
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === input.sourceType && item.sourceRecordId === input.sourceRecordId);
      if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Demande source introuvable." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const request = await ensureManagedRequest(source);
      const now = new Date();
      await db.update(unifiedClientRequests).set({ workflowStatus: input.workflowStatus, firstRespondedAt: request.firstRespondedAt ?? now, lastActivityAt: now, closedAt: ["completed", "closed", "rejected"].includes(input.workflowStatus) ? now : null }).where(eq(unifiedClientRequests.id, request.id));
      await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "workflow_status", previousValue: request.workflowStatus, newValue: input.workflowStatus, comment: input.comment, actorAdminAccountId: admin.id });
      return { success: true, workflowLabel: workflowLabel(input.workflowStatus) };
    }),

  addInternalComment: publicProcedure
    .input(sessionInput.extend({ sourceType: z.enum(sourceTypes), sourceRecordId: z.number().int().positive(), comment: z.string().trim().min(2).max(2000) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === input.sourceType && item.sourceRecordId === input.sourceRecordId);
      if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Demande source introuvable." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const request = await ensureManagedRequest(source);
      await db.update(unifiedClientRequests).set({ lastActivityAt: new Date(), firstRespondedAt: request.firstRespondedAt ?? new Date() }).where(eq(unifiedClientRequests.id, request.id));
      await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "internal_comment", comment: input.comment, actorAdminAccountId: admin.id });
      return { success: true };
    }),

  initializeEvaluationDelivery: publicProcedure
    .input(sessionInput.extend({ candidateId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });

      const [existing] = await db.select().from(applications).where(eq(applications.candidateId, candidate.id)).orderBy(desc(applications.createdAt)).limit(1);
      if (existing) return { success: true, created: false, candidateId: candidate.id, application: existing, message: "Le dossier d’évaluation provisoire existe déjà." };

      let dossierNumber = generateBootstrapEvaluationReference();
      while ((await db.select({ id: applications.id }).from(applications).where(eq(applications.dossierNumber, dossierNumber)).limit(1)).length) {
        dossierNumber = generateBootstrapEvaluationReference();
      }
      const destination = mapCandidateDestination(candidate.destination);
      const draftDestination = destination === "autre" ? "europe" : destination;
      const initialDraft = {
        destination: draftDestination,
        finalScore: 0,
        verdict: "",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        language: candidate.preferredLanguage === "en" ? "en" : "fr",
        advisorValidated: false,
        advisorValidatedAt: null,
        advisorValidatedByAdminId: null,
      };
      await db.insert(applications).values({
        dossierNumber,
        candidateId: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        whatsappNumber: candidate.phone || "Non renseigné",
        nationality: candidate.nationality || null,
        academicLevel: candidate.educationLevel || null,
        languageSkills: candidate.languageLevel || null,
        destination,
        formulaChosen: "integral",
        visaType: candidate.visaType || "À qualifier",
        dossierStatus: "nouveau",
        paymentStatus: "PENDING",
        paymentAmount: 0,
        paymentCurrency: "XAF",
        scoringTotal: 0,
        scoringDetails: JSON.stringify({ bootstrapSource: "candidate_pre_dossier", adminDraft: initialDraft }),
        evaluationDeliveryStatus: "draft",
        evaluationRequiresSecondApproval: false,
        evaluationApprovalStatus: "not_required",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const [application] = await db.select().from(applications).where(eq(applications.dossierNumber, dossierNumber)).limit(1);
      if (!application) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le dossier provisoire n’a pas pu être initialisé." });
      return { success: true, created: true, candidateId: candidate.id, application, message: "Dossier d’évaluation provisoire initialisé sans activer le dossier client." };
    }),

  getEvaluationDelivery: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      let details: Record<string, any> = {};
      try { details = JSON.parse(application.scoringDetails || "{}"); } catch { details = {}; }
      const adminDraft = details.adminDraft ?? {};
      const rawVersions = await db.select({ id: evaluationBilanVersions.id, versionNumber: evaluationBilanVersions.versionNumber, contentJson: evaluationBilanVersions.contentJson, approvalStatus: evaluationBilanVersions.approvalStatus, requiresSecondApproval: evaluationBilanVersions.requiresSecondApproval, approvalComment: evaluationBilanVersions.approvalComment, createdByAdminAccountId: evaluationBilanVersions.createdByAdminAccountId, createdAt: evaluationBilanVersions.createdAt, approvedAt: evaluationBilanVersions.approvedAt, sentAt: evaluationBilanVersions.sentAt, pdfKey: evaluationBilanVersions.pdfKey }).from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, application.id)).orderBy(desc(evaluationBilanVersions.versionNumber)).limit(30);
      const versions = await Promise.all(rawVersions.map(async (version) => ({ ...version, pdfUrl: version.pdfKey ? await storageGetSignedUrl(version.pdfKey) : null })));
      return { application, versions, draft: { destination: adminDraft.destination ?? application.destination ?? "europe", modelLabel: adminDraft.modelLabel ?? null, criteria: adminDraft.criteria ?? null, finalScore: adminDraft.finalScore ?? application.scoringTotal ?? 0, verdict: adminDraft.verdict ?? "", profileSummary: adminDraft.profileSummary ?? "", strengths: Array.isArray(adminDraft.strengths) ? adminDraft.strengths : [], weaknesses: Array.isArray(adminDraft.weaknesses) ? adminDraft.weaknesses : [], recommendations: Array.isArray(adminDraft.recommendations) ? adminDraft.recommendations : [], informationToVerify: Array.isArray(adminDraft.informationToVerify) ? adminDraft.informationToVerify : [], nextAdminAction: adminDraft.nextAdminAction ?? "", message: application.evaluationDeliveryMessage ?? "", language: adminDraft.language === "en" ? "en" : "fr", subject: application.evaluationDeliverySubject ?? (isProvisionalEvaluationReference(application.dossierNumber) ? "Votre bilan d'évaluation 3M Travel" : `Votre Bilan d'Évaluation - Dossier N° ${application.dossierNumber}`), requiresSecondApproval: application.evaluationRequiresSecondApproval, advisorValidated: adminDraft.advisorValidated === true, advisorValidatedAt: adminDraft.advisorValidatedAt ?? null, advisorValidatedByAdminId: adminDraft.advisorValidatedByAdminId ?? null } };
    }),

  previewEvaluationDeliveryEmail: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      const candidateSpaceUrl = buildCandidateSpaceAccessUrl(application.dossierNumber);
      const messageHtml = application.evaluationDeliveryMessage ? sanitizeRichTextHtml(application.evaluationDeliveryMessage) : "";
      const html = `${messageHtml ? `<section style="margin-bottom:24px">${messageHtml}</section>` : ""}${generateEvaluationReportHTML(application)}<p style="margin-top:24px">Votre bilan finalisé est également disponible au format PDF dans votre <a href="${candidateSpaceUrl}">Espace client sécurisé</a>.</p><p style="font-size:13px;color:#64748b">Connectez-vous avec l’adresse e-mail associée à votre dossier pour consulter les pièces demandées, les échanges et les prochaines étapes.</p>${buildAdvisorSignatureHtml(application.adminAssignedTo || admin.fullName)}`;
      return {
        recipient: application.email,
        subject: application.evaluationDeliverySubject || `Votre Bilan d'Évaluation - Dossier N° ${application.dossierNumber}`,
        html,
        attachmentLabel: `Bilan d’évaluation — dossier ${application.dossierNumber}.pdf`,
        requiresManualValidation: true,
      };
    }),

  previewEvaluationDeliveryPdf: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      let details: Record<string, any> = {};
      try { details = JSON.parse(application.scoringDetails || "{}"); } catch { details = {}; }
      const draft = details.adminDraft ?? {};
      if (!draft.verdict || !Array.isArray(draft.recommendations) || !draft.recommendations.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Enregistrez un bilan complet avant de générer l’aperçu PDF." });
      const versions = await db.select({ versionNumber: evaluationBilanVersions.versionNumber, createdAt: evaluationBilanVersions.createdAt, createdByAdminAccountId: evaluationBilanVersions.createdByAdminAccountId, approvalStatus: evaluationBilanVersions.approvalStatus }).from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, application.id)).orderBy(desc(evaluationBilanVersions.versionNumber)).limit(30);
      const versionNumber = versions[0]?.versionNumber ?? 1;
      const pdf = await createFinalEvaluationPdf(application, versionNumber, versions);
      return { url: pdf.url, key: pdf.key, fileName: `bilan-${application.dossierNumber}-v${versionNumber}.pdf`, versionNumber, requiresManualValidation: true };
    }),

  sendEvaluationTestEmail: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive(), testEmail: z.string().trim().email().max(320) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [applicationRows, internalRecipientRows] = await Promise.all([
        db.select().from(applications).where(eq(applications.id, input.sourceRecordId)).limit(1),
        db.select().from(adminAccounts).where(and(eq(adminAccounts.email, input.testEmail), eq(adminAccounts.status, "active"))).limit(1),
      ]);
      const application = applicationRows[0];
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable." });
      if (!internalRecipientRows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "L’adresse de test doit appartenir à un administrateur interne actif." });
      const candidateSpaceUrl = buildCandidateSpaceAccessUrl(application.dossierNumber);
      const messageHtml = application.evaluationDeliveryMessage ? sanitizeRichTextHtml(application.evaluationDeliveryMessage) : "";
      const html = `<div style="border:2px solid #f59e0b;background:#fffbeb;padding:12px;margin-bottom:20px;font-family:Arial,sans-serif"><strong>TEST INTERNE — NE PAS DIFFUSER AU CLIENT</strong><br/>Prévisualisation du bilan destiné à ${escapeHtmlText(application.fullName)} (${escapeHtmlText(application.email)}).</div>${messageHtml ? `<section style="margin-bottom:24px">${messageHtml}</section>` : ""}${generateEvaluationReportHTML(application)}<p style="margin-top:24px">Le bilan final sera disponible dans l’<a href="${candidateSpaceUrl}">Espace client sécurisé</a>.</p>${buildAdvisorSignatureHtml(application.adminAssignedTo || admin.fullName)}`;
      await sendEmail({ to: input.testEmail, subject: `[TEST INTERNE] ${application.evaluationDeliverySubject || `Bilan d’évaluation — Dossier ${application.dossierNumber}`}`, html });
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === "application" && item.sourceRecordId === application.id);
      if (source) {
        const request = await ensureManagedRequest(source);
        await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "evaluation_email_test_sent", comment: `E-mail de test envoyé à l’adresse interne ${input.testEmail}. Aucun envoi candidat n’a été déclenché.`, actorAdminAccountId: admin.id });
      }
      return { success: true, message: `E-mail de test envoyé à ${input.testEmail}. Le client n’a pas été notifié.` };
    }),

  generateDestinationEvaluationDraft: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive(), destination: z.enum(evaluationDestinations) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      if (application.evaluationDeliveryStatus === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Le bilan envoyé ne peut plus être régénéré." });
      const generated = await generateDestinationEvaluationDraft(application, input.destination);
      let details: Record<string, unknown> = {};
      try { details = JSON.parse(application.scoringDetails || "{}"); } catch { details = {}; }
      const adminDraft = { ...generated, advisorValidated: false, advisorValidatedAt: null, advisorValidatedByAdminId: null };
      const nextDetails = { ...details, adminDraft };
      const nextApplication = { ...application, destination: input.destination, scoringDetails: JSON.stringify(nextDetails), scoringTotal: generated.finalScore };
      const latest = (await db.select({ versionNumber: evaluationBilanVersions.versionNumber }).from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, application.id)).orderBy(desc(evaluationBilanVersions.versionNumber)).limit(1))[0];
      const versionNumber = (latest?.versionNumber ?? 0) + 1;
      const reportHtml = generateEvaluationReportHTML(nextApplication);
      await db.update(applications).set({ destination: input.destination, scoringDetails: nextApplication.scoringDetails, scoringTotal: generated.finalScore, scoringBadge: generated.finalScore >= 80 ? "eligible" : generated.finalScore >= 60 ? "admissible" : "faible", evaluationDeliveryStatus: "draft", evaluationScheduledAt: null, updatedAt: new Date() }).where(eq(applications.id, application.id));
      await db.insert(evaluationBilanVersions).values({ applicationId: application.id, versionNumber, contentJson: JSON.stringify({ adminDraft }), reportHtml, createdByAdminAccountId: admin.id, requiresSecondApproval: application.evaluationRequiresSecondApproval, approvalStatus: "draft" });
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === "application" && item.sourceRecordId === application.id);
      if (source) { const request = await ensureManagedRequest(source); await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "evaluation_ai_draft_generated", comment: `Brouillon IA ${generated.modelLabel} généré pour contrôle obligatoire.`, actorAdminAccountId: admin.id }); }
      return { success: true, draft: adminDraft, reportHtml, versionNumber, message: "Brouillon IA généré. Un conseiller doit le vérifier, le modifier si nécessaire puis le valider avant diffusion." };
    }),

  saveEvaluationDeliveryDraft: publicProcedure
    .input(sessionInput.extend(evaluationDraftSchema.shape))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      if (application.evaluationDeliveryStatus === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Le bilan a déjà été envoyé et ne peut plus être modifié." });
      let details: Record<string, unknown> = {};
      try { details = JSON.parse(application.scoringDetails || "{}"); } catch { details = {}; }
      const previousDraft = (details.adminDraft && typeof details.adminDraft === "object" ? details.adminDraft : {}) as Record<string, unknown>;
      const nextDraft = { ...previousDraft, destination: input.destination, finalScore: input.finalScore, verdict: input.verdict, strengths: input.strengths, weaknesses: input.weaknesses, recommendations: input.recommendations, language: input.language, advisorValidated: false, advisorValidatedAt: null, advisorValidatedByAdminId: null };
      const nextDetails = { ...details, adminDraft: nextDraft };
      const messageHtml = input.message ? sanitizeRichTextHtml(input.message) : null;
      const messagePlainText = messageHtml ? richTextToPlainText(messageHtml) : "";
      if (input.message && messagePlainText.length < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "Le message d’accompagnement doit contenir au moins trois caractères lisibles." });
      const updatedApplication = { ...application, destination: input.destination, scoringDetails: JSON.stringify(nextDetails), scoringTotal: input.finalScore, evaluationDeliveryMessage: messageHtml || null, evaluationDeliverySubject: input.subject || null };
      const scoreBadge = input.finalScore >= 80 ? "eligible" : input.finalScore >= 60 ? "admissible" : "faible";
      const latestVersion = (await db.select({ versionNumber: evaluationBilanVersions.versionNumber }).from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, application.id)).orderBy(desc(evaluationBilanVersions.versionNumber)).limit(1))[0];
      const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;
      const approvalStatus = input.requiresSecondApproval ? "pending" : "not_required" as const;
      const reportHtml = generateEvaluationReportHTML(updatedApplication);
      await db.update(applications).set({ destination: input.destination, scoringDetails: updatedApplication.scoringDetails, scoringTotal: input.finalScore, scoringBadge: scoreBadge, evaluationDeliveryMessage: messageHtml || null, evaluationDeliverySubject: input.subject || null, evaluationDeliveryStatus: "draft", evaluationScheduledAt: null, evaluationRequiresSecondApproval: input.requiresSecondApproval, evaluationApprovalStatus: approvalStatus, evaluationApprovedAt: null, evaluationApprovedByAdminId: null, updatedAt: new Date() }).where(eq(applications.id, application.id));
      await db.insert(evaluationBilanVersions).values({ applicationId: application.id, versionNumber, contentJson: JSON.stringify({ adminDraft: nextDraft, subject: input.subject || null, message: messageHtml || null, messagePlainText: messagePlainText || null }), reportHtml, createdByAdminAccountId: admin.id, requiresSecondApproval: input.requiresSecondApproval, approvalStatus: input.requiresSecondApproval ? "pending" : "draft" });
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === "application" && item.sourceRecordId === application.id);
      if (source) { const request = await ensureManagedRequest(source); await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "evaluation_draft_saved", comment: `Version ${versionNumber} du bilan enregistrée${input.requiresSecondApproval ? " et soumise à une seconde approbation" : ""}.`, actorAdminAccountId: admin.id }); }
      return { success: true, reportHtml, versionNumber, approvalStatus, message: input.requiresSecondApproval ? "Brouillon enregistré et transmis au second approbateur." : "Brouillon enregistré et prévisualisation mise à jour." };
    }),

  validateEvaluationDraft: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive(), validationComment: z.string().trim().min(2).max(1200).optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      if (application.evaluationDeliveryStatus === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Le bilan envoyé ne peut plus être validé." });
      let details: Record<string, unknown> = {};
      try { details = JSON.parse(application.scoringDetails || "{}"); } catch { details = {}; }
      const previousDraft = (details.adminDraft && typeof details.adminDraft === "object" ? details.adminDraft : {}) as Record<string, unknown>;
      const verdict = typeof previousDraft.verdict === "string" ? previousDraft.verdict.trim() : "";
      if (verdict.length < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "Saisissez au moins trois caractères dans le bilan avant validation." });
      const now = new Date();
      const finalDossierNumber = await issueFinalDossierNumber(db, application);
      const nextDraft = { ...previousDraft, advisorValidated: true, advisorValidatedAt: now.toISOString(), advisorValidatedByAdminId: admin.id };
      await db.update(applications).set({ scoringDetails: JSON.stringify({ ...details, adminDraft: nextDraft, dossierIssuedAt: now.toISOString(), dossierIssuedByAdminId: admin.id }), updatedAt: now }).where(eq(applications.id, application.id));
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === "application" && item.sourceRecordId === application.id);
      if (source) { const request = await ensureManagedRequest(source); await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "evaluation_advisor_validated", comment: `${input.validationComment || "Bilan relu et validé par le conseiller avant diffusion."} Numéro de dossier attribué : ${finalDossierNumber}.`, actorAdminAccountId: admin.id }); }
      return { success: true, dossierNumber: finalDossierNumber, message: `Validation conseiller enregistrée. Le numéro de dossier ${finalDossierNumber} est maintenant attribué ; le bilan peut être envoyé ou planifié après les approbations requises.` };
    }),

  approveSensitiveEvaluation: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive(), approvalComment: z.string().trim().min(2).max(1200).optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      if (!application.evaluationRequiresSecondApproval || application.evaluationApprovalStatus !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune seconde approbation n’est requise pour ce bilan." });
      const version = (await db.select().from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, application.id)).orderBy(desc(evaluationBilanVersions.versionNumber)).limit(1))[0];
      if (!version || version.approvalStatus !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune version de bilan en attente d’approbation." });
      if (version.createdByAdminAccountId === admin.id) throw new TRPCError({ code: "FORBIDDEN", message: "Un second administrateur distinct doit approuver ce bilan sensible." });
      const now = new Date();
      await db.update(evaluationBilanVersions).set({ approvalStatus: "approved", approvedByAdminAccountId: admin.id, approvalComment: input.approvalComment || null, approvedAt: now }).where(eq(evaluationBilanVersions.id, version.id));
      await db.update(applications).set({ evaluationApprovalStatus: "approved", evaluationApprovedAt: now, evaluationApprovedByAdminId: admin.id, updatedAt: now }).where(eq(applications.id, application.id));
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === "application" && item.sourceRecordId === application.id);
      if (source) { const request = await ensureManagedRequest(source); await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "evaluation_second_approval", comment: input.approvalComment || "Bilan sensible approuvé par un second administrateur.", actorAdminAccountId: admin.id }); }
      return { success: true, message: "Seconde approbation enregistrée. Le bilan peut désormais être envoyé ou planifié." };
    }),

  scheduleEvaluationDelivery: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive(), scheduledAt: z.date() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      if (input.scheduledAt.getTime() <= Date.now() + 60_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Choisissez une date et heure au moins une minute dans le futur." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      if (application.evaluationDeliveryStatus === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Le bilan a déjà été envoyé." });
      let scheduledDetails: Record<string, unknown> = {};
      try { scheduledDetails = JSON.parse(application.scoringDetails || "{}"); } catch { scheduledDetails = {}; }
      const scheduledDraft = (scheduledDetails.adminDraft && typeof scheduledDetails.adminDraft === "object" ? scheduledDetails.adminDraft : {}) as Record<string, unknown>;
      if (!canDeliverEvaluation(application.evaluationRequiresSecondApproval, application.evaluationApprovalStatus, scheduledDraft.advisorValidated === true)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le brouillon doit être validé par un conseiller avant programmation, ainsi que par un second administrateur lorsqu’il est sensible." });
      await db.update(applications).set({ evaluationScheduledAt: input.scheduledAt, evaluationDeliveryStatus: "scheduled", updatedAt: new Date() }).where(eq(applications.id, application.id));
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === "application" && item.sourceRecordId === application.id);
      if (source) { const request = await ensureManagedRequest(source); await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "evaluation_scheduled", comment: `Envoi du bilan programmé pour le ${input.scheduledAt.toLocaleString("fr-FR")}.`, actorAdminAccountId: admin.id }); }
      return { success: true, message: `Bilan programmé pour le ${input.scheduledAt.toLocaleString("fr-FR")}.` };
    }),

  sendEvaluationNow: publicProcedure
    .input(sessionInput.extend({ sourceRecordId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = await resolveEvaluationApplication(db, input.sourceRecordId);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier d’évaluation introuvable. Vérifiez que le candidat possède un dossier actif avant de préparer son bilan." });
      if (application.evaluationDeliveryStatus === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Le bilan a déjà été envoyé." });
      if (!["nouveau", "en_evaluation"].includes(application.dossierStatus)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le dossier a déjà progressé vers une étape ultérieure." });
      let deliveryDetails: Record<string, unknown> = {};
      try { deliveryDetails = JSON.parse(application.scoringDetails || "{}"); } catch { deliveryDetails = {}; }
      const deliveryDraft = (deliveryDetails.adminDraft && typeof deliveryDetails.adminDraft === "object" ? deliveryDetails.adminDraft : {}) as Record<string, unknown>;
      if (!canDeliverEvaluation(application.evaluationRequiresSecondApproval, application.evaluationApprovalStatus, deliveryDraft.advisorValidated === true)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le brouillon doit être validé par un conseiller avant envoi, ainsi que par un second administrateur lorsqu’il est sensible." });
      const versionAuditTrail = await db.select({ id: evaluationBilanVersions.id, versionNumber: evaluationBilanVersions.versionNumber, createdAt: evaluationBilanVersions.createdAt, createdByAdminAccountId: evaluationBilanVersions.createdByAdminAccountId, approvalStatus: evaluationBilanVersions.approvalStatus, approvedAt: evaluationBilanVersions.approvedAt, approvedByAdminId: evaluationBilanVersions.approvedByAdminAccountId, approvalComment: evaluationBilanVersions.approvalComment, sentAt: evaluationBilanVersions.sentAt }).from(evaluationBilanVersions).where(eq(evaluationBilanVersions.applicationId, application.id)).orderBy(desc(evaluationBilanVersions.versionNumber)).limit(30);
      const latestVersion = versionAuditTrail[0];
      const versionNumber = latestVersion?.versionNumber ?? 1;
      const finalPdf = await createFinalEvaluationPdf(application, versionNumber, versionAuditTrail);
      const candidateSpaceUrl = buildCandidateSpaceAccessUrl(application.dossierNumber);
      const messageHtml = application.evaluationDeliveryMessage ? sanitizeRichTextHtml(application.evaluationDeliveryMessage) : "";
      const emailBaseHtml = `${messageHtml ? `<section style="margin-bottom:24px">${messageHtml}</section>` : ""}${generateEvaluationReportHTML(application)}<p style="margin-top:24px">Votre bilan finalisé est également disponible au format PDF dans votre <a href="${candidateSpaceUrl}">Espace client sécurisé</a>.</p><p style="font-size:13px;color:#64748b">Connectez-vous avec l’adresse e-mail associée à votre dossier pour consulter les pièces demandées, les échanges et les prochaines étapes.</p>${buildAdvisorSignatureHtml(application.adminAssignedTo || admin.fullName)}`;
      const insertedTracking = await db.insert(evaluationEmails).values({ evaluationId: application.id, candidateEmail: application.email, candidateName: application.fullName, destinationCountry: application.destination || "Mobilité internationale", visaType: application.visaType || "Évaluation de profil", emailType: "admissibility_report", language: deliveryDraft.language === "en" ? "en" : "fr", scheduledAt: new Date(), status: "pending", reportContent: emailBaseHtml, secureLink: candidateSpaceUrl });
      const trackingEmailId = Number((insertedTracking as any)[0]?.insertId ?? 0);
      const availabilityHtml = trackingEmailId > 0 ? appendEvaluationOpenTrackingPixel(emailBaseHtml, trackingEmailId) : emailBaseHtml;
      try {
        await sendEmail({ to: application.email, subject: application.evaluationDeliverySubject || `Votre Bilan d'Évaluation - Dossier N° ${application.dossierNumber}`, html: availabilityHtml });
        if (trackingEmailId > 0) await db.update(evaluationEmails).set({ status: "sent", sentAt: new Date(), reportContent: availabilityHtml }).where(eq(evaluationEmails.id, trackingEmailId));
      } catch (error) {
        if (trackingEmailId > 0) await db.update(evaluationEmails).set({ status: "failed", failureReason: error instanceof Error ? error.message : String(error) }).where(eq(evaluationEmails.id, trackingEmailId));
        throw error;
      }
      const now = new Date();
      await db.update(applications).set({ dossierStatus: "bilan_envoye", evaluationCompletedAt: now, evaluationDeliveryStatus: "sent", evaluationScheduledAt: null, evaluationReportPdfKey: finalPdf.key, evaluationReportPdfUrl: finalPdf.url, updatedAt: now }).where(eq(applications.id, application.id));
      if (latestVersion) {
        await db.update(evaluationBilanVersions).set({ approvalStatus: "sent", pdfKey: finalPdf.key, pdfUrl: finalPdf.url, sentAt: now }).where(eq(evaluationBilanVersions.id, latestVersion.id));
      } else {
        await db.insert(evaluationBilanVersions).values({ applicationId: application.id, versionNumber, contentJson: JSON.stringify({ systemGenerated: true }), reportHtml: generateEvaluationReportHTML(application), createdByAdminAccountId: admin.id, requiresSecondApproval: false, approvalStatus: "sent", pdfKey: finalPdf.key, pdfUrl: finalPdf.url, sentAt: now });
      }
      if (application.candidateId) {
        await db.insert(clientNotifications).values({ candidateId: application.candidateId, type: "evaluation_available", title: "Votre bilan d’évaluation est disponible", body: `Votre bilan finalisé pour le dossier ${application.dossierNumber} est prêt. Consultez-le et téléchargez votre PDF depuis votre espace client.`, actionUrl: "/mon-espace", isRead: false, emailSentAt: now });
      }
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === "application" && item.sourceRecordId === application.id);
      if (source) { const request = await ensureManagedRequest(source); await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "evaluation_sent", comment: "Bilan validé et envoyé immédiatement au candidat.", actorAdminAccountId: admin.id }); }
      return { success: true, dossierNumber: application.dossierNumber, message: "Bilan validé et envoyé immédiatement dans l’espace client et par e-mail." };
    }),

  listUnviewedEvaluationReports: publicProcedure
    .input(sessionInput)
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const rows = await db.select({ id: applications.id, dossierNumber: applications.dossierNumber, fullName: applications.fullName, email: applications.email, destination: applications.destination, adminAssignedTo: applications.adminAssignedTo, evaluationCompletedAt: applications.evaluationCompletedAt, evaluationReportReminderSentAt: applications.evaluationReportReminderSentAt }).from(applications).where(and(eq(applications.evaluationDeliveryStatus, "sent"), isNull(applications.evaluationReportViewedAt))).orderBy(asc(applications.evaluationCompletedAt)).limit(500);
      const now = Date.now();
      return { generatedAt: new Date(now), rows: rows.map((row) => ({ ...row, hoursSinceSent: row.evaluationCompletedAt ? Math.max(0, Math.floor((now - row.evaluationCompletedAt.getTime()) / 3_600_000)) : 0, advisorName: row.adminAssignedTo })) };
    }),

  sendEvaluationReminder: publicProcedure
    .input(sessionInput.extend({ applicationId: z.number().int().positive(), language: z.enum(["fr", "en"]).default("fr"), customMessage: z.string().trim().max(3000).optional() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const application = (await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1))[0];
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable." });
      if (application.evaluationDeliveryStatus !== "sent" || application.evaluationReportViewedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Ce bilan n’est plus éligible à une relance." });
      const now = new Date();
      const minimumNextReminder = application.evaluationReportReminderSentAt ? new Date(application.evaluationReportReminderSentAt.getTime() + 24 * 60 * 60 * 1000) : null;
      if (minimumNextReminder && minimumNextReminder > now) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Une relance a déjà été envoyée. Réessayez après le ${minimumNextReminder.toLocaleString("fr-FR")}.` });
      const language = input.language as EvaluationReminderLanguage;
      const candidateSpaceUrl = buildCandidateSpaceAccessUrl(application.dossierNumber);
      const baseHtml = buildEvaluationReminderEmailHtml(application.fullName, application.dossierNumber, language, input.customMessage);
      const trackingInsert = await db.insert(evaluationEmails).values({ evaluationId: application.id, candidateEmail: application.email, candidateName: application.fullName, destinationCountry: application.destination || "Mobilité internationale", visaType: application.visaType || "Évaluation de profil", emailType: "reminder", scheduledAt: now, status: "pending", reportContent: baseHtml, secureLink: candidateSpaceUrl });
      const trackingEmailId = Number((trackingInsert as any)[0]?.insertId ?? 0);
      const html = trackingEmailId > 0 ? appendEvaluationOpenTrackingPixel(baseHtml, trackingEmailId) : baseHtml;
      try {
        await sendEmail({ to: application.email, subject: buildEvaluationReminderEmailSubject(application.dossierNumber, language), html });
        if (trackingEmailId > 0) await db.update(evaluationEmails).set({ status: "sent", sentAt: now, reportContent: html }).where(eq(evaluationEmails.id, trackingEmailId));
      } catch (error) {
        if (trackingEmailId > 0) await db.update(evaluationEmails).set({ status: "failed", failureReason: error instanceof Error ? error.message : String(error) }).where(eq(evaluationEmails.id, trackingEmailId));
        throw error;
      }
      await db.update(applications).set({ evaluationReportReminderSentAt: now, updatedAt: now }).where(eq(applications.id, application.id));
      if (application.candidateId) await db.insert(clientNotifications).values({ candidateId: application.candidateId, type: "evaluation_reminder", title: language === "en" ? "Reminder: your evaluation report is available" : "Rappel : votre bilan vous attend", body: language === "en" ? `Your evaluation report for file ${application.dossierNumber} is still available in your client area.` : `Votre bilan pour le dossier ${application.dossierNumber} reste disponible dans votre espace client.`, actionUrl: "/mon-espace", isRead: false, emailSentAt: now });
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === "application" && item.sourceRecordId === application.id);
      if (source) { const request = await ensureManagedRequest(source); await db.insert(unifiedClientRequestHistory).values({ requestId: request.id, actionType: "evaluation_reminder_sent", comment: `Relance de consultation envoyée par e-mail en ${language === "en" ? "anglais" : "français"}.`, actorAdminAccountId: admin.id }); }
      return { success: true, message: language === "en" ? "The reminder was sent by e-mail and recorded in the file." : "La relance a été envoyée par e-mail et enregistrée dans le dossier." };
    }),

  getCustomer360: publicProcedure
    .input(sessionInput.extend({ sourceType: z.enum(sourceTypes), sourceRecordId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const source = (await loadSourceSnapshots()).find((item) => item.sourceType === input.sourceType && item.sourceRecordId === input.sourceRecordId);
      if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const request = await ensureManagedRequest(source);
      const [history, dossierRows, evaluationRows, consultationRows, flightRows, insuranceRows, translationRows, documents, messages] = await Promise.all([
        db.select().from(unifiedClientRequestHistory).where(eq(unifiedClientRequestHistory.requestId, request.id)).orderBy(desc(unifiedClientRequestHistory.createdAt)).limit(100),
        db.select({ id: applications.id, dossierNumber: applications.dossierNumber, destination: applications.destination, visaType: applications.visaType, dossierStatus: applications.dossierStatus, paymentStatus: applications.paymentStatus, createdAt: applications.createdAt }).from(applications).where(eq(applications.email, source.email)).orderBy(desc(applications.createdAt)).limit(20),
        loadLegacyProfileEvaluationsForEmail(db, source.email),
        db.select({ id: consultationRequests.id, targetCountry: consultationRequests.targetCountry, status: consultationRequests.status, createdAt: consultationRequests.createdAt }).from(consultationRequests).where(eq(consultationRequests.email, source.email)).orderBy(desc(consultationRequests.createdAt)).limit(20),
        db.select({ id: flightBookingRequests.id, requestRef: flightBookingRequests.requestRef, status: flightBookingRequests.status, priority: flightBookingRequests.priority, createdAt: flightBookingRequests.createdAt }).from(flightBookingRequests).where(eq(flightBookingRequests.candidateEmail, source.email)).orderBy(desc(flightBookingRequests.createdAt)).limit(20),
        db.select({ id: insuranceRequests.id, reference: insuranceRequests.reference, destinationCountry: insuranceRequests.destinationCountry, status: insuranceRequests.status, createdAt: insuranceRequests.createdAt }).from(insuranceRequests).where(eq(insuranceRequests.email, source.email)).orderBy(desc(insuranceRequests.createdAt)).limit(20),
        db.select({ id: translationRequests.id, documentType: translationRequests.documentType, status: translationRequests.status, paymentStatus: translationRequests.paymentStatus, createdAt: translationRequests.createdAt }).from(translationRequests).where(eq(translationRequests.candidateEmail, source.email)).orderBy(desc(translationRequests.createdAt)).limit(20),
        source.candidateId ? db.select({ id: candidateFiles.id, fileName: candidateFiles.fileName, fileType: candidateFiles.fileType, uploadedAt: candidateFiles.uploadedAt, status: candidateFiles.status }).from(candidateFiles).where(eq(candidateFiles.candidateId, source.candidateId)).orderBy(desc(candidateFiles.uploadedAt)).limit(30) : Promise.resolve([]),
        source.candidateId ? db.select({ id: candidateMessages.id, senderRole: candidateMessages.senderRole, content: candidateMessages.content, createdAt: candidateMessages.createdAt }).from(candidateMessages).where(eq(candidateMessages.candidateId, source.candidateId)).orderBy(desc(candidateMessages.createdAt)).limit(30) : Promise.resolve([]),
      ]);
      return { request: { ...request, source }, history, dossiers: dossierRows, evaluations: evaluationRows, consultations: consultationRows, flights: flightRows, insurance: insuranceRows, translations: translationRows, documents, messages };
    }),

  dashboard: publicProcedure
    .input(sessionInput)
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [sources, managedRows, advisors] = await Promise.all([
        loadSourceSnapshots(),
        db.select().from(unifiedClientRequests).orderBy(desc(unifiedClientRequests.createdAt)).limit(5000),
        db.select({ id: adminAccounts.id, fullName: adminAccounts.fullName, email: adminAccounts.email }).from(adminAccounts).where(eq(adminAccounts.status, "active")).orderBy(adminAccounts.fullName),
      ]);
      const managementByKey = new Map(managedRows.map((row) => [`${row.sourceType}:${row.sourceRecordId}`, row]));
      const rows = sources.map((source) => managementByKey.get(`${source.sourceType}:${source.sourceRecordId}`) ?? {
        sourceType: source.sourceType,
        sourceRecordId: source.sourceRecordId,
        workflowStatus: inferUnifiedWorkflow(source.sourceType, source.sourceStatus),
        priority: "normal" as const,
        assignedAdminAccountId: null,
        firstRespondedAt: null,
        dueAt: new Date(source.createdAt.getTime() + 24 * 3_600_000),
        lastActivityAt: source.updatedAt,
        closedAt: null,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      });
      const now = Date.now();
      const active = rows.filter((row) => !["completed", "closed", "rejected"].includes(row.workflowStatus));
      const completed = rows.filter((row) => row.workflowStatus === "completed" || row.workflowStatus === "closed");
      const conversionBase = rows.filter((row) => ["application", "evaluation", "consultation"].includes(row.sourceType));
      const converted = conversionBase.filter((row) => ["processing", "submitted", "completed", "closed"].includes(row.workflowStatus));
      const durations = completed.map((row) => (row.closedAt ?? row.updatedAt).getTime() - row.createdAt.getTime()).filter((value) => value >= 0);
      const bySource = sourceTypes.map((sourceType) => ({ sourceType, total: rows.filter((row) => row.sourceType === sourceType).length }));
      const byAdvisor = new Map<number | null, number>();
      active.forEach((row) => byAdvisor.set(row.assignedAdminAccountId, (byAdvisor.get(row.assignedAdminAccountId) ?? 0) + 1));
      return {
        totals: { all: rows.length, active: active.length, unassigned: active.filter((row) => !row.assignedAdminAccountId).length, overdue: active.filter((row) => getUnifiedSlaState(row as any) === "overdue").length, conversionRate: conversionBase.length ? Math.round((converted.length / conversionBase.length) * 100) : 0, averageProcessingHours: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length / 3_600_000) : 0, lastCalculatedAt: new Date(now) },
        bySource,
        byAdvisor: Array.from(byAdvisor.entries()).map(([advisorId, total]) => ({ advisorId, total })),
        advisorWorkload: calculateAdvisorWorkload(advisors, active as any, new Date(now)),
      };
    }),

  myToday: publicProcedure
    .input(sessionInput)
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const rows = await db.select().from(unifiedClientRequests).where(eq(unifiedClientRequests.assignedAdminAccountId, admin.id)).orderBy(unifiedClientRequests.dueAt, desc(unifiedClientRequests.priority)).limit(100);
      const now = new Date();
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      const open = rows.filter((row) => !["completed", "closed", "rejected"].includes(row.workflowStatus));
      return {
        admin: { id: admin.id, fullName: admin.fullName },
        overdue: open.filter((row) => row.dueAt && row.dueAt < now),
        today: open.filter((row) => row.dueAt && row.dueAt >= start && row.dueAt <= end),
        noDueDate: open.filter((row) => !row.dueAt),
        blocked: open.filter((row) => ["waiting_customer", "documents_review", "payment_review"].includes(row.workflowStatus) || (row.dueAt && row.dueAt < now)),
        totalOpen: open.length,
      };
    }),

  evaluationReviewsToday: publicProcedure
    .input(evaluationQueueInput)
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const candidates = await db.select({ id: applications.id, dossierNumber: applications.dossierNumber, fullName: applications.fullName, destination: applications.destination, scoringTotal: applications.scoringTotal, adminAssignedTo: applications.adminAssignedTo, evaluationScheduledAt: applications.evaluationScheduledAt, createdAt: applications.createdAt, updatedAt: applications.updatedAt, scoringDetails: applications.scoringDetails, evaluationDeliveryStatus: applications.evaluationDeliveryStatus, dossierStatus: applications.dossierStatus }).from(applications).orderBy(desc(applications.updatedAt)).limit(500);
      const now = new Date();
      const rows = selectEvaluationReviewsForAdvisorToday(candidates, admin, now, input.filter);
      return { generatedAt: now, total: rows.length, rows };
    }),
});
