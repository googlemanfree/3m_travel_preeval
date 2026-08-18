import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { studyDestinationArticles } from "../client/src/data/studyDestinationArticles";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("routes canoniques des pages de service", () => {
  it("expose les pages demandées et redirige les anciens chemins sans dupliquer les composants", () => {
    expect(appSource).toContain('path={"/canada"} component={Canada}');
    expect(appSource).toContain('path={"/schengen"} component={Schengen}');
    expect(appSource).toContain('path={"/etudes"} component={VisaEtudes}');
    expect(appSource).toContain('path={"/billets"} component={Billets}');
    expect(appSource).toContain('path={"/formation"} component={Formation}');
    expect(appSource).toContain('Redirect to="/etudes"');
    expect(appSource).toContain('Redirect to="/billets"');
  });

  it("référence dix destinations d’études avec des sources officielles", () => {
    expect(studyDestinationArticles).toHaveLength(10);
    expect(new Set(studyDestinationArticles.map((article) => article.slug)).size).toBe(10);
    for (const article of studyDestinationArticles) {
      expect(article.title.length).toBeGreaterThan(40);
      expect(article.description.length).toBeGreaterThan(80);
      expect(article.sourceUrl).toMatch(/^https:\/\//);
      expect(article.steps).toHaveLength(5);
      expect(article.documents.length).toBeGreaterThanOrEqual(6);
    }
  });
});
