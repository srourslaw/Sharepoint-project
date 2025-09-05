import { CacheEntry, CacheOptions } from '../types/sharepoint';

/**
 * In-memory cache with TTL and size limits
 */
export class SharePointCache {
  private cache: Map<string, CacheEntry>;
  private options: CacheOptions;
  private accessOrder: string[]; // For LRU eviction

  constructor(options: CacheOptions) {
    this.cache = new Map();
    this.options = options;
    this.accessOrder = [];
    
    // Cleanup expired entries periodically
    if (options.enabled) {
      setInterval(() => this.cleanup(), 60000); // Every minute
    }
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    if (!this.options.enabled) {
      return null;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    
    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    if (!this.options.enabled) {
      return;
    }

    const now = Date.now();
    const ttl = customTtl || this.options.ttl;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      key
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  /**
   * Delete cached entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
    }
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    if (!this.options.enabled) {
      return false;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    enabled: boolean;
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: this.calculateHitRate(),
      enabled: this.options.enabled
    };
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    customTtl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fetchFunction();
      this.set(key, data, customTtl);
      return data;
    } catch (error) {
      // Don't cache errors, just throw them
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get entries that expire soon
   */
  getExpiringEntries(withinMs: number = 300000): CacheEntry[] {
    const now = Date.now();
    const threshold = now + withinMs;
    
    return Array.from(this.cache.values()).filter(entry => 
      entry.expiresAt <= threshold && entry.expiresAt > now
    );
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    customTtl?: number
  ): Promise<void> {
    try {
      const data = await fetchFunction();
      this.set(key, data, customTtl);
    } catch (error) {
      console.error(`Failed to preload cache key ${key}:`, error);
    }
  }

  /**
   * Update access order for LRU eviction
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.removeFromAccessOrder(key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`SharePoint cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Calculate hit rate (placeholder - would need hit/miss tracking)
   */
  private calculateHitRate(): number {
    // This would require tracking hits and misses
    // For now, return a placeholder
    return 0;
  }
}

/**
 * Cache key generators for consistent naming
 */
export class CacheKeys {
  static sites(): string {
    return 'sharepoint:sites';
  }

  static site(siteId: string): string {
    return `sharepoint:site:${siteId}`;
  }

  static documentLibraries(siteId: string): string {
    return `sharepoint:site:${siteId}:drives`;
  }

  static documentLibrary(driveId: string): string {
    return `sharepoint:drive:${driveId}`;
  }

  static folderContents(driveId: string, itemId: string = 'root'): string {
    return `sharepoint:drive:${driveId}:folder:${itemId}`;
  }

  static fileContent(driveId: string, itemId: string): string {
    return `sharepoint:drive:${driveId}:file:${itemId}:content`;
  }

  static fileMetadata(driveId: string, itemId: string): string {
    return `sharepoint:drive:${driveId}:file:${itemId}:metadata`;
  }

  static searchResults(query: string, driveId?: string): string {
    const scope = driveId ? `:${driveId}` : '';
    return `sharepoint:search${scope}:${Buffer.from(query).toString('base64')}`;
  }

  static userDrives(): string {
    return 'sharepoint:user:drives';
  }
}

/**
 * Cache warming service - preloads frequently accessed data
 */
export class CacheWarmer {
  private cache: SharePointCache;

  constructor(cache: SharePointCache) {
    this.cache = cache;
  }

  /**
   * Warm up cache with common data
   */
  async warmUp(
    sitesLoader: () => Promise<any>,
    userDrivesLoader: () => Promise<any>
  ): Promise<void> {
    console.log('Starting SharePoint cache warm-up...');

    const warmupTasks = [
      // Load sites
      this.cache.preload(CacheKeys.sites(), sitesLoader, 3600000), // 1 hour

      // Load user drives  
      this.cache.preload(CacheKeys.userDrives(), userDrivesLoader, 1800000), // 30 minutes
    ];

    try {
      await Promise.allSettled(warmupTasks);
      console.log('SharePoint cache warm-up completed');
    } catch (error) {
      console.error('SharePoint cache warm-up failed:', error);
    }
  }

  /**
   * Schedule periodic cache refresh
   */
  scheduleRefresh(
    refreshers: Array<{ key: string; loader: () => Promise<any>; interval: number }>
  ): void {
    for (const { key, loader, interval } of refreshers) {
      setInterval(async () => {
        try {
          console.log(`Refreshing cache key: ${key}`);
          await this.cache.preload(key, loader);
        } catch (error) {
          console.error(`Failed to refresh cache key ${key}:`, error);
        }
      }, interval);
    }
  }
}