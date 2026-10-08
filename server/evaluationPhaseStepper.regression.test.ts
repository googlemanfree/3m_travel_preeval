import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const form = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/SimpleMultiProjectForm.tsx"),
  "utf8",
);

describe("stepper premium — 3 phases Projet → Profil → Envoi", () => {
  it("expose trois phases visibles tout en gardant les sous-étapes internes", () => {
    expect(form).toContain("const PHASES");
    expect(form).toContain('{ label: "Projet"');
    expect(form).toContain('{ label: "Profil"');
    expect(form).toContain('{ label: "Envoi"');
    expect(form).toContain('data-testid="evaluation-phase-stepper"');
    expect(form).toContain("grid-cols-3");
    expect(form).toContain("Trois étapes claires");
    // Les 5 sous-étapes restent pour la validation (Critères, Documents…).
    expect(form).toContain('{ label: "Critères"');
    expect(form).toContain('{ label: "Documents"');
    expect(form).toContain("phase: 0");
    expect(form).toContain("phase: 1");
    expect(form).toContain("phase: 2");
  });

  it("annonce la sous-étape pendant la phase Profil et anime la progression", () => {
    expect(form).toContain('data-testid="evaluation-profil-substep"');
    expect(form).toContain("Phase Profil ·");
    expect(form).toContain('aria-current={isActive ? "step"');
    expect(form).toContain("role=\"progressbar\"");
    expect(form).toContain("AnimatePresence");
  });
});
