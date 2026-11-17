import { describe, expect, it } from "vitest";
import { getPageTokens, parseCandidateListUrl, serializeCandidateListUrl } from "./adminCandidatePagination";

describe("pagination persistante des candidats", () => {
  it("lit uniquement les paramètres valides depuis l’URL", () => {
    expect(parseCandidateListUrl("?q=Aureol&page=3&pageSize=50&sort=score&status=nouveau")).toMatchObject({
      searchQuery: "Aureol", page: 3, pageSize: 50, sortBy: "score", statusFilter: "nouveau",
    });
    expect(parseCandidateListUrl("?page=0&pageSize=999&sort=unknown")).toMatchObject({ page: 1, pageSize: 25, sortBy: "priorite" });
    // priorité (CV reçus à traiter d'abord) par défaut : « plus récents » doit être demandé explicitement
    expect(parseCandidateListUrl("?sort=createdAt")).toMatchObject({ sortBy: "createdAt" });
    expect(parseCandidateListUrl("")).toMatchObject({ sortBy: "priorite" });
  });

  it("sérialise les états non par défaut et rend une numérotation compacte", () => {
    const search = serializeCandidateListUrl({ searchQuery: "Marie", statusFilter: "tous", paymentFilter: "paye", scoreFilter: "tous", destinationFilter: "France", sortBy: "priorite", page: 4, pageSize: 50 });
    expect(search).toContain("q=Marie");
    expect(search).not.toContain("sort=");
    expect(serializeCandidateListUrl({ searchQuery: "", statusFilter: "tous", paymentFilter: "tous", scoreFilter: "tous", destinationFilter: "tous", sortBy: "createdAt", page: 1, pageSize: 25 })).toContain("sort=createdAt");
    expect(search).toContain("payment=paye");
    expect(search).toContain("page=4");
    expect(getPageTokens(5, 12)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 12]);
  });
});
