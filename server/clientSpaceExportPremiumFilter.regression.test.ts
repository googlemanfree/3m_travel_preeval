import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const readProjectFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("export espace client et filtre premium admin", () => {
  it("expose un export PDF récapitulatif côté espace client", () => {
    const source = readProjectFile("client/src/components/ClientSpaceNavigation.tsx");
    expect(source).toContain("exportClientDataPdf");
    expect(source).toContain('fetch("/logo-3m.webp")');
    expect(source).toContain('pdf.addImage(logoData, "PNG"');
    expect(source).toContain('pdf.setFillColor(10, 43, 96)');
    expect(source).toContain("Synthèse des données disponibles");
    expect(source).toContain('await import("jspdf")');
    expect(source).toContain("Exporter mes données PDF");
    expect(source).toContain("recapitulatif-espace-client-");
  });

  it("conserve un chargement animé et accessible dans le tableau de bord client", () => {
    const source = readProjectFile("client/src/pages/EvaluationSpace.tsx");
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain("animate-pulse");
    expect(source).toContain("Récupération sécurisée de vos dossiers");
  });

  it("relie le raccourci premium au statut d’activation réel", () => {
    const source = readProjectFile("client/src/pages/AdminDashboard.tsx");
    expect(source).toContain('activationFilter === "active"');
    expect(source).toContain("Comptes premium / activés");
    expect(source).toContain('activationStatus: activationFilter !== "ALL" ? activationFilter : undefined');
  });
});
