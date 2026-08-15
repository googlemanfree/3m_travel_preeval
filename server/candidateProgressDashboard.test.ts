import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("redirection Google et suivi candidat", () => {
  it("affiche un état de progression accessible pendant la redirection Google", () => {
    const login = read("client/src/pages/Login.tsx");
    expect(login).toContain("isGoogleRedirecting");
    expect(login).toContain('role="status"');
    expect(login).toContain('role="progressbar"');
    expect(login).toContain("Progression de la connexion Google");
    expect(login).toContain("Ne fermez pas cette fenêtre");
  });

  it("utilise le statut réel du dossier et expose une progression synchronisée", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain('dossierData.data.dossierStatus || app.dossierStatus || "nouveau"');
    expect(dashboard).toContain('aria-label="Suivi d’avancement du dossier"');
    expect(dashboard).toContain('aria-label="Progression du dossier"');
    expect(dashboard).toContain("currentStatus.action");
    expect(dashboard).not.toContain('status: "draft"');
  });
});

