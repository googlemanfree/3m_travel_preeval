/**
 * Rapport d'erreur de l'écran « Cette page n'a pas pu être chargée » : une référence courte que le visiteur peut
 * citer au support, un texte à copier, et un envoi discret au serveur (voir server/_core/clientErrorReport.ts).
 * Rien de personnel n'est collecté : chemin sans requête ni fragment, message technique, extrait de pile.
 */

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

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** « ERR-7K2M9Q » : dérivée du message, de la page et de l'heure — stable pour une même erreur au même instant. */
export function makeErrorReference(message: string, path: string, now = Date.now()): string {
  const input = `${message}|${path}|${Math.floor(now / 60_000)}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  // 6 caractères × 5 bits = 30 bits du hachage ; l'alphabet de 32 signes évite 0/O et 1/I/L.
  let code = "";
  for (let index = 0; index < 6; index += 1) code += ALPHABET[(hash >>> (index * 5)) & 31];
  return `ERR-${code}`;
}

/** Chemin de la page sans domaine, requête ni fragment (la requête peut contenir un jeton). */
export function safePagePath(href: string): string {
  return (href.split(/[?#]/)[0] || "/").replace(/^https?:\/\/[^/]+/i, "") || "/";
}

function chunkError(message: string): boolean {
  return /dynamically imported module|Loading chunk .* failed|Importing a module script failed/i.test(message);
}

export function buildClientErrorReport(
  error: unknown,
  componentStack: string | null | undefined,
  env: { href?: string; userAgent?: string; build?: string; now?: number } = {}
): ClientErrorReport {
  const err = error instanceof Error ? error : new Error(String(error ?? "Erreur inconnue"));
  const href = env.href ?? (typeof window !== "undefined" ? window.location.href : "/");
  const path = safePagePath(href);
  const message = (err.message || err.name || "Erreur inconnue").slice(0, 300);
  return {
    reference: makeErrorReference(message, path, env.now),
    kind: chunkError(message) ? "chunk" : "render",
    message,
    stack: (err.stack ?? "").split("\n").slice(0, 6).join("\n").slice(0, 1200),
    componentStack: (componentStack ?? "").split("\n").slice(0, 8).join("\n").slice(0, 800),
    path,
    userAgent: (env.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "")).slice(0, 160),
    build: (env.build ?? "").slice(0, 16),
  };
}

/** Texte à coller dans un message au support. */
export function formatErrorDetails(report: ClientErrorReport): string {
  return [
    `Référence : ${report.reference}`,
    `Page : ${report.path}`,
    `Erreur : ${report.message}`,
    report.componentStack ? `Composant :${report.componentStack}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const sent = new Set<string>();

/** Une seule émission par référence ; jamais bloquant, jamais d'exception pour l'appelant. */
export function sendClientErrorReport(report: ClientErrorReport, endpoint = "/api/client-error"): boolean {
  if (sent.has(report.reference)) return false;
  sent.add(report.reference);
  try {
    const body = JSON.stringify(report);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      return navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    }
    if (typeof fetch === "function") {
      void fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
      return true;
    }
  } catch {
    // Le rapport est un bonus : une panne d'envoi ne doit jamais aggraver l'erreur affichée.
  }
  return false;
}

/** Pour les tests. */
export function resetSentReports(): void {
  sent.clear();
}
