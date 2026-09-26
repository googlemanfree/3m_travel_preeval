export type SearchApiStatus = "not_configured" | "live" | "quota_limited" | "error" | "simulation";

type CacheEntry<T> = {
  data: T;
  createdAt: number;
};

type InFlightEntry<T> = Promise<T>;

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
  private readonly inFlight = new Map<string, InFlightEntry<T>>();
  private hits = 0;
  private misses = 0;
  private lastRequestAt: Date | null = null;
  private lastLiveResultAt: Date | null = null;
  private lastErrorAt: Date | null = null;
  private lastError: string | null = null;
  private apiStatus: SearchApiStatus = "not_configured";

  constructor(private readonly ttlMs: number, private readonly maxEntries = 200) {}

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
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) this.entries.delete(oldestKey);
    }
    this.entries.set(key, { data, createdAt: Date.now() });
  }

  /**
   * Partage une requête fournisseur déjà en cours pour éviter les appels
   * redondants lorsque plusieurs visiteurs lancent la même recherche au même moment.
   */
  loadOnce(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const request = loader().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, request);
    return request;
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
    this.inFlight.clear();
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
