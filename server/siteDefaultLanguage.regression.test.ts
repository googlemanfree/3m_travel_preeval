import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8").replace(/\r\n/g, "\n");

describe("langue par défaut du site : français, anglais seulement sur choix explicite", () => {
  it("ne détecte plus la langue du navigateur (un appareil réglé en anglais donnait une page mélangée FR/EN et <html lang=\"en\">)", () => {
    expect(source).not.toMatch(/navigator\.language/);
    expect(source).not.toContain("detectBrowserLanguage");
  });

  it("n'applique la langue mémorisée que si elle a été choisie explicitement ; sinon français", () => {
    expect(source).toMatch(/function defaultLanguage\(stored[^)]*\): Language \{\n\s+return stored\.explicit && stored\.language \? stored\.language : "fr";/);
    expect(source).toContain("useState<Language>(defaultLanguage(initialStored))");
  });

  it("le choix manuel du bouton FR/EN reste mémorisé comme explicite", () => {
    expect(source).toContain("persistClientLanguage(normalized, true)");
  });
});
