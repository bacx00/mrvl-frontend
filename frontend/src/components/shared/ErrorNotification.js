import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const ErrorNotification = ({ 
  error, 
  onDismiss, 
  onRetry, 
  autoClose = true, 
  duration = 5000,
  position = 'top-right' 
}) => {
  // Immediately dismiss and don't show any visual notification
  useEffect(() => {
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  // Don't render anything - error banners are disabled
  return null;
};

// Global error notification manager
class ErrorNotificationManager {
  constructor() {
    this.notifications = new Map();
    this.listeners = new Set();
    this.nextId = 1;
  }

  show(error, options = {}) {
    const id = this.nextId++;
    const notification = {
      id,
      error,
      options,
      timestamp: Date.now()
    };
    
    this.notifications.set(id, notification);
    this.notifyListeners();
    
    return id;
  }

  dismiss(id) {
    this.notifications.delete(id);
    this.notifyListeners();
  }

  clear() {
    this.notifications.clear();
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(Array.from(this.notifications.values()));
    });
  }
}

export const errorNotificationManager = new ErrorNotificationManager();

// Global error notification setup - DISABLED to remove red banners
if (typeof window !== 'undefined') {
  // Disable error notifications to prevent red banners
  window.showErrorNotification = (message, options = {}) => {
    // Silently ignore error notifications
    return null;
  };
  
  window.clearErrorNotifications = () => {
    // Silently ignore clear requests
  };
}

// Hook to use error notifications in React components
export const useErrorNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = errorNotificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const showError = (error, options = {}) => {
    return errorNotificationManager.show(error, options);
  };

  const dismissError = (id) => {
    errorNotificationManager.dismiss(id);
  };

  const clearAll = () => {
    errorNotificationManager.clear();
  };

  return {
    notifications,
    showError,
    dismissError,
    clearAll
  };
};

// Container component to render all error notifications - DISABLED
export const ErrorNotificationContainer = () => {
  // Don't render any error notifications to prevent red banners
  return null;
};

export default ErrorNotification;