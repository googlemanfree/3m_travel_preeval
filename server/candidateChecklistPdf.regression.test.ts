import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/components/CandidateCountryJourney.tsx"), "utf8");

describe("checklist client : progression et export PDF", () => {
  it("affiche une jauge globale accessible avec le nombre d’étapes", () => {
    expect(source).toContain("Avancement global");
    expect(source).toContain("completedStepCount}/{journey.steps.length} étapes");
    expect(source).toContain('role="progressbar"');
    expect(source).toContain("aria-valuenow={progress}");
  });

  it("exporte les étapes, statuts, documents et progression dans un PDF", () => {
    expect(source).toContain('await import("jspdf")');
    expect(source).toContain("downloadChecklistPdf");
    expect(source).toContain("Avancement global : ${progress}%");
    expect(source).toContain("item.requiredInputs");
    expect(source).toContain('pdf.save(filename)');
    expect(source).toContain("Télécharger en PDF");
  });
});
