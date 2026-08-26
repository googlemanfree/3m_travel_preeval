import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Architecture des routes de services", () => {
  it("oriente chaque service vers une route canonique", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/ServicesSection.tsx"), "utf8");
    expect(source).toContain("href: '/billets'");
    expect(source).toContain("href: '/tourisme'");
    expect(source).toContain("href: '/procedures'");
    expect(source).toContain("href: '/assurance'");
    expect(source).toContain("href: '/ressources'");
    expect(source).not.toContain("link: '/evaluation'");
    expect(source).not.toContain("link: '/hotels'");
  });

  it("enregistre les parcours publics dans le pré-rendu et les handlers de production", () => {
    const prerender = readFileSync(resolve(process.cwd(), "server/publicPrerender.ts"), "utf8");
    const vite = readFileSync(resolve(process.cwd(), "server/_core/vite.ts"), "utf8");
    for (const path of ["/tourisme", "/assurance", "/traduction/order", "/hotels", "/visa-etudes"]) {
      expect(prerender).toContain(`\"${path}\"`);
      expect(vite).toContain(`app.get(\"${path}\", renderExplicitShell)`);
    }
  });

  it("conserve les alias historiques vers des destinations canoniques", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    expect(source).toContain('path="/hotels"');
    expect(source).toContain('Redirect to="/tourisme"');
    expect(source).toContain('path={"/visa-etudes"}');
    expect(source).toContain('Redirect to="/etudes"');
  });
});
