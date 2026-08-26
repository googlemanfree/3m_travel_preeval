import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("centre de pilotage admin synchronisé", () => {
  it("expose les trois axes sans inclure de données personnelles dans les indicateurs", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminOperationsControlCenter.tsx"), "utf8");
    expect(source).toContain("Centre de pilotage synchronisé");
    expect(source).toContain("Espace client");
    expect(source).toContain("Flux partenaires");
    expect(source).toContain("Qualité opérationnelle");
    expect(source).toContain("Les opérations sensibles demandent toujours une validation humaine.");
    expect(source).not.toContain("candidate.email");
    expect(source).not.toContain("candidate.phone");
    expect(source).not.toContain("candidate.fullName");
  });

  it("conserve des points d’entrée explicites vers les dossiers, le placement et l’état système", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminOperationsControlCenter.tsx"), "utf8");
    expect(source).toContain('onNavigate("candidates")');
    expect(source).toContain('getElementById("admin-placement-pipeline")');
    expect(source).toContain('onNavigate("system-status")');
  });
});
