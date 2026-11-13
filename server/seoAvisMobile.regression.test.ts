import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_FAQ_ITEMS } from "../shared/publicFaq";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const shell = "<!doctype html><html><head><title>Base</title></head><body><!--prerender-app--></body></html>";

describe("SEO procédures, avis résolus et alignement sans compte", () => {
  it("indexe /procedures avec démarrage sans compte (FAQ + corps + meta)", () => {
    const html = composePublicPrerender(shell, "/procedures").html;
    expect(html).toContain("s’envoie depuis votre espace candidat");
    expect(html).toContain("compte candidat gratuit");
    expect(html).toContain("Évaluation gratuite (compte candidat gratuit)");
    expect(html).not.toContain("Oui. Créez d’abord votre compte");
    expect(html).toMatch(/description[^>]*compte candidat gratuit/i);

    const account = PUBLIC_FAQ_ITEMS.find((item) => item.question === "Faut-il créer un compte avant de commencer ?");
    expect(account?.answer).toMatch(/^Oui\./);
  });

  it("aligne le tableau interactif Procédures sur le même parcours", () => {
    const page = read("client/src/pages/ProceduresAdvanced.tsx");
    expect(page).toContain("Compte gratuit → évaluation gratuite");
    expect(page).not.toContain("Compte → sélection du pays → évaluation");
    expect(page).not.toContain("Compte → choix de destination → évaluation");
    expect(page).not.toContain("Compte → motif et destination → checklist");
  });

  it("fait résoudre le bloc avis rapidement (timeout court + états empty/list)", () => {
    const reviews = read("client/src/components/ApprovedReviewsSection.tsx");
    expect(reviews).toContain("REVIEWS_LOAD_TIMEOUT_MS = 2_500");
    expect(reviews).toContain("approved-reviews-empty");
    expect(reviews).toContain("approved-reviews-list");
    expect(reviews).toContain('data-reviews-resolved="true"');
    expect(reviews).toContain("isFetched");
    expect(read("client/public/sw.js")).toMatch(/3m-travel-pwa-v\d+/);
  });
});
