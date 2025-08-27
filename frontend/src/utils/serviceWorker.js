// Service Worker Registration and Management

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('🔧 Service worker is running in development mode');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      console.log('✅ Service Worker registered successfully');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('🔄 New content is available and will be used when all tabs are closed');
              
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('📱 Content is cached for offline use');
              
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch(error => {
      console.error('❌ Service Worker registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

// Service Worker communication utilities
export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📱 Gone offline');
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        this.handleMessage(event.data);
      });
    }
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🚀 Service Worker Manager initialized');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  handleMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'CACHE_STATUS':
        console.log('Cache status:', payload);
        break;
      default:
        console.log('SW message:', data);
    }
  }

  async sendMessage(message) {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active');
      return;
    }

    this.registration.active.postMessage(message);
  }

  async cacheApiResponse(url, data) {
    await this.sendMessage({
      type: 'CACHE_API_RESPONSE',
      payload: { url, data }
    });
  }

  async clearCache(cacheNames = []) {
    await this.sendMessage({
      type: 'CLEAR_CACHE',
      payload: { cacheNames }
    });
  }

  async getCacheStatus() {
    return new Promise(resolve => {
      if (!this.registration || !this.registration.active) {
        resolve({});
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = event => {
        resolve(event.data.payload);
      };

      this.registration.active.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [channel.port2]
      );
    });
  }

  // Background sync for offline actions
  async scheduleBackgroundSync(tag = 'background-sync') {
    if ('sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await this.registration.sync.register(tag);
        console.log('📋 Background sync scheduled');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  // Push notifications
  async subscribeToNotifications() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    let permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        )
      });

      console.log('🔔 Push subscription created');
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();