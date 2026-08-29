import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("client space and registration regression contracts", () => {
  it("opens Mon dossier in the unified authenticated client space", () => {
    const source = readProjectFile("client/src/components/ClientSpaceNavigation.tsx");
    expect(source).toContain('href: "/mon-espace?section=dossier"');
    expect(source).toContain('href="/mon-espace?section=dossier"');
  });

  it("initializes and validates the requested client section", () => {
    const source = readProjectFile("client/src/pages/EvaluationSpace.tsx");
    expect(source).toContain("const initialSection = validSections.includes(section as ClientSection)");
    expect(source).toContain("const [activeTab, setActiveTab] = useState<ClientSection>(initialSection)");
  });

  it("keeps a persisted account usable when the activation email temporarily fails", () => {
    const serverSource = readProjectFile("server/routers/candidate.ts");
    const registerSource = readProjectFile("client/src/pages/Register.tsx");
    expect(serverSource).toContain("let activationEmailSent = true");
    expect(serverSource).toContain("activationEmailSent,");
    expect(serverSource).not.toContain("Compte créé, mais l’e-mail d’activation n’a pas pu être envoyé");
    expect(registerSource).toContain("data.activationEmailSent !== false");
    expect(registerSource).not.toContain("Attendre 2 secondes avant d’afficher");
  });
});
