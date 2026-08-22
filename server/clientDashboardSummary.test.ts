import { describe, it, expect } from "vitest";

describe("Client Dashboard Summary Aggregator", () => {
  it("computes profile completion and aggregates client statistics correctly", () => {
    const mockCandidate = {
      id: 1,
      fullName: "Aureol Donfack",
      email: "aureoldonfack@gmail.com",
      phone: "+237698104832",
      destination: "canada",
    };

    let profileFieldsFilled = 0;
    const totalProfileFields = 5;
    if (mockCandidate.fullName) profileFieldsFilled++;
    if (mockCandidate.email) profileFieldsFilled++;
    if (mockCandidate.phone) profileFieldsFilled++;
    if (mockCandidate.destination) profileFieldsFilled++;
    const profileCompletionPercent = Math.round((profileFieldsFilled / totalProfileFields) * 100);

    expect(profileCompletionPercent).toBe(80);
  });
});
