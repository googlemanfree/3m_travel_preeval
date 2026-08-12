import { describe, expect, it } from "vitest";
import { escapeCsvCell, paginateCandidates, parseAdminCandidateReference } from "./routers/adminCandidateManagement";

describe("admin candidate dossier workflow", () => {
  it("parses only valid online and agency references", () => {
    expect(parseAdminCandidateReference("online_42")).toEqual({ source: "online", id: 42 });
    expect(parseAdminCandidateReference("agency_7")).toEqual({ source: "agency", id: 7 });
    expect(parseAdminCandidateReference("candidate_7")).toBeNull();
    expect(parseAdminCandidateReference("online_0")).toBeNull();
    expect(parseAdminCandidateReference("online_x")).toBeNull();
  });

  it("keeps pagination boundaries stable for admin lists", () => {
    const result = paginateCandidates([1, 2, 3, 4, 5], 2, 2);
    expect(result).toEqual({ records: [3, 4], total: 5, page: 2, pageSize: 2, totalPages: 3 });
    expect(paginateCandidates([1], 99, 10).page).toBe(1);
  });

  it("prevents spreadsheet formulas in candidate exports", () => {
    expect(escapeCsvCell("=HYPERLINK(\"https://example.com\")")).toBe("\"'=HYPERLINK(\"\"https://example.com\"\")\"");
    expect(escapeCsvCell("Nom\nCandidat")).toBe("\"Nom Candidat\"");
  });
});
