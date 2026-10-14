import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("suite audit suivante — overlay, frais, SEO, preuves, CTA", () => {
  it("réduit l’overlay Assistants mobile (auto-fermeture + clé v2)", () => {
    const dock = read("client/src/components/FloatingToolsDock.tsx");
    expect(dock).toContain("3m-floating-dock-hint-seen-v2");
    expect(dock).toContain("3_200");
    expect(dock).toContain('addEventListener("scroll"');
    expect(dock).toContain("w-[min(12.5rem");
  });

  it("publie des frais vérifiés FR/CA/DE/LU avec devise et lien officiel", () => {
    const fees = read("client/src/data/verifiedProcedureFees.ts");
    const procedures = read("client/src/data/procedures107Complete.ts");
    const detail = read("client/src/pages/CountryDetailPage.tsx");
    expect(fees).toContain("france-visiteur");
    expect(fees).toContain("canada-travail");
    expect(fees).toContain("allemagne-travail");
    expect(fees).toContain("luxembourg-visiteur");
    expect(fees).toContain("currency: \"EUR\"");
    expect(fees).toContain("currency: \"CAD\"");
    expect(fees).toContain("80 EUR");
    expect(procedures).toContain("80 EUR (Schengen C adulte — barème UE)");
    expect(procedures).toContain("155 CAD + 85 CAD biométrie");
    expect(detail).toContain("getVerifiedProcedureFee");
    expect(detail).toContain("procedure-fee-summary");
    expect(detail).toContain("procedure-internal-links");
  });

  it("renforce le SEO des fiches destination (titre unique + liens internes)", () => {
    const detail = read("client/src/pages/CountryDetailPage.tsx");
    expect(detail).toContain("visa ${visaLabelFr}");
    expect(detail).toContain("procedure-internal-links");
    expect(detail).toContain('href="/sources-officielles"');
    expect(detail).toContain('href="/tarifs"');
  });

  it("affiche la marque 3M TRAVEL AGENCY sur la galerie de preuves", () => {
    const gallery = read("client/src/components/ProofGallerySection.tsx");
    const docs = read("docs/modele_bilan_evaluation_et_prompt.md");
    expect(gallery).toContain("proof-brand-note");
    expect(gallery).toContain("3M TRAVEL AGENCY");
    expect(docs).not.toContain("3M TRAVEL & SERVICES");
  });

  it("unifie le message évaluation compte + CV sur Contact et Visa études", () => {
    const contact = read("client/src/pages/Contact.tsx");
    const etudes = read("client/src/pages/VisaEtudes.tsx");
    const about = read("client/src/pages/About.tsx");
    expect(contact).toContain("contact-eval-hint");
    expect(contact).toContain("evaluateHint");
    expect(etudes).toContain("etudes-eval-hint");
    expect(etudes).toContain("EVALUATION_CTA_HINT");
    expect(etudes).toContain("buildFreeEvaluationHref(\"etudes\")");
    expect(etudes).not.toContain('href="/evaluation?destination=etudes"');
    expect(about).toContain("hint");
  });

  it("purge le service worker pour la suite suivante", () => {
    expect(read("client/public/sw.js")).toContain("3m-travel-pwa-v49-suite-suivante");
  });
});
