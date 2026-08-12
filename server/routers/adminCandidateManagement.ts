import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { applications, agencyDossiers, clientDocuments } from "../../drizzle/schema";
import { getDb } from "../db";
import { requireAdminSessionFromCookie } from "./adminAuth";

const candidateFilterSchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  status: z.string().max(50).optional().default("all"),
  paymentStatus: z.enum(["all", "paye", "en_attente", "non_paye"]).default("all"),
  scoreBand: z.enum(["all", "excellent", "bon", "moyen", "faible"]).default("all"),
  destination: z.string().trim().max(100).optional().default("all"),
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

async function loadCandidates(filter: CandidateFilter, sourceLimit = 5000) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

  const [online, agency, documents] = await Promise.all([
    db.select().from(applications).orderBy(desc(applications.createdAt)).limit(sourceLimit),
    db.select().from(agencyDossiers).orderBy(desc(agencyDossiers.createdAt)).limit(sourceLimit),
    db.select().from(clientDocuments).limit(Math.min(sourceLimit * 2, 10000)),
  ]);
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
    }) as AdminCandidate);
  let candidates: AdminCandidate[] = onlineCandidates.concat(agencyCandidates);

  const query = filter.search.toLowerCase();
  if (query) candidates = candidates.filter(candidate => [candidate.fullName, candidate.email, candidate.applicationNumber, candidate.destination, candidate.visaType].some(value => value.toLowerCase().includes(query)));
  if (filter.status !== "all") candidates = candidates.filter(candidate => candidate.status === filter.status);
  if (filter.paymentStatus !== "all") candidates = candidates.filter(candidate => candidate.paymentStatus === filter.paymentStatus);
  if (filter.scoreBand !== "all") candidates = candidates.filter(candidate => candidate.scoringBadge === filter.scoreBand);
  if (filter.destination !== "all") candidates = candidates.filter(candidate => candidate.destination.toLowerCase() === filter.destination.toLowerCase());

  candidates.sort((left, right) => {
    const direction = filter.sortDirection === "asc" ? 1 : -1;
    if (filter.sortBy === "score") return direction * (left.scoringTotal - right.scoringTotal);
    if (filter.sortBy === "fullName") return direction * left.fullName.localeCompare(right.fullName, "fr");
    return direction * (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  });

  return candidates;
}

export const adminCandidateManagementRouter = router({
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
    return { csv: `\uFEFF${headers.map(escapeCsvCell).join(",")}\n${rows.join("\n")}`, count: candidates.length };
  }),

  updateCandidate: publicProcedure
    .input(z.object({
      candidateId: z.string().regex(/^(online|agency)_\\d+$/),
      status: z.string().min(1).max(50),
      adminNotes: z.string().max(5000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const reference = parseAdminCandidateReference(input.candidateId);
      if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });
      const { source, id } = reference;
      if (source === "online") {
        const allowed = ["nouveau", "en_evaluation", "bilan_envoye", "en_attente_paiement", "paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve", "refuse"] as const;
        if (!(allowed as readonly string[]).includes(input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Statut de dossier en ligne invalide." });
        const result = await db.update(applications).set({ dossierStatus: input.status as any, ...(input.adminNotes !== undefined ? { adminNote: input.adminNotes } : {}), lastStatusUpdateAt: new Date(), lastStatusUpdatedBy: admin.email }).where(eq(applications.id, id));
        const affectedRows = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
        if (affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
      } else {
        const allowed = ["nouveau", "en_cours", "documents_requis", "soumis", "approuve", "refuse"] as const;
        if (!(allowed as readonly string[]).includes(input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Statut de dossier agence invalide." });
        const result = await db.update(agencyDossiers).set({ status: input.status as any, ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}), lastStatusChangeAt: new Date(), lastStatusChangeBy: admin.email }).where(eq(agencyDossiers.id, id));
        const affectedRows = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
        if (affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
      }
      return { success: true };
    }),
});
