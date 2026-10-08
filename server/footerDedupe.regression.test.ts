import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pagesDir = resolve(root, "client/src/pages");

describe("pied de page unique — pas de duplication publique", () => {
  it("App expose un seul FooterLegal hors admin", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    expect(app).toContain("{showPublicFooter && <FooterLegal />}");
    expect(app).toContain("const showPublicFooter = !isAdminRoute");
    expect(app.match(/<FooterLegal\s*\/>/g)?.length ?? 0).toBe(1);
  });

  it("aucune page publique n’embarque un second <Footer />", () => {
    const offenders: string[] = [];
    for (const name of readdirSync(pagesDir)) {
      if (!name.endsWith(".tsx")) continue;
      if (name.startsWith("Admin")) continue; // admin : pas de FooterLegal global
      const source = readFileSync(join(pagesDir, name), "utf8");
      if (source.includes("<Footer") || /import\s+Footer\s+from/.test(source)) {
        offenders.push(name);
      }
    }
    expect(offenders).toEqual([]);
  });
});
