import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { PUBLIC_FAQ_ITEMS } from "@shared/publicFaq";
import { composePublicPrerender } from "./publicPrerender";

const template = "<!doctype html><html><head></head><body><div id=\"root\"><!--prerender-app--></div></body></html>";

describe("signaux publics de marque et d’évaluation", () => {
  it("ne publie que le réseau social officiel confirmé dans Organization.sameAs", () => {
    const html = composePublicPrerender(template, "/").html;
    expect(html).toContain('"sameAs":["https://www.facebook.com/3mtravelcm"]');
    expect(html).not.toContain("instagram.com/3mtravelagency");
  });

  it("publie le titre HTML avec la marque publique unifiée", () => {
    const html = composePublicPrerender(template, "/").html;
    expect(html).toContain("<title>3M TRAVEL AGENCY | Voyages, Visas, Études &amp; Mobilité Internationale</title>");
    expect(html).not.toContain("3M Travel &amp; Services | Voyages, Visas, Études &amp; Mobilité Internationale");
  });

  it("aligne la FAQ compte sur le démarrage sans compte puis suivi avec compte", () => {
    const accountQuestion = PUBLIC_FAQ_ITEMS.find((item) => item.question === "Faut-il créer un compte avant de commencer ?");
    expect(accountQuestion?.answer).toMatch(/Non pour démarrer/i);
    expect(accountQuestion?.answer).toContain("sans compte");
    expect(accountQuestion?.answer).toContain("Créez un compte ensuite");
    expect(accountQuestion?.answer).not.toContain("Créez d’abord votre compte");
  });

  it("n’expose pas de liens sociaux non confirmés ni de promesse sans compte dans le footer", () => {
    const footer = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/Footer.tsx"), "utf8");
    expect(footer).not.toContain("instagram.com/3mtravelagency");
    expect(footer).not.toContain("linkedin.com/company/3mtravelagency");
    expect(footer).not.toContain("twitter.com/3mtravelagency");
    expect(footer).not.toContain("sans créer de compte");
  });
});
