import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { hapticFeedback } from './MobileGestures';

// PWA Install Banner Component
export const PWAInstallBanner = ({ onInstall, onDismiss }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      hapticFeedback.success();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Expose to global for service worker integration
    window.showInstallPrompt = (prompt) => {
      setDeferredPrompt(prompt);
      setShowBanner(true);
    };

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      delete window.showInstallPrompt;
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    hapticFeedback.medium();
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA install');
        onInstall?.();
      } else {
        console.log('User dismissed PWA install');
      }
      
      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (error) {
      console.error('Error during PWA install:', error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    onDismiss?.();
    hapticFeedback.light();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="bg-red-100 dark:bg-red-900 p-2 rounded-xl">
            <Smartphone className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Install MRVL App
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Get the full experience with offline support and push notifications
            </p>
            
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-optimized"
              >
                <Download className="w-4 h-4" />
                <span>Install</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors touch-optimized"
              >
                Not now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-optimized"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Network Status Component
export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      hapticFeedback.success();
      
      // Auto-hide after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      hapticFeedback.error();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-50 animate-slide-down">
      <div className={`rounded-lg px-4 py-3 shadow-lg ${
        isOnline 
          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          {isOnline ? (
            <Wifi className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
          
          <div className="flex-1">
            <p className="font-medium">
              {isOnline ? 'Back online!' : 'You\'re offline'}
            </p>
            <p className="text-sm opacity-80">
              {isOnline 
                ? 'All features are available' 
                : 'Using cached content. Some features may be limited.'
              }
            </p>
          </div>
          
          <button
            onClick={() => setShowStatus(false)}
            className="p-1 opacity-60 hover:opacity-100 touch-optimized"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// SW Update Notification
export const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Expose to global for service worker integration
    window.showUpdateNotification = () => {
      setShowUpdate(true);
      hapticFeedback.notification();
    };

    return () => {
      delete window.showUpdateNotification;
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    hapticFeedback.medium();
    
    try {
      // Send skip waiting message to service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating app:', error);
      setIsUpdating(false);
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-blue-100 dark:bg-blue-900 rounded-lg px-4 py-3 shadow-lg text-blue-800 dark:text-blue-200">
        <div className="flex items-center space-x-3">
          <RotateCcw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
          
          <div className="flex-1">
            <p className="font-medium">
              App Update Available
            </p>
            <p className="text-sm opacity-80">
              New features and improvements are ready
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors touch-optimized"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
            
            <button
              onClick={() => setShowUpdate(false)}
              className="p-1 opacity-60 hover:opacity-100 touch-optimized"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Push Notification Handler
export const usePushNotifications = () => {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        hapticFeedback.success();
        return true;
      } else {
        hapticFeedback.error();
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async (vapidPublicKey) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        return true;
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return false;
      }
    }
    return false;
  };

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};

// PWA Detection Hook
export const usePWA = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Detect if running as PWA
    const isPWAMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');
    
    setIsPWA(isPWAMode);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setPlatform('ios');
    } else if (userAgent.includes('android')) {
      setPlatform('android');
    } else if (userAgent.includes('windows')) {
      setPlatform('windows');
    } else if (userAgent.includes('mac')) {
      setPlatform('mac');
    } else {
      setPlatform('unknown');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return {
    isPWA,
    isInstallable,
    platform,
    supportsInstall: isInstallable || platform === 'ios'
  };
};

// Offline Storage Hook
export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const storeOfflineAction = (action) => {
    try {
      const offlineActions = JSON.parse(localStorage.getItem('mrvl_offline_actions') || '[]');
      offlineActions.push({
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...action
      });
      localStorage.setItem('mrvl_offline_actions', JSON.stringify(offlineActions));
      return true;
    } catch (error) {
      console.error('Error storing offline action:', error);
      return false;
    }
  };

  const getOfflineActions = () => {
    try {
      return JSON.parse(localStorage.getItem('mrvl_offline_actions') || '[]');
    } catch (error) {
      console.error('Error retrieving offline actions:', error);
      return [];
    }
  };

  const clearOfflineActions = () => {
    try {
      localStorage.removeItem('mrvl_offline_actions');
      return true;
    } catch (error) {
      console.error('Error clearing offline actions:', error);
      return false;
    }
  };

  return {
    isOnline,
    storeOfflineAction,
    getOfflineActions,
    clearOfflineActions
  };
};

export default {
  PWAInstallBanner,
  NetworkStatus,
  UpdateNotification,
  usePushNotifications,
  usePWA,
  useOfflineStorage
};