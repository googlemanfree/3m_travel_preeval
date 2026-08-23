import { describe, expect, it } from "vitest";
import { jinkoAdminTrackingFromEnrichment } from "../client/src/components/AdminTourismRequests";
import { jinkoClientTrackingFromEnrichment } from "../client/src/components/ClientSpaceNavigation";

const enrichment = JSON.stringify({
  jinkoSelection: { name: "Hôtel de contrôle" },
  jinkoSearchTrace: {
    searchId: "JNK-control-2026-001",
    searchedAt: "2026-08-23T13:55:00.000Z",
    validUntil: "2026-08-23T14:10:00.000Z",
  },
  jinkoRevalidation: {
    action: "revalidated",
    confirmedAt: "2026-08-23T14:00:00.000Z",
    confirmedByAdminEmail: "advisor@3mtravelagency.com",
  },
});

describe("suivi Jinko dans les espaces client et administrateur", () => {
  it("expose au client une offre sélectionnée et sa revalidation sans révéler de note interne", () => {
    expect(jinkoClientTrackingFromEnrichment(enrichment)).toEqual({
      hotelName: "Hôtel de contrôle",
      searchId: "JNK-control-2026-001",
      searchedAt: "2026-08-23T13:55:00.000Z",
      validUntil: "2026-08-23T14:10:00.000Z",
      revalidatedAt: "2026-08-23T14:00:00.000Z",
      revalidatedBy: "advisor@3mtravelagency.com",
    });
  });

  it("permet au back-office de distinguer une demande Jinko revalidée", () => {
    expect(jinkoAdminTrackingFromEnrichment(enrichment)).toMatchObject({
      hotelName: "Hôtel de contrôle",
      searchId: "JNK-control-2026-001",
      revalidatedAt: "2026-08-23T14:00:00.000Z",
      revalidatedBy: "advisor@3mtravelagency.com",
    });
  });

  it("ignore les enrichissements incomplets ou invalides", () => {
    expect(jinkoClientTrackingFromEnrichment("{" )).toBeNull();
    expect(jinkoAdminTrackingFromEnrichment(JSON.stringify({ jinkoSelection: { name: "Sans trace" } }))).toBeNull();
  });
});
