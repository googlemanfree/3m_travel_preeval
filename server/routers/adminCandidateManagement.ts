import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { applications, agencyDossiers, agencyDossierHistory, clientDocuments, candidateFiles, candidateMessages, candidates } from "../../drizzle/schema";
import { caseActivityLogs, caseStatusHistory, cases, clientNotifications } from "../../drizzle/caseTrackingSchema";
import { getDb } from "../db";
import { requireAdminSessionFromCookie, requireValidAdminSession } from "./adminAuth";
import { sendClientNotificationEmail, sendDossierConfirmationEmail } from "../emailService";

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

async function resolveCandidateIdForAdmin(candidateId: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  const reference = parseAdminCandidateReference(candidateId);
  if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });

  if (reference.source === "online") {
    const [application] = await db.select({ candidateId: applications.candidateId, email: applications.email }).from(applications).where(eq(applications.id, reference.id)).limit(1);
    if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
    if (application.candidateId) return application.candidateId;
    const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, application.email)).limit(1);
    return candidate?.id ?? null;
  }

  const [dossier] = await db.select({ email: agencyDossiers.email }).from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
  if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
  const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, dossier.email)).limit(1);
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
  listPreDossierAccounts: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), search: z.string().trim().max(120).optional().default("") }))
    .query(async ({ input, ctx }) => {
      await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [accounts, files] = await Promise.all([
        db.select().from(candidates).where(eq(candidates.dossierStatus, "nouveau")).orderBy(desc(candidates.createdAt)).limit(500),
        db.select({ candidateId: candidateFiles.candidateId }).from(candidateFiles).limit(5000),
      ]);
      const documentsByCandidate = new Map<number, number>();
      files.forEach((file) => documentsByCandidate.set(file.candidateId, (documentsByCandidate.get(file.candidateId) ?? 0) + 1));
      const query = input.search.toLowerCase();
      const filtered = accounts.filter((account) => !query || [account.fullName, account.email, account.phone ?? "", account.destination ?? ""].some((value) => value.toLowerCase().includes(query)));
      return {
        total: filtered.length,
        accounts: filtered.map((account) => ({
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
          pendingEvaluationReference: account.evaluationDeclarationStatus === "pending_validation" ? "Évaluation externe à valider" : null,
          evaluationDeclarationStatus: account.evaluationDeclarationStatus,
          evaluationReviewedAt: account.evaluationReviewedAt,
          evaluationReviewedBy: account.evaluationReviewedBy,
          evaluationReviewNote: account.evaluationReviewNote,
          evaluationValidated: account.evaluationDeclarationStatus === "validated",
        })),
      };
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
        sourceLabel: "3M Travel & Services",
      });
      if (emailSent && notificationId > 0) {
        await db.update(clientNotifications).set({ emailSentAt: new Date() }).where(eq(clientNotifications.id, notificationId));
      }

      return { success: true, deliveredToClientSpace: true, emailSent, deliveredBy: admin.email, evaluationValidatedManually: true, reviewNote: manualReviewNote };
    }),

  activatePreDossierAccount: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.number().int().positive(), destination: z.string().trim().min(2).max(100), visaType: z.string().trim().min(2).max(100), adminNotes: z.string().trim().max(5000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
      if (candidate.dossierStatus !== "nouveau") throw new TRPCError({ code: "CONFLICT", message: "Ce compte possède déjà un dossier actif." });
      if (candidate.evaluationDeclarationStatus !== "validated" || !candidate.evaluationReviewedAt) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’évaluation doit être validée par un conseiller avant l’ouverture du dossier officiel." });
      }
      const [latestApplication] = await db.select({ paymentStatus: applications.paymentStatus }).from(applications)
        .where(eq(applications.candidateId, candidate.id))
        .orderBy(desc(applications.createdAt))
        .limit(1);
      const [paidAgencyDossier] = await db.select({ id: agencyDossiers.id }).from(agencyDossiers)
        .where(and(isNull(agencyDossiers.deletedAt), eq(agencyDossiers.email, candidate.email), eq(agencyDossiers.initialPaymentStatus, "paid")))
        .orderBy(desc(agencyDossiers.createdAt))
        .limit(1);
      if (latestApplication?.paymentStatus !== "SUCCESS" && !paidAgencyDossier) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le paiement doit être confirmé avant l’ouverture du dossier officiel." });
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
          destination: input.destination,
          visaType: input.visaType,
          status: "en_cours",
          assignedToAdmin: admin.email,
          ...(input.adminNotes ? { adminNotes: input.adminNotes } : {}),
        }).where(eq(agencyDossiers.id, agencyDossierId));
      } else {
        const inserted = await db.insert(agencyDossiers).values({ fullName: candidate.fullName, email: candidate.email, phone: candidate.phone ?? "Non renseigné", dateOfBirth: candidate.dateOfBirth, nationality: candidate.nationality, destination: input.destination, visaType: input.visaType, status: "nouveau", createdByAdmin: admin.email, assignedToAdmin: admin.email, adminNotes: input.adminNotes ?? null, source: "manual_admin" });
        agencyDossierId = Number((inserted as any)[0]?.insertId || 0);
      }
      await db.update(candidates).set({ dossierStatus: "documents", destination: input.destination as any, visaType: input.visaType, dossierNote: input.adminNotes ?? null }).where(eq(candidates.id, candidate.id));
      await db.insert(agencyDossierHistory).values({
        dossierId: agencyDossierId,
        action: "account_linked",
        changedBy: admin.email || "unknown",
        oldValue: linkedExistingDossier ? "pré-dossier sans compte" : null,
        newValue: JSON.stringify({ candidateId: candidate.id, email: candidate.email }),
        details: "Compte candidat rattaché au pré-dossier agence après validation administrative",
      });
      let emailSent = false;
      try {
        emailSent = await sendDossierConfirmationEmail(candidate.email, candidate.fullName, `3M-AGN-${agencyDossierId.toString().padStart(4, "0")}`, input.destination, 0);
      } catch {
        emailSent = false;
      }
      return { success: true, emailSent, linkedExistingDossier, agencyDossierId };
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
    return { csv: `\\uFEFF${headers.map(escapeCsvCell).join(",")}\\n${rows.join("\\n")}`, count: candidates.length };
  }),

  reviewPortrait: publicProcedure
    .input(z.object({
      candidateId: z.string().regex(/^(online|agency)_\\d+$/),
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
      fullName: z.string().trim().min(2).max(160).optional(),
      email: z.string().email().optional(),
      phone: z.string().trim().max(40).optional(),
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
        const statusLabels: Record<string, string> = {
          nouveau: "Nouveau dossier",
          en_evaluation: "Évaluation en cours",
          en_cours: "Dossier en cours de traitement",
          documents_requis: "Documents requis",
          en_attente_documents: "Documents requis",
          documents_recus: "Documents reçus",
          soumis: "Dossier soumis",
          soumis_agences: "Dossier soumis aux autorités",
          approuve: "Dossier approuvé",
          visa_approuve: "Visa approuvé",
          refuse: "Dossier refusé",
        };
        const visibleBody = `Mise à jour du dossier ${dossierNumberForMessage}${previousStatus !== input.status ? `\n\nNouveau statut : ${statusLabels[input.status] ?? input.status}` : ""}${Object.keys(profilePatch).length > 0 ? "\n\nL’équipe a également actualisé certaines informations de votre profil." : ""}${input.adminNotes ? `\n\nNote de l’équipe : ${input.adminNotes}` : ""}`;
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
      const messages = await db.select().from(candidateMessages).where(eq(candidateMessages.candidateId, candidateId)).orderBy(candidateMessages.createdAt);
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
