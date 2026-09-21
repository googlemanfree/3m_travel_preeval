import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evisasDatabaseComplete } from "../client/src/data/evisasDatabaseComplete";
import { compareMarker, DEFAULT_WITNESSES, evaluateWitness, parseArgs } from "../scripts/verify-deploy";
import { LEGACY_PUBLIC_REDIRECTS, legacyRedirectLocation } from "./legacyPublicRedirects";
import { composePublicPrerender } from "./publicPrerender";
import { extractBuildMarker, injectBuildMarker, parseBuildMarker, resolveBuildMarker, sanitizeBuildMarker } from "./publicBuildMarker";

// « Publié avec succès » ne prouve pas qu'un commit est en ligne : la balise 3m-build-marker,
// posée à la compilation, et le script verify:deploy donnent une preuve lisible sur toute page.
const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");
const indexHtml = read("client/index.html");
const shell = '<!doctype html><html><head><title>t</title></head><body><div id="root"><!--prerender-app--></div></body></html>';

describe("balise de build posée à la compilation", () => {
  it("préfère PUBLIC_BUILD_MARKER, puis commit et date de build, et à défaut « nogit » avec la date", () => {
    const now = new Date(Date.UTC(2026, 8, 21, 16, 32, 45));
    expect(resolveBuildMarker({ PUBLIC_BUILD_MARKER: " release-42 " }, () => "abcdef12", now)).toBe("release-42");
    expect(resolveBuildMarker({}, () => "abcdef12\n", now)).toBe("abcdef12.202609211632");
    expect(resolveBuildMarker({}, () => "fatal: not a git repository", now)).toBe("nogit.202609211632");
    expect(resolveBuildMarker({}, () => undefined, now)).toBe("nogit.202609211632");
    expect(resolveBuildMarker({}, () => {
      throw new Error("git introuvable");
    }, now)).toBe("nogit.202609211632");
  });

  it("relit commit et date de build depuis la balise, ancien format et balise sans commit compris", () => {
    const builtAt = new Date(Date.UTC(2026, 8, 21, 16, 32));
    expect(parseBuildMarker("abcdef12.202609211632")).toEqual({ commit: "abcdef12", builtAt });
    expect(parseBuildMarker("nogit.202609211632")).toEqual({ commit: undefined, builtAt });
    expect(parseBuildMarker("abcdef12")).toEqual({ commit: "abcdef12" });
    expect(parseBuildMarker("admin-bilan-online-reference-2026-09-04-v1")).toEqual({});
    expect(parseBuildMarker("nogit.202613991699")).toEqual({});
    expect(parseBuildMarker(undefined)).toEqual({});
  });

  it("nettoie un marqueur hostile avant de l’insérer dans un attribut HTML", () => {
    const sanitized = sanitizeBuildMarker('x"><script>alert(1)</script>');
    expect(sanitized).toMatch(/^[a-zA-Z0-9._-]+$/);
    const injected = injectBuildMarker(indexHtml, 'x"><script>alert(1)</script>');
    expect(injected).not.toContain("<script>alert(1)</script>");
    expect(extractBuildMarker(injected)).toBe(sanitized);
  });

  it("remplace uniquement la valeur de la balise dans client/index.html", () => {
    const original = extractBuildMarker(indexHtml);
    expect(original).toBeTruthy();
    const injected = injectBuildMarker(indexHtml, "abcdef12");
    expect(extractBuildMarker(injected)).toBe("abcdef12");
    expect(injected.replace("abcdef12", original ?? "")).toBe(indexHtml);
    // La révision du service worker est une autre valeur : elle ne doit pas bouger.
    expect(injected).toContain("2026-09-04-admin-bilan-online-reference-v1");
    expect(injectBuildMarker("<html><head></head></html>", "abcdef12")).toBe("<html><head></head></html>");
  });

  it("branche le plugin dans vite.config.ts sans passer par un shell, et le script dans package.json", () => {
    const viteConfig = read("vite.config.ts");
    expect(viteConfig).toContain("buildMarkerPlugin(),");
    expect(viteConfig).toContain('name: "3m-build-marker"');
    expect(viteConfig).toContain("execFileSync");
    expect(viteConfig).not.toContain("execSync(");
    expect(read("package.json")).toContain('"verify:deploy": "tsx scripts/verify-deploy.ts"');
  });
});

describe("vérification d’un déploiement (scripts/verify-deploy.ts)", () => {
  const unknown = () => undefined;

  it("reconnaît le commit attendu, un build qui le contient, un ancien build et un build inconnu", () => {
    expect(compareMarker("abcdef12.202609211632", "abcdef1234567890", unknown)).toBe("exact");
    expect(compareMarker("abcdef12", "abcdef1234567890", unknown)).toBe("exact");
    expect(compareMarker("abcdef1234567890.202609211632", "abcdef12", unknown)).toBe("exact");
    expect(compareMarker("1234567a.202609211632", "abcdef12", (ancestor, descendant) => ancestor === "abcdef12" && descendant === "1234567a")).toBe("descendant");
    expect(compareMarker("1234567a.202609211632", "abcdef12", () => false)).toBe("older");
    expect(compareMarker("1234567a.202609211632", "abcdef12", unknown)).toBe("unknown");
  });

  it("compare la date d’un build sans git à celle du commit attendu", () => {
    const committedAt = () => new Date(Date.UTC(2026, 8, 21, 12, 26, 30));
    expect(compareMarker("nogit.202609211632", "abcdef12", unknown, committedAt)).toBe("built-after");
    expect(compareMarker("nogit.202609211226", "abcdef12", unknown, committedAt)).toBe("built-after");
    expect(compareMarker("nogit.202609211100", "abcdef12", unknown, committedAt)).toBe("built-before");
    expect(compareMarker("nogit.202609211632", "abcdef12", unknown)).toBe("unknown");
  });

  it("traite une balise sans commit comme un ancien build", () => {
    expect(compareMarker("admin-bilan-online-reference-2026-09-04-v1", "abcdef12", () => true)).toBe("no-marker");
    expect(compareMarker(undefined, "abcdef12", () => true)).toBe("no-marker");
  });

  it("évalue une route témoin sur son statut et sa destination", () => {
    const redirect = { path: "/communaute", status: 301, location: "/3m-digital" };
    expect(evaluateWitness(redirect, { status: 301, location: "/3m-digital" }).ok).toBe(true);
    expect(evaluateWitness(redirect, { status: 404, location: null }).detail).toBe("404 au lieu de 301");
    expect(evaluateWitness(redirect, { status: 301, location: "/autre" }).ok).toBe(false);
    expect(evaluateWitness({ path: "/", status: 200 }, { status: 200, location: null }).ok).toBe(true);
  });

  it("lit les options de la ligne de commande", () => {
    expect(parseArgs([])).toEqual({ base: "https://www.3mtravelagency.com" });
    expect(parseArgs(["--base", "https://staging.example.org//", "--expect", "origin/main", "--sitemap-count", "204"]))
      .toEqual({ base: "https://staging.example.org", expect: "origin/main", sitemapCount: 204 });
  });

  it("garde des routes témoins alignées sur le code : redirections, pages 200 et vraies 404", () => {
    for (const witness of DEFAULT_WITNESSES) {
      if (witness.status === 301) {
        const alias = witness.path.split("?")[0] as keyof typeof LEGACY_PUBLIC_REDIRECTS;
        expect(LEGACY_PUBLIC_REDIRECTS[alias], witness.path).toBeDefined();
        expect(witness.location, witness.path).toBe(legacyRedirectLocation(LEGACY_PUBLIC_REDIRECTS[alias], witness.path));
      } else {
        expect(composePublicPrerender(shell, witness.path).status, witness.path).toBe(witness.status);
      }
    }
    expect(evisasDatabaseComplete.some((destination) => destination.id === "kenya")).toBe(true);
    expect(DEFAULT_WITNESSES.map((witness) => witness.status).sort()).toEqual([200, 200, 200, 301, 301, 404, 404]);
  });
});
