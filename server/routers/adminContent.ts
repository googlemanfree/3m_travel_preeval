import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { z } from "zod";
import { aureolQuestions, candidates } from "../../drizzle/schema";
import { countryPathways } from "../../drizzle/countryCatalogSchema";
import { contentReviews, contentUpdates } from "../../drizzle/remoteSupportSchema";
import { countryCodeFromName, groupQuestions, reviewState } from "../../shared/contentKit";
import { WORLD_COUNTRY_ROWS } from "../../shared/worldCountries";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { PUBLIC_PAGES, getIndexablePublicPaths } from "../publicPrerender";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireValidAdminSession } from "./adminAuth";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

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
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette fonction n'est pas encore activée : la migration 0094 doit être appliquée." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const session = z.string().min(1).max(512);
const pagePath = z.string().trim().regex(/^\/[A-Za-z0-9/_.-]{0,180}$/, "Adresse de page invalide (elle commence par /).");
const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const DAY = 24 * 60 * 60 * 1000;

async function audit(db: Db, admin: { id: number; email?: string | null }, action: string, resourceId: string | number, details: string) {
  await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action, resourceType: "site_content", resourceId, details: details.slice(0, 300) });
}

/**
 * Gouvernance du contenu : relecture des pages (fraîcheur), demande réelle (questions posées, destinations les plus visées,
 * fiches pays à rédiger en priorité) et « Quoi de neuf » daté. Aucune donnée personnelle n'est exposée : les questions sont affichées sans e-mail.
 */
export const adminContentRouter = router({
  adminContentReviews: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const reviews = await db.select().from(contentReviews).limit(2000);
    const byPath = new Map(reviews.map((row) => [row.pagePath, row] as const));
    const now = new Date();
    const items = getIndexablePublicPaths().map((path) => {
      const review = byPath.get(path);
      const title = (PUBLIC_PAGES[path]?.title ?? "").replace(/\s*\|\s*3M TRAVEL AGENCY\s*$/i, "");
      return { path, title: title || path, reviewedAt: iso(review?.reviewedAt), reviewedBy: review?.reviewedBy ?? null, note: review?.note ?? null, state: reviewState(review?.reviewedAt, now) };
    });
    const rank = { never: 0, stale: 1, ok: 2 } as const;
    items.sort((a, b) => rank[a.state] - rank[b.state] || a.path.localeCompare(b.path));
    return { total: items.length, never: items.filter((item) => item.state === "never").length, stale: items.filter((item) => item.state === "stale").length, items: items.slice(0, 400) };
  })),

  adminMarkReviewed: publicProcedure.input(z.object({ sessionToken: session, paths: z.array(pagePath).min(1).max(50), note: z.string().trim().max(300).nullish().transform((value) => value || null) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const known = new Set(getIndexablePublicPaths());
    const paths = Array.from(new Set(input.paths)).filter((path) => known.has(path));
    if (paths.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune page connue dans la sélection." });
    const label = adminLabel(admin);
    for (const path of paths) {
      const [existing] = await db.select({ id: contentReviews.id }).from(contentReviews).where(eq(contentReviews.pagePath, path)).limit(1);
      if (existing) await db.update(contentReviews).set({ reviewedAt: new Date(), reviewedBy: label, note: input.note }).where(eq(contentReviews.id, existing.id));
      else await db.insert(contentReviews).values({ pagePath: path, reviewedBy: label, note: input.note });
    }
    await audit(db, admin, "content.reviewed", paths.length === 1 ? paths[0] : "batch", `${paths.length} page(s) relue(s)`);
    return { marked: paths.length };
  })),

  /** Annule une relecture saisie par erreur : la page redevient « jamais relue ». */
  adminClearReview: publicProcedure.input(z.object({ sessionToken: session, path: pagePath })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.delete(contentReviews).where(eq(contentReviews.pagePath, input.path));
    await audit(db, admin, "content.review_cleared", input.path, "relecture annulée");
    return { ok: true as const };
  })),

  /** Ce que les visiteurs cherchent vraiment : questions fréquentes de l'assistant, destinations visées, fiches pays à rédiger d'abord. */
  adminDemand: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const since = new Date(Date.now() - 90 * DAY);
    const rows = await db.select({ question: aureolQuestions.question, isHelpful: aureolQuestions.isHelpful, pagePath: aureolQuestions.pagePath, createdAt: aureolQuestions.createdAt }).from(aureolQuestions).where(gte(aureolQuestions.createdAt, since)).orderBy(desc(aureolQuestions.createdAt)).limit(3000);
    const questions = groupQuestions(rows).slice(0, 30).map((group) => ({
      question: group.sample, count: group.count, unhelpful: group.items.filter((item) => item.isHelpful === false).length,
      topPage: Array.from(group.items.reduce((acc, item) => { if (item.pagePath) acc.set(item.pagePath, (acc.get(item.pagePath) ?? 0) + 1); return acc; }, new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }));

    const people = await db.select({ preferred: candidates.preferredDestinations }).from(candidates).where(and(isNull(candidates.deletedAt), gte(candidates.createdAt, new Date(Date.now() - 180 * DAY)))).limit(6000);
    const demand = new Map<string, number>();
    for (const person of people) {
      let names: unknown = [];
      try { names = JSON.parse(person.preferred || "[]"); } catch { names = []; }
      if (!Array.isArray(names)) continue;
      for (const name of names.slice(0, 3)) {
        const code = typeof name === "string" ? countryCodeFromName(name, WORLD_COUNTRY_ROWS) : null;
        if (code) demand.set(code, (demand.get(code) ?? 0) + 1);
      }
    }
    const pathways = await db.select({ countryCode: countryPathways.countryCode, pathway: countryPathways.pathway, status: countryPathways.status, coverage: countryPathways.coverage }).from(countryPathways).limit(2000);
    const names = new Map(WORLD_COUNTRY_ROWS.map((row) => [row[0], row[1]] as const));
    const countries = Array.from(demand.entries()).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([code, count]) => {
      const own = pathways.filter((row) => row.countryCode === code);
      const published = own.filter((row) => row.status === "published").map((row) => row.pathway);
      return { code, name: names.get(code) ?? code, demand: count, publishedPathways: published, needsWriting: published.length === 0 };
    });
    return { questionsSince: since.toISOString(), questions, candidatesCounted: people.length, countries };
  })),

  // ───────────── Quoi de neuf ─────────────
  adminUpdates: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(contentUpdates).where(isNull(contentUpdates.archivedAt)).orderBy(desc(contentUpdates.createdAt)).limit(100);
    return rows.map((row) => ({ id: row.id, title: row.title, summary: row.summary, pagePath: row.pagePath, published: row.published === 1, publishedAt: iso(row.publishedAt), createdBy: row.createdBy, createdAt: iso(row.createdAt)! }));
  })),

  adminSaveUpdate: publicProcedure.input(z.object({
    sessionToken: session, id: z.number().int().positive().optional(), title: z.string().trim().min(5).max(160), summary: z.string().trim().min(20).max(600),
    pagePath: pagePath.nullish().transform((value) => value || null), publish: z.boolean(),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const values = { title: input.title, summary: input.summary, pagePath: input.pagePath, published: input.publish ? 1 : 0, publishedAt: input.publish ? new Date() : null };
    if (input.id) {
      await db.update(contentUpdates).set(values).where(and(eq(contentUpdates.id, input.id), isNull(contentUpdates.archivedAt)));
      await audit(db, admin, "content_update.saved", input.id, input.title);
      return { id: input.id };
    }
    const created = await db.insert(contentUpdates).values({ ...values, createdBy: adminLabel(admin) });
    const id = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    await audit(db, admin, "content_update.created", id, input.title);
    return { id };
  })),

  adminSetUpdatePublished: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive(), published: z.boolean() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.update(contentUpdates).set({ published: input.published ? 1 : 0, publishedAt: input.published ? new Date() : null }).where(eq(contentUpdates.id, input.id));
    await audit(db, admin, input.published ? "content_update.published" : "content_update.unpublished", input.id, "");
    return { ok: true as const };
  })),

  /** Retire l'entrée de la liste sans l'effacer (récupérable en base). */
  adminArchiveUpdate: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.update(contentUpdates).set({ archivedAt: new Date(), published: 0 }).where(eq(contentUpdates.id, input.id));
    await audit(db, admin, "content_update.archived", input.id, "");
    return { ok: true as const };
  })),

  /** Public : seulement les entrées publiées et non archivées, sans auteur. */
  publicUpdates: publicProcedure.query(() => guarded(async () => {
    const db = await requireDb();
    const rows = await db.select({ id: contentUpdates.id, title: contentUpdates.title, summary: contentUpdates.summary, pagePath: contentUpdates.pagePath, publishedAt: contentUpdates.publishedAt }).from(contentUpdates)
      .where(and(eq(contentUpdates.published, 1), isNull(contentUpdates.archivedAt))).orderBy(desc(contentUpdates.publishedAt)).limit(30);
    return rows.map((row) => ({ ...row, publishedAt: iso(row.publishedAt) }));
  })),
});
