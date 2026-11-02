import { storageGetSignedUrl } from "../storage";

/**
 * Résout une URL document client : chemins publics (/forms/…) restent tels quels ;
 * clés manus-storage passent par URL signée.
 */
export async function resolveClientDocumentUrl(documentUrl: string | null | undefined): Promise<string> {
  const raw = String(documentUrl || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/forms/")) return raw;
  if (raw.startsWith("forms/")) return `/${raw}`;
  const key = raw.replace(/^\/manus-storage\//, "");
  try {
    return await storageGetSignedUrl(key);
  } catch {
    return raw.startsWith("/") ? raw : `/manus-storage/${key}`;
  }
}
