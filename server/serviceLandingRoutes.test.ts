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

  it("inclut le sitemap XML avec l’ensemble des routes publiques et articles d’études", () => {
    const sitemapPath = resolve(process.cwd(), "client/public/sitemap.xml");
    const sitemapContent = readFileSync(sitemapPath, "utf8");
    expect(sitemapContent).toContain("<loc>https://www.3mtravelagency.com/canada</loc>");
    expect(sitemapContent).toContain("<loc>https://www.3mtravelagency.com/schengen</loc>");
    expect(sitemapContent).toContain("<loc>https://www.3mtravelagency.com/etudes</loc>");
    expect(sitemapContent).toContain("<loc>https://www.3mtravelagency.com/blog/etudes/canada</loc>");
    expect(sitemapContent).toContain("<loc>https://www.3mtravelagency.com/blog/etudes/maroc</loc>");
  });

  it("sépare les parcours de Procédures et place l’évaluation multi-projets au début de l’accueil", () => {
    const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const proceduresSource = readFileSync(resolve(process.cwd(), "client/src/pages/ProceduresAdvanced.tsx"), "utf8");
    const canadaSource = readFileSync(resolve(process.cwd(), "client/src/pages/Canada.tsx"), "utf8");
    expect(homeSource).toContain('id="evaluation-multi"');
    expect(homeSource.indexOf('id="evaluation-multi"')).toBeLessThan(homeSource.indexOf("<EmbassyNewsWidget />"));
    expect(proceduresSource).toContain("Canada : Résidence & Emploi");
    expect(proceduresSource).toContain("Visa Schengen & Court Séjour");
    expect(proceduresSource).toContain("Études Internationales");
    expect(proceduresSource).toContain('href="/?project=travail#evaluation-multi"');
    expect(proceduresSource).toContain('href="/?project=etudes#evaluation-multi"');
    expect(proceduresSource).toContain('href="/?project=tourisme#evaluation-multi"');
    expect(canadaSource).toContain("CanadaScoreSimulator");
    expect(canadaSource).toContain("Étape 1 : Évaluez votre score CRS avant de continuer");
  });
});


