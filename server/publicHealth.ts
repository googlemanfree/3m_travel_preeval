import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "./db";

/**
 * Contrôle public de disponibilité (page « État du service »).
 * Ne renvoie ni donnée de dossier ni détail d'infrastructure : seulement « ok » ou « dégradé », et l'heure du contrôle.
 */
export type PublicHealth = { status: "ok" | "degraded"; database: "ok" | "down"; checkedAt: string };

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
}
