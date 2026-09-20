import type { Express } from "express";

// Alias historiques que client/src/App.tsx redirige avec <Redirect>. Sans 301
// serveur, le catch-all de production les répond en 404 (composePublicPrerender)
// et l’hébergeur transforme ce 404 en écran de maintenance : la redirection
// cliente n’a alors jamais l’occasion de s’exécuter (liens des annonces Facebook
// compris). Chaque cible doit rester identique au <Redirect> d’App.tsx, ce que
// vérifie appRoutesServedByPrerender.regression.test.ts.
// /submit-review, /evaluation-primaire et /evaluation-rapide-enhanced ont déjà leur
// 301 (server/_core/vite.ts et server/_core/index.ts) : ne pas les répéter ici.
export const LEGACY_PUBLIC_REDIRECTS = {
  "/communaute": "/3m-digital",
  "/evaluation-canada": "/evaluation?source=facebook&campaign=Canada",
  "/evaluation-rapide": "/#evaluation-multi",
  "/vols": "/flights",
  "/insurance": "/assurance",
  "/evisa-demande": "/evisas/request",
  "/e-design": "/evisas",
  "/evisas-enhanced": "/evisas",
  "/evisas-v3": "/evisas",
  "/procedure": "/procedures",
  "/procedures-complete": "/procedures",
  "/procedures-enhanced": "/procedures",
  "/procedures-advanced": "/procedures",
  "/visa-types": "/procedures",
  "/procedures/schengen": "/schengen",
  "/simple-signup": "/register",
  "/schedule-agency": "/contact",
  "/candidate/login": "/login",
  "/dashboard": "/mon-espace",
  "/client-dashboard": "/mon-espace",
  "/mon-espace-candidat": "/mon-espace",
  "/my-space": "/mon-espace",
  "/mon-espace-enhanced": "/mon-espace",
  "/mon-espace-v2": "/mon-espace",
  "/suivi-client": "/mon-espace?section=dossier",
} as const satisfies Record<string, string>;

// Conserve la requête reçue (fbclid, utm_*, ref de parrainage…) en la fusionnant
// dans celle de la cible, avant un éventuel #fragment. Pour un paramètre défini
// des deux côtés, la cible l’emporte, comme avec le <Redirect> client qui ignore
// la requête d’origine. Sans paramètre supplémentaire, la cible est renvoyée telle quelle.
export function legacyRedirectLocation(target: string, originalUrl: string) {
  const queryStart = originalUrl.indexOf("?");
  if (queryStart === -1) return target;
  const destination = new URL(target, "https://redirect.invalid");
  const targetSearch = destination.search;
  const targetKeys = new Set<string>();
  destination.searchParams.forEach((_value, key) => targetKeys.add(key));
  new URLSearchParams(originalUrl.slice(queryStart + 1)).forEach((value, key) => {
    if (!targetKeys.has(key)) destination.searchParams.append(key, value);
  });
  return destination.search === targetSearch ? target : `${destination.pathname}${destination.search}${destination.hash}`;
}

export function registerLegacyAliasRedirects(app: Express) {
  for (const [alias, target] of Object.entries(LEGACY_PUBLIC_REDIRECTS)) {
    app.get(alias, (req, res) => {
      res.set({ "Cache-Control": "public, max-age=3600" });
      return res.redirect(301, legacyRedirectLocation(target, req.originalUrl));
    });
  }
}
