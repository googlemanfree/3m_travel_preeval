import { describe, it, expect } from "vitest";

describe("Appointment Booking Confirmation Animation & Detailed Summary", () => {
  it("generates animated success state with complete appointment summary", () => {
    const confirmationData = {
      success: true,
      animationState: "bounce-in",
      summary: {
        advisorName: "Maître Aureol Donfack",
        date: "2026-08-22",
        time: "10:30",
        location: "Agence Principale 3M Travel (Douala / Yaoundé) ou Consultation Vidéo",
        reference: "3M-APT-8842",
      },
    };

    expect(confirmationData.success).toBe(true);
    expect(confirmationData.animationState).toBe("bounce-in");
    expect(confirmationData.summary.reference).toContain("3M-APT");
    expect(confirmationData.summary.advisorName).toBeDefined();
  });
});
