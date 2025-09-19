/**
 * PWA Enhancement Suite for Tournament Platform
 * Advanced offline capabilities and native app-like experience
 */

class PWAEnhancer {
  constructor() {
    this.isOnline = navigator.onLine;
    this.installPrompt = null;
    this.updateAvailable = false;
    this.offlineQueue = [];
    
    this.initializeEnhancements();
  }

  async initializeEnhancements() {
    // Network status monitoring
    this.setupNetworkMonitoring();
    
    // Install prompt handling
    this.setupInstallPrompt();
    
    // Update notifications
    this.setupUpdateNotifications();
    
    // Background sync setup
    this.setupBackgroundSync();
    
    // Offline queue management
    this.setupOfflineQueue();
    
    // Push notifications
    this.setupPushNotifications();
    
    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Performance monitoring
    this.setupPerformanceMonitoring();
  }

  // Network Status Management
  setupNetworkMonitoring() {
    const updateOnlineStatus = () => {
      const wasOffline = !this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (wasOffline && this.isOnline) {
        this.handleBackOnline();
      } else if (!this.isOnline) {
        this.handleGoingOffline();
      }
      
      this.updateUIForNetworkStatus();
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  async checkConnectivity() {
    try {
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const actuallyOnline = response.ok;
      if (actuallyOnline !== this.isOnline) {
        this.isOnline = actuallyOnline;
        this.updateUIForNetworkStatus();
      }
    } catch (error) {
      if (this.isOnline) {
        this.isOnline = false;
        this.updateUIForNetworkStatus();
      }
    }
  }

  handleBackOnline() {
    console.log('[PWA] Back online - processing queued actions');
    
    // Show success notification
    this.showNotification('Back online!', {
      body: 'Connection restored. Syncing your data...',
      icon: '/icons/online.svg',
      tag: 'connectivity'
    });
    
    // Process offline queue
    this.processOfflineQueue();
    
    // Refresh critical data
    this.refreshCriticalData();
  }

  handleGoingOffline() {
    console.log('[PWA] Going offline - enabling offline mode');
    
    this.showNotification('Offline mode', {
      body: 'You can still browse matches and view cached content',
      icon: '/icons/offline.svg',
      tag: 'connectivity'
    });
    
    // Enable offline mode in UI
    document.body.classList.add('offline-mode');
  }

  updateUIForNetworkStatus() {
    const statusIndicator = document.querySelector('.network-status-indicator');
    if (statusIndicator) {
      statusIndicator.className = `network-status-indicator ${this.isOnline ? 'online' : 'offline'}`;
      statusIndicator.textContent = this.isOnline ? 'Online' : 'Offline';
    }

    // Update service worker about network status
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NETWORK_STATUS',
        isOnline: this.isOnline
      });
    }
  }

  // Install Prompt Management
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.hideInstallButton();
      
      // Track installation
      if (window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: 'Tournament Platform'
        });
      }
    });
  }

  async promptInstall() {
    if (!this.installPrompt) return false;

    try {
      this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
      } else {
        console.log('[PWA] User dismissed install prompt');
      }
      
      this.installPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }

  showInstallButton() {
    const installButton = document.querySelector('.pwa-install-button');
    if (installButton) {
      installButton.style.display = 'flex';
      installButton.addEventListener('click', () => this.promptInstall());
    }
  }

  hideInstallButton() {
    const installButton = document.querySelector('.pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // Update Management
  setupUpdateNotifications() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          this.updateAvailable = true;
          this.showUpdateNotification();
        }
      });

      // Check for updates periodically
      setInterval(() => {
        this.checkForUpdates();
      }, 60000 * 30); // Check every 30 minutes
    }
  }

  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    }
  }

  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span>New version available!</span>
        <button onclick="pwaEnhancer.applyUpdate()" class="update-button">
          Update Now
        </button>
        <button onclick="this.parentElement.parentElement.remove()" class="dismiss-button">
          Later
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds if not interacted with
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  async applyUpdate() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }

  // Background Sync
  setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register background sync for match updates
      navigator.serviceWorker.ready.then((registration) => {
        return registration.sync.register('sync-match-updates');
      });
    }
  }

  // Offline Queue Management
  setupOfflineQueue() {
    // Load existing queue from localStorage
    const savedQueue = localStorage.getItem('mrvl-offline-queue');
    if (savedQueue) {
      this.offlineQueue = JSON.parse(savedQueue);
    }
  }

  queueOfflineAction(action) {
    this.offlineQueue.push({
      ...action,
      timestamp: Date.now(),
      id: `offline-${Date.now()}-${Math.random()}`
    });
    
    localStorage.setItem('mrvl-offline-queue', JSON.stringify(this.offlineQueue));
  }

  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    const processedActions = [];
    
    for (const action of this.offlineQueue) {
      try {
        await this.executeOfflineAction(action);
        processedActions.push(action.id);
      } catch (error) {
        console.error('[PWA] Failed to process offline action:', action, error);
        // Keep failed actions in queue for retry
      }
    }

    // Remove successfully processed actions
    this.offlineQueue = this.offlineQueue.filter(
      action => !processedActions.includes(action.id)
    );
    
    localStorage.setItem('mrvl-offline-queue', JSON.stringify(this.offlineQueue));
  }

  async executeOfflineAction(action) {
    switch (action.type) {
      case 'match_vote':
        return fetch('/api/matches/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
      
      case 'team_follow':
        return fetch('/api/teams/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
      
      case 'forum_post':
        return fetch('/api/user/forums/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
      
      default:
        console.warn('[PWA] Unknown offline action type:', action.type);
    }
  }

  // Push Notifications
  async setupPushNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await this.subscribeToPush();
      }
    }
  }

  async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      console.log('[PWA] Push notification subscription successful');
    } catch (error) {
      console.error('[PWA] Push notification subscription failed:', error);
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  // Keyboard Shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't interfere with form inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'l': // Go to live matches
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            window.location.hash = '#/matches?filter=live';
          }
          break;
        
        case 'h': // Go home
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            window.location.hash = '#/';
          }
          break;
        
        case 'r': // Refresh data
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.refreshCriticalData();
          }
          break;
      }
    });
  }

  // Performance Monitoring
  setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[PWA] Long task detected:', entry.duration, 'ms');
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }

    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        const used = Math.round(memory.usedJSHeapSize / 1048576);
        const total = Math.round(memory.totalJSHeapSize / 1048576);
        
        if (used / total > 0.9) {
          console.warn('[PWA] High memory usage:', used, 'MB /', total, 'MB');
        }
      }, 30000);
    }
  }

  // Utility Methods
  async refreshCriticalData() {
    const criticalEndpoints = [
      '/api/matches?filter=live',
      '/api/events?filter=ongoing',
      '/api/rankings'
    ];

    const refreshPromises = criticalEndpoints.map(endpoint =>
      fetch(endpoint, { cache: 'no-cache' }).catch(console.warn)
    );

    await Promise.allSettled(refreshPromises);
    
    // Notify UI about refresh
    document.dispatchEvent(new CustomEvent('data-refreshed'));
  }

  async showNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        return registration.showNotification(title, {
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-72.png',
          ...options
        });
      } catch (error) {
        console.warn('[PWA] Notification failed:', error);
      }
    }
  }

  // Public API
  getNetworkStatus() {
    return {
      online: this.isOnline,
      effectiveType: navigator.connection?.effectiveType,
      downlink: navigator.connection?.downlink,
      rtt: navigator.connection?.rtt
    };
  }

  canInstall() {
    return this.installPrompt !== null;
  }

  hasUpdate() {
    return this.updateAvailable;
  }

  getOfflineQueueSize() {
    return this.offlineQueue.length;
  }
}

// Initialize PWA enhancer
const pwaEnhancer = new PWAEnhancer();

// Make it globally available
window.pwaEnhancer = pwaEnhancer;

export default pwaEnhancer;