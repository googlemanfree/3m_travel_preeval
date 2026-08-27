import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Register.tsx"), "utf8");

describe("soumission d’inscription", () => {
  it("bloque une nouvelle soumission pendant l’envoi ou la création", () => {
    expect(source).toContain("if (registerMutation.isPending || isUploadingPortrait || showSuccessAnimation)");
    expect(source).toContain('disabled={registerMutation.isPending || isUploadingPortrait || !isFormValid || showSuccessAnimation}');
  });

  it("annonce un chargement accessible avec une progression visible", () => {
    expect(source).toContain('role="status" aria-live="polite" aria-atomic="true"');
    expect(source).toContain("Création de votre espace en cours...");
    expect(source).toContain('role="progressbar"');
    expect(source).toContain("Veuillez patienter sans actualiser la page.");
  });
});
