/**
 * High-performance In-Memory & Stale-While-Revalidate Cache Layer
 * Provides instant 0ms responses for recurring read queries with background revalidation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class FastCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Fetch with Stale-While-Revalidate caching pattern
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 60_000 // default 1 minute
  ): Promise<T> {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing) {
      const isExpired = now - existing.timestamp > existing.ttl;
      if (!isExpired) {
        // Fresh hit: 0ms instant return
        return existing.data;
      }

      // Stale hit: return immediately, revalidate in background
      fetcher()
        .then((fresh) => {
          this.set(key, fresh, ttlMs);
        })
        .catch((err) => {
          console.warn(`[Cache] Background revalidation failed for ${key}:`, err);
        });

      return existing.data;
    }

    // Cache miss: execute fetcher
    const fresh = await fetcher();
    this.set(key, fresh, ttlMs);
    return fresh;
  }

  set<T>(key: string, data: T, ttlMs: number = 60_000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const existing = this.cache.get(key);
    if (!existing) return null;
    if (Date.now() - existing.timestamp > existing.ttl) {
      return null;
    }
    return existing.data as T;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const fastCache = new FastCache();
