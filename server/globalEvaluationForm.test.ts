import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("évaluation mondiale", () => {
  it("propose une destination recherchable, une procédure associée et une alternative à étudier", () => {
    const page = readProjectFile("client/src/pages/Evaluation.tsx");

    // La catégorie de destination et le type de visa sont déduits du pays et du projet : plus de menu pouvant les contredire.
    expect(page).toContain("deriveDestination(");
    expect(page).not.toContain('value="autre">Monde');
    expect(page).toContain("DynamicProjectChoice");
    expect(page).toContain("getAllDestinationOptionsForProject(form.projectType)");
    expect(page).toContain("getProceduresForCountry(form.projectType, form.destinationCountry)");
    expect(page).toContain("DestinationAutocomplete");
    expect(page).toContain("Recherchez un pays : le formulaire se recompose");
  });

  it("préserve le lien partagé historique Canada", () => {
    const app = readProjectFile("client/src/App.tsx");

    expect(app).toContain('<Route path={"/evaluation-canada"}>{() => <Redirect to="/evaluation?source=facebook&campaign=Canada" />}</Route>');
  });
});
