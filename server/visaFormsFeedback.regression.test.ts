import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("formulaires de visa : chargement visible et erreurs précises", () => {
  const evaluation = read("client/src/components/SimpleMultiProjectForm.tsx");
  const evisa = read("client/src/pages/EvisaRequestForm.tsx");

  it("l'évaluation affiche un indicateur, annonce la progression et ne perd plus un document en silence", () => {
    expect(evaluation).toContain('data-testid="evaluation-submit"');
    expect(evaluation).toContain("aria-busy={isSubmitting}");
    expect(evaluation).toContain("Envoi de votre évaluation…");
    expect(evaluation).toContain("Envoi des documents (");
    expect(evaluation).toContain('aria-live="polite"');
    expect(evaluation).toContain("describeFormError(error)");
    // Un document refusé est signalé, sans annuler l'évaluation déjà enregistrée.
    expect(evaluation).toContain("failedDocuments.push(item.file.name)");
    expect(evaluation).toContain("Votre évaluation est bien enregistrée");
    expect(evaluation).not.toContain('error.message || "Erreur lors de la soumission"');
  });

  it("la demande d'e-Visa affiche un indicateur et un message d'erreur adapté à la cause", () => {
    expect(evisa).toContain('data-testid="evisa-submit"');
    expect(evisa).toContain("aria-busy={isLoading}");
    expect(evisa).toContain("describeFormError(err,");
    expect(evisa).not.toContain("setError(err.message ||");
  });
});
