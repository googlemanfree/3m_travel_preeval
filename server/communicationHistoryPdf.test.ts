import { describe, expect, it } from "vitest";
import { buildCommunicationHistoryEntries } from "../client/src/lib/communicationHistoryPdf";

describe("export d’historique de communication", () => {
  it("inclut les messages, notifications et l’instantané e‑Visa archivé", () => {
    const entries = buildCommunicationHistoryEntries([{
      id: 1, senderRole: "advisor", content: "Voici les exigences.", createdAt: "2026-08-17T10:00:00.000Z",
      evisaSnapshotJson: JSON.stringify({ sharedAt: "2026-08-17T10:00:00.000Z", items: [{ country: "Togo", officialPortalLabel: "Togo Voyage", officialPortalUrl: "https://voyage.gouv.tg/", officialVerifiedAt: "17 août 2026", requirements: "Passeport valide", fee: "À confirmer", delay: "5 jours", procedureUrl: "/evisas/request?destination=togo" }] }),
    }], [{ id: 2, title: "Nouveau message", body: "Une notification", createdAt: "2026-08-17T09:00:00.000Z" }]);
    expect(entries).toHaveLength(2);
    expect(entries[1].content).toContain("Instantané e‑Visa partagé");
    expect(entries[1].content).toContain("https://voyage.gouv.tg/");
  });
});
