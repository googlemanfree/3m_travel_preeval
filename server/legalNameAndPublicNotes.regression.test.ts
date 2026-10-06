import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("raison sociale officielle", () => {
  it("n'emploie plus « 3M Travel & Services SARL » : le nom légal est « 3M Travel Agency SARL » (le nom commercial sans SARL reste libre)", () => {
    let output = "";
    try {
      output = execFileSync("git", ["grep", "-l", "-i", "-E", "Services,? SARL", "--", "client", "server", "shared", "docs/protocole-accord-01-luxembourg.md", "docs/protocole-accord-02-luxembourg.md"], { encoding: "utf8" });
    } catch (error) {
      if ((error as { status?: number }).status !== 1) throw error;
    }
    const files = output.split("\n").map((entry) => entry.trim()).filter((entry) => entry && entry !== "server/legalNameAndPublicNotes.regression.test.ts");
    expect(files).toEqual([]);
  });

  it("les pages juridiques n'affichent plus de note interne « modèle de base à faire valider »", () => {
    for (const page of ["client/src/pages/PolitiqueConfidentialite.tsx", "client/src/pages/ConditionsUtilisation.tsx"]) {
      const source = read(page);
      expect(source, page).not.toContain("modèle de base");
      expect(source, page).toContain("3M Travel Agency SARL");
    }
  });
});

describe("/evaluation sans compte", () => {
  it("l'écran de blocage propose l'évaluation gratuite publique au lieu d'une impasse", () => {
    const guard = read("client/src/components/AuthGuard.tsx");
    const app = read("client/src/App.tsx").replace(/\r\n/g, "\n");
    expect(guard).toContain("publicAlternative");
    expect(guard).toContain('data-testid="auth-guard-public-alternative"');
    const route = app.slice(app.indexOf('<Route path={"/evaluation"}>'), app.indexOf('<Route path={"/mon-espace"}>'));
    expect(route).toContain("AuthGuard");
    expect(route).toContain("/?project=travail#evaluation-multi");
  });
});
