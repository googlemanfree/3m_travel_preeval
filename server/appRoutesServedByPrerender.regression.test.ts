import { readFileSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LEGACY_PUBLIC_REDIRECTS, legacyRedirectLocation, registerLegacyAliasRedirects } from "./legacyPublicRedirects";
import { composePublicPrerender, getIndexablePublicPaths, PUBLIC_PAGES } from "./publicPrerender";
import { evisasDatabaseComplete } from "../client/src/data/evisasDatabaseComplete";
import { studyDestinationArticles } from "../client/src/data/studyDestinationArticles";

// En production, le catch-all Express répond avec le statut de composePublicPrerender
// et l’hébergeur transforme un 404 en écran de maintenance : une route qui s’affiche
// correctement dans le navigateur peut donc être inaccessible. Ce test compare
// client/src/App.tsx au comportement serveur pour qu’aucune route ne retombe en 404.
const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");
const shell = '<!doctype html><html><head><title>t</title></head><body><div id="root"><!--prerender-app--></div></body></html>';
const render = (path: string) => composePublicPrerender(shell, path);

const appSource = read("client/src/App.tsx");
// Routes statiques : chemin littéral (path="/x" ou path={"/x"}), sans paramètre ni joker.
const staticRoutes = Array.from(new Set(
  Array.from(appSource.matchAll(/<Route\s+path=\{?"(\/[^"]*)"\}?/g), (match) => match[1])
    .filter((path) => !path.includes(":") && !path.includes("*")),
));
// Alias : <Route path="/x">{() => <Redirect to="/y" />}</Route>
const appRedirects = new Map(
  Array.from(appSource.matchAll(/<Route\s+path=\{?"(\/[^"]*)"\}?>\{\(\) => <Redirect to="([^"]*)" \/>\}<\/Route>/g), (match) => [match[1], match[2]] as const),
);

// Alias dont le 301 est enregistré ailleurs que dans LEGACY_PUBLIC_REDIRECTS.
const HISTORICAL_REDIRECT_SOURCES: Record<string, string> = {
  "/submit-review": "server/_core/vite.ts",
  "/evaluation-primaire": "server/_core/index.ts",
  "/evaluation-rapide-enhanced": "server/_core/index.ts",
};
const redirectedByServer = new Set([...Object.keys(LEGACY_PUBLIC_REDIRECTS), ...Object.keys(HISTORICAL_REDIRECT_SOURCES)]);

// Pages réellement publiques : indexables avec des métadonnées propres.
const INDEXABLE_PAGES = [
  "/procedures/allemagne-formation",
  "/procedures/autriche-formation",
  "/procedures/suisse-formation",
  "/procedures/emirats",
  "/procedures/arabie-saoudite",
  "/procedures/coree-du-sud",
  "/procedures/japon",
];
// Pages personnelles, transactionnelles ou doublons d’une page de référence : 200 non indexable.
const PRIVATE_PAGES = [
  "/complete-profile",
  "/forgot-password",
  "/reset-password",
  "/payment/method-selection",
  "/payment/agency-confirmation",
  "/payment/success",
  "/payment/error",
  "/payment-success",
  "/payment-failed",
  "/dossier-confirmation",
  "/open-dossier",
  "/submit-documents",
  "/evaluation-result",
  "/evisas/request",
  "/procedures/comparaison",
  "/3m-booking",
  "/assurance-inscription",
];

describe("extraction des routes d’App.tsx", () => {
  it("lit assez de routes et d’alias pour que les contrôles ci-dessous ne soient pas vides", () => {
    expect(staticRoutes.length).toBeGreaterThan(120);
    expect(staticRoutes).toEqual(expect.arrayContaining(["/", "/procedures", "/forgot-password", "/payment/success", "/404"]));
    expect(appRedirects.size).toBeGreaterThan(30);
    expect(appRedirects.get("/evaluation-canada")).toBe("/evaluation?source=facebook&campaign=Canada");
  });
});

describe("routes statiques d’App.tsx servies par le pré-rendu", () => {
  it("ne répond 404 à aucune route statique, hors /404 et alias redirigés par le serveur", () => {
    const notFound = staticRoutes.filter((path) => path !== "/404" && !redirectedByServer.has(path) && render(path).status === 404);
    expect(notFound).toEqual([]);
  });

  it("garde une vraie 404 pour /404 et pour une route inconnue", () => {
    for (const path of ["/404", "/route-inconnue", "/communaute-inconnue", "/payment"]) {
      const rendered = render(path);
      expect(rendered.status, path).toBe(404);
      expect(rendered.html, path).toContain("Page introuvable");
    }
  });

  it("classe uniquement des routes qui existent encore dans App.tsx", () => {
    for (const path of [...INDEXABLE_PAGES, ...PRIVATE_PAGES]) expect(staticRoutes, path).toContain(path);
  });

  it.each(INDEXABLE_PAGES)("sert %s en 200 indexable avec des métadonnées SEO complètes", (path) => {
    const meta = PUBLIC_PAGES[path];
    expect(meta.title.length, "titre").toBeGreaterThanOrEqual(30);
    expect(meta.title.length, "titre").toBeLessThanOrEqual(60);
    expect(meta.description.length, "description").toBeGreaterThanOrEqual(50);
    expect(meta.description.length, "description").toBeLessThanOrEqual(160);
    expect(meta.keywords?.length ?? 0, "mots-clés").toBeGreaterThanOrEqual(3);
    expect(meta.keywords?.length ?? 0, "mots-clés").toBeLessThanOrEqual(8);
    const rendered = render(path);
    expect(rendered.status).toBe(200);
    expect(rendered.noindex).toBe(false);
    expect(rendered.html).toContain('name="robots" content="index,follow"');
    expect(rendered.html).toContain(`<link rel="canonical" href="https://www.3mtravelagency.com${path}" />`);
    expect(getIndexablePublicPaths()).toContain(path);
  });

  it.each(PRIVATE_PAGES)("sert %s en 200 non indexable, hors sitemap", (path) => {
    const rendered = render(path);
    expect(rendered.status).toBe(200);
    expect(rendered.noindex).toBe(true);
    expect(rendered.html).toContain('name="robots" content="noindex,follow"');
    expect(rendered.html).toContain('data-prerendered="true"');
    expect(getIndexablePublicPaths()).not.toContain(path);
  });

  it("sert en 200 non indexable les pages dynamiques de paiement et de réservation de vol", () => {
    for (const path of ["/payment/DOS-2026-001", "/payment/DOS-2026-001/", "/flight-booking/FL-123"]) {
      const rendered = render(path);
      expect(rendered.status, path).toBe(200);
      expect(rendered.html, path).toContain('name="robots" content="noindex,follow"');
    }
  });

  it("sert les fiches e-Visa valides en 200 indexable avec des métadonnées par pays", () => {
    for (const destination of evisasDatabaseComplete.slice(0, 3)) {
      const path = `/evisa/${destination.id}`;
      const rendered = render(path);
      expect(rendered.status, path).toBe(200);
      expect(rendered.noindex, path).toBe(false);
      expect(rendered.html, path).toContain("<title>");
      expect(rendered.html, path).toContain("e‑Visa | 3M Travel &amp; Services</title>");
      expect(rendered.html, path).toContain("Détails e-Visa");
      expect(rendered.html, path).toContain('<meta property="og:type" content="website" />');
      expect(rendered.html, path).toContain(`<meta property="og:url" content="https://www.3mtravelagency.com${path}" />`);
      expect(rendered.html, path).toContain('<meta name="twitter:card" content="summary_large_image" />');
      expect(rendered.html, path).toContain(`<meta name="twitter:url" content="https://www.3mtravelagency.com${path}" />`);
      expect(getIndexablePublicPaths(), path).toContain(path);
    }
  });

  it("sert les articles d’études valides en 200 indexable avec leur contenu", () => {
    for (const article of studyDestinationArticles.slice(0, 3)) {
      const path = `/blog/etudes/${article.slug}`;
      const rendered = render(path);
      expect(rendered.status, path).toBe(200);
      expect(rendered.noindex, path).toBe(false);
      expect(rendered.html, path).toContain(`<h1>${article.title}</h1>`);
      expect(rendered.html, path).toContain("Étapes de préparation");
      expect(rendered.html, path).toContain('<meta property="og:type" content="article" />');
      expect(rendered.html, path).toContain('<meta property="article:publisher" content="https://www.3mtravelagency.com" />');
      expect(rendered.html, path).toContain('<meta name="twitter:card" content="summary_large_image" />');
      expect(rendered.html, path).toContain(`<meta name="twitter:url" content="https://www.3mtravelagency.com${path}" />`);
    }
  });

  it("publie les numéros officiels Yaoundé et Ottawa dans le LocalBusiness JSON-LD", () => {
    const rendered = render("/procedures/canada-travail");
    expect(rendered.html).toContain('"@type":"LocalBusiness"');
    expect(rendered.html).toContain("+237 620 996 045");
    expect(rendered.html).toContain("+237 698 104 832");
    expect(rendered.html).toContain("+1 672 897 2999");
    expect(rendered.html).toContain('"@type":"ContactPoint"');
  });

  it("conserve une vraie 404 pour les identifiants e-Visa et slugs blog inconnus", () => {
    for (const path of ["/evisa/pays-inconnu", "/blog/etudes/pays-inconnu"]) {
      expect(render(path).status, path).toBe(404);
    }
  });
});

describe("alias historiques redirigés par un 301 serveur", () => {
  it.each(Object.entries(LEGACY_PUBLIC_REDIRECTS))("%s redirige vers la même cible que le <Redirect> d’App.tsx : %s", (alias, target) => {
    expect(appRedirects.get(alias)).toBe(target);
  });

  it("aligne aussi les 301 déjà enregistrés dans vite.ts et index.ts sur App.tsx", () => {
    for (const [alias, file] of Object.entries(HISTORICAL_REDIRECT_SOURCES)) {
      const target = appRedirects.get(alias);
      expect(target, alias).toBeDefined();
      const source = read(file);
      expect(source, alias).toContain(`app.get("${alias}"`);
      expect(source, alias).toContain(`res.redirect(301, "${target}")`);
    }
  });

  it("branche la table dans registerLegacyPublicRedirects, appelé par le mode Vite comme par la production", () => {
    const vite = read("server/_core/vite.ts");
    expect(vite).toMatch(/function registerLegacyPublicRedirects\(app: Express\) \{[\s\S]*?registerLegacyAliasRedirects\(app\);[\s\S]*?\n\}/);
    expect(vite.match(/^\s*registerLegacyPublicRedirects\(app\);/gm)).toHaveLength(2);
  });

  it("ne traite jamais un alias deux fois : 301 serveur ou page pré-rendue, pas les deux", () => {
    const registeredTwice = Object.keys(LEGACY_PUBLIC_REDIRECTS).filter((alias) => alias in HISTORICAL_REDIRECT_SOURCES || alias in PUBLIC_PAGES);
    expect(registeredTwice).toEqual([]);
    expect(getIndexablePublicPaths().filter((path) => redirectedByServer.has(path))).toEqual([]);
  });

  it("ne redirige ni vers un autre alias ni vers une page en 404", () => {
    for (const [alias, target] of Object.entries(LEGACY_PUBLIC_REDIRECTS)) {
      const targetPath = target.split(/[?#]/, 1)[0] || "/";
      expect(redirectedByServer.has(targetPath), `${alias} → ${target}`).toBe(false);
      expect(render(targetPath).status, `${alias} → ${target}`).toBe(200);
    }
  });
});

describe("fusion de la requête entrante avec la cible", () => {
  it("renvoie la cible telle quelle sans paramètre supplémentaire", () => {
    const target = LEGACY_PUBLIC_REDIRECTS["/evaluation-canada"];
    expect(legacyRedirectLocation(target, "/evaluation-canada")).toBe(target);
    expect(legacyRedirectLocation(target, "/evaluation-canada?")).toBe(target);
    expect(legacyRedirectLocation(target, "/evaluation-canada?campaign=Autre&source=x")).toBe(target);
  });

  it("ajoute les paramètres de suivi de la campagne Facebook sans perdre ceux de la cible", () => {
    expect(legacyRedirectLocation("/evaluation?source=facebook&campaign=Canada", "/evaluation-canada?fbclid=abc&utm_source=fb"))
      .toBe("/evaluation?source=facebook&campaign=Canada&fbclid=abc&utm_source=fb");
    expect(legacyRedirectLocation("/evaluation?source=facebook&campaign=Canada", "/evaluation-canada?campaign=Autre&fbclid=abc"))
      .toBe("/evaluation?source=facebook&campaign=Canada&fbclid=abc");
  });

  it("insère la requête avant le fragment et conserve les paramètres répétés", () => {
    expect(legacyRedirectLocation("/#evaluation-multi", "/evaluation-rapide?utm_source=fb")).toBe("/?utm_source=fb#evaluation-multi");
    expect(legacyRedirectLocation("/procedures", "/procedure?tag=a&tag=b")).toBe("/procedures?tag=a&tag=b");
  });

  it("conserve la valeur décodée du code de parrainage et n’émet jamais d’URL absolue", () => {
    const location = legacyRedirectLocation("/3m-digital", "/communaute?ref=A%20B&next=https://evil.example");
    expect(location.startsWith("/")).toBe(true);
    const parsed = new URL(location, "https://www.3mtravelagency.com");
    expect(parsed.origin).toBe("https://www.3mtravelagency.com");
    expect(parsed.searchParams.get("ref")).toBe("A B");
  });
});

describe("301 servis par Express", () => {
  let server: Server;
  let base = "";

  beforeAll(async () => {
    const app = express();
    registerLegacyAliasRedirects(app);
    server = await new Promise<Server>((listening) => {
      const instance = app.listen(0, "127.0.0.1", () => listening(instance));
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections?.();
    await new Promise<void>((done) => server.close(() => done()));
  });

  it.each(Object.entries(LEGACY_PUBLIC_REDIRECTS))("répond 301 sur %s vers %s", async (alias, target) => {
    const response = await fetch(`${base}${alias}`, { redirect: "manual" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(target);
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it("conserve les paramètres de la campagne Facebook, les codes de parrainage et le fragment", async () => {
    const facebook = await fetch(`${base}/evaluation-canada?fbclid=abc&utm_campaign=canada-2026`, { redirect: "manual" });
    expect(facebook.status).toBe(301);
    expect(facebook.headers.get("location")).toBe("/evaluation?source=facebook&campaign=Canada&fbclid=abc&utm_campaign=canada-2026");

    const referral = await fetch(`${base}/communaute?ref=ABC123`, { redirect: "manual" });
    expect(referral.headers.get("location")).toBe("/3m-digital?ref=ABC123");

    const fragment = await fetch(`${base}/evaluation-rapide?utm_source=fb`, { redirect: "manual" });
    expect(fragment.headers.get("location")).toBe("/?utm_source=fb#evaluation-multi");
  });

  it("redirige aussi avec un slash final et pour les requêtes HEAD", async () => {
    const trailingSlash = await fetch(`${base}/communaute/`, { redirect: "manual" });
    expect(trailingSlash.status).toBe(301);
    expect(trailingSlash.headers.get("location")).toBe("/3m-digital");

    const head = await fetch(`${base}/vols`, { method: "HEAD", redirect: "manual" });
    expect(head.status).toBe(301);
    expect(head.headers.get("location")).toBe("/flights");
  });

  it("laisse passer les chemins inconnus et ceux qui ont déjà leur propre 301", async () => {
    for (const path of ["/communaute-inconnue", ...Object.keys(HISTORICAL_REDIRECT_SOURCES)]) {
      const response = await fetch(`${base}${path}`, { redirect: "manual" });
      expect(response.status, path).toBe(404);
    }
  });
});
