import { describe, expect, it } from "vitest";
import { resolveLoyaltyTier } from "./routers/flightBooking";

describe("programme de fidélité des vols", () => {
  it("applique les niveaux publiés en fonction des points cumulés", () => {
    expect(resolveLoyaltyTier(0)).toBe("explorer");
    expect(resolveLoyaltyTier(499)).toBe("explorer");
    expect(resolveLoyaltyTier(500)).toBe("silver");
    expect(resolveLoyaltyTier(1500)).toBe("gold");
    expect(resolveLoyaltyTier(3000)).toBe("platinum");
  });
});
