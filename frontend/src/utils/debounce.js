/**
 * Debounce utility for optimizing rapid state updates
 * Prevents excessive re-renders and API calls
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - If true, trigger on leading edge instead of trailing
 * @returns {Function} The debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  let lastArgs;
  let lastThis;
  let result;
  
  const debounced = function(...args) {
    lastArgs = args;
    lastThis = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) {
        result = func.apply(lastThis, lastArgs);
      }
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      result = func.apply(this, args);
    }
    
    return result;
  };
  
  debounced.cancel = function() {
    clearTimeout(timeout);
    timeout = null;
  };
  
  debounced.flush = function() {
    if (timeout) {
      clearTimeout(timeout);
      result = func.apply(lastThis, lastArgs);
      timeout = null;
    }
    return result;
  };
  
  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle
 * @returns {Function} The throttled function
 */
export function throttle(func, wait) {
  let timeout = null;
  let lastTime = 0;
  let lastArgs;
  let lastThis;
  
  const throttled = function(...args) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);
    lastArgs = args;
    lastThis = this;
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastTime = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastTime = Date.now();
        timeout = null;
        func.apply(lastThis, lastArgs);
      }, remaining);
    }
  };
  
  throttled.cancel = function() {
    clearTimeout(timeout);
    timeout = null;
    lastTime = 0;
  };
  
  return throttled;
}

/**
 * Batch multiple updates into a single render cycle
 * Useful for aggregating rapid state changes
 */
export class UpdateBatcher {
  constructor(callback, delay = 100) {
    this.callback = callback;
    this.delay = delay;
    this.updates = [];
    this.timeout = null;
  }
  
  add(update) {
    this.updates.push(update);
    this.scheduleFlush();
  }
  
  scheduleFlush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }
  
  flush() {
    if (this.updates.length > 0) {
      const updates = [...this.updates];
      this.updates = [];
      this.callback(updates);
    }
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
  
  clear() {
    this.updates = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export default {
  debounce,
  throttle,
  UpdateBatcher
};