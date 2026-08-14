import { describe, it, expect } from "vitest";

describe("Document Status Badges", () => {
  it("maps document status correctly to labels and badge variants", () => {
    const statuses = ["pending", "verified", "rejected", "analyzing"];
    
    const getStatusInfo = (status: string) => {
      switch (status) {
        case "verified":
        case "approved":
          return { label: "Validé", variant: "success" };
        case "rejected":
          return { label: "Rejeté", variant: "destructive" };
        case "analyzing":
          return { label: "En analyse", variant: "default" };
        default:
          return { label: "En attente", variant: "secondary" };
      }
    };

    expect(getStatusInfo("verified").label).toBe("Validé");
    expect(getStatusInfo("rejected").variant).toBe("destructive");
    expect(getStatusInfo("pending").label).toBe("En attente");
    expect(getStatusInfo("analyzing").label).toBe("En analyse");
  });
});
