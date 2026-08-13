import { describe, expect, it } from "vitest";
import { validateFlightDates } from "./flightDateValidation";

describe("validateFlightDates", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("accepts a future one-way departure date", () => {
    expect(validateFlightDates({
      tripType: "ONE_WAY",
      departureDate: "2026-08-20",
    }, now)).toBeNull();
  });

  it("rejects a departure date in the past", () => {
    expect(validateFlightDates({
      tripType: "ONE_WAY",
      departureDate: "2026-08-12",
    }, now)).toContain("départ");
  });

  it("rejects invalid calendar dates", () => {
    expect(validateFlightDates({
      tripType: "ONE_WAY",
      departureDate: "2026-02-30",
    }, now)).toContain("invalide");
  });

  it("requires and orders the return date for round trips", () => {
    expect(validateFlightDates({
      tripType: "ROUND_TRIP",
      departureDate: "2026-08-20",
    }, now)).toContain("retour");
    expect(validateFlightDates({
      tripType: "ROUND_TRIP",
      departureDate: "2026-08-20",
      returnDate: "2026-08-19",
    }, now)).toContain("postérieure");
  });

  it("accepts a same-day return and a later return", () => {
    expect(validateFlightDates({
      tripType: "ROUND_TRIP",
      departureDate: "2026-08-20",
      returnDate: "2026-08-20",
    }, now)).toBeNull();
  });
});
