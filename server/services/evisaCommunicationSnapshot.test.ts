import { describe, expect, it } from "vitest";
import { createEvisaCommunicationSnapshot } from "./evisaCommunicationSnapshot";

describe("instantané de communication e‑Visa", () => {
  it("scelle la version exacte des exigences et du message envoyés", () => {
    const json = createEvisaCommunicationSnapshot([{
      destinationId: "togo", country: "Togo", officialPortalUrl: "https://voyage.gouv.tg/", officialPortalLabel: "Togo Voyage",
      officialVerifiedAt: "17 août 2026", requirements: "Passeport valide", fee: "À confirmer", delay: "5 jours ouvrés", procedureUrl: "/evisas/request?destination=togo",
    }], "Veuillez consulter les exigences.", 12, new Date("2026-08-17T10:00:00.000Z"));
    const snapshot = JSON.parse(json);
    expect(snapshot.messageContentAtSend).toBe("Veuillez consulter les exigences.");
    expect(snapshot.items[0]).toMatchObject({ country: "Togo", requirements: "Passeport valide", officialVerifiedAt: "17 août 2026" });
    expect(snapshot.sharedByAdminId).toBe(12);
  });
});
