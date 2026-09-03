import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("améliorations UI du suivi client et de l’accès admin", () => {
  it("rend la notification PWA compacte et masquable", () => {
    const source = read("client/src/components/PwaStatusNotice.tsx");
    expect(source).toContain("updateDismissed");
    expect(source).toContain("Masquer la notification de mise à jour");
    expect(source).toContain("w-[min(22rem,calc(100%-2rem))]");
  });

  it("expose un chargement admin accessible avec une progression animée", () => {
    const source = read("client/src/components/AdminGuard.tsx");
    expect(source).toContain('aria-label="Chargement de l’espace administrateur"');
    expect(source).toContain("Connexion sécurisée en cours");
    expect(source).toContain('animate={{ x: ["-120%", "280%"] }}');
  });

  it("présente une timeline et des détails dépliables dans le suivi client", () => {
    const source = read("client/src/pages/ClientCaseTracking.tsx");
    expect(source).toContain("workflowStages");
    expect(source).toContain("Voir les détails");
    expect(source).toContain("aria-expanded={expanded}");
    expect(source).toContain("TooltipProvider");
    expect(source).toContain("AnimatePresence");
  });
});
