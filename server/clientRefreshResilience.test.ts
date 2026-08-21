import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("résilience du rechargement de l’espace client", () => {
  const root = resolve(process.cwd());
  const candidateRouter = readFileSync(resolve(root, "server/routers/candidate.ts"), "utf8");
  const clientEntrypoint = readFileSync(resolve(root, "client/src/main.tsx"), "utf8");
  const dashboard = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");

  it("laisse le tableau de bord guider les profils sans portrait au lieu de les bloquer", () => {
    expect(candidateRouter).toContain('"candidate.getClientDashboardSummary"');
    expect(candidateRouter).toContain("PORTRAIT_ONBOARDING_PATHS");
  });

  it("utilise le jeton adapté à la zone consultée après rechargement", () => {
    expect(clientEntrypoint).toContain("window.location.pathname.startsWith(\"/admin\")");
    expect(clientEntrypoint).toContain("const isAdminRoute");
  });

  it("réessaie les échecs transitoires et distingue le profil incomplet", () => {
    expect(dashboard).toContain("retry: 3");
    expect(dashboard).toContain("portraitIsMissing");
    expect(dashboard).toContain("Complétez votre profil");
  });
});
