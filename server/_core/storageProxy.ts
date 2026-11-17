import type { Express, Response } from "express";
import { Readable } from "node:stream";
import { ENV } from "./env";
import { storageKeyFromStoredUrl, STORAGE_PROXY_PREFIX } from "../../shared/storedFileUrl";

/**
 * Accès aux fichiers déposés (CV, pièces) : « /manus-storage/<clé> ».
 *
 *  - Ouvrir : redirection vers un lien signé tout neuf à chaque ouverture (jamais mis en cache : un lien signé expire).
 *  - Télécharger (`?download=1&name=…`) : le fichier est relayé par le serveur avec un nom et un en-tête « pièce jointe ».
 *    L'attribut `download` d'un lien est ignoré par les navigateurs quand l'adresse redirige vers un autre site : le fichier
 *    s'ouvrait alors à la place de la page, et la fiche du dossier était quittée.
 *  - Le lien signé est demandé jusqu'à trois fois : une erreur passagère du stockage ne doit pas faire croire que le CV a disparu.
 *  - Une erreur renvoie un message clair (le fichier n'est jamais supprimé ni modifié par une ouverture ou un téléchargement).
 */

const PRESIGN_ATTEMPTS = 3;
const PRESIGN_BACKOFF_MS = 150;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Nom de fichier sûr pour l'en-tête de téléchargement (sans chemin, sans caractère de contrôle ni guillemet). */
export function safeDownloadName(candidate: unknown, key: string): string {
  const raw = typeof candidate === "string" && candidate.trim() ? candidate : key.split("/").pop() || "document";
  const cleaned = raw.replace(/[\u0000-\u001f\u007f"\\/:*?<>|]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 150);
  return cleaned || "document";
}

export function contentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/%/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

async function presignedUrl(key: string): Promise<{ url: string } | { status: number }> {
  const forgeUrl = new URL("v1/storage/presign/get", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
  forgeUrl.searchParams.set("path", key);
  let lastStatus = 502;
  for (let attempt = 1; attempt <= PRESIGN_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(forgeUrl, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` } });
      if (response.ok) {
        const { url } = (await response.json()) as { url?: string };
        if (url) return { url };
        lastStatus = 502;
      } else {
        const body = await response.text().catch(() => "");
        console.error(`[StorageProxy] forge error (essai ${attempt}/${PRESIGN_ATTEMPTS}): ${response.status} ${body.slice(0, 200)}`);
        lastStatus = response.status === 404 ? 404 : 502;
        if (response.status === 404) break; // fichier réellement absent : inutile de réessayer
      }
    } catch (error) {
      console.error(`[StorageProxy] forge injoignable (essai ${attempt}/${PRESIGN_ATTEMPTS}):`, error instanceof Error ? error.message : error);
      lastStatus = 502;
    }
    if (attempt < PRESIGN_ATTEMPTS) await wait(PRESIGN_BACKOFF_MS * attempt);
  }
  return { status: lastStatus };
}

function fail(res: Response, status: number) {
  res.set("Cache-Control", "no-store");
  res.status(status).type("text/plain; charset=utf-8").send(status === 404
    ? "Fichier introuvable dans le stockage. Il n'a pas été supprimé par cette ouverture : redemandez le lien ou signalez-le à l'équipe."
    : "Le stockage des fichiers ne répond pas pour le moment. Réessayez dans quelques secondes.");
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const rawKey = (req.params as Record<string, string>)[0];
    // Même contrôle de clé que partout ailleurs (pas de « .. », pas de chemin absolu, pas de caractères suspects).
    const key = rawKey ? storageKeyFromStoredUrl(`${STORAGE_PROXY_PREFIX}${rawKey}`) : null;
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const signed = await presignedUrl(key);
      if (!("url" in signed)) {
        fail(res, signed.status);
        return;
      }

      if (req.query.download !== "1") {
        res.set("Cache-Control", "no-store");
        res.redirect(307, signed.url);
        return;
      }

      const upstream = await fetch(signed.url);
      if (!upstream.ok || !upstream.body) {
        console.error(`[StorageProxy] téléchargement impossible : ${upstream.status}`);
        fail(res, upstream.status === 404 ? 404 : 502);
        return;
      }
      res.status(200);
      res.set({
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": contentDisposition(safeDownloadName(req.query.name, key)),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      });
      const length = upstream.headers.get("content-length");
      if (length) res.set("Content-Length", length);
      Readable.fromWeb(upstream.body as never).on("error", () => res.destroy()).pipe(res);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      if (!res.headersSent) fail(res, 502);
    }
  });
}
