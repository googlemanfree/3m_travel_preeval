import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INITIAL_AGREEMENT_PROTOCOL } from "../shared/agreementProtocolContent";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const shell = "<!doctype html><html><head><title>Base</title></head><body><!--prerender-app--></body></html>";

describe("ops confiance — protocole, SLA, indexation", () => {
  it("aligne le résumé Tarifs/CGU sur le protocole signé (non remboursable si phase engagée)", () => {
    expect(INITIAL_AGREEMENT_PROTOCOL).toMatch(/non remboursables/i);
    expect(INITIAL_AGREEMENT_PROTOCOL).toContain("travaux déjà réalisés");
    const tarifs = read("client/src/pages/Tarifs.tsx");
    const cgu = read("client/src/pages/ConditionsUtilisation.tsx");
    expect(tarifs).toContain("phase engagée");
    expect(tarifs).toContain("protocole + reçu");
    expect(tarifs).not.toContain("éventuel remboursement partiel selon le protocole écrit (cas par cas)");
    expect(cgu).toContain("phase engagée");
    expect(cgu).toContain("protocole signé");
    expect(composePublicPrerender(shell, "/tarifs").html).toContain("phase engagée");
  });

  it("harmonise le SLA annoncé en heures ouvrées (pas « 24 heures » calendaires)", () => {
    const contact = read("client/src/pages/Contact.tsx");
    const office = read("client/src/components/OfficeContactPanel.tsx");
    const company = read("client/src/lib/companyContacts.ts");
    expect(company).toContain("sous 24 heures ouvrées");
    expect(contact).toContain("24 heures ouvrées");
    expect(contact).not.toContain("Vous recevrez une réponse dans les 24 heures.");
    expect(office).toContain("24 h ouvrées");
  });

  it("rafraîchit lastmod sitemap des pages confiance pour limiter le retard d’indexation", () => {
    const sitemap = read("client/public/sitemap.xml");
    for (const path of ["/", "/procedures", "/tarifs", "/contact", "/politique-confidentialite", "/conditions-utilisation"]) {
      const loc = `https://www.3mtravelagency.com${path === "/" ? "/" : path}`;
      expect(sitemap).toMatch(new RegExp(`${loc.replace(/\//g, "\\/")}</loc>\\s*<lastmod>2026-10-14</lastmod>`));
    }
  });

  it("purge le service worker pour ce lot ops", () => {
    expect(read("client/public/sw.js")).toMatch(/3m-travel-pwa-v\d+/);
  });
});
