import { createHash } from "node:crypto";

/**
 * Le runtime Manus (vite-plugin-manus-runtime) pèse ~367 Ko et monte une seconde application React : c'est le pont entre le site et
 * l'aperçu de la plateforme, qui n'existe que lorsque la page est ouverte DANS un cadre (iframe). Injecté en ligne dans chaque page, il
 * représentait ~96 % du HTML (≈ 100 Ko compressés par visite) pour des visiteurs qui ne l'utilisent jamais.
 *
 * En production on l'émet donc comme fichier statique à empreinte (cache longue durée) et on ne le charge que si la page est dans un
 * cadre. Hors cadre : aucune ligne du runtime n'est téléchargée ni exécutée. En développement, le plugin d'origine reste inchangé.
 */
export const MANUS_RUNTIME_ASSET_PREFIX = "assets/manus-runtime-";

export function manusRuntimeFileName(source: string): string {
  return `${MANUS_RUNTIME_ASSET_PREFIX}${createHash("sha256").update(source).digest("hex").slice(0, 10)}.js`;
}

/** Petit chargeur en ligne : ignore les pages ouvertes seules, charge le fichier statique dans un cadre (même identifiant que l'ancien script). */
export function manusRuntimeLoaderScript(fileName: string): string {
  return `(function(){if(window.parent===window)return;window.__MANUS_HOST_DEV__=false;var s=document.createElement("script");s.id="manus-runtime";s.src="/${fileName}";document.body.appendChild(s)})();`;
}
