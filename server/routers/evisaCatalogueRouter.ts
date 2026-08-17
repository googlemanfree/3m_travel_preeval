import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { evisaCatalogueAuditLogs, managedEvisaDestinations } from "../../drizzle/evisaCatalogueSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { suggestEvisaCatalogueFields } from "../services/evisaCatalogueAssistant";

const safeArray = (value?: string | null) => {
  if (!value) return [] as string[];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
};

const destinationInput = z.object({
  id: z.number().int().positive().optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez un identifiant stable en minuscules, par exemple kenya.").min(2).max(100),
  country: z.string().trim().min(2).max(160),
  capital: z.string().trim().min(2).max(160),
  flag: z.string().trim().min(1).max(16),
  region: z.string().trim().min(2).max(100),
  visaType: z.string().trim().min(2).max(160),
  duration: z.string().trim().min(1).max(160),
  delay: z.string().trim().min(1).max(160),
  requirements: z.string().trim().min(5).max(8000),
  fee: z.string().trim().min(1).max(160),
  notes: z.string().trim().min(5).max(8000),
  imageUrl: z.string().trim().url("L’image doit être une URL valide.").max(2000).optional().or(z.literal("")),
  officialPortalUrl: z.string().trim().url("Le portail officiel doit être une URL HTTPS valide.").max(1000).refine((value) => value.startsWith("https://"), "Le portail officiel doit utiliser HTTPS."),
  officialPortalLabel: z.string().trim().min(2).max(255),
  officialVerifiedAt: z.string().trim().min(4).max(80),
  highlights: z.array(z.string().trim().min(1).max(200)).max(12).default([]),
  emblems: z.array(z.string().trim().min(1).max(200)).max(12).default([]),
  steps: z.array(z.string().trim().min(1).max(600)).min(1).max(12),
  isActive: z.boolean().default(true),
});

function serialise(row: typeof managedEvisaDestinations.$inferSelect) {
  return {
    ...row,
    imageUrl: row.imageUrl ?? "",
    highlights: safeArray(row.highlightsJson),
    emblems: safeArray(row.emblemsJson),
    steps: safeArray(row.stepsJson),
  };
}

function parseAuditSnapshot(value?: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}

function summaryFor(action: "created" | "updated" | "deactivated" | "deleted", country: string) {
  return ({ created: `Destination e‑Visa ${country} créée.`, updated: `Exigences e‑Visa ${country} mises à jour.`, deactivated: `Destination e‑Visa ${country} désactivée.`, deleted: `Surcharge e‑Visa ${country} supprimée.` })[action];
}

export const evisaCatalogueRouter = router({
  suggestWithAI: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1), country: z.string().trim().min(2).max(160), region: z.string().trim().min(2).max(100),
      visaType: z.string().trim().min(2).max(160), officialPortalUrl: z.string().trim().url().refine((value) => value.startsWith("https://")),
      officialVerifiedAt: z.string().trim().min(4).max(80), currentRequirements: z.string().max(8000).default(""), currentFee: z.string().max(160).default(""),
      currentDelay: z.string().max(160).default(""), currentNotes: z.string().max(8000).default(""),
    }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      try {
        return await suggestEvisaCatalogueFields(input);
      } catch (error) {
        console.error("Suggestion IA e‑Visa impossible", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La suggestion IA est temporairement indisponible. Vérifiez ou complétez la fiche manuellement." });
      }
    }),

  /** Surcharges publiques utilisées pour compléter, corriger ou masquer les fiches statiques. */
  getPublicOverrides: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Catalogue e‑Visa indisponible." });
    const rows = await db.select().from(managedEvisaDestinations);
    return rows.map(serialise);
  }),

  listAdmin: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), includeInactive: z.boolean().default(true) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Catalogue e‑Visa indisponible." });
      const rows = await db.select().from(managedEvisaDestinations)
        .where(input.includeInactive ? undefined : eq(managedEvisaDestinations.isActive, true))
        .orderBy(managedEvisaDestinations.country);
      return rows.map(serialise);
    }),

  upsert: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), destination: destinationInput }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Catalogue e‑Visa indisponible." });
      const value = input.destination;
      const existing = (await db.select().from(managedEvisaDestinations).where(eq(managedEvisaDestinations.slug, value.slug)).limit(1))[0];
      if (value.id && existing && existing.id !== value.id) throw new TRPCError({ code: "CONFLICT", message: "Cet identifiant e‑Visa est déjà utilisé." });
      if (!value.id && existing) throw new TRPCError({ code: "CONFLICT", message: "Cette destination existe déjà dans le catalogue administré. Utilisez Modifier." });
      const values = {
        slug: value.slug, country: value.country, capital: value.capital, flag: value.flag, region: value.region, visaType: value.visaType,
        duration: value.duration, delay: value.delay, requirements: value.requirements, fee: value.fee, notes: value.notes,
        imageUrl: value.imageUrl || null, officialPortalUrl: value.officialPortalUrl, officialPortalLabel: value.officialPortalLabel,
        officialVerifiedAt: value.officialVerifiedAt, highlightsJson: JSON.stringify(value.highlights), emblemsJson: JSON.stringify(value.emblems),
        stepsJson: JSON.stringify(value.steps), isActive: value.isActive, updatedByAdminId: admin.id,
      };
      let destinationId: number;
      let action: "created" | "updated";
      if (value.id) {
        const prior = (await db.select().from(managedEvisaDestinations).where(and(eq(managedEvisaDestinations.id, value.id), eq(managedEvisaDestinations.slug, value.slug))).limit(1))[0];
        if (!prior) throw new TRPCError({ code: "NOT_FOUND", message: "Destination e‑Visa administrée introuvable." });
        await db.update(managedEvisaDestinations).set(values).where(eq(managedEvisaDestinations.id, value.id));
        destinationId = value.id; action = "updated";
      } else {
        const result = await db.insert(managedEvisaDestinations).values({ ...values, createdByAdminId: admin.id });
        destinationId = Number((result as any)[0]?.insertId ?? 0);
        action = "created";
      }
      const current = (await db.select().from(managedEvisaDestinations).where(eq(managedEvisaDestinations.id, destinationId)).limit(1))[0];
      await db.insert(evisaCatalogueAuditLogs).values({
        destinationId, destinationSlug: value.slug, action, summary: summaryFor(action, value.country),
        previousSnapshotJson: existing ? JSON.stringify(serialise(existing)) : null,
        nextSnapshotJson: current ? JSON.stringify(serialise(current)) : JSON.stringify(value), actorAdminId: admin.id,
      });
      return { success: true, destination: current ? serialise(current) : null };
    }),

  setActive: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), id: z.number().int().positive(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Catalogue e‑Visa indisponible." });
      const existing = (await db.select().from(managedEvisaDestinations).where(eq(managedEvisaDestinations.id, input.id)).limit(1))[0];
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Destination e‑Visa introuvable." });
      await db.update(managedEvisaDestinations).set({ isActive: input.isActive, updatedByAdminId: admin.id }).where(eq(managedEvisaDestinations.id, input.id));
      const next = { ...serialise(existing), isActive: input.isActive };
      await db.insert(evisaCatalogueAuditLogs).values({
        destinationId: existing.id, destinationSlug: existing.slug, action: input.isActive ? "activated" : "deactivated",
        summary: input.isActive ? `Destination e‑Visa ${existing.country} réactivée.` : summaryFor("deactivated", existing.country),
        previousSnapshotJson: JSON.stringify(serialise(existing)), nextSnapshotJson: JSON.stringify(next), actorAdminId: admin.id,
      });
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), id: z.number().int().positive(), confirmation: z.literal("SUPPRIMER") }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Catalogue e‑Visa indisponible." });
      const existing = (await db.select().from(managedEvisaDestinations).where(eq(managedEvisaDestinations.id, input.id)).limit(1))[0];
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Destination e‑Visa introuvable." });
      await db.delete(managedEvisaDestinations).where(eq(managedEvisaDestinations.id, input.id));
      await db.insert(evisaCatalogueAuditLogs).values({
        destinationId: existing.id, destinationSlug: existing.slug, action: "deleted", summary: summaryFor("deleted", existing.country),
        previousSnapshotJson: JSON.stringify(serialise(existing)), nextSnapshotJson: null, actorAdminId: admin.id,
      });
      return { success: true };
    }),

  restoreVersion: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), auditId: z.number().int().positive(), confirmation: z.literal("RESTAURER") }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Catalogue e‑Visa indisponible." });
      const audit = (await db.select().from(evisaCatalogueAuditLogs).where(eq(evisaCatalogueAuditLogs.id, input.auditId)).limit(1))[0];
      if (!audit) throw new TRPCError({ code: "NOT_FOUND", message: "Version d’audit introuvable." });
      const snapshot = parseAuditSnapshot(audit.previousSnapshotJson);
      const parsed = destinationInput.safeParse(snapshot);
      if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette version ne contient pas une destination restaurable." });
      const restored = parsed.data;
      const existing = (await db.select().from(managedEvisaDestinations).where(eq(managedEvisaDestinations.slug, restored.slug)).limit(1))[0];
      const values = {
        slug: restored.slug, country: restored.country, capital: restored.capital, flag: restored.flag, region: restored.region, visaType: restored.visaType,
        duration: restored.duration, delay: restored.delay, requirements: restored.requirements, fee: restored.fee, notes: restored.notes,
        imageUrl: restored.imageUrl || null, officialPortalUrl: restored.officialPortalUrl, officialPortalLabel: restored.officialPortalLabel,
        officialVerifiedAt: restored.officialVerifiedAt, highlightsJson: JSON.stringify(restored.highlights), emblemsJson: JSON.stringify(restored.emblems),
        stepsJson: JSON.stringify(restored.steps), isActive: restored.isActive, updatedByAdminId: admin.id,
      };
      let destinationId: number;
      if (existing) {
        await db.update(managedEvisaDestinations).set(values).where(eq(managedEvisaDestinations.id, existing.id));
        destinationId = existing.id;
      } else {
        const result = await db.insert(managedEvisaDestinations).values({ ...values, createdByAdminId: admin.id });
        destinationId = Number((result as any)[0]?.insertId ?? 0);
      }
      const current = (await db.select().from(managedEvisaDestinations).where(eq(managedEvisaDestinations.id, destinationId)).limit(1))[0];
      await db.insert(evisaCatalogueAuditLogs).values({
        destinationId, destinationSlug: restored.slug, action: "restored", summary: `Version antérieure de ${restored.country} restaurée depuis l’audit #${audit.id}.`,
        previousSnapshotJson: existing ? JSON.stringify(serialise(existing)) : null, nextSnapshotJson: current ? JSON.stringify(serialise(current)) : JSON.stringify(restored), actorAdminId: admin.id,
      });
      return { success: true, destination: current ? serialise(current) : null };
    }),

  listAudit: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Audit e‑Visa indisponible." });
      const rows = await db.select().from(evisaCatalogueAuditLogs).orderBy(desc(evisaCatalogueAuditLogs.createdAt)).limit(input.limit);
      return rows.map((row) => ({ ...row, previousSnapshot: parseAuditSnapshot(row.previousSnapshotJson), nextSnapshot: parseAuditSnapshot(row.nextSnapshotJson) }));
    }),
});
