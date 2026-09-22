import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/**
 * `evaluation.getMyEvaluations` est une procédure candidate : tout candidat connecté peut l'appeler
 * directement (pas seulement depuis un écran existant). `reviewedBy`/`secondReviewedBy`/`finalReviewedBy`
 * portaient l'adresse e-mail de l'administrateur — une identité interne à l'agence, jamais due au candidat.
 */
describe("evaluation.getMyEvaluations : aucune adresse e-mail d'administrateur renvoyée au candidat", () => {
  it("ne construit plus reviewedBy, secondReviewedBy ni finalReviewedBy", () => {
    const source = read("server/routers/evaluation.ts");
    const start = source.indexOf("getMyEvaluations: candidateProcedure");
    const procedure = source.slice(start, source.indexOf("}),", start) + 3); // jusqu'à la fin de la procédure
    for (const field of ["reviewedBy:", "secondReviewedBy:", "finalReviewedBy:"]) expect(procedure, field).not.toContain(field);
    // Les dates de validation restent utiles au candidat (« Validé le … ») sans révéler qui, côté agence, a validé.
    for (const field of ["reviewedAt:", "secondReviewedAt:", "finalReviewedAt:"]) expect(procedure, field).toContain(field);
  });

  it("l'espace candidat n'affiche plus l'identité de l'administrateur ayant validé", () => {
    const source = read("client/src/pages/EvaluationSpace.tsx");
    expect(source).not.toContain("finalReviewedBy");
  });
});
