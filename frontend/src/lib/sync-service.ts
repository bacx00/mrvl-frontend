// Frontend-Backend Synchronization Service
// Handles real-time data synchronization, caching, and offline support

import { apiGet, apiPost, apiPut, apiDelete, TokenManager, EnhancedAPIError } from './enhanced-api';

export interface SyncOptions {
  cacheTimeout?: number; // Cache timeout in milliseconds
  retryAttempts?: number; // Number of retry attempts
  realTimeUpdates?: boolean; // Enable real-time updates
  offlineSupport?: boolean; // Enable offline caching
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  key: string;
}

export class FrontendBackendSync {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private retryQueue: Array<{ key: string; request: () => Promise<any>; attempts: number }> = [];
  private eventSource: EventSource | null = null;
  private options: Required<SyncOptions>;

  constructor(options: SyncOptions = {}) {
    this.options = {
      cacheTimeout: options.cacheTimeout ?? 5 * 60 * 1000, // 5 minutes
      retryAttempts: options.retryAttempts ?? 3,
      realTimeUpdates: options.realTimeUpdates ?? true,
      offlineSupport: options.offlineSupport ?? true
    };

    if (typeof window !== 'undefined') {
      this.initializeSync();
    }
  }

  /**
   * Initialize synchronization features
   */
  private initializeSync(): void {
    // Handle online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Handle authentication changes
    window.addEventListener('auth:login', this.handleAuthChange.bind(this));
    window.addEventListener('auth:logout', this.handleAuthLogout.bind(this));

    // Initialize real-time updates if enabled
    if (this.options.realTimeUpdates) {
      this.initializeRealTimeUpdates();
    }

    // Process retry queue periodically
    setInterval(this.processRetryQueue.bind(this), 30000); // Every 30 seconds
  }

  /**
   * Initialize real-time updates via Server-Sent Events
   */
  private initializeRealTimeUpdates(): void {
    if (!TokenManager.isAuthenticated()) {
      return;
    }

    try {
      const token = TokenManager.getToken();
      const eventSourceUrl = `${this.getApiBaseUrl()}/stream?token=${encodeURIComponent(token || '')}`;
      
      this.eventSource = new EventSource(eventSourceUrl);
      
      this.eventSource.onopen = () => {
        console.log('Real-time updates connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealTimeUpdate(data);
        } catch (error) {
          console.warn('Invalid real-time update data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.warn('Real-time updates error:', error);
        setTimeout(() => this.initializeRealTimeUpdates(), 10000); // Retry in 10 seconds
      };
    } catch (error) {
      console.warn('Failed to initialize real-time updates:', error);
    }
  }

  /**
   * Handle real-time updates
   */
  private handleRealTimeUpdate(data: { type: string; key: string; payload: any }): void {
    const { type, key, payload } = data;

    switch (type) {
      case 'cache_invalidate':
        this.invalidateCache(key);
        break;
      case 'data_update':
        this.updateCache(key, payload);
        break;
      case 'match_update':
        this.handleMatchUpdate(payload);
        break;
      default:
        console.log('Unknown real-time update type:', type);
    }

    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('data:update', {
      detail: { type, key, payload }
    }));
  }

  /**
   * Handle match-specific updates
   */
  private handleMatchUpdate(matchData: any): void {
    const matchKey = `matches/${matchData.id}`;
    this.updateCache(matchKey, matchData);
    
    // Also update the matches list cache
    this.invalidateCache('matches');
    this.invalidateCache('matches/live');
  }

  /**
   * Synchronized GET request with caching
   */
  async syncGet<T>(endpoint: string, options: Partial<SyncOptions> = {}): Promise<T> {
    const cacheKey = this.getCacheKey('GET', endpoint);
    const mergedOptions = { ...this.options, ...options };

    // Check cache first
    if (mergedOptions.offlineSupport) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached && !this.isCacheExpired(cached)) {
        return cached.data;
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create the request
    const requestPromise = this.executeRequest(
      () => apiGet<T>(endpoint),
      cacheKey,
      mergedOptions.retryAttempts!
    );

    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      if (mergedOptions.offlineSupport) {
        this.setCache(cacheKey, result, mergedOptions.cacheTimeout!);
      }

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Synchronized POST request
   */
  async syncPost<T>(endpoint: string, data?: any, options: Partial<SyncOptions> = {}): Promise<T> {
    const mergedOptions = { ...this.options, ...options };
    
    return this.executeRequest(
      () => apiPost<T>(endpoint, data),
      `POST:${endpoint}:${JSON.stringify(data)}`,
      mergedOptions.retryAttempts!
    );
  }

  /**
   * Synchronized PUT request
   */
  async syncPut<T>(endpoint: string, data: any, options: Partial<SyncOptions> = {}): Promise<T> {
    const mergedOptions = { ...this.options, ...options };
    
    const result = await this.executeRequest(
      () => apiPut<T>(endpoint, data),
      `PUT:${endpoint}:${JSON.stringify(data)}`,
      mergedOptions.retryAttempts!
    );

    // Invalidate related caches
    this.invalidateRelatedCaches(endpoint);

    return result;
  }

  /**
   * Synchronized DELETE request
   */
  async syncDelete<T>(endpoint: string, options: Partial<SyncOptions> = {}): Promise<T> {
    const mergedOptions = { ...this.options, ...options };
    
    const result = await this.executeRequest(
      () => apiDelete<T>(endpoint),
      `DELETE:${endpoint}`,
      mergedOptions.retryAttempts!
    );

    // Invalidate related caches
    this.invalidateRelatedCaches(endpoint);

    return result;
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest<T>(
    requestFn: () => Promise<T>,
    requestKey: string,
    maxAttempts: number
  ): Promise<T> {
    let lastError: EnhancedAPIError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof EnhancedAPIError ? error : new EnhancedAPIError(
          error.message || 'Request failed',
          error.status || 500
        );

        // Don't retry certain errors
        if (lastError.isAuthenticationError() || lastError.isAuthorizationError() || lastError.isValidationError()) {
          throw lastError;
        }

        // Add to retry queue if offline and offline support is enabled
        if (!navigator.onLine && this.options.offlineSupport) {
          this.addToRetryQueue(requestKey, requestFn, attempt);
          throw new EnhancedAPIError('Request queued for retry when online', 0);
        }

        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Cache management methods
   */
  private getCacheKey(method: string, endpoint: string): string {
    return `${method}:${endpoint}`;
  }

  private getFromCache<T>(key: string): CacheEntry<T> | null {
    return this.cache.get(key) || null;
  }

  private setCache<T>(key: string, data: T, timeout: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + timeout,
      key
    };
    this.cache.set(key, entry);
  }

  private updateCache<T>(key: string, data: T): void {
    const existing = this.cache.get(key);
    if (existing) {
      existing.data = data;
      existing.timestamp = Date.now();
    }
  }

  private isCacheExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiry;
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  private invalidateRelatedCaches(endpoint: string): void {
    // Extract resource type from endpoint
    const resourceType = endpoint.split('/')[0];
    
    // Invalidate all caches related to this resource
    for (const [key] of this.cache) {
      if (key.includes(resourceType)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retry queue management
   */
  private addToRetryQueue(key: string, request: () => Promise<any>, attempts: number): void {
    this.retryQueue.push({ key, request, attempts });
  }

  private async processRetryQueue(): Promise<void> {
    if (!navigator.onLine || this.retryQueue.length === 0) {
      return;
    }

    const queueCopy = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of queueCopy) {
      try {
        await item.request();
        console.log(`Retry successful for: ${item.key}`);
      } catch (error) {
        if (item.attempts < this.options.retryAttempts) {
          this.retryQueue.push({
            ...item,
            attempts: item.attempts + 1
          });
        } else {
          console.error(`Max retry attempts reached for: ${item.key}`, error);
        }
      }
    }
  }

  /**
   * Event handlers
   */
  private handleOnline(): void {
    console.log('Connection restored, processing retry queue');
    this.processRetryQueue();
    
    if (this.options.realTimeUpdates) {
      this.initializeRealTimeUpdates();
    }
  }

  private handleOffline(): void {
    console.log('Connection lost, enabling offline mode');
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private handleAuthChange(): void {
    if (this.options.realTimeUpdates) {
      this.initializeRealTimeUpdates();
    }
  }

  private handleAuthLogout(): void {
    this.cache.clear();
    this.retryQueue = [];
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Utility methods
   */
  private getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:8000/api';
      } else {
        return `${window.location.protocol}//${host}/api`;
      }
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; size: string; hitRate: number } {
    const entries = this.cache.size;
    const sizeBytes = JSON.stringify([...this.cache.values()]).length;
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    
    return {
      entries,
      size: `${sizeKB} KB`,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.cache.clear();
    this.retryQueue = [];
    this.pendingRequests.clear();
  }
}

// Create singleton instance
export const syncService = new FrontendBackendSync();