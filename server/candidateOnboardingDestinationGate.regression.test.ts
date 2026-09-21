import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { coarseCategoryForPreferredDestinations, isRecognizedCandidateDestination } from "../shared/candidateDestinationOptions";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("choix de destination obligatoire à l'inscription", () => {
  it("le formulaire d'inscription impose au moins une destination reconnue avant de pouvoir soumettre", () => {
    const register = read("client/src/pages/Register.tsx");
    expect(register).toContain("<DestinationPicker");
    expect(register).toContain("form.preferredDestinations.length > 0");
    expect(register).toContain("preferredDestinations: form.preferredDestinations");
  });

  it("le serveur rejette une destination non reconnue et stocke jusqu'à 3 pays précis", () => {
    const candidateRouter = read("server/routers/candidate.ts");
    expect(candidateRouter).toContain("isRecognizedCandidateDestination");
    expect(candidateRouter).toContain("preferredDestinations: JSON.stringify(preferredDestinations)");
    expect(candidateRouter).toContain(".max(MAX_PREFERRED_DESTINATIONS,");
  });

  it("dérive correctement l'ancienne catégorie large à partir du premier pays précis choisi (compatibilité avec le code existant)", () => {
    expect(coarseCategoryForPreferredDestinations(["Canada"])).toBe("canada");
    expect(coarseCategoryForPreferredDestinations(["Royaume-Uni"])).toBe("europe");
    expect(coarseCategoryForPreferredDestinations(["Qatar"])).toBe("golfe");
    expect(coarseCategoryForPreferredDestinations(["Sénégal"])).toBe("autre");
    expect(coarseCategoryForPreferredDestinations(["Allemagne"])).toBe("europe");
    expect(coarseCategoryForPreferredDestinations([])).toBe("autre");
  });

  it("reconnaît tous les pays du monde (avec ou sans guide) et rejette ce qui n'est pas un pays", () => {
    for (const name of ["Canada", "Allemagne", "Sénégal", "Côte d'Ivoire", "Nouvelle-Zélande", "Japon", "Brésil"]) expect(isRecognizedCandidateDestination(name), name).toBe(true);
    expect(isRecognizedCandidateDestination("Narnia")).toBe(false);
  });
});

describe("blocage réel de l'espace candidat tant que l'évaluation n'est pas soumise", () => {
  it("les onglets Documents et Dossier affichent un blocage explicite plutôt qu'un contenu vide ou générique quand l'évaluation est requise", () => {
    const source = read("client/src/pages/EvaluationSpace.tsx");
    expect(source).toContain('{activeTab === "dossier" && (evaluationRequired ? evaluationGateCard : (');
    expect(source).toContain('{activeTab === "documents" && (evaluationRequired ? evaluationGateCard : (');
    expect(source).toContain("Terminez d'abord votre évaluation");
  });

  it("la checklist documentaire et l'affichage de destination utilisent le pays précis déclaré (pas seulement la catégorie large historique)", () => {
    const source = read("client/src/pages/EvaluationSpace.tsx");
    expect(source).toContain("preferredDestinationsList[0] || cProfile.destination");
    expect(source).toContain("destination={primaryDestination}");
    // le parcours par pays et le lien d'évaluation reçoivent aussi le pays précis (jamais « europe » ou « autre »)
    expect(source).not.toContain("<CandidateCountryJourney destination={cProfile.destination}");
    expect(source).toContain("encodeURIComponent(primaryDestination || \"general\")");
  });
});
