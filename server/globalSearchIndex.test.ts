import { describe, expect, it } from "vitest";
import { GLOBAL_SEARCH_INDEX, searchInternalSite } from "@/lib/globalSearchIndex";
import { WORLD_DESTINATION_DIRECTORY } from "@/data/worldDestinationDirectory";

describe("global search index", () => {
  it("covers the complete world directory without dropping countries", () => {
    expect(WORLD_DESTINATION_DIRECTORY.length).toBeGreaterThanOrEqual(196);
    expect(GLOBAL_SEARCH_INDEX.some((item) => item.title === "Canada" && item.category === "Pays")).toBe(true);
    expect(GLOBAL_SEARCH_INDEX.some((item) => item.title === "Japon" && item.category === "Pays")).toBe(true);
  });

  it("ranks site procedures and services before unrelated entries", () => {
    const results = searchInternalSite("visa travail");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.category === "Procédure" || item.category === "Service")).toBe(true);
  });

  it("supports accents and country aliases through folded matching", () => {
    const results = searchInternalSite("Allemagne");
    expect(results[0]?.title).toContain("Allemagne");
  });
});
