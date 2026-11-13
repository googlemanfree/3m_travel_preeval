import { describe, expect, it } from "vitest";
import type { Fact } from "../shared/bilanAuto/types";
import { emptyFacts } from "./services/bilanAuto/scoring";
import { ageFromBirthDate, buildOrientations, evaluateCanadaRule, sanitizeSearchResult, MIN_ALTERNATIVES, type SourceRef } from "./services/bilanAuto/orientations";

const fact = <T,>(value: T, provenance: Fact<T>["provenance"] = "declare"): Fact<T> => ({ value, provenance, sources: ["formulaire"] });
const source: SourceRef = { url: "https://example.org/offre/1", title: "Offre d'exemple", consultedAt: "2026-11-13" };

function facts(level: Parameters<typeof fact<string>>[0], age: number | null) {
  const value = emptyFacts();
  value.formation.niveau = level === null ? { value: null, provenance: "non_renseigne", sources: [] } : (fact(level) as never);
  value.ageAns = age;
  value.metierVise = "Technicien de maintenance";
  value.missionsVisees = ["Maintenance préventive", "Diagnostic de pannes"];
  return value;
}

describe("règle Canada : BTS minimum et moins de 40 ans", () => {
  it.each([
    ["bac_plus_2", 39, true],
    ["bac_plus_2", 25, true],
    ["bac_plus_3_4", 30, true],
    ["bac_plus_5_plus", 39, true],
    ["bac_plus_2", 40, false],
    ["bac_plus_5_plus", 52, false],
    ["bac", 25, false],
    ["inferieur_bac", 30, false],
  ])("niveau %s à %i ans → proposé : %s", (level, age, expected) => {
    expect(evaluateCanadaRule(facts(level, age)).applies).toBe(expected);
  });

  it("ne devine pas : âge ou diplôme inconnu = règle non évaluable, dite explicitement", () => {
    const noAge = evaluateCanadaRule(facts("bac_plus_2", null));
    expect(noAge.applies).toBe(false);
    expect(noAge.undecidable).toEqual(["âge"]);
    const none = evaluateCanadaRule(facts(null, null));
    expect(none.undecidable).toEqual(["niveau de diplôme", "âge"]);
    expect(none.reason).toMatch(/à confirmer/);
  });

  it("calcule l'âge depuis une date de naissance, à la veille de l'anniversaire inclus", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    expect(ageFromBirthDate("1987-11-14", now)).toBe(38);
    expect(ageFromBirthDate("1987-11-13", now)).toBe(39);
    expect(ageFromBirthDate("13/11/1986", now)).toBe(40);
    expect(ageFromBirthDate("n'importe quoi", now)).toBeNull();
    expect(ageFromBirthDate("2026-01-01", now)).toBeNull();
  });
});

describe("fraîcheur des sources", () => {
  const now = new Date("2026-11-13T10:00:00Z");
  it("écarte une source périmée ou datée du futur, garde une source récente", () => {
    const old: SourceRef = { ...source, consultedAt: "2025-01-01" };
    const future: SourceRef = { ...source, consultedAt: "2027-01-01" };
    const result = sanitizeSearchResult({ offers: [{ title: "A", employer: "B", source: old }, { title: "A", employer: "B", source: future }, { title: "A", employer: "B", source }], salaries: [{ label: "x", amount: "1", period: "mois", source: old }] }, { now });
    expect(result.offers).toHaveLength(1);
    expect(result.salaries).toHaveLength(0);
  });
  it("la durée de fraîcheur est configurable", () => {
    const aged: SourceRef = { ...source, consultedAt: "2026-06-01" };
    expect(sanitizeSearchResult({ offers: [{ title: "A", employer: "B", source: aged }], salaries: [] }, { now, maxAgeDays: 90 }).offers).toHaveLength(0);
    expect(sanitizeSearchResult({ offers: [{ title: "A", employer: "B", source: aged }], salaries: [] }, { now, maxAgeDays: 365 }).offers).toHaveLength(1);
  });
  it("source périmée : le salaire redevient « à documenter »", async () => {
    const outcome = await buildOrientations({ facts: facts("bac_plus_2", 30), now, search: async () => ({ offers: [], salaries: [{ label: "Technicien", amount: "3000", period: "mois brut", source: { ...source, consultedAt: "2024-01-01" } }] }) });
    expect(outcome.proposals[0].salary).toMatch(/à documenter/i);
    expect(outcome.sourcesIncomplete).toBe(true);
  });
});

describe("orientations", () => {
  it("Luxembourg prioritaire, au moins quatre alternatives, Canada ajouté par la règle", async () => {
    const outcome = await buildOrientations({ facts: facts("bac_plus_2", 30) });
    expect(outcome.proposals[0]).toMatchObject({ country: "Luxembourg", role: "prioritaire" });
    const alternatives = outcome.proposals.filter((proposal) => proposal.role === "alternative");
    expect(alternatives.length).toBeGreaterThanOrEqual(MIN_ALTERNATIVES);
    expect(outcome.proposals.map((proposal) => proposal.country)).toEqual(expect.arrayContaining(["Lituanie", "Pologne", "Italie", "Serbie", "Grèce", "Canada"]));
    expect(outcome.proposals.find((proposal) => proposal.country === "Canada")?.role).toBe("regle_canada");
  });

  it("pas de Canada automatique à 40 ans ou plus ou sans BTS, mais toujours quatre alternatives", async () => {
    for (const candidate of [facts("bac_plus_5_plus", 45), facts("bac", 25)]) {
      const outcome = await buildOrientations({ facts: candidate });
      expect(outcome.proposals.some((proposal) => proposal.country === "Canada")).toBe(false);
      expect(outcome.proposals.filter((proposal) => proposal.role === "alternative").length).toBeGreaterThanOrEqual(MIN_ALTERNATIVES);
    }
  });

  it("sans source : aucun salaire inventé, aucun élément présenté comme offre", async () => {
    const outcome = await buildOrientations({ facts: facts("bac_plus_2", 30) });
    expect(outcome.sourcesIncomplete).toBe(true);
    for (const proposal of outcome.proposals) {
      expect(proposal.salary).toMatch(/à documenter/i);
      expect(proposal.items.some((item) => item.kind === "offre_reperee" || item.kind === "repere_salarial")).toBe(false);
      expect(proposal.items.some((item) => item.kind === "poste_a_cibler")).toBe(true);
      expect(proposal.reserves.join(" ")).toMatch(/non une promesse/);
    }
  });

  it("distingue une offre repérée (sourcée et datée) d'un poste à cibler, et un repère salarial sourcé", async () => {
    const outcome = await buildOrientations({
      facts: facts("bac_plus_2", 30),
      search: async ({ country }) => ({
        offers: country === "Luxembourg" ? [{ title: "Technicien", employer: "Société X", city: "Luxembourg-Ville", source }] : [],
        salaries: country === "Luxembourg" ? [{ label: "Technicien de maintenance", amount: "3 000 à 3 500", period: "par mois brut", source }] : [],
      }),
    });
    const lux = outcome.proposals[0];
    expect(lux.items.map((item) => item.kind)).toEqual(["offre_reperee", "poste_a_cibler", "repere_salarial"]);
    expect(lux.salary).not.toMatch(/à documenter/i);
    expect(lux.sources).toHaveLength(2);
    expect(outcome.proposals[1].salary).toMatch(/à documenter/i);
  });

  it("rejette offres et salaires sans source valide (pas d'URL https, pas de date)", () => {
    const result = sanitizeSearchResult({
      offers: [{ title: "A", employer: "B", source: { url: "http://x.test", title: "t", consultedAt: "2026-11-13" } }, { title: "A", employer: "B", source }],
      salaries: [{ label: "x", amount: "3000", period: "mois", source: { url: "https://x.test", title: "t", consultedAt: "hier" } }],
    });
    expect(result.offers).toHaveLength(1);
    expect(result.salaries).toHaveLength(0);
  });

  it("une erreur de recherche ne bloque pas le bilan : « à documenter » et erreur journalisée", async () => {
    const outcome = await buildOrientations({ facts: facts("bac_plus_2", 30), search: async () => { throw new Error("quota dépassé"); } });
    expect(outcome.proposals.length).toBeGreaterThanOrEqual(6);
    expect(outcome.sourcesIncomplete).toBe(true);
    expect(outcome.searchErrors[0]).toMatch(/quota dépassé/);
    expect(outcome.proposals.every((proposal) => /à documenter/i.test(proposal.salary))).toBe(true);
  });
});
