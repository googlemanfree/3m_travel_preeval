import { describe, expect, it } from "vitest";
import { CEC_SIX_MONTH_CRS_HISTORY, CRS_HISTORY_SOURCE } from "./crsHistoricalRounds";

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
