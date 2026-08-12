import { describe, expect, it, vi } from "vitest";
import { FlightSearchCache } from "./flightSearchCache";

describe("FlightSearchCache", () => {
  it("retourne une recherche mémorisée et comptabilise le cache hit", () => {
    const cache = new FlightSearchCache<{ value: string }>(60_000);
    cache.set("DLA-CDG", { value: "live" });

    expect(cache.get("DLA-CDG")?.data).toEqual({ value: "live" });
    expect(cache.getStatus()).toMatchObject({ entries: 1, hits: 1, misses: 0, hitRate: 100 });
  });

  it("expire les entrées et compte le cache miss", () => {
    vi.useFakeTimers();
    const cache = new FlightSearchCache<{ value: string }>(1_000);
    cache.set("DLA-CDG", { value: "live" });
    vi.advanceTimersByTime(1_001);

    expect(cache.get("DLA-CDG")).toBeNull();
    expect(cache.getStatus()).toMatchObject({ entries: 0, hits: 0, misses: 1 });
    vi.useRealTimers();
  });
});
