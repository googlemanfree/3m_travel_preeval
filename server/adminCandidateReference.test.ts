import { describe, expect, it } from "vitest";
import { parseAdminCandidateReference } from "./routers/admin";

describe("références de fiche candidat administrateur", () => {
  it("accepte les identifiants normalisés des dossiers en ligne et agence", () => {
    expect(parseAdminCandidateReference("online_42")).toEqual({ source: "online", id: 42 });
    expect(parseAdminCandidateReference("agency_7")).toEqual({ source: "agency", id: 7 });
  });

  it("refuse toute référence ambiguë ou incomplète", () => {
    expect(parseAdminCandidateReference("42")).toBeNull();
    expect(parseAdminCandidateReference("online_0")).toBeNull();
    expect(parseAdminCandidateReference("online_3_extra")).toBeNull();
  });
});
