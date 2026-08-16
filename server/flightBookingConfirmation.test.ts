import { describe, expect, it } from "vitest";
import { resolveBookingRequester } from "./routers/flightBooking";

describe("confirmation de demande de vol", () => {
  it("prépare une demande invitée sans exiger de compte candidat", () => {
    expect(resolveBookingRequester({ fullName: "Aureol Donfack", email: "AUREOL@example.com" }, null)).toEqual({
      candidateId: null,
      email: "aureol@example.com",
      fullName: "Aureol Donfack",
      isGuest: true,
    });
  });

  it("rattache la demande au candidat connecté lorsque sa session est disponible", () => {
    expect(resolveBookingRequester({ fullName: "Aureol Donfack", email: "aureol@example.com" }, { id: 12, email: "compte@example.com" })).toMatchObject({
      candidateId: 12,
      email: "compte@example.com",
      isGuest: false,
    });
  });

  it("refuse les coordonnées passager incomplètes", () => {
    expect(() => resolveBookingRequester({ fullName: "A", email: "invalide" }, null)).toThrow("Le nom complet et une adresse e-mail valide du passager sont requis.");
  });
});
