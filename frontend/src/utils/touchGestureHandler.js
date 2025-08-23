/**
 * Touch Gesture Handler for Mobile Optimization
 * Provides swipe, tap, and other gesture detection
 */

class TouchGestureHandler {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      swipeThreshold: options.swipeThreshold || 50,
      swipeVelocity: options.swipeVelocity || 0.3,
      tapDelay: options.tapDelay || 200,
      longPressDelay: options.longPressDelay || 500,
      doubleTapDelay: options.doubleTapDelay || 300,
      preventScroll: options.preventScroll || false,
      ...options
    };
    
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.touchStartTime = 0;
    this.lastTapTime = 0;
    this.longPressTimer = null;
    this.isScrolling = null;
    
    this.callbacks = {
      onSwipeLeft: options.onSwipeLeft || null,
      onSwipeRight: options.onSwipeRight || null,
      onSwipeUp: options.onSwipeUp || null,
      onSwipeDown: options.onSwipeDown || null,
      onTap: options.onTap || null,
      onDoubleTap: options.onDoubleTap || null,
      onLongPress: options.onLongPress || null,
      onPinch: options.onPinch || null,
      onPinchIn: options.onPinchIn || null,
      onPinchOut: options.onPinchOut || null
    };
    
    this.init();
  }
  
  init() {
    if (!this.element) return;
    
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // Prevent default touch behaviors if needed
    if (this.options.preventScroll) {
      this.element.style.touchAction = 'none';
    }
  }
  
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isScrolling = null;
    
    // Handle multi-touch for pinch gestures
    if (e.touches.length === 2) {
      this.handlePinchStart(e);
    }
    
    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      if (this.callbacks.onLongPress) {
        this.callbacks.onLongPress({
          x: this.touchStartX,
          y: this.touchStartY,
          target: e.target
        });
      }
    }, this.options.longPressDelay);
  }
  
  handleTouchMove(e) {
    if (!this.touchStartX || !this.touchStartY) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    
    // Determine if user is scrolling
    if (this.isScrolling === null) {
      this.isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
    }
    
    // Cancel long press on move
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      clearTimeout(this.longPressTimer);
    }
    
    // Handle pinch gestures
    if (e.touches.length === 2) {
      this.handlePinchMove(e);
    }
    
    // Prevent scrolling if needed
    if (this.options.preventScroll && !this.isScrolling) {
      e.preventDefault();
    }
  }
  
  handleTouchEnd(e) {
    clearTimeout(this.longPressTimer);
    
    const touch = e.changedTouches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;
    
    // Calculate swipe distance and velocity
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / touchDuration;
    
    // Detect swipe gestures
    if (distance > this.options.swipeThreshold && velocity > this.options.swipeVelocity) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.triggerCallback('onSwipeRight', { deltaX, deltaY, velocity });
        } else {
          this.triggerCallback('onSwipeLeft', { deltaX, deltaY, velocity });
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.triggerCallback('onSwipeDown', { deltaX, deltaY, velocity });
        } else {
          this.triggerCallback('onSwipeUp', { deltaX, deltaY, velocity });
        }
      }
    } 
    // Detect tap gestures
    else if (distance < 10 && touchDuration < this.options.tapDelay) {
      // Check for double tap
      if (touchEndTime - this.lastTapTime < this.options.doubleTapDelay) {
        this.triggerCallback('onDoubleTap', {
          x: this.touchEndX,
          y: this.touchEndY,
          target: e.target
        });
        this.lastTapTime = 0;
      } else {
        this.triggerCallback('onTap', {
          x: this.touchEndX,
          y: this.touchEndY,
          target: e.target
        });
        this.lastTapTime = touchEndTime;
      }
    }
    
    // Reset values
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isScrolling = null;
  }
  
  handleTouchCancel() {
    clearTimeout(this.longPressTimer);
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isScrolling = null;
  }
  
  handlePinchStart(e) {
    if (e.touches.length !== 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    this.initialPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  }
  
  handlePinchMove(e) {
    if (e.touches.length !== 2 || !this.initialPinchDistance) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    const scale = currentDistance / this.initialPinchDistance;
    
    if (this.callbacks.onPinch) {
      this.callbacks.onPinch({ scale });
    }
    
    if (scale > 1.1 && this.callbacks.onPinchOut) {
      this.callbacks.onPinchOut({ scale });
    } else if (scale < 0.9 && this.callbacks.onPinchIn) {
      this.callbacks.onPinchIn({ scale });
    }
  }
  
  triggerCallback(callbackName, data) {
    const callback = this.callbacks[callbackName];
    if (callback && typeof callback === 'function') {
      callback(data);
    }
  }
  
  destroy() {
    if (!this.element) return;
    
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    
    clearTimeout(this.longPressTimer);
  }
}

// Factory function for easy use
export function enableTouchGestures(element, options) {
  return new TouchGestureHandler(element, options);
}

// React hook for touch gestures
export function useTouchGestures(ref, options) {
  const [gestureHandler, setGestureHandler] = React.useState(null);
  
  React.useEffect(() => {
    if (ref.current) {
      const handler = new TouchGestureHandler(ref.current, options);
      setGestureHandler(handler);
      
      return () => {
        handler.destroy();
      };
    }
  }, [ref, options]);
  
  return gestureHandler;
}

export default TouchGestureHandler;