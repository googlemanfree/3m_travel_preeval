/**
 * Les fichiers déposés (CV, pièces) sont enregistrés sous la forme relative « /manus-storage/<clé> » : c'est ce que renvoie
 * `storagePut`, et ce qui est stocké en base. Cette adresse n'est utilisable que depuis le site lui-même (le serveur la redirige
 * vers un lien signé) ; tout code qui exige une adresse https absolue doit d'abord en tirer la clé de stockage.
 */

import { z } from "zod";

export const STORAGE_PROXY_PREFIX = "/manus-storage/";

/** Clé de stockage d'une adresse « /manus-storage/… » ; null pour toute autre adresse (https absolu, vide, ou clé suspecte). */
export function storageKeyFromStoredUrl(url: string | null | undefined): string | null {
  if (typeof url !== "string" || !url.startsWith(STORAGE_PROXY_PREFIX)) return null;
  const key = url.slice(STORAGE_PROXY_PREFIX.length);
  if (!key || key.startsWith("/") || key.split("/").some((part) => part === ".." || part === ".") || /[\\\s?#]/.test(key)) return null;
  return key;
}

/** Adresse que l'interface peut proposer comme lien d'ouverture : https absolu, ou fichier de notre propre stockage. Jamais autre chose. */
export function isOpenableStoredUrl(url: string | null | undefined): boolean {
  if (typeof url !== "string") return false;
  return /^https?:\/\//i.test(url) || storageKeyFromStoredUrl(url) !== null;
}

/**
 * Adresse à donner à un bouton « Télécharger » : pour un fichier de notre stockage, le serveur relaie le fichier avec son nom
 * (l'attribut `download` d'un lien est ignoré dès que l'adresse redirige vers un autre site) ; toute autre adresse reste inchangée.
 */
export function downloadHrefFor(url: string | null | undefined, fileName?: string | null): string {
  if (typeof url !== "string") return "";
  if (storageKeyFromStoredUrl(url) === null) return url;
  const name = fileName?.trim() ? `&name=${encodeURIComponent(fileName.trim())}` : "";
  return `${url}?download=1${name}`;
}

/** Reconstruit l’URL proxy à partir d’une clé de stockage déjà validée. */
export function storedUrlFromKey(key: string): string {
  return `${STORAGE_PROXY_PREFIX}${key.replace(/^\/+/, "")}`;
}

/**
 * Schéma Zod pour les URLs renvoyées par le dépôt (`/manus-storage/…` ou https absolu historique).
 * Remplace `z.string().url()` qui refusait systématiquement les chemins relatifs du stockage.
 */
export const storedUploadUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .refine((value) => isOpenableStoredUrl(value), {
    message: "Adresse de fichier invalide : renvoyez le document depuis le formulaire de dépôt.",
  });

/** Jeton JWT de preuve portrait — assez large pour une clé longue + signature (l’URL complète n’y est plus obligatoire). */
export const portraitVerificationTokenSchema = z
  .string()
  .trim()
  .min(20, "Portrait vérifié requis")
  .max(2048, "Jeton de vérification portrait invalide : reprenez une photo puis réessayez.");
