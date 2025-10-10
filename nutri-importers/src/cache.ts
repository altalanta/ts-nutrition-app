/**
 * Simple HTTP response cache for importer responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ResponseCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const responseCache = new ResponseCache();

// Generate cache key for search queries
export function generateSearchCacheKey(query: string, options: any = {}): string {
  return `search:${query}:${JSON.stringify(options)}`;
}

// Generate cache key for barcode lookups
export function generateBarcodeCacheKey(barcode: string, options: any = {}): string {
  return `barcode:${barcode}:${JSON.stringify(options)}`;
}

// Generate cache key for FDC lookups
export function generateFdcCacheKey(fdcId: string): string {
  return `fdc:${fdcId}`;
}

// Periodic cleanup (in a real app, this would be run by a scheduler)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    responseCache.cleanup();
  }, 10 * 60 * 1000); // Clean up every 10 minutes
}




