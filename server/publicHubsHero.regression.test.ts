import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("public hubs — héros marque-first", () => {
  it("Tarifs : marque h1, CTA ambre, hero plein écran", () => {
    const tarifs = read("client/src/pages/Tarifs.tsx");
    expect(tarifs).toContain("3M TRAVEL AGENCY");
    expect(tarifs).toContain("min-h-[88svh]");
    expect(tarifs).toContain("bg-amber-500");
    expect(tarifs).toContain("Comprendre les tarifs avant de vous engager");
    expect(tarifs).not.toContain("Information tarifaire");
  });

  it("Contact : marque h1, Yaoundé, CTA ambre", () => {
    const contact = read("client/src/pages/Contact.tsx");
    expect(contact).toContain("3M TRAVEL AGENCY");
    expect(contact).toContain("min-h-[88svh]");
    expect(contact).toContain("bg-amber-500");
    expect(contact).toContain("Nous contacter à Yaoundé");
    expect(contact).toContain("#carte-yaounde");
  });

  it("Évaluation : marque h1, ancre formulaire, sans badge sparkles hero", () => {
    const evaluation = read("client/src/pages/Evaluation.tsx");
    expect(evaluation).toContain("3M TRAVEL AGENCY");
    expect(evaluation).toContain("Évaluation gratuite de votre profil");
    expect(evaluation).toContain('id="evaluation-formulaire"');
    expect(evaluation).toContain("bg-amber-500");
    const heroSlice = evaluation.slice(
      evaluation.indexOf("<main"),
      evaluation.indexOf('id="evaluation-formulaire"'),
    );
    expect(heroSlice).not.toContain("Évaluation structurée du profil");
  });

  it("e-Visa : marque h1, recherche hors hero, sans emoji dans le hero", () => {
    const evisa = read("client/src/pages/Evisa.tsx");
    expect(evisa).toContain("3M TRAVEL AGENCY");
    expect(evisa).toContain("min-h-[88svh]");
    expect(evisa).toContain('id="annuaire-evisa"');
    expect(evisa).toContain("bg-amber-500");
    expect(evisa).toContain("e-Visas & autorisations de voyage");
    const heroSlice = evisa.slice(evisa.indexOf("<main"), evisa.indexOf('id="annuaire-evisa"'));
    expect(heroSlice).not.toContain("Annuaire e-Visa");
    expect(heroSlice).not.toContain("placeholder=");
    expect(evisa).not.toContain("{d.emoji}");
    expect(evisa).not.toContain("🌐 Tous");
  });
});
