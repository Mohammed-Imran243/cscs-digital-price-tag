/**
 * CSCS ESL Platform — In-memory API Cache
 * Caches DragonESL API responses to avoid redundant calls across modules.
 * TTL default: 5 minutes. Use shorter TTL for live data (ESL tags, AP status).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Fetch with cache — if cached and fresh, return immediately.
   * Otherwise call fetcher, cache result, return it.
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }
}

// Singleton — shared across all modules
export const apiCache = new ApiCache();

// TTL constants
export const TTL = {
  STORES: 10 * 60 * 1000,       // 10 min — stores rarely change
  TEMPLATES: 5 * 60 * 1000,     // 5 min
  CATEGORIES: 10 * 60 * 1000,   // 10 min — very stable
  TEMPLATE_TYPES: 10 * 60 * 1000,
  PRODUCTS: 3 * 60 * 1000,      // 3 min — products change more often
  ESL_DEVICES: 2 * 60 * 1000,   // 2 min — live device data
  AP_DEVICES: 2 * 60 * 1000,    // 2 min
  MERCHANT: 15 * 60 * 1000,     // 15 min — merchant info barely changes
  DASHBOARD: 3 * 60 * 1000,     // 3 min for dashboard aggregate
};
