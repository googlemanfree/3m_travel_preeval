import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

describe("poids des pages publiques : les bibliothèques PDF ne se chargent qu'à la demande", () => {
  const config = source("vite.config.ts");

  it("aucun chunk manuel ne regroupe les bibliothèques PDF (sinon chaque page les importe, ~450 Ko compressés)", () => {
    expect(config).not.toMatch(/return\s+["']pdf-vendor["']/);
    expect(config).not.toMatch(/return\s+["']pdf-viewer-vendor["']/);
    // ces bibliothèques restent explicitement laissées au découpage automatique
    expect(config).toMatch(/pdfjs-dist[\s\S]{0,200}jspdf[\s\S]{0,200}return undefined/);
  });

  it("les chunks lourds réservés à quelques pages restent isolés", () => {
    expect(config).toMatch(/portrait-vendor/);
    expect(config).toMatch(/recharts-vendor/);
  });

  it("l'accueil (simulateur CRS) et le formulaire e-Visa ne chargent jspdf qu'au clic", () => {
    for (const file of ["client/src/components/CanadaScoreSimulator.tsx", "client/src/components/ValidationStep.tsx"]) {
      const text = source(file);
      expect(text, `${file} : import statique de jspdf`).not.toMatch(/^import\s+[^;]*from\s+["']jspdf(-autotable)?["']/m);
      expect(text, `${file} : import dynamique attendu`).toMatch(/import\(["']jspdf["']\)/);
    }
  });

  it("un échec de chargement de l'export du simulateur est annoncé, pas silencieux", () => {
    const simulator = source("client/src/components/CanadaScoreSimulator.tsx");
    expect(simulator).toMatch(/toast\.error\(["']Le rapport PDF n’a pas pu être généré/);
  });

  it("les composants publics de premier écran n'importent pas de bibliothèque PDF en dur", () => {
    const entryFiles = ["client/src/pages/Home.tsx", "client/src/App.tsx", "client/src/main.tsx", "client/src/components/Footer.tsx", "client/src/components/ServicesOverviewSection.tsx", "client/src/components/ProofGallerySection.tsx"];
    for (const file of entryFiles) {
      expect(source(file), file).not.toMatch(/from\s+["'](jspdf|jspdf-autotable|html2canvas|html2pdf\.js|react-pdf|pdfjs-dist)["']/);
    }
  });
});
