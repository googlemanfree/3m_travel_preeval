import jwt from "jsonwebtoken";
import { STORAGE_PROXY_PREFIX, storedUrlFromKey, storageKeyFromStoredUrl } from "../shared/storedFileUrl";

export type PortraitProof = {
  type: "candidate_portrait";
  email: string;
  key: string;
  url: string;
  captureMethod: "camera" | "gallery";
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET est obligatoire pour vérifier un portrait.");
  return secret;
}

/**
 * Preuve compacte : on signe la clé de stockage (courte), pas l’URL complète.
 * L’URL proxy `/manus-storage/<clé>` est reconstruite à la vérification.
 */
export function createPortraitProof(input: Omit<PortraitProof, "type" | "url"> & { url?: string }): string {
  const key = storageKeyFromStoredUrl(input.url) ?? input.key.replace(/^\/+/, "");
  return jwt.sign(
    {
      type: "candidate_portrait",
      email: input.email,
      key,
      captureMethod: input.captureMethod,
    },
    getJwtSecret(),
    {
      expiresIn: "15m",
      subject: input.email,
    },
  );
}

export function verifyPortraitProof(token: string, candidateEmail: string, avatarUrl?: string): PortraitProof {
  try {
    const proof = jwt.verify(token, getJwtSecret()) as Partial<PortraitProof> & { key?: string; url?: string };
    if (proof.type !== "candidate_portrait" || proof.email !== candidateEmail) {
      throw new Error("invalid portrait proof");
    }
    if (proof.captureMethod !== "camera" && proof.captureMethod !== "gallery") throw new Error("invalid capture method");
    // Compat : anciens jetons pouvaient n’embarquer que l’URL absolue / proxy ; les nouveaux signent la clé seule.
    const keyFromProof = proof.key ? String(proof.key).replace(/^\/+/, "") : null;
    const keyFromLegacyUrl = proof.url ? storageKeyFromStoredUrl(proof.url) : null;
    const key = keyFromProof || keyFromLegacyUrl;
    if (!key || key.includes("..") || key.startsWith("/")) throw new Error("invalid portrait key");
    const url = storedUrlFromKey(key);
    if (avatarUrl) {
      const avatarKey = storageKeyFromStoredUrl(avatarUrl);
      const legacyUrlMatch = Boolean(proof.url && proof.url === avatarUrl);
      if (avatarKey !== key && !legacyUrlMatch) throw new Error("portrait URL mismatch");
    }
    return {
      type: "candidate_portrait",
      email: proof.email,
      key,
      url,
      captureMethod: proof.captureMethod,
    };
  } catch {
    throw new Error("Le portrait n’est plus valide. Reprenez une photo puis réessayez.");
  }
}

export { STORAGE_PROXY_PREFIX };
