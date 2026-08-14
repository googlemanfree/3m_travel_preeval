import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { getDb } from "../db";
import { adminAuditLogs } from "../../drizzle/schema";

const listInput = z.object({
  sessionToken: z.string().min(1),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
  search: z.string().trim().max(120).default(""),
  action: z.string().trim().max(120).default("all"),
  category: z.enum(["all", "auth", "mutation", "access", "security"]).default("all"),
  outcome: z.enum(["all", "success", "failure"]).default("all"),
});

export const adminAuditRouter = router({
  list: publicProcedure.input(listInput).query(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    const filters = [
      input.category !== "all" ? eq(adminAuditLogs.category, input.category) : undefined,
      input.outcome !== "all" ? eq(adminAuditLogs.outcome, input.outcome) : undefined,
      input.action !== "all" ? eq(adminAuditLogs.action, input.action) : undefined,
      input.search
        ? or(
            like(adminAuditLogs.adminEmail, `%${input.search}%`),
            like(adminAuditLogs.action, `%${input.search}%`),
            like(adminAuditLogs.resourceType, `%${input.search}%`),
            like(adminAuditLogs.resourceId, `%${input.search}%`),
          )
        : undefined,
    ].filter(Boolean) as NonNullable<Parameters<typeof and>[0]>[];

    const where = filters.length ? and(...filters) : undefined;
    const offset = (input.page - 1) * input.pageSize;

    const [rows, [{ total }]] = await Promise.all([
      db.select().from(adminAuditLogs).where(where).orderBy(desc(adminAuditLogs.createdAt)).limit(input.pageSize).offset(offset),
      db.select({ total: count() }).from(adminAuditLogs).where(where),
    ]);

    return {
      rows,
      total: Number(total),
      page: input.page,
      pageSize: input.pageSize,
      pages: Math.max(1, Math.ceil(Number(total) / input.pageSize)),
      viewer: { id: admin.id, email: admin.email },
    };
  }),
});
