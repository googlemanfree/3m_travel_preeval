import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeKey } from "../client/src/i18n/domTranslator";

const root = process.cwd();
const dictionary: Record<string, string> = JSON.parse(readFileSync(resolve(root, "client/src/i18n/frToEn.json"), "utf8"));
const batchDir = resolve(root, "scripts/i18n/batches");
const batches = readdirSync(batchDir).filter((file) => file.endsWith(".fr.json")).map((file) => file.slice(0, -".fr.json".length)).sort();

const FRENCH = /\b(le|la|les|des|du|un|une|et|pour|vous|votre|vos|nous|notre|avec|dans|sur|est|sont|pas|ou|au|aux|ce|cette|ces|que|qui|ne|plus|par|sans|être|avoir)\b/gi;
const ENGLISH = /\b(the|and|for|you|your|our|with|in|on|is|are|not|or|to|of|that|this|these|which|by|without|be|have|from|an|a|it|we)\b/gi;

describe("dictionnaire français → anglais du site", () => {
  it("est construit à partir des lots : chaque lot a autant de chaînes françaises que de traductions, et le dictionnaire les contient toutes", () => {
    expect(batches.length).toBeGreaterThanOrEqual(3);
    for (const name of batches) {
      const fr: string[] = JSON.parse(readFileSync(resolve(batchDir, `${name}.fr.json`), "utf8"));
      const en: string[] = JSON.parse(readFileSync(resolve(batchDir, `${name}.en.json`), "utf8"));
      expect(en.length, `lot ${name}`).toBe(fr.length);
      fr.forEach((source, index) => expect(dictionary[source], `lot ${name}, ${source.slice(0, 50)}`).toBe(en[index]));
    }
  });

  it("n'a que des clés normalisées (espaces simples, sans espace aux bords) et des traductions non vides", () => {
    for (const [key, value] of Object.entries(dictionary)) {
      expect(normalizeKey(key), key.slice(0, 60)).toBe(key);
      expect(value.trim().length, key.slice(0, 60)).toBeGreaterThan(0);
    }
  });

  it("garde les emplacements ({date}, {q}, {c}) : une clé en contient exactement les mêmes que sa traduction", () => {
    const slots = (text: string) => (text.match(/\{(date|q|c)\}/g) ?? []).sort().join(",");
    for (const [key, value] of Object.entries(dictionary)) expect(slots(value), key.slice(0, 60)).toBe(slots(key));
  });

  it("ne contient aucune « traduction » qui soit encore du français", () => {
    for (const [key, value] of Object.entries(dictionary)) {
      const french = (value.match(FRENCH) ?? []).length;
      const english = (value.match(ENGLISH) ?? []).length;
      expect(french >= 2 && french > english, `traduction encore française : ${value.slice(0, 80)}`).toBe(false);
      expect(/[éèêàùçôîïâû]/i.test(value) && english === 0 && value.split(" ").length > 3, `accents français sans mot anglais : ${value.slice(0, 80)}`).toBe(false);
      void key;
    }
  });

  it("le pont de traduction est monté dans l'application, charge le dictionnaire seulement en anglais et laisse l'administration en français", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    expect(app).toContain("<DomTranslationBridge />");
    const bridge = readFileSync(resolve(root, "client/src/i18n/DomTranslationBridge.tsx"), "utf8");
    expect(bridge).toContain('language === "en"');
    expect(bridge).toContain('import("@/i18n/frToEn.json")');
    expect(bridge).toContain('"/admin"');
  });
});
