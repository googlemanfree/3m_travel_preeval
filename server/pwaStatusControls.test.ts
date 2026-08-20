import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

describe("Contrôles PWA visibles pour l’utilisateur", () => {
  it("expose une bannière de mise à jour et un indicateur hors ligne globaux", () => {
    const app = fs.readFileSync(path.join(root, "client/src/App.tsx"), "utf8");
    const notice = fs.readFileSync(path.join(root, "client/src/components/PwaStatusNotice.tsx"), "utf8");
    const pwaClient = fs.readFileSync(path.join(root, "client/src/lib/pwaClient.ts"), "utf8");

    expect(app).toContain("<PwaStatusNotice />");
    expect(notice).toContain("Nouvelle version disponible");
    expect(notice).toContain("Mode hors connexion");
    expect(pwaClient).toContain("SKIP_WAITING");
  });

  it("permet au client de supprimer seulement les caches de l’application", () => {
    const pwaClient = fs.readFileSync(path.join(root, "client/src/lib/pwaClient.ts"), "utf8");
    const clientSpace = fs.readFileSync(path.join(root, "client/src/components/ClientSpaceNavigation.tsx"), "utf8");

    expect(pwaClient).toContain('key.startsWith("3m-travel-pwa")');
    expect(clientSpace).toContain("Réinitialiser le cache");
  });
});
