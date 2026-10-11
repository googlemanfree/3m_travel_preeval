// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { applySecurityHeaders, isPrivatePath, PERMISSIONS_POLICY } from "./_core/securityHeaders";
import { composePublicPrerender, getIndexablePublicPaths } from "./publicPrerender";

// Fiches.tsx s'appuie sur le runtime JSX automatique de Vite : sous vitest, React doit être global avant son import.
(globalThis as { React?: typeof React }).React = React;
const loadFiches = async () => (await import("../client/src/pages/Fiches")).default;

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8").replace(/\r/g, "");
const shell = '<!doctype html><html lang="fr"><head><title>x</title></head><body><!--prerender-app--></body></html>';
const metaOf = (path: string) => {
  const html = composePublicPrerender(shell, path).html;
  return {
    title: ((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? "").replace(/&amp;/g, "&"),
    description: ((html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [])[1] ?? "").replace(/&amp;/g, "&"),
  };
};
const headersFor = (path: string) => {
  const headers: Record<string, string> = {};
  applySecurityHeaders(path, (name, value) => { headers[name] = value; });
  return headers;
};

afterEach(() => cleanup());

describe("en-têtes de sécurité", () => {
  it("toutes les pages : Referrer-Policy et Permissions-Policy, caméra du site conservée (portrait du candidat)", () => {
    const headers = headersFor("/procedures");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toBe(PERMISSIONS_POLICY);
    expect(PERMISSIONS_POLICY).toContain("camera=(self)");
    expect(PERMISSIONS_POLICY).toContain("microphone=()");
    expect(PERMISSIONS_POLICY).toContain("geolocation=()");
  });

  it("pages publiques : pas d'interdiction d'affichage dans un cadre (aperçu de l'hébergeur)", () => {
    for (const path of ["/", "/procedures", "/flights", "/blog/etudes/canada"]) {
      const headers = headersFor(path);
      expect(headers["X-Frame-Options"], path).toBeUndefined();
      expect(headers["Content-Security-Policy"], path).toBeUndefined();
    }
  });

  it("pages privées (connexion, espaces, paiement, administration) : interdites dans un cadre d'un autre site", () => {
    for (const path of ["/login", "/admin", "/admin/payments", "/mon-espace", "/mon-dossier", "/paiement", "/payment/method-selection", "/document-upload", "/employeurs", "/agences-placement"]) {
      expect(isPrivatePath(path), path).toBe(true);
      const headers = headersFor(path);
      expect(headers["X-Frame-Options"], path).toBe("SAMEORIGIN");
      expect(headers["Content-Security-Policy"], path).toBe("frame-ancestors 'self'");
    }
    expect(isPrivatePath("/administration-publique")).toBe(false);
    expect(isPrivatePath("/loginx")).toBe(false);
  });

  it("le middleware est branché avant les routes du serveur", () => {
    const index = read("server/_core/index.ts");
    expect(index).toContain("app.use(securityHeadersMiddleware);");
    expect(index.indexOf("securityHeadersMiddleware);")).toBeLessThan(index.indexOf("express.json"));
  });
});

describe("champs de formulaire nommés", () => {
  it("/assurance : chaque champ du formulaire est lié à son libellé par un identifiant unique", () => {
    const source = read("client/src/pages/AssuranceInscription.tsx");
    expect(source).toContain("const id = useId();");
    expect(source).toMatch(/<Label htmlFor=\{id\}>\{label\}<\/Label><Input id=\{id\}/);
  });

  it("/traduction/order : les trois listes sont liées à leur libellé", () => {
    const source = read("client/src/pages/TranslationOrder.tsx");
    for (const id of ["documentType", "sourceLanguage", "targetLanguage"]) {
      expect(source, id).toContain(`<SelectTrigger id="${id}">`);
      expect(source, id).toContain(`htmlFor="${id}"`);
    }
  });

  it("/fiches, /ressources et /conformite-documents : recherche et filtre nommés", () => {
    expect(read("client/src/pages/Fiches.tsx")).toContain('aria-label="Rechercher une fiche pays"');
    expect(read("client/src/pages/Fiches.tsx")).toContain('aria-label="Filtrer les fiches par pays"');
    expect(read("client/src/pages/Ressources.tsx")).toContain("aria-label={language === 'en' ?");
    expect(read("client/src/pages/DocumentCompliancePage.tsx")).toContain('<Input aria-label="Pays ou région"');
  });
});

describe("titres et descriptions", () => {
  it("toutes les pages procédure : titre ≤ 65 caractères et description ≤ 175", () => {
    const paths = getIndexablePublicPaths().filter((path) => path.startsWith("/procedures/"));
    expect(paths.length).toBeGreaterThan(100);
    for (const path of paths) {
      const { title, description } = metaOf(path);
      expect(title.length, `${path} : ${title}`).toBeLessThanOrEqual(65);
      expect(description.length, `${path} : ${description}`).toBeLessThanOrEqual(175);
    }
  });

  it("/partenaires : description ≤ 175 caractères", () => {
    expect(metaOf("/partenaires").description.length).toBeLessThanOrEqual(175);
  });
});

describe("/fiches : affichage progressif", () => {
  const cards = () => screen.queryAllByRole("button", { name: /Voir tous les détails/ });

  it("affiche 18 fiches d'abord, puis 18 de plus à chaque clic, le bouton disparaît quand tout est affiché", async () => {
    const Fiches = await loadFiches();
    render(<Fiches />);
    expect(cards()).toHaveLength(18);
    const more = screen.getByTestId("fiches-show-more");
    expect(more.textContent).toMatch(/restantes/);
    fireEvent.click(more);
    expect(cards()).toHaveLength(36);
    for (let i = 0; i < 20 && screen.queryByTestId("fiches-show-more"); i++) fireEvent.click(screen.getByTestId("fiches-show-more"));
    expect(screen.queryByTestId("fiches-show-more")).toBeNull();
    expect(cards().length).toBeGreaterThan(36);
  });

  it("une recherche revient à la première page et trouve aussi les fiches non encore affichées", async () => {
    const Fiches = await loadFiches();
    render(<Fiches />);
    fireEvent.click(screen.getByTestId("fiches-show-more"));
    expect(cards()).toHaveLength(36);
    fireEvent.change(screen.getByLabelText("Rechercher une fiche pays"), { target: { value: "Canada" } });
    expect(cards().length).toBeGreaterThan(0);
    expect(cards().length).toBeLessThanOrEqual(18);
    expect(screen.getByText(/fiches? trouvée/).textContent).toMatch(/\d+ fiches? trouvée/);
  });
});
