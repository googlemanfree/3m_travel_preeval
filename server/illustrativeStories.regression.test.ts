import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ILLUSTRATIVE_MOBILITY_STORIES } from "../client/src/data/illustrativeMobilityStories";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("exemples illustratifs (personnages fictifs)", () => {
  it("contient des origines Cameroun / Côte d’Ivoire / autres et aucune promesse de résultat", () => {
    expect(ILLUSTRATIVE_MOBILITY_STORIES.length).toBeGreaterThanOrEqual(6);
    const origins = ILLUSTRATIVE_MOBILITY_STORIES.map((s) => s.countryOrigin);
    expect(origins).toEqual(expect.arrayContaining(["Cameroun", "Côte d’Ivoire", "Sénégal"]));
    for (const story of ILLUSTRATIVE_MOBILITY_STORIES) {
      const blob = `${story.quoteFr} ${story.quoteEn}`.toLowerCase();
      expect(blob).not.toMatch(/j[’']ai obtenu (mon |le )?visa/);
      expect(blob).not.toMatch(/i got (my )?visa/);
      expect(blob).not.toMatch(/100\s*%\s*(de )?succ[eè]s|guaranteed admission|visa (garanti|assuré)/);
    }
  });

  it("reste séparé des avis approuvés et clairement étiqueté", () => {
    const component = read("client/src/components/IllustrativeMobilityStories.tsx");
    expect(component).toContain("personnages fictifs");
    expect(component).toContain("fictional personas");
    expect(component).toContain("illustrative-mobility-stories");
    expect(component).toContain('href="/avis"');

    expect(read("client/src/pages/Home.tsx")).toContain("IllustrativeMobilityStories");
    expect(read("client/src/pages/Avis.tsx")).toContain("IllustrativeMobilityStories");
    expect(read("client/src/pages/VisaTravail.tsx")).toContain("IllustrativeMobilityStories");

    // Les avis approuvés continuent d’interdire les témoignages fabriqués.
    expect(read("client/src/components/ApprovedReviewsSection.tsx")).toContain("aucun témoignage fabriqué");
  });
});
