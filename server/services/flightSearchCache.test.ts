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

  it("partage une seule promesse pour deux chargements simultanés", async () => {
    const cache = new FlightSearchCache<{ value: string }>(60_000);
    let calls = 0;
    let resolve!: (value: { value: string }) => void;
    const loader = vi.fn(() => {
      calls += 1;
      return new Promise<{ value: string }>((done) => {
        resolve = done;
      });
    });

    const first = cache.loadOnce("DLA-CDG", loader);
    const second = cache.loadOnce("DLA-CDG", loader);
    resolve({ value: "live" });

    await expect(Promise.all([first, second])).resolves.toEqual([{ value: "live" }, { value: "live" }]);
    expect(calls).toBe(1);
  });

  it("évince l’entrée la plus ancienne au-delà de la capacité", () => {
    const cache = new FlightSearchCache<{ value: string }>(60_000, 2);
    cache.set("first", { value: "1" });
    cache.set("second", { value: "2" });
    cache.set("third", { value: "3" });

    expect(cache.get("first")).toBeNull();
    expect(cache.get("second")?.data).toEqual({ value: "2" });
    expect(cache.get("third")?.data).toEqual({ value: "3" });
  });
});
