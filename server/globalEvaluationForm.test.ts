import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("évaluation mondiale", () => {
  it("propose une destination recherchable, une procédure associée et une alternative à étudier", () => {
    const page = readProjectFile("client/src/pages/Evaluation.tsx");

    expect(page).toContain('value="autre">Monde — laissez-nous comparer les possibilités</option>');
    expect(page).toContain("getCountriesForProject(form.projectType)");
    expect(page).toContain("getDestinationOptionsForProject(form.projectType)");
    expect(page).toContain("getProceduresForCountry(form.projectType, form.destinationCountry)");
    expect(page).toContain("DestinationAutocomplete");
    expect(page).toContain("Recherchez par pays, sélectionnez une destination avec son drapeau");
  });

  it("préserve le lien partagé historique Canada", () => {
    const app = readProjectFile("client/src/App.tsx");

    expect(app).toContain('<Route path={"/evaluation-canada"}>{() => <Redirect to="/evaluation?source=facebook&campaign=Canada" />}</Route>');
  });
});
