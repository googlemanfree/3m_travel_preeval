import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");
const workspace = readFileSync(resolve(process.cwd(), "client/src/components/Candidate360Workspace.tsx"), "utf8");

describe("navigation documentaire Candidate360", () => {
  it("ouvre l’onglet Documents dans la fiche au lieu de fermer ou sortir vers la liste", () => {
    expect(dashboard).toContain('onClick={() => setCandidate360Tab("documents")}');
    expect(dashboard).toContain("initialTab={candidate360Tab}");
    expect(dashboard).not.toContain('onClick={() => onOpenOperations("documents", candidate.folderCode)}');
    expect(workspace).toContain('const [activeTab, setActiveTab]');
    expect(workspace).toContain('<Tabs value={activeTab} onValueChange=');
    expect(workspace).toContain('<TabsTrigger value="documents"');
  });
});
