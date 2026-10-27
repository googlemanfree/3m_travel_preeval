import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { countryPathways, countrySources, countryVisaPrograms, procedureSteps } from "../drizzle/schema";
import { getDb } from "./db";
import { getPublicBuildMarker } from "./publicBuildMarker";

/**
 * Contrôle public de disponibilité (page « État du service »).
 * Ne renvoie ni donnée de dossier ni détail d'infrastructure : seulement « ok » ou « dégradé », et l'heure du contrôle.
 */
export type PublicHealth = { status: "ok" | "degraded"; database: "ok" | "down"; checkedAt: string };

export type DeploymentHealth = PublicHealth & {
  buildMarker: string;
  catalog: {
    migration: "0087_country_catalog";
    tables: Record<"countryPathways" | "countryVisaPrograms" | "countrySources" | "procedureSteps", number>;
  };
};

const CACHE_MS = 15_000;
const PROBE_TIMEOUT_MS = 3_000;

/** Interroge la base avec un délai maximal : une base lente est signalée « indisponible ». */
export async function probeDatabase(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), PROBE_TIMEOUT_MS);
    });
    try {
      await Promise.race([db.execute(sql`select 1`), timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
    return true;
  } catch {
    return false;
  }
}

/** Fabrique le contrôle avec un cache court : une rafale de visiteurs ne multiplie pas les requêtes en base. */
export function createPublicHealthCheck(probe: () => Promise<boolean> = probeDatabase, now: () => number = Date.now) {
  let cached: { at: number; value: PublicHealth } | null = null;
  return async (): Promise<PublicHealth> => {
    const current = now();
    if (cached && current - cached.at < CACHE_MS) return cached.value;
    const databaseOk = await probe();
    const value: PublicHealth = {
      status: databaseOk ? "ok" : "degraded",
      database: databaseOk ? "ok" : "down",
      checkedAt: new Date(current).toISOString(),
    };
    cached = { at: current, value };
    return value;
  };
}

export function registerPublicHealthRoute(app: Express, deps: { check?: () => Promise<PublicHealth> } = {}) {
  const check = deps.check ?? createPublicHealthCheck();
  app.get("/api/public/health", async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const health = await check();
    res.status(health.status === "ok" ? 200 : 503).json(health);
  });

  app.get("/api/public/deployment-health", async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const checkedAt = new Date().toISOString();
    const database = await probeDatabase();
    const emptyTables = { countryPathways: 0, countryVisaPrograms: 0, countrySources: 0, procedureSteps: 0 };
    if (!database) {
      return res.status(503).json({ status: "degraded", database: "down", checkedAt, buildMarker: getPublicBuildMarker(), catalog: { migration: "0087_country_catalog", tables: emptyTables } } satisfies DeploymentHealth);
    }
    try {
      const db = await getDb();
      if (!db) throw new Error("database unavailable");
      const [pathways, programs, sources, steps] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(countryPathways),
        db.select({ count: sql<number>`count(*)` }).from(countryVisaPrograms),
        db.select({ count: sql<number>`count(*)` }).from(countrySources),
        db.select({ count: sql<number>`count(*)` }).from(procedureSteps),
      ]);
      const tables = {
        countryPathways: Number(pathways[0]?.count ?? 0),
        countryVisaPrograms: Number(programs[0]?.count ?? 0),
        countrySources: Number(sources[0]?.count ?? 0),
        procedureSteps: Number(steps[0]?.count ?? 0),
      };
      return res.status(200).json({ status: "ok", database: "ok", checkedAt, buildMarker: getPublicBuildMarker(), catalog: { migration: "0087_country_catalog", tables } } satisfies DeploymentHealth);
    } catch {
      return res.status(503).json({ status: "degraded", database: "ok", checkedAt, buildMarker: getPublicBuildMarker(), catalog: { migration: "0087_country_catalog", tables: emptyTables } } satisfies DeploymentHealth);
    }
  });
}
