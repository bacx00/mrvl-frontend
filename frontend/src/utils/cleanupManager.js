/**
 * Global cleanup manager for preventing memory leaks
 * Manages cleanup of all active resources on page unload
 */

class CleanupManager {
  constructor() {
    this.cleanupFunctions = new Set();
    this.isCleaningUp = false;
    
    // Bind methods
    this.cleanup = this.cleanup.bind(this);
    this.register = this.register.bind(this);
    this.unregister = this.unregister.bind(this);
    
    // Register global cleanup handlers
    if (typeof window !== 'undefined') {
      // Handle page unload
      window.addEventListener('beforeunload', this.cleanup);
      window.addEventListener('unload', this.cleanup);
      
      // Handle visibility change (mobile browsers)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseActiveOperations();
        } else {
          this.resumeActiveOperations();
        }
      });
      
      console.log('🧹 Cleanup Manager initialized');
    }
  }
  
  /**
   * Register a cleanup function
   * @param {Function} cleanupFn - Function to call during cleanup
   * @returns {Function} Unregister function
   */
  register(cleanupFn) {
    if (typeof cleanupFn !== 'function') {
      console.warn('Cleanup function must be a function');
      return () => {};
    }
    
    this.cleanupFunctions.add(cleanupFn);
    
    // Return unregister function
    return () => this.unregister(cleanupFn);
  }
  
  /**
   * Unregister a cleanup function
   * @param {Function} cleanupFn - Function to remove from cleanup
   */
  unregister(cleanupFn) {
    this.cleanupFunctions.delete(cleanupFn);
  }
  
  /**
   * Execute all cleanup functions
   */
  cleanup() {
    if (this.isCleaningUp) return;
    
    this.isCleaningUp = true;
    console.log('🧹 Executing global cleanup...');
    
    // Execute all cleanup functions
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup function error:', error);
      }
    });
    
    // Clear the set
    this.cleanupFunctions.clear();
    
    console.log('✅ Global cleanup complete');
  }
  
  /**
   * Pause active operations (when tab becomes hidden)
   */
  pauseActiveOperations() {
    // Dispatch event that components can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mrvl-pause-operations'));
    }
  }
  
  /**
   * Resume active operations (when tab becomes visible)
   */
  resumeActiveOperations() {
    // Dispatch event that components can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mrvl-resume-operations'));
    }
  }
  
  /**
   * Destroy the cleanup manager
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.cleanup);
      window.removeEventListener('unload', this.cleanup);
    }
    
    this.cleanup();
  }
}

// Create singleton instance
const cleanupManager = new CleanupManager();

// Export singleton
export default cleanupManager;