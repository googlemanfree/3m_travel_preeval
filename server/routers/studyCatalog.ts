import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { adminNotifications, candidates, clientNotifications } from "../../drizzle/schema";
import {
  studyApplicationEvents,
  studyApplications,
  studyInstitutions,
  studyIntakes,
  studyPrograms,
  studyTuitionFees,
} from "../../drizzle/studyCatalogSchema";
import {
  CATALOG_STATUSES,
  INSTITUTION_TYPES,
  INTAKE_AVAILABILITIES,
  MAX_ACTIVE_STUDY_APPLICATIONS,
  STUDENT_CATEGORIES,
  STUDY_APPLICATION_STATUSES,
  STUDY_CONSENT_VERSION,
  STUDY_LEVELS,
  STUDY_MODES,
  STUDY_STATUS_CLIENT_NEXT,
  STUDY_STATUS_LABELS,
  TERMINAL_STUDY_STATUSES,
  TUITION_PERIODS,
  canApplyToIntake,
  effectiveAvailability,
  feePublishBlockers,
  institutionPublishBlockers,
  intakePublishBlockers,
  isStudyStatusChangeAllowed,
  tuitionFreshness,
  tuitionLabel,
  type StudyApplicationStatus,
} from "../../shared/studyCatalog";
import { WORLD_COUNTRY_ROWS } from "../../shared/worldCountries";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireValidAdminSession } from "./adminAuth";
import { candidateProcedure } from "./candidate";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const WORLD_CODES = new Set(WORLD_COUNTRY_ROWS.map((row) => row[0]));

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
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le catalogue études n'est pas encore activé : la migration 0088 doit être appliquée." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const session = z.string().min(1).max(512);
const countryCode = z.string().trim().length(2).transform((value) => value.toUpperCase()).refine((value) => WORLD_CODES.has(value), "Pays inconnu.");
const status = z.enum(CATALOG_STATUSES);
const text = (max: number) => z.string().trim().max(max).nullish().transform((value) => (value ? value : null));
const isoDay = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.");
const optionalDay = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().transform((value) => (value ? value : null));
const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);

async function audit(db: Db, admin: { id: number; email?: string | null }, action: string, resourceId: string | number, details: string) {
  await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action, resourceType: "study_catalog", resourceId, details: details.slice(0, 300) });
}

function checkedFields(markChecked: boolean | undefined) {
  return markChecked ? { checkedAt: new Date() } : {};
}

function refuseIfBlocked(blockers: string[]) {
  if (blockers.length > 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Publication impossible : ${blockers.join(" ")}` });
}

/**
 * Écoles, rentrées et scolarités. Lecture publique : uniquement le publié, sans site d'établissement ni provenance des montants.
 * Candidature : réservée au candidat connecté, avec consentement ; l'agence traite et dépose auprès de l'établissement.
 */
export const studyCatalogRouter = router({
  schools: publicProcedure.input(z.object({ countryCode })).query(({ input }) => guarded(async () => {
    const db = await requireDb();
    const institutions = await db.select().from(studyInstitutions).where(and(eq(studyInstitutions.countryCode, input.countryCode), eq(studyInstitutions.status, "published"))).orderBy(asc(studyInstitutions.name));
    if (institutions.length === 0) return [];
    const programs = await db.select().from(studyPrograms).where(and(inArray(studyPrograms.institutionId, institutions.map((row) => row.id)), eq(studyPrograms.status, "published"))).orderBy(asc(studyPrograms.name));
    const programIds = programs.map((row) => row.id);
    const [intakes, fees] = programIds.length
      ? await Promise.all([
        db.select().from(studyIntakes).where(and(inArray(studyIntakes.programId, programIds), eq(studyIntakes.status, "published"))).orderBy(asc(studyIntakes.startDate)),
        db.select().from(studyTuitionFees).where(and(inArray(studyTuitionFees.programId, programIds), eq(studyTuitionFees.status, "published"))).orderBy(desc(studyTuitionFees.academicYear)),
      ])
      : [[], []];
    const now = new Date();
    return institutions.map((institution) => ({
      id: institution.id,
      name: institution.name,
      city: institution.city,
      institutionType: institution.institutionType,
      publicPrivate: institution.publicPrivate,
      agencyRelation: institution.agencyRelation,
      accreditationNote: institution.accreditationNote,
      programs: programs.filter((program) => program.institutionId === institution.id).map((program) => ({
        id: program.id,
        name: program.name,
        level: program.level,
        field: program.field,
        teachingLanguage: program.teachingLanguage,
        durationMonths: program.durationMonths,
        mode: program.mode,
        admissionNote: program.admissionNote,
        languageNote: program.languageNote,
        intakes: intakes.filter((intake) => intake.programId === program.id).map((intake) => ({
          id: intake.id,
          label: intake.label,
          startDate: intake.startDate,
          applicationsOpenAt: intake.applicationsOpenAt,
          applicationDeadline: intake.applicationDeadline,
          availability: effectiveAvailability(intake, now),
          canApply: canApplyToIntake(intake, now),
        })),
        fees: fees.filter((fee) => fee.programId === program.id).map((fee) => ({
          id: fee.id,
          studentCategory: fee.studentCategory,
          label: tuitionLabel(fee, now),
          applicationFee: fee.applicationFee,
          extraNote: fee.extraNote,
          stale: tuitionFreshness(fee.checkedAt, now) !== "fresh",
        })),
      })),
    }));
  })),

  myApplications: candidateProcedure.query(({ ctx }) => guarded(async () => {
    const db = await requireDb();
    const rows = await db.select().from(studyApplications).where(eq(studyApplications.candidateId, ctx.candidate.id)).orderBy(asc(studyApplications.preferenceRank), desc(studyApplications.submittedAt));
    if (rows.length === 0) return [];
    const intakes = await db.select().from(studyIntakes).where(inArray(studyIntakes.id, rows.map((row) => row.intakeId)));
    const programs = intakes.length ? await db.select().from(studyPrograms).where(inArray(studyPrograms.id, intakes.map((row) => row.programId))) : [];
    const institutions = programs.length ? await db.select().from(studyInstitutions).where(inArray(studyInstitutions.id, programs.map((row) => row.institutionId))) : [];
    return rows.map((row) => {
      const intake = intakes.find((item) => item.id === row.intakeId);
      const program = programs.find((item) => item.id === intake?.programId);
      const institution = institutions.find((item) => item.id === program?.institutionId);
      return {
        id: row.id,
        rank: row.preferenceRank,
        status: row.status,
        statusLabel: STUDY_STATUS_LABELS[row.status],
        next: STUDY_STATUS_CLIENT_NEXT[row.status],
        institutionName: institution?.name ?? "Établissement",
        programName: program?.name ?? "Programme",
        intakeLabel: intake?.label ?? "",
        startDate: intake?.startDate ?? null,
        submittedAt: iso(row.submittedAt),
        lastStatusAt: iso(row.lastStatusAt),
        canWithdraw: !TERMINAL_STUDY_STATUSES.includes(row.status) && !["admission_letter_received", "visa_phase", "deposit_paid"].includes(row.status),
      };
    });
  })),

  applyToIntake: candidateProcedure.input(z.object({
    intakeId: z.number().int().positive(),
    consent: z.boolean().refine((value) => value === true, "Votre accord est nécessaire pour que l'agence prépare cette candidature."),
    note: text(1000),
  })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [intake] = await db.select().from(studyIntakes).where(and(eq(studyIntakes.id, input.intakeId), eq(studyIntakes.status, "published"))).limit(1);
    if (!intake) throw new TRPCError({ code: "NOT_FOUND", message: "Cette rentrée n'est plus proposée." });
    const [program] = await db.select().from(studyPrograms).where(and(eq(studyPrograms.id, intake.programId), eq(studyPrograms.status, "published"))).limit(1);
    const [institution] = program ? await db.select().from(studyInstitutions).where(and(eq(studyInstitutions.id, program.institutionId), eq(studyInstitutions.status, "published"))).limit(1) : [];
    if (!program || !institution) throw new TRPCError({ code: "NOT_FOUND", message: "Ce programme n'est plus proposé." });
    if (!canApplyToIntake(intake)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Les candidatures pour cette rentrée sont closes." });

    const existing = await db.select({ id: studyApplications.id, status: studyApplications.status }).from(studyApplications).where(and(eq(studyApplications.candidateId, ctx.candidate.id), eq(studyApplications.intakeId, intake.id))).limit(1);
    if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Vous avez déjà postulé à cette rentrée." });
    const [{ active = 0 } = { active: 0 }] = await db.select({ active: sql<number>`count(*)` }).from(studyApplications).where(and(eq(studyApplications.candidateId, ctx.candidate.id), notInArray(studyApplications.status, [...TERMINAL_STUDY_STATUSES])));
    if (Number(active) >= MAX_ACTIVE_STUDY_APPLICATIONS) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Vous avez déjà ${MAX_ACTIVE_STUDY_APPLICATIONS} candidatures en cours. Retirez-en une ou parlez-en à votre conseiller.` });

    const created = await db.insert(studyApplications).values({
      candidateId: ctx.candidate.id,
      intakeId: intake.id,
      preferenceRank: Number(active) + 1,
      consentTextVersion: STUDY_CONSENT_VERSION,
      candidateNote: input.note,
    });
    const applicationId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    await db.insert(studyApplicationEvents).values({ applicationId, actorType: "candidate", actorId: ctx.candidate.id, action: "submitted", note: `${institution.name} · ${program.name} · ${intake.label}`.slice(0, 1000) });
    try {
      await db.insert(adminNotifications).values({
        type: "new_contact_message",
        title: "Nouvelle candidature études",
        message: `${ctx.candidate.fullName} — ${institution.name} — ${program.name} (${intake.label})`.slice(0, 1000),
        relatedId: `study_application:${applicationId}`,
        targetAdminType: "accompagnement",
      });
      await db.insert(clientNotifications).values({
        candidateId: ctx.candidate.id,
        type: "study_application",
        title: "Candidature études reçue",
        body: `Votre candidature à ${institution.name} (${program.name}, ${intake.label}) est reçue. Votre conseiller vérifie vos pièces avant de la déposer.`,
        actionUrl: "/mon-espace",
        isRead: false,
      });
    } catch {
      // Les notifications ne doivent jamais faire échouer la candidature elle-même.
    }
    return { id: applicationId, rank: Number(active) + 1 };
  })),

  withdraw: candidateProcedure.input(z.object({ applicationId: z.number().int().positive() })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [row] = await db.select().from(studyApplications).where(and(eq(studyApplications.id, input.applicationId), eq(studyApplications.candidateId, ctx.candidate.id))).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Candidature introuvable." });
    if (!isStudyStatusChangeAllowed(row.status, "withdrawn") || ["admission_letter_received", "visa_phase", "deposit_paid"].includes(row.status)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette candidature est trop avancée pour être retirée ici : contactez votre conseiller." });
    }
    await db.update(studyApplications).set({ status: "withdrawn", lastStatusAt: new Date() }).where(eq(studyApplications.id, row.id));
    await db.insert(studyApplicationEvents).values({ applicationId: row.id, actorType: "candidate", actorId: ctx.candidate.id, action: "withdrawn" });
    return { ok: true as const };
  })),

  // ─── Administration ────────────────────────────────────────────────────────────────────────────

  adminTree: publicProcedure.input(z.object({ sessionToken: session, countryCode: countryCode.optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const institutions = await db.select().from(studyInstitutions).where(input.countryCode ? eq(studyInstitutions.countryCode, input.countryCode) : undefined).orderBy(asc(studyInstitutions.countryCode), asc(studyInstitutions.name)).limit(300);
    const ids = institutions.map((row) => row.id);
    const programs = ids.length ? await db.select().from(studyPrograms).where(inArray(studyPrograms.institutionId, ids)).orderBy(asc(studyPrograms.name)) : [];
    const programIds = programs.map((row) => row.id);
    const [intakes, fees] = programIds.length
      ? await Promise.all([
        db.select().from(studyIntakes).where(inArray(studyIntakes.programId, programIds)).orderBy(asc(studyIntakes.startDate)),
        db.select().from(studyTuitionFees).where(inArray(studyTuitionFees.programId, programIds)).orderBy(desc(studyTuitionFees.academicYear)),
      ])
      : [[], []];
    return { institutions, programs, intakes, fees };
  })),

  adminSaveInstitution: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive().optional(),
    countryCode,
    city: text(120),
    name: z.string().trim().min(2).max(255),
    institutionType: z.enum(INSTITUTION_TYPES),
    publicPrivate: z.enum(["public", "private"]).nullish().transform((value) => value ?? null),
    accreditationNote: text(500),
    adminWebsite: text(600),
    agencyRelation: z.enum(["partner", "listed"]),
    status,
    markChecked: z.boolean().optional(),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { sessionToken: _token, id, markChecked, ...values } = input;
    const checked = checkedFields(markChecked);
    if (values.status === "published") {
      let checkedAt: Date | null = (checked as { checkedAt?: Date }).checkedAt ?? null;
      if (!checkedAt && id) checkedAt = (await db.select({ checkedAt: studyInstitutions.checkedAt }).from(studyInstitutions).where(eq(studyInstitutions.id, id)).limit(1))[0]?.checkedAt ?? null;
      refuseIfBlocked(institutionPublishBlockers({ name: values.name, countryCode: values.countryCode, accreditationNote: values.accreditationNote, checkedAt }));
    }
    let savedId = id ?? 0;
    if (id) await db.update(studyInstitutions).set({ ...values, ...checked }).where(eq(studyInstitutions.id, id));
    else {
      const created = await db.insert(studyInstitutions).values({ ...values, countryCode: values.countryCode, name: values.name, ...checked });
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    await audit(db, admin, "study_catalog.institution_saved", savedId, `${values.countryCode} ${values.name} (${values.status})`);
    return { id: savedId };
  })),

  adminSaveProgram: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive().optional(),
    institutionId: z.number().int().positive(),
    name: z.string().trim().min(2).max(255),
    level: z.enum(STUDY_LEVELS),
    field: text(160),
    teachingLanguage: text(80),
    durationMonths: z.number().int().min(1).max(120).nullish().transform((value) => value ?? null),
    mode: z.enum(STUDY_MODES),
    admissionNote: text(3000),
    languageNote: text(500),
    status,
    markChecked: z.boolean().optional(),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { sessionToken: _token, id, markChecked, ...values } = input;
    const [institution] = await db.select({ id: studyInstitutions.id }).from(studyInstitutions).where(eq(studyInstitutions.id, values.institutionId)).limit(1);
    if (!institution) throw new TRPCError({ code: "NOT_FOUND", message: "Établissement introuvable." });
    const checked = checkedFields(markChecked);
    let savedId = id ?? 0;
    if (id) await db.update(studyPrograms).set({ ...values, ...checked }).where(eq(studyPrograms.id, id));
    else {
      const created = await db.insert(studyPrograms).values({ ...values, ...checked });
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    await audit(db, admin, "study_catalog.program_saved", savedId, `${values.name} (${values.status})`);
    return { id: savedId };
  })),

  adminSaveIntake: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive().optional(),
    programId: z.number().int().positive(),
    label: z.string().trim().min(2).max(120),
    startDate: isoDay,
    applicationsOpenAt: optionalDay,
    applicationDeadline: optionalDay,
    documentsDeadline: optionalDay,
    availability: z.enum(INTAKE_AVAILABILITIES),
    status,
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { sessionToken: _token, id, ...values } = input;
    const [program] = await db.select({ id: studyPrograms.id }).from(studyPrograms).where(eq(studyPrograms.id, values.programId)).limit(1);
    if (!program) throw new TRPCError({ code: "NOT_FOUND", message: "Programme introuvable." });
    if (values.status === "published") refuseIfBlocked(intakePublishBlockers(values));
    const stamped = { ...values, checkedAt: new Date() };
    let savedId = id ?? 0;
    if (id) await db.update(studyIntakes).set(stamped).where(eq(studyIntakes.id, id));
    else {
      const created = await db.insert(studyIntakes).values(stamped);
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    await audit(db, admin, "study_catalog.intake_saved", savedId, `${values.label} ${values.startDate} (${values.status})`);
    return { id: savedId };
  })),

  adminSaveFee: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive().optional(),
    programId: z.number().int().positive(),
    academicYear: z.string().trim().min(9).max(9),
    studentCategory: z.enum(STUDENT_CATEGORIES),
    amount: z.number().positive().max(10_000_000),
    currency: z.string().trim().toUpperCase().length(3),
    period: z.enum(TUITION_PERIODS),
    applicationFee: z.number().min(0).max(1_000_000).nullish().transform((value) => value ?? null),
    extraNote: text(500),
    sourceNote: text(500),
    status,
    markChecked: z.boolean().optional(),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { sessionToken: _token, id, markChecked, amount, applicationFee, ...rest } = input;
    const [program] = await db.select({ id: studyPrograms.id }).from(studyPrograms).where(eq(studyPrograms.id, rest.programId)).limit(1);
    if (!program) throw new TRPCError({ code: "NOT_FOUND", message: "Programme introuvable." });
    const checked = checkedFields(markChecked);
    if (rest.status === "published") {
      let checkedAt: Date | null = (checked as { checkedAt?: Date }).checkedAt ?? null;
      if (!checkedAt && id) checkedAt = (await db.select({ checkedAt: studyTuitionFees.checkedAt }).from(studyTuitionFees).where(eq(studyTuitionFees.id, id)).limit(1))[0]?.checkedAt ?? null;
      refuseIfBlocked(feePublishBlockers({ amount, currency: rest.currency, academicYear: rest.academicYear, sourceNote: rest.sourceNote, checkedAt }));
    }
    const values = { ...rest, amount: amount.toFixed(2), applicationFee: applicationFee === null ? null : applicationFee.toFixed(2), ...checked };
    let savedId = id ?? 0;
    if (id) await db.update(studyTuitionFees).set(values).where(eq(studyTuitionFees.id, id));
    else {
      const created = await db.insert(studyTuitionFees).values(values);
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    await audit(db, admin, "study_catalog.fee_saved", savedId, `programme ${rest.programId} ${rest.academicYear} ${rest.currency} (${rest.status})`);
    return { id: savedId };
  })),

  adminDelete: publicProcedure.input(z.object({ sessionToken: session, kind: z.enum(["institution", "program", "intake", "fee"]), id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    // Une rentrée déjà demandée par un candidat ne se supprime pas : on la retire (statut « retirée »).
    const intakeIds = async (programIds: number[]) => programIds.length ? (await db.select({ id: studyIntakes.id }).from(studyIntakes).where(inArray(studyIntakes.programId, programIds))).map((row) => row.id) : [];
    const programIdsOf = async (institutionId: number) => (await db.select({ id: studyPrograms.id }).from(studyPrograms).where(eq(studyPrograms.institutionId, institutionId))).map((row) => row.id);
    const hasApplications = async (ids: number[]) => ids.length ? Number((await db.select({ n: sql<number>`count(*)` }).from(studyApplications).where(inArray(studyApplications.intakeId, ids)))[0]?.n ?? 0) > 0 : false;
    if (input.kind === "intake") {
      if (await hasApplications([input.id])) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Des candidatures existent pour cette rentrée : passez-la en « retirée » au lieu de la supprimer." });
      await db.delete(studyIntakes).where(eq(studyIntakes.id, input.id));
    } else if (input.kind === "fee") {
      await db.delete(studyTuitionFees).where(eq(studyTuitionFees.id, input.id));
    } else if (input.kind === "program") {
      const ids = await intakeIds([input.id]);
      if (await hasApplications(ids)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Des candidatures existent pour ce programme : passez-le en « retiré »." });
      if (ids.length) await db.delete(studyIntakes).where(inArray(studyIntakes.id, ids));
      await db.delete(studyTuitionFees).where(eq(studyTuitionFees.programId, input.id));
      await db.delete(studyPrograms).where(eq(studyPrograms.id, input.id));
    } else {
      const programIds = await programIdsOf(input.id);
      const ids = await intakeIds(programIds);
      if (await hasApplications(ids)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Des candidatures existent pour cet établissement : passez-le en « retiré »." });
      if (ids.length) await db.delete(studyIntakes).where(inArray(studyIntakes.id, ids));
      if (programIds.length) {
        await db.delete(studyTuitionFees).where(inArray(studyTuitionFees.programId, programIds));
        await db.delete(studyPrograms).where(inArray(studyPrograms.id, programIds));
      }
      await db.delete(studyInstitutions).where(eq(studyInstitutions.id, input.id));
    }
    await audit(db, admin, "study_catalog.deleted", input.id, input.kind);
    return { ok: true as const };
  })),

  adminApplications: publicProcedure.input(z.object({ sessionToken: session, status: z.enum(STUDY_APPLICATION_STATUSES).optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(studyApplications).where(input.status ? eq(studyApplications.status, input.status) : undefined).orderBy(desc(studyApplications.lastStatusAt)).limit(200);
    if (rows.length === 0) return [];
    const intakes = await db.select().from(studyIntakes).where(inArray(studyIntakes.id, rows.map((row) => row.intakeId)));
    const programs = intakes.length ? await db.select().from(studyPrograms).where(inArray(studyPrograms.id, intakes.map((row) => row.programId))) : [];
    const institutions = programs.length ? await db.select().from(studyInstitutions).where(inArray(studyInstitutions.id, programs.map((row) => row.institutionId))) : [];
    const people = await db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, phone: candidates.phone }).from(candidates).where(inArray(candidates.id, rows.map((row) => row.candidateId)));
    return rows.map((row) => {
      const intake = intakes.find((item) => item.id === row.intakeId);
      const program = programs.find((item) => item.id === intake?.programId);
      const institution = institutions.find((item) => item.id === program?.institutionId);
      const person = people.find((item) => item.id === row.candidateId);
      return {
        id: row.id,
        candidateId: row.candidateId,
        candidateName: person?.fullName ?? "Candidat",
        candidateEmail: person?.email ?? null,
        candidatePhone: person?.phone ?? null,
        rank: row.preferenceRank,
        status: row.status,
        institutionName: institution?.name ?? "Établissement",
        countryCode: institution?.countryCode ?? null,
        programName: program?.name ?? "Programme",
        intakeLabel: intake?.label ?? "",
        applicationDeadline: intake?.applicationDeadline ?? null,
        candidateNote: row.candidateNote,
        adminNote: row.adminNote,
        institutionReference: row.institutionReference,
        submittedAt: iso(row.submittedAt),
        lastStatusAt: iso(row.lastStatusAt),
      };
    });
  })),

  adminSetApplicationStatus: publicProcedure.input(z.object({
    sessionToken: session,
    applicationId: z.number().int().positive(),
    status: z.enum(STUDY_APPLICATION_STATUSES),
    adminNote: text(2000),
    institutionReference: text(120),
    notifyCandidate: z.boolean().default(true),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [row] = await db.select().from(studyApplications).where(eq(studyApplications.id, input.applicationId)).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Candidature introuvable." });
    const changed = row.status !== input.status;
    if (changed && !isStudyStatusChangeAllowed(row.status as StudyApplicationStatus, input.status)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Une candidature retirée ou non retenue ne se rouvre pas : le candidat peut postuler à nouveau." });
    }
    await db.update(studyApplications).set({
      status: input.status,
      adminNote: input.adminNote,
      institutionReference: input.institutionReference,
      ...(changed ? { lastStatusAt: new Date() } : {}),
    }).where(eq(studyApplications.id, row.id));
    await db.insert(studyApplicationEvents).values({ applicationId: row.id, actorType: "admin", actorId: admin.id, action: changed ? `status:${input.status}` : "note", note: input.adminNote?.slice(0, 1000) ?? null });
    if (changed && input.notifyCandidate) {
      try {
        await db.insert(clientNotifications).values({
          candidateId: row.candidateId,
          type: "study_application",
          title: `Candidature études : ${STUDY_STATUS_LABELS[input.status]}`,
          body: STUDY_STATUS_CLIENT_NEXT[input.status],
          actionUrl: "/mon-espace",
          isRead: false,
        });
      } catch {
        // La notification ne bloque pas le changement d'étape.
      }
    }
    await audit(db, admin, "study_catalog.application_status", row.id, `${row.status} -> ${input.status}`);
    return { ok: true as const, changed };
  })),
});
