import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSimulator = () =>
  fs.readFileSync(path.join(projectRoot, "client/src/components/CanadaScoreSimulator.tsx"), "utf8");

describe("CanadaScoreSimulator — sourcing des rondes IRCC", () => {
  it("compare le score au seuil de rondes réellement sourcées, pas à une liste inventée en dur", () => {
    const source = readSimulator();
    expect(source).toContain('import { CEC_SIX_MONTH_CRS_HISTORY, CRS_HISTORY_SOURCE, LATEST_INVITATION_ROUNDS, LATEST_ROUNDS_VERIFIED_AT } from "@/data/crsHistoricalRounds"');
    expect(source).toContain("const allRounds = LATEST_INVITATION_ROUNDS;");
    // L'ancienne liste "allRounds" codée en dur (rondes #430-#435, jamais vérifiées) ne doit pas revenir.
    expect(source).not.toContain("Ronde #435");
    expect(source).not.toContain("Ronde #434");
    expect(source).not.toContain("Ronde #433");
    expect(source).not.toContain("Ronde #430");
  });

  it("retire le filtre \"Général\" (IRCC ne tient plus de rondes toutes catégories depuis fin 2023)", () => {
    const source = readSimulator();
    expect(source).not.toContain('value="general"');
    expect(source).not.toContain("Général (Toutes cat.)");
    expect(source).not.toContain("Toutes catégories confondues");
  });

  it("cite la source IRCC et la date de vérification pour le tableau comparatif, comme pour le graphique", () => {
    const source = readSimulator();
    const sourceCitations = source.match(/rondes relevées le/g) ?? [];
    // Une citation dans le rendu web (cartes) et une dans le PDF exporté.
    expect(sourceCitations.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("LATEST_ROUNDS_VERIFIED_AT");
  });
});

describe("CanadaScoreSimulator — téléchargement du PDF réservé aux candidats inscrits", () => {
  it("vérifie l'authentification candidat avant de générer le fichier PDF", () => {
    const source = readSimulator();
    expect(source).toContain('import { useCandidateAuth } from "@/hooks/useCandidateAuth"');
    expect(source).toContain("const { isAuthenticated } = useCandidateAuth();");
    const exportFn = source.slice(source.indexOf("const handleExportPDF"), source.indexOf("const handleCopyResults"));
    expect(exportFn).toContain("if (!isAuthenticated)");
    expect(exportFn).toContain("/register?from=");
    // La redirection doit intervenir avant toute génération/sauvegarde du PDF.
    expect(exportFn.indexOf("if (!isAuthenticated)")).toBeLessThan(exportFn.indexOf(".save("));
  });

  it("laisse la prévisualisation libre pour tout visiteur (seul le téléchargement est réservé)", () => {
    const source = readSimulator();
    const previewFn = source.slice(source.indexOf("const handlePreviewPDF"), source.indexOf("const handleExportPDF"));
    expect(previewFn).not.toContain("isAuthenticated");
  });

  it("indique visuellement au visiteur non connecté qu'un compte est requis pour télécharger", () => {
    const source = readSimulator();
    expect(source).toContain("Créer un compte pour télécharger");
    expect(source).toContain("réservé aux candidats inscrits");
  });
});
