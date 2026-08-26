import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("accessibilité et mobilité des parcours candidats", () => {
  it("conserve des champs d’inscription adaptés aux mobiles et à l’autocomplétion", () => {
    const register = source("client/src/pages/Register.tsx");
    expect(register).toContain('autoComplete="name"');
    expect(register).toContain('autoComplete="email"');
    expect(register).toContain('autoComplete="new-password"');
    expect(register).toContain('className="h-12 w-full bg-gradient-to-r');
    expect(register).toContain('className="touch-target absolute right-1');
  });

  it("annonce et rend utilisables les contrôles de connexion sur mobile", () => {
    const login = source("client/src/pages/Login.tsx");
    expect(login).toContain('aria-label={showPassword ? t("Masquer le mot de passe", "Hide password") : t("Afficher le mot de passe", "Show password")}');
    expect(login).toContain('className="touch-target absolute right-1');
    expect(login).toContain('flex flex-col items-start justify-between gap-3 sm:flex-row');
  });

  it("garde une navigation d’espace client accessible au clavier et tactile", () => {
    const dashboard = source("client/src/pages/EvaluationSpace.tsx");
    expect(dashboard).toContain('role="tablist" aria-label="Sections de l’espace candidat"');
    expect(dashboard).toContain('role="tab"');
    expect(dashboard).toContain('aria-selected={isActive}');
    expect(dashboard).toContain('id="candidate-space-content"');
  });

  it("annonce les actions documentaires avec des libellés explicites", () => {
    const uploader = source("client/src/components/DocumentUploader.tsx");
    expect(uploader).toContain('aria-haspopup="listbox"');
    expect(uploader).toContain('role="listbox"');
    expect(uploader).toContain('aria-label={`Modifier la catégorie de ${file.name}`}');
    expect(uploader).toContain('aria-label={`Supprimer ${file.name}`}');
  });
});
