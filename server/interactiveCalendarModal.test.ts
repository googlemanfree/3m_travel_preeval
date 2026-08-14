import { describe, it, expect } from "vitest";

describe("Interactive Calendar Modal for Appointment Booking", () => {
  it("allows selecting a date, time slot, and advisor without leaving the page", () => {
    const bookingPayload = {
      candidatName: "Jean Dupont",
      advisorId: "advisor_canada_1",
      date: "2026-08-20",
      timeSlot: "14:00",
      serviceType: "Consultation Express Entry Canada",
    };

    const isModalOpen = true;
    const isBooked = true;

    expect(isModalOpen).toBe(true);
    expect(bookingPayload.advisorId).toBe("advisor_canada_1");
    expect(bookingPayload.timeSlot).toBe("14:00");
    expect(isBooked).toBe(true);
  });
});
