import { prepareCvExcerpt, type CvExcerpt } from "./cvExcerpt";

/**
 * Lit le texte du CV d'une évaluation pour l'analyse préparatoire. Ne s'exécute que pour un candidat qui a
 * donné un consentement DISTINCT à la lecture de son CV (voir cvAnalysisConsented) ; ne lève jamais : sans
 * texte exploitable (image scannée, format non pris en charge, échec réseau), l'analyse continue sans CV.
 */

export const CV_FETCH_TIMEOUT_MS = 8000;
export const CV_FETCH_MAX_BYTES = 5 * 1024 * 1024;
/** Premières pages seulement : l'essentiel d'un CV, et un coût borné. */
export const CV_MAX_PAGES = 4;

/** Consentement distinct du consentement général à l'analyse : enregistré à part dans projectDetailsJson. */
export function cvAnalysisConsented(row: { projectDetailsJson?: string | null }): boolean {
  if (!row.projectDetailsJson) return false;
  try {
    const details = JSON.parse(row.projectDetailsJson) as Record<string, unknown>;
    return details.preparatoryCvAnalysisConsent === true;
  } catch {
    return false;
  }
}

export type CvTextDeps = {
  fetchFile?: (url: string) => Promise<Buffer | null>;
  pdfText?: (buffer: Buffer, pages: number[]) => Promise<string>;
  pdfPageCount?: (buffer: Buffer) => Promise<number>;
};

/** HTTPS uniquement et jamais une adresse locale ou privée : l'adresse vient de notre stockage, mais on ne suit pas une redirection vers l'intérieur. */
export function isSafeCvUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^\[/.test(host) || /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false;
  return true;
}

async function defaultFetchFile(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CV_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "error" });
    if (!response.ok) return null;
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > CV_FETCH_MAX_BYTES) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length > 0 && buffer.length <= CV_FETCH_MAX_BYTES ? buffer : null;
  } finally {
    clearTimeout(timer);
  }
}

const isPdf = (buffer: Buffer) => buffer.length > 5 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";

export async function loadCvExcerpt(cvFileUrl: string | null | undefined, deps: CvTextDeps = {}): Promise<CvExcerpt | null> {
  if (!cvFileUrl || !isSafeCvUrl(cvFileUrl)) return null;
  try {
    const buffer = await (deps.fetchFile ?? defaultFetchFile)(cvFileUrl);
    // Seuls les PDF avec du texte sont lus : pas de reconnaissance d'image (aucune donnée envoyée à un service de vision).
    if (!buffer || !isPdf(buffer)) return null;
    const service = deps.pdfText && deps.pdfPageCount ? null : await import("../aiEvaluationService");
    const pdfPageCount = deps.pdfPageCount ?? service!.getPdfPageCount;
    const pdfText = deps.pdfText ?? service!.extractTextFromPDF;
    const total = await pdfPageCount(buffer);
    const pages = Array.from({ length: Math.max(1, Math.min(total, CV_MAX_PAGES)) }, (_, index) => index + 1);
    return prepareCvExcerpt(await pdfText(buffer, pages));
  } catch (error) {
    console.warn("[structuredEvaluation] CV illisible : analyse sans le CV", error instanceof Error ? error.message.slice(0, 200) : error);
    return null;
  }
}
