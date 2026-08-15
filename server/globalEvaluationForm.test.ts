import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("évaluation mondiale", () => {
  it("permet une destination précise ou une comparaison mondiale", () => {
    const page = readProjectFile("client/src/pages/Evaluation.tsx");

    expect(page).toContain('value="autre">Monde — laissez-nous comparer les possibilités</option>');
    expect(page).toContain("possibilités disponibles dans le monde entier");
    expect(page).toContain("Vous pouvez indiquer n’importe quel pays");
    expect(page).toContain("[\"Canada\", \"Luxembourg\", \"Allemagne\", \"États-Unis\", \"Chine\", \"Australie\"]");
  });

  it("préserve le lien partagé historique Canada", () => {
    const app = readProjectFile("client/src/App.tsx");

    expect(app).toContain('<Route path={"/evaluation-canada"}>{() => <Redirect to="/evaluation?source=facebook&campaign=Canada" />}</Route>');
  });
});

