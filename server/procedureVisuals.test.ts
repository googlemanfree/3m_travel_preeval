import { describe, expect, it } from "vitest";
import { getProcedureRegionBadges, getProcedureVisual, PROCEDURE_VISUALS } from "../client/src/data/procedureVisuals";

describe("procedure visuals", () => {
  it("uses the catalogued Canada destination visual and badge", () => {
    const country = { id: "canada-travail", name: "Canada", region: "Amérique du Nord" };
    expect(getProcedureVisual(country)).toBe("/manus-storage/destination-canada_5e7dfbae.jpg");
    expect(getProcedureRegionBadges(country)).toEqual(["🇨🇦", "Canada — Priorité N°1"]);
  });

  it("uses the catalogued France destination visual and Schengen badge", () => {
    const country = { id: "france-travail", name: "France", region: "Europe" };
    expect(getProcedureVisual(country)).toBe("/manus-storage/destination-france_dc1778e3.jpg");
    expect(getProcedureRegionBadges(country)).toEqual(["🇪🇺", "Espace Schengen"]);
  });

  it("keeps an international fallback for destinations without a catalogued visual", () => {
    const country = { id: "japon-travail", name: "Japon", region: "Asie" };
    expect(getProcedureVisual(country)).toBe(PROCEDURE_VISUALS.home);
    expect(getProcedureRegionBadges(country)).toEqual(["🌍", "Mobilité internationale"]);
  });
});
