import { describe, expect, it } from "vitest";
import { getLot1DestinationVisualIds, getProcedureVisualSources } from "@/data/procedureVisuals";

const expectedIds = [
  "canada-travail",
  "luxembourg-travail",
  "france-travail",
  "belgique-etudes",
  "allemagne-travail",
  "suisse-travail",
  "royaume-uni-travail",
  "etats-unis-travail",
  "australie-travail",
  "italie-travail",
] as const;

describe("Visuels destinations du lot 1", () => {
  it("déclare exactement les dix destinations autorisées", () => {
    expect(getLot1DestinationVisualIds()).toEqual(expectedIds);
  });

  it("utilise une URL persistante dédiée par destination", () => {
    const urls = expectedIds.map((id) => getProcedureVisualSources({ id, name: id, region: "" }));
    expect(urls).toHaveLength(expectedIds.length);
    expect(new Set(urls.map((visual) => visual.desktop)).size).toBe(expectedIds.length);
    urls.forEach((visual) => {
      expect(visual.desktop).toMatch(/^\/manus-storage\/destination-.+\.jpg$/);
      expect(visual.mobile).toBe(visual.desktop);
    });
  });
});
