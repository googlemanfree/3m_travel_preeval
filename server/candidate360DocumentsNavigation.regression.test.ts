import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");
const workspace = readFileSync(resolve(process.cwd(), "client/src/components/Candidate360Workspace.tsx"), "utf8");

describe("navigation documentaire Candidate360", () => {
  it("ouvre l’onglet Documents dans la fiche au lieu de fermer ou sortir vers la liste", () => {
    expect(dashboard).toContain('onClick={() => open360Tab("documents")}');
    expect(dashboard).toContain("initialTab={candidate360Tab}");
    expect(dashboard).not.toContain('onClick={() => onOpenOperations("documents", candidate.folderCode)}');
    expect(workspace).toContain('const [activeTab, setActiveTab]');
    expect(workspace).toContain('<Tabs id="candidate-360-tabs" value={activeTab} onValueChange=');
    expect(workspace).toContain('<TabsTrigger value="documents"');
  });

  it("les boutons du panneau latéral fonctionnent à chaque clic, pas seulement au premier", () => {
    // Bug : la fiche changeait d'onglet seule, le panneau gardait l'ancien en mémoire ; recliquer sur le même bouton ne déclenchait rien.
    expect(workspace).toContain("onTabChange?.(value as NonNullable<Props[\"initialTab\"]>)");
    expect(dashboard).toContain("onTabChange={setCandidate360Tab}");
    // Et l'écran est amené sur la fiche, plus bas que les boutons.
    expect(dashboard).toContain('document.getElementById("candidate-360-tabs")?.scrollIntoView');
    for (const tab of ["documents", "payments", "overview", "messages"]) {
      expect(dashboard).toContain(`onClick={() => open360Tab("${tab}")}`);
      expect(dashboard).not.toContain(`onClick={() => setCandidate360Tab("${tab}")}`);
    }
  });
});
