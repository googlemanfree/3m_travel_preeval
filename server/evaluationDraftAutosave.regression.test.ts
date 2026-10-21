import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Evaluation.tsx"), "utf8");

describe("brouillon d’évaluation dans l’espace client", () => {
  it("sauvegarde automatiquement les réponses locales avec une version et un propriétaire", () => {
    expect(source).toContain("const DRAFT_KEY = 'eval_draft'");
    expect(source).toContain("localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, savedAt, owner: draftOwner, form }))");
    expect(source).toContain("setDraftStatus('saving')");
    expect(source).toContain("setDraftStatus('saved')");
  });

  it("affiche une confirmation accessible et permet d’effacer le brouillon", () => {
    expect(source).toContain('data-testid="evaluation-draft-status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("Brouillon restauré");
    expect(source).toContain("Effacer le brouillon");
    expect(source).toContain("localStorage.removeItem(DRAFT_KEY)");
  });

  it("ne persiste pas le fichier CV dans le brouillon local", () => {
    const autosaveLine = source.match(/localStorage\.setItem\(DRAFT_KEY,([\s\S]*?)\);/)?.[1] ?? "";
    expect(autosaveLine).toContain("form");
    expect(autosaveLine).not.toContain("cvFile");
    expect(autosaveLine).not.toContain("cvBase64");
  });
});
