import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { countryPathways, countrySources, countryVisaPrograms, procedureSteps } from "../../drizzle/schema";
import {
  CATALOG_STATUSES,
  COVERAGES,
  OFFER_REQUIREMENTS,
  PATHWAYS,
  ROUTE_TYPES,
  SOURCE_AUTHORITIES,
  SOURCE_STATUSES,
  STEP_ACTORS,
  buildSeedPathways,
  buildSeedPrograms,
  isOfficialUrl,
  publishBlockers,
} from "../../shared/countryCatalog";
import { guideSlugForCode } from "../../shared/countryGuides";
import { WORLD_COUNTRY_ROWS } from "../../shared/worldCountries";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireValidAdminSession } from "./adminAuth";
import { getCountryGuide, getCountryGuides, refreshCountryGuides } from "../services/countryGuidesSnapshot";

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
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le catalogue des parcours n'est pas encore activé : la migration 0087 doit être appliquée." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const session = z.string().min(1).max(512);
const countryCode = z.string().trim().length(2).transform((value) => value.toUpperCase()).refine((value) => WORLD_CODES.has(value), "Pays inconnu.");
const pathway = z.enum(PATHWAYS);
const status = z.enum(CATALOG_STATUSES);
const optionalText = (max: number) => z.string().trim().max(max).nullish().transform((value) => (value ? value : null));

const iso = (value: Date | null | undefined) => (value ? new Date(value).toISOString() : null);

/** Résumé d'une action d'administration pour le journal (sans donnée personnelle). */
async function audit(db: Db, admin: { id: number; email?: string | null }, action: string, resourceId: string | number, details: string) {
  await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action, resourceType: "country_catalog", resourceId, details });
  // Chaque changement de l'administration met à jour les guides publics et le plan du site sans attendre le rafraîchissement périodique.
  await refreshCountryGuides();
}

/**
 * Catalogue mondial des parcours. Lecture publique : uniquement les fiches « publiées », donc appuyées par une source officielle relue.
 * Gestion : réservée à l'administration, chaque changement est journalisé.
 */
export const countryCatalogRouter = router({
  /**
   * Lecture publique d'un pays : le même instantané que le prérendu. Il ne contient que le publié et AUCUNE source ni adresse
   * officielle (elles restent côté administration, voir adminCountry).
   */
  published: publicProcedure.input(z.object({ countryCode, pathway: pathway.optional() })).query(({ input }) => {
    const slug = guideSlugForCode(input.countryCode);
    const guide = slug ? getCountryGuide(slug) : undefined;
    return { countryCode: input.countryCode, pathways: (guide?.pathways ?? []).filter((item) => !input.pathway || item.pathway === input.pathway) };
  }),

  /** Guides publiés, lus dans l'instantané en mémoire (le même que le prérendu) : aucune requête, aucune fiche non publiée. */
  guideList: publicProcedure.query(() => Array.from(getCountryGuides().values())
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((guide) => ({ code: guide.code, name: guide.name, slug: guide.slug, pathways: guide.pathways.map((item) => item.pathway), updatedAt: guide.updatedAt }))),

  guide: publicProcedure.input(z.object({ slug: z.string().trim().min(2).max(80) })).query(({ input }) => getCountryGuide(input.slug) ?? null),

  adminMatrix: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [pathways, programs, sources] = await Promise.all([
      db.select().from(countryPathways),
      db.select({ countryCode: countryVisaPrograms.countryCode, pathway: countryVisaPrograms.pathway, total: sql<number>`count(*)` }).from(countryVisaPrograms).groupBy(countryVisaPrograms.countryCode, countryVisaPrograms.pathway),
      db.select({ countryCode: countrySources.countryCode, pathway: countrySources.pathway, status: countrySources.status, total: sql<number>`count(*)` }).from(countrySources).groupBy(countrySources.countryCode, countrySources.pathway, countrySources.status),
    ]);
    const key = (code: string, kind: string) => `${code}|${kind}`;
    const programCount = new Map(programs.map((row) => [key(row.countryCode, row.pathway), Number(row.total)]));
    const sourceCount = new Map<string, { all: number; verified: number }>();
    for (const row of sources) {
      const current = sourceCount.get(key(row.countryCode, row.pathway)) ?? { all: 0, verified: 0 };
      current.all += Number(row.total);
      if (row.status === "verified") current.verified += Number(row.total);
      sourceCount.set(key(row.countryCode, row.pathway), current);
    }
    return pathways.map((row) => ({
      countryCode: row.countryCode,
      pathway: row.pathway,
      coverage: row.coverage,
      status: row.status,
      checkedAt: iso(row.checkedAt),
      programCount: programCount.get(key(row.countryCode, row.pathway)) ?? 0,
      sourceCount: sourceCount.get(key(row.countryCode, row.pathway))?.all ?? 0,
      verifiedSourceCount: sourceCount.get(key(row.countryCode, row.pathway))?.verified ?? 0,
    }));
  })),

  adminCountry: publicProcedure.input(z.object({ sessionToken: session, countryCode })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [pathways, programs, sources] = await Promise.all([
      db.select().from(countryPathways).where(eq(countryPathways.countryCode, input.countryCode)),
      db.select().from(countryVisaPrograms).where(eq(countryVisaPrograms.countryCode, input.countryCode)).orderBy(asc(countryVisaPrograms.id)),
      db.select().from(countrySources).where(eq(countrySources.countryCode, input.countryCode)).orderBy(asc(countrySources.id)),
    ]);
    const steps = programs.length ? await db.select().from(procedureSteps).where(inArray(procedureSteps.programId, programs.map((program) => program.id))).orderBy(asc(procedureSteps.programId), asc(procedureSteps.stepNo)) : [];
    return { countryCode: input.countryCode, pathways, programs, sources, steps };
  })),

  /** Crée les 196 × 3 fiches et les dispositifs du jeu de départ, sans rien écraser : peut être relancé sans risque. */
  adminSeed: publicProcedure.input(z.object({ sessionToken: session })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const seedPathways = buildSeedPathways();
    let pathwaysAdded = 0;
    for (let index = 0; index < seedPathways.length; index += 200) {
      const chunk = seedPathways.slice(index, index + 200);
      const result = await db.insert(countryPathways).values(chunk).onDuplicateKeyUpdate({ set: { countryCode: sql`country_pathways.country_code` } });
      pathwaysAdded += Number((result as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 0);
    }
    const existing = await db.select({ countryCode: countryVisaPrograms.countryCode, pathway: countryVisaPrograms.pathway, officialName: countryVisaPrograms.officialName }).from(countryVisaPrograms);
    const known = new Set(existing.map((row) => `${row.countryCode}|${row.pathway}|${row.officialName}`));
    const toAdd = buildSeedPrograms().filter((program) => !known.has(`${program.countryCode}|${program.pathway}|${program.officialName}`));
    for (let index = 0; index < toAdd.length; index += 200) await db.insert(countryVisaPrograms).values(toAdd.slice(index, index + 200));
    await audit(db, admin, "country_catalog.seeded", "seed", `${toAdd.length} dispositif(s) ajouté(s), ${seedPathways.length} fiches vérifiées`);
    return { pathways: seedPathways.length, pathwaysAdded, programsAdded: toAdd.length };
  })),

  adminSavePathway: publicProcedure.input(z.object({
    sessionToken: session,
    countryCode,
    pathway,
    coverage: z.enum(COVERAGES),
    summary: optionalText(1500),
    status,
    /** Marque la fiche comme relue aujourd'hui par cet administrateur. */
    markChecked: z.boolean().optional(),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    if (input.status === "published") {
      const [programs, sources] = await Promise.all([
        db.select({ id: countryVisaPrograms.id }).from(countryVisaPrograms).where(and(eq(countryVisaPrograms.countryCode, input.countryCode), eq(countryVisaPrograms.pathway, input.pathway), sql`${countryVisaPrograms.status} <> 'retired'`)),
        db.select().from(countrySources).where(and(eq(countrySources.countryCode, input.countryCode), eq(countrySources.pathway, input.pathway))),
      ]);
      const blockers = publishBlockers({ summary: input.summary, coverage: input.coverage, programCount: programs.length, sources });
      if (blockers.length > 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Publication impossible : ${blockers.join(" ")}` });
    }
    const checked = input.markChecked ? { checkedAt: new Date(), checkedByAdminId: admin.id, checkedByLabel: adminLabel(admin) } : {};
    const values = { coverage: input.coverage, summary: input.summary, status: input.status, ...checked };
    await db.insert(countryPathways).values({ countryCode: input.countryCode, pathway: input.pathway, ...values }).onDuplicateKeyUpdate({ set: values });
    await audit(db, admin, "country_catalog.pathway_saved", `${input.countryCode}:${input.pathway}`, `statut ${input.status}, couverture ${input.coverage}`);
    return { ok: true as const };
  })),

  adminSaveProgram: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive().optional(),
    countryCode,
    pathway,
    officialName: z.string().trim().min(2).max(200),
    nameFr: optionalText(200),
    programRef: optionalText(80),
    legalBasis: optionalText(300),
    routeType: z.enum(ROUTE_TYPES).nullish().transform((value) => value ?? null),
    offerRequired: z.enum(OFFER_REQUIREMENTS).nullish().transform((value) => value ?? null),
    sponsorLicenceRequired: z.boolean().nullish().transform((value) => value ?? null),
    labourMarketTest: z.boolean().nullish().transform((value) => value ?? null),
    salaryNote: optionalText(1500),
    durationNote: optionalText(1500),
    renewable: z.boolean().nullish().transform((value) => value ?? null),
    familyAllowed: z.boolean().nullish().transform((value) => value ?? null),
    residencePathNote: optionalText(1500),
    feesNote: optionalText(1500),
    processingNote: optionalText(1500),
    status,
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { sessionToken: _token, id, ...values } = input;
    const stamped = { ...values, countryCode: input.countryCode, pathway: input.pathway, officialName: input.officialName, status: input.status, checkedAt: new Date() };
    let savedId = id ?? 0;
    if (id) await db.update(countryVisaPrograms).set(stamped).where(eq(countryVisaPrograms.id, id));
    else {
      const created = await db.insert(countryVisaPrograms).values(stamped);
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    await audit(db, admin, "country_catalog.program_saved", savedId, `${input.countryCode}:${input.pathway} ${input.officialName}`.slice(0, 200));
    return { id: savedId };
  })),

  adminDeleteProgram: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.delete(procedureSteps).where(eq(procedureSteps.programId, input.id));
    await db.delete(countryVisaPrograms).where(eq(countryVisaPrograms.id, input.id));
    await audit(db, admin, "country_catalog.program_deleted", input.id, "dispositif et étapes supprimés");
    return { ok: true as const };
  })),

  adminSaveSource: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive().optional(),
    countryCode,
    pathway,
    label: z.string().trim().min(2).max(200),
    url: z.string().trim().max(600),
    authority: z.enum(SOURCE_AUTHORITIES),
    note: optionalText(300),
    /** « Je viens d'ouvrir cette page officielle » : fixe le statut « vérifiée » et la date du jour. */
    markVerified: z.boolean().optional(),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    if (!isOfficialUrl(input.url)) throw new TRPCError({ code: "BAD_REQUEST", message: "L'adresse doit commencer par https:// et pointer vers un site existant." });
    const status: (typeof SOURCE_STATUSES)[number] = input.markVerified ? "verified" : "needs_review";
    const verification = input.markVerified ? { checkedAt: new Date(), checkedByAdminId: admin.id, checkedByLabel: adminLabel(admin) } : {};
    const values = { countryCode: input.countryCode, pathway: input.pathway, label: input.label, url: input.url, authority: input.authority, note: input.note, status, ...verification };
    let savedId = input.id ?? 0;
    if (input.id) await db.update(countrySources).set(values).where(eq(countrySources.id, input.id));
    else {
      const created = await db.insert(countrySources).values(values);
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    await audit(db, admin, input.markVerified ? "country_catalog.source_verified" : "country_catalog.source_saved", savedId, `${input.countryCode}:${input.pathway} ${input.label}`.slice(0, 200));
    return { id: savedId };
  })),

  adminDeleteSource: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.delete(countrySources).where(eq(countrySources.id, input.id));
    await audit(db, admin, "country_catalog.source_deleted", input.id, "source supprimée");
    return { ok: true as const };
  })),

  adminSaveStep: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive().optional(),
    programId: z.number().int().positive(),
    stepNo: z.number().int().min(1).max(60),
    actor: z.enum(STEP_ACTORS),
    title: z.string().trim().min(2).max(200),
    description: optionalText(2000),
    documents: z.array(z.string().trim().min(1).max(200)).max(30).optional(),
    delayNote: optionalText(300),
    feeNote: optionalText(300),
    officialUrl: z.string().trim().max(600).nullish().transform((value) => (value ? value : null)),
    status,
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    if (input.officialUrl && !isOfficialUrl(input.officialUrl)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le lien officiel doit commencer par https://." });
    const [program] = await db.select({ id: countryVisaPrograms.id }).from(countryVisaPrograms).where(eq(countryVisaPrograms.id, input.programId)).limit(1);
    if (!program) throw new TRPCError({ code: "NOT_FOUND", message: "Dispositif introuvable." });
    const values = { programId: input.programId, stepNo: input.stepNo, actor: input.actor, title: input.title, description: input.description, documentsJson: input.documents ?? [], delayNote: input.delayNote, feeNote: input.feeNote, officialUrl: input.officialUrl, status: input.status, checkedAt: new Date() };
    let savedId = input.id ?? 0;
    if (input.id) await db.update(procedureSteps).set(values).where(eq(procedureSteps.id, input.id));
    else {
      const created = await db.insert(procedureSteps).values(values);
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    await audit(db, admin, "country_catalog.step_saved", savedId, `dispositif ${input.programId}, étape ${input.stepNo}`);
    return { id: savedId };
  })),

  adminDeleteStep: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.delete(procedureSteps).where(eq(procedureSteps.id, input.id));
    await audit(db, admin, "country_catalog.step_deleted", input.id, "étape supprimée");
    return { ok: true as const };
  })),
});
