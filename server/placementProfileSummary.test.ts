import { describe, expect, it } from "vitest";
import { buildPlacementSummaryDraft, buildPlacementSummaryPdf, fingerprintPlacementSummary } from "./services/placementProfileSummary";

describe("placement profile summary", () => {
  it("anonymise les coordonnées et identifiants sensibles", () => {
    const draft = buildPlacementSummaryDraft({
      fullName: "Aureol DONFACK",
      destination: "Canada",
      procedure: "Travail",
      profileSummary: "Contact aureol@example.com +237 699 123 456, passeport AB123456 et CV brut.",
      documents: [{ type: "passeport", status: "approved", comment: "AB123456" }, { type: "passeport", status: "pending" }],
    });
    const serialized = JSON.stringify(draft);
    expect(draft.identity).toBe("Aureol D.");
    expect(serialized).not.toContain("aureol@example.com");
    expect(serialized).not.toContain("699 123 456");
    expect(serialized).not.toContain("AB123456");
    expect(draft.documents).toHaveLength(1);
    expect(draft.documents[0]).toMatchObject({ type: "Passeport", status: "Validé" });
    expect(buildPlacementSummaryPdf(draft).toString("latin1")).toContain("Contact : 3M TRAVEL AGENCY uniquement");
  });

  it("produit une empreinte stable et change après modification d’une pièce", () => {
    const base = buildPlacementSummaryDraft({ fullName: "Maya N.", destination: "Luxembourg", procedure: "Études", documents: [{ type: "diplome", status: "pending" }] });
    const changed = buildPlacementSummaryDraft({ fullName: "Maya N.", destination: "Luxembourg", procedure: "Études", documents: [{ type: "diplome", status: "approved" }] });
    expect(fingerprintPlacementSummary(base)).not.toBe(fingerprintPlacementSummary(changed));
  });
});
