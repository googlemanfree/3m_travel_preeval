import { describe, expect, it } from "vitest";
import { filterKanbanCandidates, getDeadlineLevel, type KanbanCandidate } from "./AdminCandidateKanban";

const candidates: KanbanCandidate[] = [
  { id: "1", fullName: "A", folderCode: "A", destinationCountry: "canada", projectType: "travail", status: "PENDING_48H", source: "WEB", advisorName: "Nadia" },
  { id: "2", fullName: "B", folderCode: "B", destinationCountry: "luxembourg", projectType: "travail", status: "PUBLISHED", source: "WEB", advisorName: "Nadia" },
  { id: "3", fullName: "C", folderCode: "C", destinationCountry: "canada", projectType: "études", status: "DOCUMENTS_CHECK", source: "ACCOUNT_ONLY", advisorName: "Paul" },
];

describe("AdminCandidateKanban", () => {
  it("filtre simultanément par destination et conseiller", () => {
    expect(filterKanbanCandidates(candidates, "canada", "Nadia").map((candidate) => candidate.id)).toEqual(["1"]);
    expect(filterKanbanCandidates(candidates, "ALL", "Nadia").map((candidate) => candidate.id)).toEqual(["1", "2"]);
    expect(filterKanbanCandidates(candidates, "canada", "ALL").map((candidate) => candidate.id)).toEqual(["1", "3"]);
  });

  it("classe les échéances sans dépendre de l’horloge système", () => {
    const now = Date.parse("2026-08-26T12:00:00.000Z");
    expect(getDeadlineLevel(undefined, now)).toBe("unspecified");
    expect(getDeadlineLevel("2026-08-26T11:59:00.000Z", now)).toBe("overdue");
    expect(getDeadlineLevel("2026-08-26T20:00:00.000Z", now)).toBe("soon");
    expect(getDeadlineLevel("2026-08-28T12:00:00.000Z", now)).toBe("on_track");
    expect(getDeadlineLevel("not-a-date", now)).toBe("invalid");
  });
});
