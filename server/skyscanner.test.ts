import { describe, it, expect } from "vitest";

describe("Sky Scrapper API — RAPIDAPI_KEY validation", () => {
  it("should return airport results for Douala", async () => {
    const key = process.env.RAPIDAPI_KEY;
    expect(key, "RAPIDAPI_KEY must be set").toBeTruthy();

    const res = await fetch(
      "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport?query=Douala&locale=en-US",
      {
        headers: {
          "X-RapidAPI-Key": key!,
          "X-RapidAPI-Host": "sky-scrapper.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    expect(res.status, "HTTP status should be 200").toBe(200);
    const json = await res.json() as { status: boolean; data?: unknown[] };
    expect(json.status, "API status should be true").toBe(true);
    expect(Array.isArray(json.data) && json.data.length > 0, "Should return at least one airport").toBe(true);
  }, 20000);
});
