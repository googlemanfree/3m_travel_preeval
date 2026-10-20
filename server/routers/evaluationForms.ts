import { TRPCError } from "@trpc/server";
import { asc, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { evaluationFormOverrides } from "../../drizzle/schema";
import {
  OVERRIDE_ACTIONS,
  OVERRIDE_SECTIONS,
  PROJECT_KINDS,
  getDomain,
  getProgram,
  resolveDynamicForm,
  validateOverride,
  type FormOverride,
} from "../../shared/dynamicForm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invalidateFormOverrides, loadFormOverrides, rowToOverride } from "../services/formOverrides";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireValidAdminSession } from "./adminAuth";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const MAX_OVERRIDES = 300;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Les questions modifiables ne sont pas encore activées : la migration 0086 doit être appliquée." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const payloadSchema = z.object({
  label: z.string().trim().max(200).optional(),
  help: z.string().trim().max(400).optional(),
  placeholder: z.string().trim().max(160).optional(),
  kind: z.enum(["text", "textarea", "select", "date"]).optional(),
  options: z.array(z.object({ value: z.string().trim().min(1).max(40), label: z.string().trim().min(1).max(120) })).max(12).optional(),
  required: z.boolean().optional(),
  section: z.enum(OVERRIDE_SECTIONS).optional(),
});

const overrideInput = z.object({
  sessionToken: z.string().min(1).max(512),
  id: z.number().int().positive().optional(),
  fieldKey: z.string().trim().min(2).max(60),
  action: z.enum(OVERRIDE_ACTIONS),
  projectKind: z.enum(PROJECT_KINDS).nullish(),
  programId: z.string().trim().max(80).nullish(),
  domainId: z.string().trim().max(40).nullish(),
  countryCode: z.string().trim().length(2).nullish(),
  payload: payloadSchema.nullish(),
  note: z.string().trim().max(300).optional(),
});

/** Questions modifiables par l'administration : lecture publique des règles actives, gestion réservée à l'administration. */
export const evaluationFormsRouter = router({
  /** Les formulaires ont besoin des règles actives (libellés et questions ajoutées) : rien de sensible n'y figure. */
  activeOverrides: publicProcedure.query(async () => {
    const db = await getDb();
    const list = await loadFormOverrides(db);
    return list.map((override) => ({ id: override.id, fieldKey: override.fieldKey, action: override.action, projectKind: override.projectKind ?? null, programId: override.programId ?? null, domainId: override.domainId ?? null, countryCode: override.countryCode ?? null, payload: override.payload ?? null }));
  }),

  adminList: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512) })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(evaluationFormOverrides).orderBy(desc(evaluationFormOverrides.id)).limit(MAX_OVERRIDES);
    return rows.map((row) => ({ ...rowToOverride(row), note: row.note, createdByLabel: row.createdByLabel, createdAt: row.createdAt, active: Boolean(row.active) }));
  })),

  /** Les questions du formulaire pour un contexte, telles qu'elles s'afficheront, avec l'état de chacune. */
  adminPreview: publicProcedure.input(z.object({
    sessionToken: z.string().min(1).max(512),
    projectType: z.enum(PROJECT_KINDS),
    country: z.string().trim().max(100).optional(),
    programId: z.string().trim().max(80).optional(),
    domainId: z.string().trim().max(40).optional(),
  })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const overrides = await loadFormOverrides(db);
    const context = { country: input.country, projectType: input.projectType, programId: input.programId, domainId: input.domainId };
    const base = resolveDynamicForm(context);
    const applied = resolveDynamicForm({ ...context, overrides });
    const appliedByKey = new Map(applied.sections.flatMap((section) => section.fields.map((field) => [field.key, field] as const)));
    const baseKeys = new Set(base.sections.flatMap((section) => section.fields.map((field) => field.key)));
    return {
      program: { id: base.program.id, label: base.program.label },
      domain: base.domain ? { id: base.domain.id, label: base.domain.label } : null,
      countryCode: base.countryCode,
      sections: [
        ...base.sections.map((section) => ({
          id: section.id,
          title: section.title,
          fields: section.fields.map((field) => {
            const current = appliedByKey.get(field.key);
            return { key: field.key, label: current?.label ?? field.label, baseLabel: field.label, kind: field.kind, required: current ? Boolean(current.required) : Boolean(field.required), hidden: !current, custom: false };
          }),
        })),
        ...applied.sections.map((section) => ({
          id: `${section.id}-custom`,
          title: `${section.title} — questions ajoutées`,
          fields: section.fields.filter((field) => !baseKeys.has(field.key)).map((field) => ({ key: field.key, label: field.label, baseLabel: field.label, kind: field.kind, required: Boolean(field.required), hidden: false, custom: true })),
        })).filter((section) => section.fields.length > 0),
      ],
    };
  })),

  adminSave: publicProcedure.input(overrideInput).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const override: FormOverride = { fieldKey: input.fieldKey, action: input.action, projectKind: input.projectKind ?? null, programId: input.programId ?? null, domainId: input.domainId ?? null, countryCode: input.countryCode ? input.countryCode.toUpperCase() : null, payload: input.payload ?? null };
    const problem = validateOverride(override);
    if (problem) throw new TRPCError({ code: "BAD_REQUEST", message: problem });
    if (override.programId) {
      const program = getProgram(override.programId);
      if (!program) throw new TRPCError({ code: "BAD_REQUEST", message: "Visa ou programme inconnu." });
      if (override.projectKind && program.kind !== override.projectKind) throw new TRPCError({ code: "BAD_REQUEST", message: "Ce visa ou programme n'appartient pas à ce type de projet." });
    }
    if (override.domainId && !getDomain(override.domainId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Domaine inconnu." });
    const values = {
      fieldKey: override.fieldKey,
      action: override.action,
      projectKind: override.projectKind ?? null,
      programId: override.programId ?? null,
      domainId: override.domainId ?? null,
      countryCode: override.countryCode ?? null,
      payload: override.payload ? JSON.stringify(override.payload) : null,
      note: input.note ?? null,
    };
    let id = input.id ?? 0;
    if (input.id) {
      await db.update(evaluationFormOverrides).set(values).where(eq(evaluationFormOverrides.id, input.id));
    } else {
      const [{ total = 0 } = { total: 0 }] = await db.select({ total: count() }).from(evaluationFormOverrides);
      if (Number(total) >= MAX_OVERRIDES) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Nombre maximal de règles atteint : supprimez celles qui ne servent plus." });
      const created = await db.insert(evaluationFormOverrides).values({ ...values, createdByAdminId: admin.id, createdByLabel: adminLabel(admin) });
      id = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    invalidateFormOverrides();
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "evaluation_form.override_saved", resourceType: "evaluation_form_override", resourceId: id, details: `${override.action} ${override.fieldKey}`.slice(0, 200) });
    return { id };
  })),

  adminSetActive: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512), id: z.number().int().positive(), active: z.boolean() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.update(evaluationFormOverrides).set({ active: input.active }).where(eq(evaluationFormOverrides.id, input.id));
    invalidateFormOverrides();
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: input.active ? "evaluation_form.override_enabled" : "evaluation_form.override_disabled", resourceType: "evaluation_form_override", resourceId: input.id });
    return { ok: true as const };
  })),

  adminDelete: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512), id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.delete(evaluationFormOverrides).where(eq(evaluationFormOverrides.id, input.id));
    invalidateFormOverrides();
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "evaluation_form.override_deleted", resourceType: "evaluation_form_override", resourceId: input.id });
    return { ok: true as const };
  })),
});
