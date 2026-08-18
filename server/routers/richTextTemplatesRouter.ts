import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { adminTextTemplates } from "../../drizzle/richTextSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { improveAdministrativeRichText } from "../services/richTextAssistant";
import { richTextToPlainText, sanitizeRichTextHtml } from "../services/richText";
import { requireValidAdminSession } from "./adminAuth";

const scopeSchema = z.enum(["candidate_message", "evaluation_message", "general"]);

export const richTextTemplatesRouter = router({
  list: publicProcedure.input(z.object({ sessionToken: z.string().min(1), scope: scopeSchema.optional() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible.");
    const where = input.scope ? eq(adminTextTemplates.scope, input.scope) : undefined;
    return db.select().from(adminTextTemplates).where(where).orderBy(desc(adminTextTemplates.updatedAt)).limit(80);
  }),

  create: publicProcedure.input(z.object({ sessionToken: z.string().min(1), name: z.string().trim().min(3).max(120), scope: scopeSchema, contentHtml: z.string().trim().min(3).max(12000) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible.");
    const contentHtml = sanitizeRichTextHtml(input.contentHtml);
    const contentText = richTextToPlainText(contentHtml);
    if (contentText.length < 3) throw new Error("Le modèle ne contient aucun texte exploitable.");
    const result = await db.insert(adminTextTemplates).values({ name: input.name, scope: input.scope, contentHtml, contentText, createdByAdminId: admin.id, updatedByAdminId: admin.id });
    return { success: true, id: Number((result as any)[0]?.insertId ?? 0) };
  }),

  delete: publicProcedure.input(z.object({ sessionToken: z.string().min(1), id: z.number().int().positive() })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible.");
    await db.delete(adminTextTemplates).where(eq(adminTextTemplates.id, input.id));
    return { success: true };
  }),

  improve: publicProcedure.input(z.object({ sessionToken: z.string().min(1), scope: scopeSchema, contentHtml: z.string().trim().min(3).max(12000) })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return improveAdministrativeRichText(input.contentHtml, input.scope);
  }),
});
