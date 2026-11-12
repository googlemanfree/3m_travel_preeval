import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const editor = readFileSync(resolve(root, "client/src/components/EvaluationDeliveryEditor.tsx"), "utf8").replace(/\s+/g, " ");

/** Constat du 2026-11-12 : bilan vide → Enregistrer, Valider, test et Envoyer grisés sans explication sur la marche à suivre. */
describe("bilan vide : le chemin pour activer les boutons est expliqué", () => {
  it("un bloc d'aide s'affiche tant que le bilan est vide et non verrouillé", () => {
    expect(editor).toContain("{!text.trim() && !locked && ( <div");
    expect(editor).toContain('data-testid="bilan-empty-help"');
    expect(editor).toContain("Les boutons s'activent dès que le bilan contient du texte.");
  });

  it("deux actions : coller le bilan copié, ou partir du canevas adapté au dossier", () => {
    expect(editor).toContain('data-testid="bilan-paste-clipboard"');
    expect(editor).toContain("navigator.clipboard.readText()");
    expect(editor).toContain('data-testid="bilan-use-skeleton"');
    expect(editor).toContain("pickSkeleton(suggestedSkeleton)");
  });

  it("le collage refusé par le navigateur renvoie vers Ctrl+V et le champ, sans casser", () => {
    expect(editor).toContain("Collage automatique refusé par le navigateur");
    expect(editor).toContain('document.getElementById("bilan-input")');
  });

  it("les garde-fous de conformité (promesses, données sensibles, zones à compléter) restent bloquants", () => {
    expect(editor).toContain("Formulation à revoir (promesse de résultat)");
    expect(editor).toContain("Donnée sensible à retirer");
    expect(editor).toContain("disabled={locked || busy || blockers.length > 0}");
  });
});
