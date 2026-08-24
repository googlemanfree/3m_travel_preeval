import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
const hero = readFileSync(resolve(projectRoot, "client/src/components/HeroSectionVIP.tsx"), "utf8");
const navbar = readFileSync(resolve(projectRoot, "client/src/components/Navbar.tsx"), "utf8");
const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

describe("accès public au formulaire d’évaluation gratuite", () => {
  it("garde le formulaire gratuit ancré sur la page d’accueil", () => {
    expect(home).toContain('id="evaluation-multi"');
    expect(home).toContain("SimpleMultiProjectForm");
    expect(home).toContain('window.location.hash !== "#evaluation-multi"');
    expect(home).toContain('scrollIntoView({ behavior: "auto", block: "start" })');
  });

  it("oriente le hero, le menu et les anciens liens vers le formulaire sans compte", () => {
    expect(hero).toContain('href="#evaluation-multi"');
    expect(navbar).toContain('{ href: "/#evaluation-multi", label: "Évaluation Rapide"');
    expect(app).toContain('<Redirect to="/#evaluation-multi" />');
    expect(app).not.toContain('<Route path={"/evaluation-primaire"}>{() => <Redirect to="/evaluation" />}</Route>');
    expect(app).not.toContain('<Route path={"/evaluation-rapide-enhanced"}>{() => <Redirect to="/evaluation" />}</Route>');
  });
});
