import type { Express, Request, Response } from "express";
import { clientKeyOf, createFixedWindowLimiter } from "./publicRateLimit";

/**
 * Rapport d'erreur d'écran (« Cette page n'a pas pu être chargée ») envoyé par le navigateur du visiteur.
 * Objectif : savoir QUELLE page et QUEL composant ont planté, sans jamais recevoir de donnée personnelle.
 *  - liste blanche stricte de champs, tous tronqués ;
 *  - la requête et le fragment de l'URL sont retirés (ils peuvent contenir un jeton) ;
 *  - adresses e-mail, jetons et longs identifiants hexadécimaux sont masqués avant toute écriture dans les journaux ;
 *  - plafonds par visiteur et global : un tiers ne peut pas inonder les journaux.
 */

export const CLIENT_ERROR_REFERENCE = /^ERR-[A-Z0-9]{6}$/;
const MAX_BODY_BYTES = 8_000;

const perClientLimiter = createFixedWindowLimiter({ limit: 8, windowMs: 10 * 60_000 });
const globalLimiter = createFixedWindowLimiter({ limit: 300, windowMs: 60 * 60_000 });

export interface ClientErrorReport {
  reference: string;
  kind: "render" | "chunk" | "other";
  message: string;
  stack: string;
  componentStack: string;
  path: string;
  userAgent: string;
  build: string;
}

/** Masque ce qui ressemble à une donnée personnelle ou à un secret. */
export function scrubText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]")
    .replace(/([?&#](?:token|code|key|secret|session|password|sig|signature)=)[^&\s)'"]+/gi, "$1[masqué]")
    .replace(/\b[a-f0-9]{24,}\b/gi, "[id]")
    .replace(/\beyJ[\w-]{6,}\.[\w-]{6,}\.[\w-]{4,}\b/g, "[jeton]")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .slice(0, max);
}

/** Chemin seul, sans domaine, requête ni fragment. */
export function scrubPath(value: unknown): string {
  if (typeof value !== "string") return "";
  const path = value.split(/[?#]/)[0].replace(/^https?:\/\/[^/]+/i, "");
  return scrubText(path.startsWith("/") ? path : `/${path}`, 200);
}

export function sanitizeClientErrorReport(body: unknown): ClientErrorReport | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  const reference = typeof input.reference === "string" ? input.reference.trim().toUpperCase() : "";
  if (!CLIENT_ERROR_REFERENCE.test(reference)) return null;
  const kind = input.kind === "chunk" || input.kind === "render" ? input.kind : "other";
  const message = scrubText(input.message, 300);
  if (!message) return null;
  return {
    reference,
    kind,
    message,
    stack: scrubText(input.stack, 1200),
    componentStack: scrubText(input.componentStack, 800),
    path: scrubPath(input.path),
    userAgent: scrubText(input.userAgent, 160),
    build: scrubText(input.build, 16),
  };
}

export function handleClientErrorReport(req: Request, res: Response): void {
  const length = Number(req.headers["content-length"] ?? 0);
  if (length > MAX_BODY_BYTES) {
    res.status(413).end();
    return;
  }
  const client = clientKeyOf(req as never) || "inconnu";
  if (!perClientLimiter.check(client).allowed || !globalLimiter.check("all").allowed) {
    // 204 : le navigateur n'a rien à réessayer, et on ne révèle rien sur les plafonds.
    res.status(204).end();
    return;
  }
  const report = sanitizeClientErrorReport(req.body);
  if (!report) {
    res.status(400).json({ ok: false });
    return;
  }
  console.error(`[ClientError] ${report.reference} ${report.kind} ${report.path} :: ${report.message}`, {
    stack: report.stack,
    componentStack: report.componentStack,
    userAgent: report.userAgent,
    build: report.build,
  });
  res.status(204).end();
}

export function registerClientErrorRoute(app: Express): void {
  app.post("/api/client-error", handleClientErrorReport);
}

/** Pour les tests. */
export function resetClientErrorLimiters(): void {
  perClientLimiter.reset();
  globalLimiter.reset();
}
