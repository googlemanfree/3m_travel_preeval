import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("Correctifs urgents upload et navigation", () => {
  it("autorise la catégorie photo_identite et ses alias biométriques", () => {
    const source = read("server/routers/candidateUpload.ts");
    expect(source).toContain('photo_identite: "photo_identite"');
    expect(source).toContain('portrait: "photo_identite"');
    expect(source).toContain('portrait_humain: "photo_identite"');
  });

  it("retire le QR et les tooltips flottants du Footer", () => {
    const source = read("client/src/components/Footer.tsx");
    expect(source).not.toContain("FacebookQRCodeWidget");
    expect(source).not.toContain('role="tooltip"');
  });

  it("dirige le suivi client vers la page dédiée", () => {
    const source = read("client/src/components/ClientSpaceNavigation.tsx");
    expect(source).toContain('href="/mon-dossier"');
    expect(source).not.toContain('href="/mon-espace?section=dossier"');
    const appSource = read("client/src/App.tsx");
    expect(appSource).toContain('path={"/mon-dossier"}');
  });
});

