import { describe, expect, it } from "vitest";
import {
  getPageTokens,
  parseCandidateListUrl,
  serializeCandidateListUrl,
} from "../client/src/lib/adminCandidatePagination";

describe("pagination candidats persistante", () => {
  it("valide les paramètres URL et conserve les filtres explicites", () => {
    const state = parseCandidateListUrl("?q=Aureol&page=3&pageSize=50&sort=score&status=nouveau");
    expect(state).toMatchObject({ searchQuery: "Aureol", page: 3, pageSize: 50, sortBy: "score", statusFilter: "nouveau" });
    expect(parseCandidateListUrl("?page=0&pageSize=999&sort=unknown")).toMatchObject({ page: 1, pageSize: 25, sortBy: "createdAt" });
    expect(serializeCandidateListUrl(state)).toContain("pageSize=50");
  });

  it("construit une numérotation compacte et accessible pour de nombreuses pages", () => {
    expect(getPageTokens(5, 12)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 12]);
  });
});
