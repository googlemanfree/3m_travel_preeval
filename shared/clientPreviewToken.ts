/**
 * Jeton d’aperçu espace client — stocké hors dossier (agency_settings), TTL court.
 * Ne modifie jamais un dossier actif.
 */

export const CLIENT_PREVIEW_TOKEN_PREFIX = "client_preview_token:";
export const CLIENT_PREVIEW_TTL_MS = 15 * 60 * 1000;

export type ClientPreviewTokenPayload = {
  token: string;
  candidateId: string;
  adminEmail: string;
  expiresAt: string;
  createdAt: string;
};

export function clientPreviewSettingKey(token: string): string {
  return `${CLIENT_PREVIEW_TOKEN_PREFIX}${token}`;
}

export function parseClientPreviewToken(raw: string | null | undefined): ClientPreviewTokenPayload | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ClientPreviewTokenPayload>;
    if (!parsed.token || !parsed.candidateId || !parsed.expiresAt) return null;
    return {
      token: String(parsed.token),
      candidateId: String(parsed.candidateId),
      adminEmail: String(parsed.adminEmail || ""),
      expiresAt: String(parsed.expiresAt),
      createdAt: String(parsed.createdAt || parsed.expiresAt),
    };
  } catch {
    return null;
  }
}

export function isClientPreviewTokenFresh(payload: ClientPreviewTokenPayload, now = Date.now()): boolean {
  return new Date(payload.expiresAt).getTime() > now;
}
