import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("post-évaluation confiance — prochaine étape, docs, analytics, avis", () => {
  it("affiche la prochaine étape après soumission (délai, contact, suivi)", () => {
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    expect(form).toContain('data-testid="evaluation-next-steps"');
    expect(form).toContain("Délai de réponse attendu");
    expect(form).toContain("Mode de contact");
    expect(form).toContain("Où retrouver le suivi");
    expect(form).toContain("submittedReviewDeadline");
    expect(form).toContain("reviewDeadline");
  });

  it("rassure près du dépôt de CV/pièces et renvoie vers la confidentialité", () => {
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(form).toContain("DOCUMENT_VAULT_POLICY");
    expect(form).toContain('data-testid="evaluation-docs-privacy"');
    expect(form).toContain("Qui y a accès");
    expect(form).toContain("DOCUMENT_VAULT_POLICY.privacyPath");
    expect(space).toContain('data-testid="client-docs-privacy-note"');
    expect(space).toContain("/politique-confidentialite");
    expect(read("shared/documentVaultPolicy.ts")).toContain('privacyPath: "/politique-confidentialite"');
  });

  it("mesure début et fin d’évaluation sans PII", () => {
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    expect(form).toContain('trackEvent("evaluation_started"');
    expect(form).toContain('trackEvent("evaluation_completed"');
    expect(form).toContain("event_category: \"public_evaluation\"");
    expect(form).not.toMatch(/trackEvent\([^)]*email/i);
    expect(form).not.toMatch(/trackEvent\([^)]*fullName/i);
    expect(form).not.toMatch(/trackEvent\([^)]*whatsapp/i);
  });

  it("rappelle date de contrôle et lien officiel près des infos importantes", () => {
    const detail = read("client/src/pages/CountryDetailPage.tsx");
    expect(detail).toContain('data-testid="procedure-fee-control-stamp"');
    expect(detail).toContain('data-testid="procedure-steps-control-stamp"');
    expect(detail).toContain('data-testid="procedure-documents-control-stamp"');
    expect(detail).toContain("Lien officiel");
  });

  it("clarifie qui peut témoigner et comment les avis sont vérifiés", () => {
    const avis = read("client/src/pages/Avis.tsx");
    const submit = read("client/src/pages/SubmitReview.tsx");
    expect(avis).toContain('data-testid="avis-authenticity"');
    expect(avis).toContain("Qui peut témoigner");
    expect(avis).toContain("Comment les avis sont vérifiés");
    expect(submit).toContain('data-testid="review-eligibility-note"');
    expect(submit).toContain("Éligibilité");
    expect(submit).toContain("jamais d’avis inventés");
  });

  it("purge le service worker pour le lot post-évaluation confiance", () => {
    expect(read("client/public/sw.js")).toContain("3m-travel-pwa-v53-post-eval-confiance");
  });
});
