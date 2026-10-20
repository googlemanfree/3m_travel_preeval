import { TRPCError } from "@trpc/server";
import { desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { candidateFiles, candidates, dataProcessors, documentTransmissions, privacyAuditEvents } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireStrongAdmin } from "../services/adminStrongAuth";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { storageGetSignedUrl } from "../storage";
import { requireValidAdminSession } from "./adminAuth";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const sessionSchema = z.string().min(20);

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
  return db;
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le centre de confidentialité n’est pas encore activé : la migration 0082 doit être appliquée." });
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment." });
  }
}

/** Délai de validité du lien : lu dans l'adresse signée quand le service de stockage l'indique, sinon délai cible prudent. */
export function signedUrlExpiry(url: string, now: Date = new Date()): { expiresAt: Date; fromProvider: boolean } {
  try {
    const parsed = new URL(url);
    const seconds = Number(parsed.searchParams.get("X-Amz-Expires") ?? parsed.searchParams.get("expires"));
    if (Number.isFinite(seconds) && seconds > 0) return { expiresAt: new Date(now.getTime() + Math.min(seconds, 7 * 86_400) * 1000), fromProvider: true };
  } catch {
    // adresse non analysable : délai cible ci-dessous
  }
  return { expiresAt: new Date(now.getTime() + 15 * 60_000), fromProvider: false };
}

const ipOf = (ctx: unknown): string | null => {
  const req = (ctx as { req?: { ip?: string; headers?: Record<string, string | string[] | undefined> } } | undefined)?.req;
  const forwarded = req?.headers?.["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (first?.split(",")[0]?.trim() || req?.ip) ?? null;
};

/** Centre de confidentialité (administration) : journal, registre des prestataires, transmissions encadrées de pièces privées. */
export const privacyCenterRouter = router({
  adminAuditEvents: publicProcedure.input(z.object({ sessionToken: sessionSchema, actionPrefix: z.string().trim().max(40).optional(), limit: z.number().int().min(10).max(300).default(100) })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const query = db.select().from(privacyAuditEvents);
    const rows = await (input.actionPrefix ? query.where(like(privacyAuditEvents.action, `${input.actionPrefix.replace(/[%_]/g, "")}%`)) : query).orderBy(desc(privacyAuditEvents.id)).limit(input.limit);
    return rows;
  })),

  adminProcessors: publicProcedure.input(z.object({ sessionToken: sessionSchema })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    return db.select().from(dataProcessors).orderBy(dataProcessors.name);
  })),

  adminProcessorUpdate: publicProcedure.input(z.object({
    sessionToken: sessionSchema,
    id: z.number().int().positive(),
    hostingCountry: z.string().trim().max(120).optional(),
    contractBasis: z.string().trim().max(255).optional(),
    safeguardsStatus: z.enum(["unreviewed", "reviewed", "refused"]).optional(),
    integrationEnabled: z.boolean().optional(),
    notes: z.string().trim().max(2000).optional(),
  })).mutation(({ input, ctx }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const current = (await db.select().from(dataProcessors).where(eq(dataProcessors.id, input.id)).limit(1))[0];
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Prestataire introuvable." });
    const nextStatus = input.safeguardsStatus ?? current.safeguardsStatus;
    // Garde-fou : aucune intégration ni aucun transfert externe ne s'active sans examen des garanties enregistré.
    if (input.integrationEnabled && (nextStatus !== "reviewed" || !(input.hostingCountry ?? current.hostingCountry))) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible d’activer : examinez d’abord les garanties du prestataire et renseignez son pays d’hébergement." });
    }
    const changes: Partial<typeof dataProcessors.$inferInsert> = {};
    if (input.hostingCountry !== undefined) changes.hostingCountry = input.hostingCountry || null;
    if (input.contractBasis !== undefined) changes.contractBasis = input.contractBasis || null;
    if (input.notes !== undefined) changes.notes = input.notes || null;
    if (input.safeguardsStatus !== undefined) {
      changes.safeguardsStatus = input.safeguardsStatus;
      changes.reviewedByAdminId = admin.id;
      changes.reviewedAt = new Date();
      if (input.safeguardsStatus !== "reviewed") changes.integrationEnabled = false;
    }
    if (input.integrationEnabled !== undefined && !(input.safeguardsStatus !== undefined && input.safeguardsStatus !== "reviewed")) changes.integrationEnabled = input.integrationEnabled;
    await db.update(dataProcessors).set(changes).where(eq(dataProcessors.id, current.id));
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "processor.updated", resourceType: "data_processor", resourceId: current.id, details: `${current.name} : ${Object.keys(changes).join(",")}`, ip: ipOf(ctx) });
    return { ok: true as const };
  })),

  /** Liste les pièces d'un candidat : type, nom, statut, date. Jamais le contenu ni un lien : la consultation est un acte journalisé. */
  adminCandidateFiles: publicProcedure.input(z.object({ sessionToken: sessionSchema, candidateId: z.number().int().positive() })).query(({ input, ctx }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const files = await db.select({ id: candidateFiles.id, fileType: candidateFiles.fileType, fileName: candidateFiles.fileName, status: candidateFiles.status, uploadedAt: candidateFiles.uploadedAt })
      .from(candidateFiles).where(eq(candidateFiles.candidateId, input.candidateId)).orderBy(desc(candidateFiles.id)).limit(100);
    const candidate = (await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1))[0];
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "documents.list_viewed", resourceType: "candidate", resourceId: input.candidateId, ip: ipOf(ctx) });
    return { candidateName: candidate?.fullName ?? null, files };
  })),

  /** Transmission encadrée : motif et destinataire obligatoires, administrateur renforcé, lien temporaire, enregistrement. */
  adminIssueDocumentLink: publicProcedure.input(z.object({
    sessionToken: sessionSchema,
    fileId: z.number().int().positive(),
    purpose: z.string().trim().min(10).max(500),
    recipient: z.string().trim().min(3).max(255),
  })).mutation(({ input, ctx }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    await requireStrongAdmin(admin);
    const db = await requireDb();
    const file = (await db.select().from(candidateFiles).where(eq(candidateFiles.id, input.fileId)).limit(1))[0];
    if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "Pièce introuvable." });
    const url = await storageGetSignedUrl(file.fileKey.replace(/^\/manus-storage\//, ""));
    const { expiresAt, fromProvider } = signedUrlExpiry(url);
    await db.insert(documentTransmissions).values({
      candidateId: file.candidateId,
      fileId: file.id,
      fileLabel: `${file.fileType} — ${file.fileName}`.slice(0, 255),
      purpose: input.purpose,
      recipient: input.recipient,
      issuedByAdminId: admin.id,
      issuedByLabel: adminLabel(admin),
      linkExpiresAt: expiresAt,
    });
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "documents.link_issued", resourceType: "candidate_file", resourceId: file.id, details: `destinataire=${input.recipient.slice(0, 120)}`, ip: ipOf(ctx) });
    return { url, expiresAt, expiryFromProvider: fromProvider };
  })),

  adminTransmissions: publicProcedure.input(z.object({ sessionToken: sessionSchema, candidateId: z.number().int().positive().optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const query = db.select().from(documentTransmissions);
    return (input.candidateId ? query.where(eq(documentTransmissions.candidateId, input.candidateId)) : query).orderBy(desc(documentTransmissions.id)).limit(100);
  })),
});
