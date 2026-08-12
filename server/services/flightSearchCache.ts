export type SearchApiStatus = "not_configured" | "live" | "quota_limited" | "error" | "simulation";

type CacheEntry<T> = {
  data: T;
  createdAt: number;
};

export type FlightSearchCacheStatus = {
  entries: number;
  ttlSeconds: number;
  hits: number;
  misses: number;
  hitRate: number;
  lastRequestAt: string | null;
  lastLiveResultAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  apiStatus: SearchApiStatus;
};

export class FlightSearchCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;
  private lastRequestAt: Date | null = null;
  private lastLiveResultAt: Date | null = null;
  private lastErrorAt: Date | null = null;
  private lastError: string | null = null;
  private apiStatus: SearchApiStatus = "not_configured";

  constructor(private readonly ttlMs: number) {}

  get(key: string) {
    this.lastRequestAt = new Date();
    const entry = this.entries.get(key);
    if (!entry || Date.now() - entry.createdAt > this.ttlMs) {
      if (entry) this.entries.delete(key);
      this.misses += 1;
      return null;
    }
    this.hits += 1;
    return { data: entry.data, expiresAt: new Date(entry.createdAt + this.ttlMs).toISOString() };
  }

  set(key: string, data: T) {
    this.entries.set(key, { data, createdAt: Date.now() });
  }

  recordLiveResult() {
    this.apiStatus = "live";
    this.lastLiveResultAt = new Date();
    this.lastError = null;
    this.lastErrorAt = null;
  }

  recordUnavailable(status: SearchApiStatus, message: string) {
    this.apiStatus = status;
    this.lastError = message;
    this.lastErrorAt = new Date();
  }

  markNotConfigured() {
    this.apiStatus = "not_configured";
  }

  clear() {
    this.entries.clear();
  }

  getStatus(): FlightSearchCacheStatus {
    const total = this.hits + this.misses;
    return {
      entries: this.entries.size,
      ttlSeconds: Math.round(this.ttlMs / 1000),
      hits: this.hits,
      misses: this.misses,
      hitRate: total ? Math.round((this.hits / total) * 100) : 0,
      lastRequestAt: this.lastRequestAt?.toISOString() ?? null,
      lastLiveResultAt: this.lastLiveResultAt?.toISOString() ?? null,
      lastErrorAt: this.lastErrorAt?.toISOString() ?? null,
      lastError: this.lastError,
      apiStatus: this.apiStatus,
    };
  }
}

export const flightSearchCache = new FlightSearchCache<unknown>(15 * 60 * 1000);
