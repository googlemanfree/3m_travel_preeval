import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminSavedViews } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireAdminSessionFromCookie } from "./adminAuth";

const savedViewStateSchema = z.object({
  searchQuery: z.string().max(120).default(""),
  statusFilter: z.string().max(50).default("tous"),
  paymentFilter: z.string().max(50).default("tous"),
  scoreFilter: z.string().max(50).default("tous"),
  destinationFilter: z.string().max(100).default("tous"),
  sortBy: z.enum(["createdAt", "fullName", "score"]).default("createdAt"),
  page: z.number().int().min(1).default(1),
  pageSize: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]).default(25),
});

export const adminSavedViewsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const rows = await db.select().from(adminSavedViews)
      .where(eq(adminSavedViews.adminAccountId, admin.id))
      .orderBy(desc(adminSavedViews.updatedAt));
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      state: savedViewStateSchema.parse(JSON.parse(row.stateJson)),
      updatedAt: row.updatedAt,
    }));
  }),

  save: publicProcedure.input(z.object({
    name: z.string().trim().min(2).max(80),
    state: savedViewStateSchema,
  })).mutation(async ({ input, ctx }) => {
    const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const existing = await db.select({ id: adminSavedViews.id }).from(adminSavedViews)
      .where(and(eq(adminSavedViews.adminAccountId, admin.id), eq(adminSavedViews.name, input.name)))
      .limit(1);
    if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Une vue portant ce nom existe déjà." });
    const count = await db.select({ id: adminSavedViews.id }).from(adminSavedViews)
      .where(eq(adminSavedViews.adminAccountId, admin.id));
    if (count.length >= 20) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Maximum de 20 vues favorites atteint." });
    await db.insert(adminSavedViews).values({
      adminAccountId: admin.id,
      name: input.name,
      stateJson: JSON.stringify(input.state),
    });
    return { success: true };
  }),

  remove: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.delete(adminSavedViews).where(and(eq(adminSavedViews.id, input.id), eq(adminSavedViews.adminAccountId, admin.id)));
    return { success: true };
  }),
});
