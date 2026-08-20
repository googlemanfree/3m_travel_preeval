import { describe, expect, it } from "vitest";
import { getTourismTrackingMeta } from "./routers/tourism";

describe("suivi client 3M Booking", () => {
  it("présente une progression exploitable pour chaque statut hôtel", () => {
    expect(getTourismTrackingMeta("new")).toMatchObject({ label: "Demande reçue", step: 1 });
    expect(getTourismTrackingMeta("quote_sent")).toMatchObject({ label: "Devis disponible", step: 3 });
    expect(getTourismTrackingMeta("confirmed")).toMatchObject({ label: "Séjour confirmé", step: 4 });
  });

  it("marque une demande annulée sans étape active", () => {
    expect(getTourismTrackingMeta("cancelled")).toMatchObject({ label: "Demande annulée", step: 0, tone: "rose" });
  });
});
