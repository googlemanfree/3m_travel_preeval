import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { adminTextTemplates } from "../../drizzle/richTextSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { improveAdministrativeRichText } from "../services/richTextAssistant";
import { richTextToPlainText, sanitizeRichTextHtml } from "../services/richText";
import { requireValidAdminSession } from "./adminAuth";
import { SHARED_BILINGUAL_TEMPLATES } from "../services/bilingualCommunicationTemplates";

const scopeSchema = z.enum(["candidate_message", "evaluation_message", "general"]);
const languageSchema = z.enum(["fr", "en"]);

export const richTextTemplatesRouter = router({
  list: publicProcedure.input(z.object({ sessionToken: z.string().min(1), scope: scopeSchema.optional(), language: languageSchema.optional() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible.");
    const filters = [input.scope ? eq(adminTextTemplates.scope, input.scope) : undefined, input.language ? eq(adminTextTemplates.language, input.language) : undefined].filter(Boolean) as any[];
    const where = filters.length ? (filters.length === 1 ? filters[0] : and(...filters)) : undefined;
    return db.select().from(adminTextTemplates).where(where).orderBy(desc(adminTextTemplates.updatedAt)).limit(80);
  }),

  create: publicProcedure.input(z.object({ sessionToken: z.string().min(1), name: z.string().trim().min(3).max(120), scope: scopeSchema, language: languageSchema.default("fr"), contentHtml: z.string().trim().min(3).max(12000) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible.");
    const contentHtml = sanitizeRichTextHtml(input.contentHtml);
    const contentText = richTextToPlainText(contentHtml);
    if (contentText.length < 3) throw new Error("Le modèle ne contient aucun texte exploitable.");
    const result = await db.insert(adminTextTemplates).values({ name: input.name, scope: input.scope, language: input.language, contentHtml, contentText, createdByAdminId: admin.id, updatedByAdminId: admin.id });
    return { success: true, id: Number((result as any)[0]?.insertId ?? 0) };
  }),

  bootstrapSharedBilingual: publicProcedure.input(z.object({ sessionToken: z.string().min(1) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible.");
    const existing = await db.select({ name: adminTextTemplates.name, scope: adminTextTemplates.scope, language: adminTextTemplates.language }).from(adminTextTemplates).limit(500);
    const existingKeys = new Set(existing.map((template) => `${template.scope}:${template.language}:${template.name}`));
    const missing = SHARED_BILINGUAL_TEMPLATES.filter((template) => !existingKeys.has(`${template.scope}:${template.language}:${template.name}`));
    for (const template of missing) {
      const contentHtml = sanitizeRichTextHtml(template.contentHtml);
      await db.insert(adminTextTemplates).values({ ...template, contentHtml, contentText: richTextToPlainText(contentHtml), createdByAdminId: admin.id, updatedByAdminId: admin.id });
    }
    return { success: true, created: missing.length, total: SHARED_BILINGUAL_TEMPLATES.length };
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
