import { describe, expect, it } from "vitest";
import { getProcedureRegionBadges, getProcedureVisual, PROCEDURE_VISUALS } from "../client/src/data/procedureVisuals";

describe("procedure visuals", () => {
  it("uses the Canada visual and badge for Canada destinations", () => {
    const country = { id: "canada-travail", name: "Canada", region: "Amérique du Nord" };
    expect(getProcedureVisual(country)).toBe(PROCEDURE_VISUALS.canada);
    expect(getProcedureRegionBadges(country)).toEqual(["🇨🇦", "Canada — Priorité N°1"]);
  });

  it("uses the Schengen visual for European destinations", () => {
    const country = { id: "france-travail", name: "France", region: "Europe" };
    expect(getProcedureVisual(country)).toBe(PROCEDURE_VISUALS.schengen);
    expect(getProcedureRegionBadges(country)).toEqual(["🇪🇺", "Espace Schengen"]);
  });

  it("keeps an international fallback for other destinations", () => {
    const country = { id: "japon-travail", name: "Japon", region: "Asie" };
    expect(getProcedureVisual(country)).toBe(PROCEDURE_VISUALS.home);
    expect(getProcedureRegionBadges(country)).toEqual(["🌍", "Mobilité internationale"]);
  });
});
