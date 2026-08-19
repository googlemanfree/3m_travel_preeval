import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { managedConsularPortalAuditLogs, managedConsularPortals } from "../../drizzle/consularPortalSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";

const portalInput = z.object({
  countryCode: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le code pays est invalide.").min(2).max(120),
  countryName: z.string().trim().min(2).max(160),
  officialPortalUrl: z.string().trim().url("Saisissez une URL valide.").refine((url) => url.startsWith("https://"), "Le lien doit utiliser HTTPS.").optional().or(z.literal("")),
  officialPortalLabel: z.string().trim().max(255).optional().or(z.literal("")),
  officialVerifiedAt: z.string().trim().max(80).optional().or(z.literal("")),
  verificationStatus: z.enum(["verifie", "a_completer"]),
  verificationNote: z.string().trim().max(3000).optional().or(z.literal("")),
  revalidateDueAt: z.string().trim().max(80).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.verificationStatus === "verifie" && !value.officialPortalUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["officialPortalUrl"], message: "Un lien HTTPS est obligatoire pour confirmer une fiche." });
  }
});

const serialise = (row: typeof managedConsularPortals.$inferSelect) => ({
  ...row,
  officialPortalUrl: row.officialPortalUrl ?? "",
  officialPortalLabel: row.officialPortalLabel ?? "",
  officialVerifiedAt: row.officialVerifiedAt ?? "",
  verificationNote: row.verificationNote ?? "",
  revalidateDueAt: row.revalidateDueAt?.toISOString() ?? "",
  lastRevalidationAlertAt: row.lastRevalidationAlertAt?.toISOString() ?? "",
});

export const consularRegistryRouter = router({
  listOverrides: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registre consulaire indisponible." });
      const rows = await db.select().from(managedConsularPortals);
      return rows.map(serialise);
    }),

  upsertOverride: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), portal: portalInput }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registre consulaire indisponible." });
      const value = input.portal;
      const existing = (await db.select().from(managedConsularPortals).where(eq(managedConsularPortals.countryCode, value.countryCode)).limit(1))[0];
      const values = {
        countryCode: value.countryCode,
        countryName: value.countryName,
        officialPortalUrl: value.officialPortalUrl || null,
        officialPortalLabel: value.officialPortalLabel || null,
        officialVerifiedAt: value.officialVerifiedAt || null,
        verificationStatus: value.verificationStatus,
        verificationNote: value.verificationNote || null,
        revalidateDueAt: value.revalidateDueAt ? new Date(value.revalidateDueAt) : null,
        updatedByAdminId: admin.id,
      } as const;
      let portalId: number;
      const action = existing ? "updated" as const : "created" as const;
      if (existing) {
        await db.update(managedConsularPortals).set(values).where(eq(managedConsularPortals.id, existing.id));
        portalId = existing.id;
      } else {
        const result = await db.insert(managedConsularPortals).values(values);
        portalId = Number((result as unknown as { insertId?: number })?.insertId ?? (result as any)[0]?.insertId ?? 0);
      }
      const current = (await db.select().from(managedConsularPortals).where(eq(managedConsularPortals.id, portalId)).limit(1))[0];
      if (!current) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La mise à jour du registre n’a pas pu être confirmée." });
      await db.insert(managedConsularPortalAuditLogs).values({
        portalId,
        countryCode: value.countryCode,
        action,
        summary: action === "created" ? `Fiche consulaire ${value.countryName} créée.` : `Lien institutionnel ${value.countryName} mis à jour.`,
        previousSnapshotJson: existing ? JSON.stringify(serialise(existing)) : null,
        nextSnapshotJson: JSON.stringify(serialise(current)),
        actorAdminId: admin.id,
      });
      return { success: true, portal: serialise(current) };
    }),

  listRevalidationQueue: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), daysAhead: z.number().int().min(1).max(180).default(30) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registre consulaire indisponible." });
      const now = new Date();
      const deadline = new Date(now.getTime() + input.daysAhead * 24 * 60 * 60 * 1000);
      const rows = await db.select().from(managedConsularPortals);
      return rows
        .filter((row) => row.verificationStatus === "a_completer" || !row.revalidateDueAt || row.revalidateDueAt <= deadline)
        .sort((left, right) => (left.revalidateDueAt?.getTime() ?? 0) - (right.revalidateDueAt?.getTime() ?? 0))
        .map(serialise);
    }),
});
