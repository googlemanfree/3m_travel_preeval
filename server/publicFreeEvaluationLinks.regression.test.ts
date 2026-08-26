import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
const hero = readFileSync(resolve(projectRoot, "client/src/components/HeroSectionVIP.tsx"), "utf8");
const navbar = readFileSync(resolve(projectRoot, "client/src/components/Navbar.tsx"), "utf8");
const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
const blog = readFileSync(resolve(projectRoot, "client/src/pages/Blog.tsx"), "utf8");
const form = readFileSync(resolve(projectRoot, "client/src/components/SimpleMultiProjectForm.tsx"), "utf8");
const publicCta = readFileSync(resolve(projectRoot, "client/src/components/PublicEvaluationCTA.tsx"), "utf8");

describe("accès public au formulaire d’évaluation gratuite", () => {
  it("garde le formulaire gratuit ancré sur la page d’accueil", () => {
    expect(home).toContain('id="evaluation-multi"');
    expect(home).toContain("SimpleMultiProjectForm");
    expect(home).toContain('window.location.hash !== "#evaluation-multi"');
    expect(home).toContain('scrollIntoView({ behavior: "smooth", block: "start" })');
    expect(home).toContain("window.setTimeout(scrollToEvaluation, 420)");
  });

  it("oriente le hero, le menu et les anciens liens vers le formulaire sans compte", () => {
    expect(hero).toContain("PublicEvaluationCTA");
    expect(publicCta).toContain('return `/?project=${encodeURIComponent(project)}#evaluation-multi`');
    expect(navbar).toContain('{ href: "/?project=travail#evaluation-multi", label: { fr: "Évaluation rapide", en: "Quick assessment" }');
    expect(app).toContain('<Redirect to="/#evaluation-multi" />');
    expect(app).not.toContain('<Route path={"/evaluation-primaire"}>{() => <Redirect to="/evaluation" />}</Route>');
    expect(app).not.toContain('<Route path={"/evaluation-rapide-enhanced"}>{() => <Redirect to="/evaluation" />}</Route>');
    expect(blog).toContain('href="/?project=travail#evaluation-multi"');
    expect(blog).not.toContain('href="/evaluation"');
  });

  it("confirme le succès et bloque les coordonnées de contact mal formées avant l’envoi", () => {
    expect(form).toContain("Évaluation soumise avec succès. Vérifiez votre e-mail.");
    expect(form).toContain("isEmailValid");
    expect(form).toContain("isWhatsappValid");
    expect(form).toContain("aria-invalid={emailError}");
    expect(form).toContain("aria-invalid={whatsappError}");
  });
});
