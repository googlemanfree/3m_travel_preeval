import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("pré-remplissage de l'évaluation avec les pays de préférence déclarés à l'inscription", () => {
  it("le login et le profil candidat exposent preferredDestinations au lieu de forcer une nouvelle saisie", () => {
    const candidateRouter = read("server/routers/candidate.ts");
    expect(candidateRouter).toContain("preferredDestinations: candidate.preferredDestinations");
    expect(candidateRouter).toContain("preferredDestinations: c.preferredDestinations");
  });

  it("le cache d'authentification candidat transporte les pays de préférence jusqu'à la page d'évaluation", () => {
    const authHook = read("client/src/hooks/useCandidateAuth.ts");
    const login = read("client/src/pages/Login.tsx");
    const evaluation = read("client/src/pages/Evaluation.tsx");

    expect(authHook).toContain("preferredDestinations?: string[] | null");
    expect(login).toContain("preferredDestinations: parsePreferredDestinations");
    expect(evaluation).toContain("candidate?.preferredDestinations?.[0]");
    expect(evaluation).toContain("destinationCountry: preferredDestination");
  });
});
