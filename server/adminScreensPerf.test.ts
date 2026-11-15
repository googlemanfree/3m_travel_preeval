import { describe, expect, it } from "vitest";
import { mapWithLimit } from "./utils/mapWithLimit";
import { getEnrichedCandidateJourney, resetEnrichedJourneyCacheForTests } from "../shared/candidateJourneyCatalog";

describe("mapWithLimit", () => {
  it("garde l'ordre des résultats quel que soit l'ordre de fin", async () => {
    const out = await mapWithLimit([30, 5, 15, 1], 2, async (ms, index) => { await new Promise((resolve) => setTimeout(resolve, ms)); return `${index}:${ms}`; });
    expect(out).toEqual(["0:30", "1:5", "2:15", "3:1"]);
  });
  it("ne dépasse jamais la limite de tâches simultanées", async () => {
    let running = 0, peak = 0;
    await mapWithLimit(Array.from({ length: 25 }, (_, i) => i), 4, async () => { running += 1; peak = Math.max(peak, running); await new Promise((resolve) => setTimeout(resolve, 3)); running -= 1; });
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
  });
  it("accepte une liste vide et propage une erreur", async () => {
    expect(await mapWithLimit([], 5, async () => 1)).toEqual([]);
    await expect(mapWithLimit([1, 2, 3], 2, async (n) => { if (n === 2) throw new Error("échec"); return n; })).rejects.toThrow("échec");
  });
});

describe("parcours enrichi gardé par combinaison", () => {
  it("renvoie le même objet pour la même combinaison et un objet différent pour une autre", () => {
    resetEnrichedJourneyCacheForTests();
    const a = getEnrichedCandidateJourney("luxembourg", "travail", "travail");
    expect(getEnrichedCandidateJourney("luxembourg", "travail", "travail")).toBe(a);
    expect(getEnrichedCandidateJourney("canada", "etude", "etude")).not.toBe(a);
    expect(getEnrichedCandidateJourney("luxembourg", "travail", "travail", "programme-x", null)).not.toBe(a);
  });
  it("distingue « absent » de la chaîne vide et ne confond pas les arguments entre eux", () => {
    resetEnrichedJourneyCacheForTests();
    const first = getEnrichedCandidateJourney("a|b", null, "c");
    const second = getEnrichedCandidateJourney("a", "b|null", "c");
    expect(first).not.toBe(second);
  });
  it("est figé pendant les tests : toute modification par un appelant échouerait ici plutôt qu'en production", () => {
    resetEnrichedJourneyCacheForTests();
    const journey = getEnrichedCandidateJourney("luxembourg", "travail", "travail");
    expect(Object.isFrozen(journey)).toBe(true);
    expect(() => { (journey.steps as unknown[]).push({}); }).toThrow();
  });
  it("redonne un résultat identique après vidage du cache (même contenu)", () => {
    resetEnrichedJourneyCacheForTests();
    const before = JSON.stringify(getEnrichedCandidateJourney("pologne", "travail", "travail"));
    resetEnrichedJourneyCacheForTests();
    expect(JSON.stringify(getEnrichedCandidateJourney("pologne", "travail", "travail"))).toBe(before);
  });
});
