import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("polish conversion accueil", () => {
  it("démarre l’évaluation guidée par le projet (pays) avant le profil", () => {
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    const projet = form.indexOf('{ label: "Projet"');
    const profil = form.indexOf('{ label: "Profil"');
    expect(projet).toBeGreaterThan(-1);
    expect(profil).toBeGreaterThan(projet);
    expect(form).toContain("grid-cols-5");
    expect(form).toContain("Étape 0 = Projet");
  });

  it("garde un WhatsApp flottant discret et accessible", () => {
    const floating = read("client/src/components/FloatingActionMenu.tsx");
    expect(floating).toContain("safe-bottom-floating-whatsapp");
    expect(floating).toContain('data-testid="floating-whatsapp"');
    expect(floating).toContain("useReducedMotion");
    expect(floating).toContain("WhatsApp — une question ?");
  });
});
