import { and, desc, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { z } from "zod";
import { adminTextTemplateAuditEvents, adminTextTemplates } from "../../drizzle/richTextSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { improveAdministrativeRichText } from "../services/richTextAssistant";
import { richTextToPlainText, sanitizeRichTextHtml } from "../services/richText";
import { requireValidAdminSession } from "./adminAuth";
import { SHARED_BILINGUAL_TEMPLATES } from "../services/bilingualCommunicationTemplates";

const scopeSchema = z.enum(["candidate_message", "evaluation_message", "general"]);
const languageSchema = z.enum(["fr", "en"]);

const unsafeEvaluationTemplatePatterns = [
  /\b(?:score|note)\s*(?:global|d[’']?admissibilit[ée])\b/i,
  /\b(?:in[ée]ligible|[ée]ligible)\b/i,
  /\b(?:visa|emploi|admission|permis)\s+garanti\b/i,
  /\b(?:orientation|r[ée]orientation|d[ée]cision)\s+automatique\b/i,
];

function assertSafeEvaluationTemplate(scope: z.infer<typeof scopeSchema>, contentText: string): void {
  if (scope !== "evaluation_message") return;
  if (unsafeEvaluationTemplatePatterns.some((pattern) => pattern.test(contentText))) {
    throw new Error("Un modèle d’évaluation ne peut pas contenir de score, décision d’éligibilité, garantie ou orientation automatique.");
  }
}

function fingerprint(contentText: string): string {
  return createHash("sha256").update(contentText, "utf8").digest("hex");
}

async function auditTemplateChange(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  input: {
    templateId: number;
    templateName: string;
    scope: z.infer<typeof scopeSchema>;
    language: z.infer<typeof languageSchema>;
    action: "created" | "updated" | "deleted";
    actorAdminId: number;
    contentText: string;
    reason?: string;
  },
): Promise<void> {
  await db.insert(adminTextTemplateAuditEvents).values({
    templateId: input.templateId,
    templateName: input.templateName,
    scope: input.scope,
    language: input.language,
    action: input.action,
    actorAdminId: input.actorAdminId,
    contentFingerprint: fingerprint(input.contentText),
    reason: input.reason?.trim() || null,
  });
}

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
    assertSafeEvaluationTemplate(input.scope, contentText);
    const result = await db.insert(adminTextTemplates).values({ name: input.name, scope: input.scope, language: input.language, contentHtml, contentText, createdByAdminId: admin.id, updatedByAdminId: admin.id });
    const id = Number((result as any)[0]?.insertId ?? 0);
    if (id > 0) await auditTemplateChange(db, { templateId: id, templateName: input.name, scope: input.scope, language: input.language, action: "created", actorAdminId: admin.id, contentText });
    return { success: true, id };
  }),

  update: publicProcedure.input(z.object({ sessionToken: z.string().min(1), id: z.number().int().positive(), name: z.string().trim().min(3).max(120), scope: scopeSchema, language: languageSchema, contentHtml: z.string().trim().min(3).max(12000), reason: z.string().trim().min(8).max(500) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible.");
    const existing = (await db.select().from(adminTextTemplates).where(eq(adminTextTemplates.id, input.id)).limit(1))[0];
    if (!existing) throw new Error("Modèle introuvable.");
    const contentHtml = sanitizeRichTextHtml(input.contentHtml);
    const contentText = richTextToPlainText(contentHtml);
    if (contentText.length < 3) throw new Error("Le modèle ne contient aucun texte exploitable.");
    assertSafeEvaluationTemplate(input.scope, contentText);
    await db.update(adminTextTemplates).set({ name: input.name, scope: input.scope, language: input.language, contentHtml, contentText, updatedByAdminId: admin.id }).where(eq(adminTextTemplates.id, existing.id));
    await auditTemplateChange(db, { templateId: existing.id, templateName: input.name, scope: input.scope, language: input.language, action: "updated", actorAdminId: admin.id, contentText, reason: input.reason });
    return { success: true };
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

  delete: publicProcedure.input(z.object({ sessionToken: z.string().min(1), id: z.number().int().positive(), reason: z.string().trim().min(8).max(500) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new Error("Base de données indisponible.");
    const existing = (await db.select().from(adminTextTemplates).where(eq(adminTextTemplates.id, input.id)).limit(1))[0];
    if (!existing) throw new Error("Modèle introuvable.");
    await db.delete(adminTextTemplates).where(eq(adminTextTemplates.id, existing.id));
    await auditTemplateChange(db, { templateId: existing.id, templateName: existing.name, scope: existing.scope, language: existing.language, action: "deleted", actorAdminId: admin.id, contentText: existing.contentText, reason: input.reason });
    return { success: true };
  }),

  improve: publicProcedure.input(z.object({ sessionToken: z.string().min(1), scope: scopeSchema, contentHtml: z.string().trim().min(3).max(12000) })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return improveAdministrativeRichText(input.contentHtml, input.scope);
  }),
});
