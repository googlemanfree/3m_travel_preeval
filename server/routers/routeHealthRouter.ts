import { desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { externalLinkChecks, route404Events, site404Config } from "../../drizzle/routeHealthSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { TRPCError } from "@trpc/server";

const defaultConfig = {
  title: "Page introuvable",
  message: "La page demandée n’existe plus ou a été déplacée. Utilisez un lien ci-dessous pour continuer votre parcours.",
  links: [
    { label: "Retour à l’accueil", href: "/" },
    { label: "Évaluation de profil", href: "/evaluation" },
    { label: "Accéder à mon espace", href: "/mon-espace" },
    { label: "Contacter Prime Travel", href: "/contact" },
  ],
};

const linkInput = z.object({
  label: z.string().trim().min(1).max(120),
  href: z.string().trim().min(1).max(1000).refine((value) => value.startsWith("/") || value.startsWith("https://"), "Utilisez une route interne ou une URL HTTPS."),
});

const isPrivateHost = (hostname: string) => {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "localhost" || normalized.endsWith(".local") || normalized === "::1") return true;
  if (/^(127|10)\./.test(normalized) || /^192\.168\./.test(normalized) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  return false;
};

export const safeExternalUrl = (value: string) => {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "URL externe invalide." }); }
  if (parsed.protocol !== "https:" || isPrivateHost(parsed.hostname)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Seules les URLs HTTPS publiques sont autorisées." });
  }
  return parsed.toString();
};

const parseLinks = (value?: string | null) => {
  if (!value) return defaultConfig.links;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((link): link is { label: string; href: string } => Boolean(link && typeof link.label === "string" && typeof link.href === "string")) : defaultConfig.links;
  } catch { return defaultConfig.links; }
};

const serializeConfig = (row: typeof site404Config.$inferSelect | undefined) => row ? ({
  id: row.id,
  title: row.title,
  message: row.message,
  links: parseLinks(row.linksJson),
  updatedAt: row.updatedAt,
  updatedByAdminId: row.updatedByAdminId,
}) : { id: null, ...defaultConfig, updatedAt: null, updatedByAdminId: null };

export const performLinkCheck = async (url: string) => {
  const safeUrl = safeExternalUrl(url);
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(safeUrl, { method: "HEAD", redirect: "manual", signal: controller.signal, headers: { "User-Agent": "PrimeTravel-LinkMonitor/1.0" } });
    const status = response.status >= 300 && response.status < 400 ? "redirect" : response.ok ? "ok" : "broken";
    return { status: status as "ok" | "broken" | "redirect", httpStatus: response.status, responseMs: Date.now() - started, errorMessage: null };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return { status: (isAbort ? "timeout" : "error") as "timeout" | "error", httpStatus: null, responseMs: Date.now() - started, errorMessage: isAbort ? "Délai de réponse dépassé." : "Lien inaccessible." };
  } finally { clearTimeout(timeout); }
};

export const routeHealthRouter = router({
  getPublic404Config: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return defaultConfig;
    const row = (await db.select().from(site404Config).where(eq(site404Config.isActive, 1)).orderBy(desc(site404Config.updatedAt)).limit(1))[0];
    return serializeConfig(row);
  }),

  record404: publicProcedure.input(z.object({ path: z.string().trim().min(1).max(512), referrer: z.string().trim().max(1000).optional().default("") })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return { success: true };
    const existing = (await db.select().from(route404Events).where(eq(route404Events.path, input.path)).limit(1))[0];
    const userAgent = String(ctx.req.headers["user-agent"] ?? "").slice(0, 512) || null;
    if (existing) {
      await db.update(route404Events).set({ occurrenceCount: existing.occurrenceCount + 1, lastSeenAt: new Date(), referrer: input.referrer || existing.referrer, userAgent }).where(eq(route404Events.id, existing.id));
    } else {
      await db.insert(route404Events).values({ path: input.path, referrer: input.referrer || null, userAgent });
    }
    return { success: true };
  }),

  getAdmin404Config: publicProcedure.input(z.object({ sessionToken: z.string().min(1) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Configuration 404 indisponible." });
    const row = (await db.select().from(site404Config).orderBy(desc(site404Config.updatedAt)).limit(1))[0];
    return serializeConfig(row);
  }),

  update404Config: publicProcedure.input(z.object({ sessionToken: z.string().min(1), title: z.string().trim().min(3).max(180), message: z.string().trim().min(10).max(2000), links: z.array(linkInput).max(8) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Configuration 404 indisponible." });
    const values = { title: input.title, message: input.message, linksJson: JSON.stringify(input.links), isActive: 1, updatedByAdminId: admin.id };
    const existing = (await db.select().from(site404Config).orderBy(desc(site404Config.updatedAt)).limit(1))[0];
    if (existing) await db.update(site404Config).set(values).where(eq(site404Config.id, existing.id));
    else await db.insert(site404Config).values(values);
    const saved = (await db.select().from(site404Config).orderBy(desc(site404Config.updatedAt)).limit(1))[0];
    return { success: true, config: serializeConfig(saved) };
  }),

  list404Events: publicProcedure.input(z.object({ sessionToken: z.string().min(1), search: z.string().trim().max(200).optional().default(""), limit: z.number().int().min(1).max(200).default(50) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Journal 404 indisponible." });
    const rows = input.search ? await db.select().from(route404Events).where(like(route404Events.path, `%${input.search}%`)).orderBy(desc(route404Events.lastSeenAt)).limit(input.limit) : await db.select().from(route404Events).orderBy(desc(route404Events.lastSeenAt)).limit(input.limit);
    return rows;
  }),

  listExternalLinks: publicProcedure.input(z.object({ sessionToken: z.string().min(1) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Contrôleur de liens indisponible." });
    return db.select().from(externalLinkChecks).orderBy(desc(externalLinkChecks.updatedAt)).limit(200);
  }),

  upsertExternalLink: publicProcedure.input(z.object({ sessionToken: z.string().min(1), url: z.string().trim().url(), label: z.string().trim().max(255).optional().default("") })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const url = safeExternalUrl(input.url);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Contrôleur de liens indisponible." });
    const existing = (await db.select().from(externalLinkChecks).where(eq(externalLinkChecks.url, url)).limit(1))[0];
    if (existing) await db.update(externalLinkChecks).set({ label: input.label || existing.label, updatedByAdminId: admin.id, status: "pending", errorMessage: null }).where(eq(externalLinkChecks.id, existing.id));
    else await db.insert(externalLinkChecks).values({ url, label: input.label || null, createdByAdminId: admin.id, updatedByAdminId: admin.id });
    return { success: true };
  }),

  checkExternalLink: publicProcedure.input(z.object({ sessionToken: z.string().min(1), id: z.number().int().positive() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Contrôleur de liens indisponible." });
    const link = (await db.select().from(externalLinkChecks).where(eq(externalLinkChecks.id, input.id)).limit(1))[0];
    if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Lien introuvable." });
    const result = await performLinkCheck(link.url);
    await db.update(externalLinkChecks).set({ ...result, checkedAt: new Date(), updatedByAdminId: admin.id }).where(eq(externalLinkChecks.id, link.id));
    return { success: true, ...result };
  }),

  checkAllExternalLinks: publicProcedure.input(z.object({ sessionToken: z.string().min(1) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Contrôleur de liens indisponible." });
    const links = await db.select().from(externalLinkChecks).limit(200);
    let checked = 0;
    for (const link of links) {
      const result = await performLinkCheck(link.url);
      await db.update(externalLinkChecks).set({ ...result, checkedAt: new Date(), updatedByAdminId: admin.id }).where(eq(externalLinkChecks.id, link.id));
      checked += 1;
    }
    return { success: true, checked };
  }),
});
