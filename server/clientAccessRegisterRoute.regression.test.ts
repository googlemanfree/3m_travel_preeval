import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composePublicPrerender } from "./publicPrerender";

const appSource = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const navbarSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/Navbar.tsx"), "utf8");
const heroSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/HeroSectionVIP.tsx"), "utf8");

describe("accès client et inscription publique", () => {
  it("utilise le libellé de connexion demandé dans les accès publics", () => {
    expect(navbarSource).toContain('account: { fr: "Se connecter", en: "Sign in" }');
    expect(heroSource).toContain('<a href="/login">🔑 Se connecter</a>');
  });

  it("charge l’inscription directement plutôt que par un module susceptible d’expirer", () => {
    expect(appSource).toContain('import Register from "./pages/Register";');
    expect(appSource).not.toContain('const Register = lazyWithTimeout');
    expect(appSource).toContain('<Route path={"/register"} component={Register} />');
    expect(appSource).toContain('<Route path={"/signup"} component={Register} />');
  });

  it("sert un pré-rendu d’inscription non indexable plutôt qu’une page introuvable", () => {
    const template = "<!doctype html><html><head><title>Base</title></head><body><!--prerender-app--></body></html>";
    const rendered = composePublicPrerender(template, "/register");
    expect(rendered.status).toBe(200);
    expect(rendered.noindex).toBe(true);
    expect(rendered.html).toContain("Créer mon espace client");
    expect(rendered.html).not.toContain("Page introuvable");
  });
});
