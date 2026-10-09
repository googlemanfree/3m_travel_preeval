import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { computeSelectableStage, nextPostSelectionStage, resolvePostSelectionStage } from "../shared/talentCorridor";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("corridor de talents — 4 interfaces", () => {
  it("expose le hub /partenaires et les portails B2B", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('path={"/partenaires"}');
    expect(app).toContain('path={"/agences-placement"}');
    expect(app).toContain('path={"/employeurs"}');
    expect(read("client/src/pages/PartnersHub.tsx")).toContain("four-interfaces-title");
    expect(read("client/src/pages/Home.tsx")).toContain("home-talent-corridor");
  });

  it("calcule le statut sélectionnable candidat", () => {
    expect(computeSelectableStage({
      evaluationValidated: false,
      consentGranted: false,
      destinationSet: false,
      identityComplete: true,
    }, false)).toBe("incomplete");
    expect(computeSelectableStage({
      evaluationValidated: true,
      consentGranted: false,
      destinationSet: true,
      identityComplete: true,
    }, false)).toBe("awaiting_consent");
    expect(computeSelectableStage({
      evaluationValidated: true,
      consentGranted: true,
      destinationSet: true,
      identityComplete: true,
    }, false)).toBe("selectable");
    expect(computeSelectableStage({
      evaluationValidated: true,
      consentGranted: true,
      destinationSet: true,
      identityComplete: true,
    }, true)).toBe("shared");
  });

  it("branche le badge sélectionnable dans mon-espace", () => {
    expect(read("client/src/pages/EvaluationSpace.tsx")).toContain("SelectableProfileCard");
    expect(read("client/src/components/SelectableProfileCard.tsx")).toContain("getMySelectableStatus");
    expect(read("server/routers/placementPortal.ts")).toContain("getMySelectableStatus");
  });

  it("avance la file admin post-sélection", () => {
    expect(nextPostSelectionStage("selected")).toBe("contract_invitation");
    expect(nextPostSelectionStage("contract_invitation")).toBe("protocol_two");
    expect(nextPostSelectionStage("protocol_two")).toBe("procedure_ready");
    expect(nextPostSelectionStage("procedure_ready")).toBeNull();
    expect(resolvePostSelectionStage({ status: "selected" })).toBe("selected");
    expect(resolvePostSelectionStage({ status: "procedure_ready" })).toBe("procedure_ready");
    expect(read("server/routers/placementPortal.ts")).toContain("adminAdvancePostSelection");
    expect(read("client/src/components/AdminPlacementPipeline.tsx")).toContain("admin-post-selection-kanban");
    expect(read("drizzle/placementPortalSchema.ts")).toContain("adminPipelineStage");
  });

  it("indexe les landings corridor pour la découverte internationale", () => {
    const prerender = read("server/publicPrerender.ts");
    expect(prerender).toContain('"/partenaires"');
    expect(prerender).toContain('"/agences-placement"');
    expect(prerender).toContain('"/employeurs"');
    expect(read("client/src/components/Navbar.tsx")).toContain("/partenaires");
    expect(read("client/src/components/Footer.tsx")).toContain("/partenaires");
    expect(read("client/src/pages/Sitemap.tsx")).toContain("Corridor de talents");
  });
});
