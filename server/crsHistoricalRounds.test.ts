// Copie exécutable de client/src/data/crsHistoricalRounds.test.ts : vitest.config.ts ne collecte
// que server/**/*.test.ts(x) (client/src/data/crsHistoricalRounds.test.ts n'est donc jamais lancé
// par `npm test`). On duplique ici pour que ces vérifications tournent réellement en CI.
import { describe, expect, it } from "vitest";
import { CEC_SIX_MONTH_CRS_HISTORY, CRS_HISTORY_SOURCE, LATEST_INVITATION_ROUNDS, LATEST_ROUNDS_VERIFIED_AT } from "@/data/crsHistoricalRounds";

describe("CEC_SIX_MONTH_CRS_HISTORY", () => {
  it("conserve six seuils CEC mensuels, chronologiques et sourcés par IRCC", () => {
    expect(CEC_SIX_MONTH_CRS_HISTORY).toHaveLength(6);
    expect(CEC_SIX_MONTH_CRS_HISTORY.map((round) => round.month)).toEqual([
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
    ]);
    expect(CEC_SIX_MONTH_CRS_HISTORY.every((round) => round.minScore > 0 && round.invitations > 0)).toBe(true);
    expect(CRS_HISTORY_SOURCE.url).toContain("canada.ca");
    expect(CRS_HISTORY_SOURCE.organization).toContain("IRCC");
  });
});

describe("LATEST_INVITATION_ROUNDS", () => {
  const roundNumberOf = (roundNum: string) => Number(roundNum.replace(/\D/g, ""));

  it("ne couvre que des catégories ayant réellement des rondes IRCC récentes (pas de \"général\" fantôme)", () => {
    const categories = new Set(LATEST_INVITATION_ROUNDS.map((round) => round.category));
    expect(categories).toEqual(new Set(["cec", "provincial", "sante"]));
    expect(LATEST_INVITATION_ROUNDS.some((round) => (round as { category: string }).category === "general")).toBe(false);
  });

  it("fournit exactement 3 rondes vérifiées par catégorie retenue", () => {
    for (const category of ["cec", "provincial", "sante"] as const) {
      expect(LATEST_INVITATION_ROUNDS.filter((round) => round.category === category)).toHaveLength(3);
    }
  });

  it("a des données plausibles et non nulles pour chaque ronde (aucun seuil ou invitation inventé à 0)", () => {
    for (const round of LATEST_INVITATION_ROUNDS) {
      expect(round.minScore).toBeGreaterThan(0);
      expect(round.invitations).toBeGreaterThan(0);
      expect(round.roundNum).toMatch(/^Ronde #\d+$/);
      expect(round.date.length).toBeGreaterThan(0);
      expect(round.type.length).toBeGreaterThan(0);
      expect(round.description.length).toBeGreaterThan(0);
    }
  });

  it("est trié de la ronde la plus récente à la plus ancienne (numéro de ronde IRCC décroissant)", () => {
    const numbers = LATEST_INVITATION_ROUNDS.map((round) => roundNumberOf(round.roundNum));
    const sorted = [...numbers].sort((a, b) => b - a);
    expect(numbers).toEqual(sorted);
  });

  it("ne réintroduit pas les rondes/seuils précédemment fabriqués (Ronde #435/#434/#433/#430, seuil 720)", () => {
    const roundNumbers = LATEST_INVITATION_ROUNDS.map((round) => round.roundNum);
    expect(roundNumbers).not.toContain("Ronde #435");
    expect(roundNumbers).not.toContain("Ronde #434");
    expect(roundNumbers).not.toContain("Ronde #433");
    expect(roundNumbers).not.toContain("Ronde #430");
    expect(LATEST_INVITATION_ROUNDS.some((round) => round.minScore === 720)).toBe(false);
  });

  it("est daté d'une vérification manuelle récente sur la page officielle IRCC", () => {
    expect(LATEST_ROUNDS_VERIFIED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(CRS_HISTORY_SOURCE.url).toContain("express-entry-rounds.html");
  });
});
