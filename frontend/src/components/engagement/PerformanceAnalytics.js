import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Battery, Cpu, Zap, TrendingUp, Eye, Clock, Users, MousePointer } from 'lucide-react';

// Performance Analytics Context
const PerformanceContext = createContext({
  metrics: {},
  trackEvent: () => {},
  trackUserInteraction: () => {},
  getHeatmapData: () => {},
  startPerformanceTrace: () => {},
  endPerformanceTrace: () => {}
});

export const PerformanceProvider = ({ children }) => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memoryUsage: 0,
    batteryLevel: 100,
    touchLatency: 0,
    engagementScore: 0,
    sessionDuration: 0
  });

  const [events, setEvents] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [performanceTraces, setPerformanceTraces] = useState(new Map());
  
  const fpsCounter = useRef(0);
  const lastFrameTime = useRef(0);
  const sessionStart = useRef(Date.now());
  const touchEvents = useRef([]);
  const interactionQueue = useRef([]);

  // FPS Monitoring
  useEffect(() => {
    let animationId;
    
    const measureFPS = (currentTime) => {
      if (lastFrameTime.current) {
        const delta = currentTime - lastFrameTime.current;
        const fps = Math.round(1000 / delta);
        fpsCounter.current = fps;
        
        setMetrics(prev => ({ ...prev, fps }));
      }
      
      lastFrameTime.current = currentTime;
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Memory and Battery Monitoring
  useEffect(() => {
    const updateSystemMetrics = () => {
      // Memory usage
      if (performance.memory) {
        const memoryUsage = Math.round(
          (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        );
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
      
      // Battery level
      if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
          const batteryLevel = Math.round(battery.level * 100);
          setMetrics(prev => ({ ...prev, batteryLevel }));
        });
      }
    };

    updateSystemMetrics();
    const interval = setInterval(updateSystemMetrics, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Touch Latency Tracking
  useEffect(() => {
    let touchStartTime = 0;
    
    const handleTouchStart = () => {
      touchStartTime = performance.now();
    };
    
    const handleTouchEnd = () => {
      if (touchStartTime) {
        const latency = performance.now() - touchStartTime;
        touchEvents.current.push(latency);
        
        // Keep only last 10 measurements
        if (touchEvents.current.length > 10) {
          touchEvents.current.shift();
        }
        
        const avgLatency = touchEvents.current.reduce((a, b) => a + b, 0) / touchEvents.current.length;
        setMetrics(prev => ({ ...prev, touchLatency: Math.round(avgLatency) }));
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Session Duration
  useEffect(() => {
    const updateSessionDuration = () => {
      const duration = Math.round((Date.now() - sessionStart.current) / 1000);
      setMetrics(prev => ({ ...prev, sessionDuration: duration }));
    };

    const interval = setInterval(updateSessionDuration, 1000);
    return () => clearInterval(interval);
  }, []);

  // Batch Process Interaction Events
  useEffect(() => {
    const processInteractionQueue = () => {
      if (interactionQueue.current.length > 0) {
        const interactions = interactionQueue.current.splice(0);
        
        // Calculate engagement score based on interactions
        const engagementScore = calculateEngagementScore(interactions);
        setMetrics(prev => ({ ...prev, engagementScore }));
        
        // Send to analytics service (mock)
        sendAnalyticsData(interactions);
      }
    };

    const interval = setInterval(processInteractionQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  const trackEvent = useCallback((eventName, data = {}) => {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      sessionId: sessionStart.current,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
    interactionQueue.current.push(event);
  }, []);

  const trackUserInteraction = useCallback((type, element, coordinates = null) => {
    const interaction = {
      type,
      element: element?.tagName || 'unknown',
      elementId: element?.id || null,
      elementClass: element?.className || null,
      coordinates,
      timestamp: Date.now(),
      performance: {
        fps: fpsCounter.current,
        memory: metrics.memoryUsage,
        battery: metrics.batteryLevel
      }
    };

    // Add to heatmap data if coordinates provided
    if (coordinates) {
      setHeatmapData(prev => [...prev.slice(-499), {
        x: coordinates.x,
        y: coordinates.y,
        type,
        timestamp: Date.now(),
        intensity: 1
      }]);
    }

    trackEvent('user_interaction', interaction);
  }, [metrics, trackEvent]);

  const startPerformanceTrace = useCallback((traceName) => {
    const startTime = performance.now();
    setPerformanceTraces(prev => new Map(prev.set(traceName, { startTime, endTime: null })));
    return startTime;
  }, []);

  const endPerformanceTrace = useCallback((traceName) => {
    const endTime = performance.now();
    setPerformanceTraces(prev => {
      const trace = prev.get(traceName);
      if (trace) {
        const duration = endTime - trace.startTime;
        trackEvent('performance_trace', { 
          name: traceName, 
          duration,
          startTime: trace.startTime,
          endTime
        });
        
        const newMap = new Map(prev);
        newMap.set(traceName, { ...trace, endTime, duration });
        return newMap;
      }
      return prev;
    });
  }, [trackEvent]);

  const getHeatmapData = useCallback(() => {
    // Group heatmap data by regions for better visualization
    const regions = {};
    heatmapData.forEach(point => {
      const regionX = Math.floor(point.x / 50) * 50;
      const regionY = Math.floor(point.y / 50) * 50;
      const key = `${regionX}-${regionY}`;
      
      if (!regions[key]) {
        regions[key] = { x: regionX, y: regionY, intensity: 0, count: 0 };
      }
      
      regions[key].intensity += point.intensity;
      regions[key].count += 1;
    });

    return Object.values(regions);
  }, [heatmapData]);

  return (
    <PerformanceContext.Provider value={{
      metrics,
      events: events.slice(-50), // Return last 50 events
      trackEvent,
      trackUserInteraction,
      getHeatmapData,
      startPerformanceTrace,
      endPerformanceTrace
    }}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Performance Metrics Dashboard (Dev/Admin only)
export const PerformanceMetrics = ({ isVisible = false }) => {
  const { metrics, events } = useContext(PerformanceContext);
  const [detailedView, setDetailedView] = useState(false);

  if (!isVisible) return null;

  const getPerformanceColor = (value, type) => {
    switch (type) {
      case 'fps':
        if (value >= 55) return 'text-green-600';
        if (value >= 30) return 'text-yellow-600';
        return 'text-red-600';
      case 'memory':
        if (value <= 70) return 'text-green-600';
        if (value <= 85) return 'text-yellow-600';
        return 'text-red-600';
      case 'battery':
        if (value >= 50) return 'text-green-600';
        if (value >= 20) return 'text-yellow-600';
        return 'text-red-600';
      case 'latency':
        if (value <= 16) return 'text-green-600';
        if (value <= 33) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Performance</h3>
        <button
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={() => setDetailedView(!detailedView)}
        >
          {detailedView ? 'Simple' : 'Detailed'}
        </button>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-1">
          <Zap size={12} />
          <span className={getPerformanceColor(metrics.fps, 'fps')}>
            {metrics.fps} FPS
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Cpu size={12} />
          <span className={getPerformanceColor(metrics.memoryUsage, 'memory')}>
            {metrics.memoryUsage}% RAM
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Battery size={12} />
          <span className={getPerformanceColor(metrics.batteryLevel, 'battery')}>
            {metrics.batteryLevel}%
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Clock size={12} />
          <span className={getPerformanceColor(metrics.touchLatency, 'latency')}>
            {metrics.touchLatency}ms
          </span>
        </div>
      </div>

      {detailedView && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="flex justify-between text-xs">
            <span>Session:</span>
            <span>{Math.floor(metrics.sessionDuration / 60)}m {metrics.sessionDuration % 60}s</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Engagement:</span>
            <span>{metrics.engagementScore}/100</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Events:</span>
            <span>{events.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// User Interaction Heatmap
export const InteractionHeatmap = ({ isVisible = false }) => {
  const { getHeatmapData } = useContext(PerformanceContext);
  const [heatmapVisible, setHeatmapVisible] = useState(isVisible);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!heatmapVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const heatmapData = getHeatmapData();

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw heatmap points
    heatmapData.forEach(point => {
      const intensity = Math.min(point.intensity / 10, 1);
      const radius = 25;
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${intensity * 0.4})`);
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [heatmapVisible, getHeatmapData]);

  if (!heatmapVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.6 }}
      />
      
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
        <div className="flex items-center space-x-2 mb-2">
          <Eye size={12} />
          <span>Interaction Heatmap</span>
        </div>
        <button
          className="text-xs text-blue-300 hover:text-blue-100"
          onClick={() => setHeatmapVisible(false)}
        >
          Hide
        </button>
      </div>
    </div>
  );
};

// A/B Testing Framework for Touch Interactions
export const ABTestProvider = ({ children, testConfig = {} }) => {
  const [currentVariant, setCurrentVariant] = useState(null);
  const [testResults, setTestResults] = useState({});
  const { trackEvent } = useContext(PerformanceContext);

  useEffect(() => {
    // Determine user's variant (based on user ID hash or random)
    const userId = localStorage.getItem('userId') || 'anonymous';
    const hash = simpleHash(userId);
    const variants = Object.keys(testConfig);
    
    if (variants.length > 0) {
      const variantIndex = hash % variants.length;
      const selectedVariant = variants[variantIndex];
      setCurrentVariant(selectedVariant);
      
      trackEvent('ab_test_assignment', {
        testName: testConfig.name,
        variant: selectedVariant,
        userId: userId.substring(0, 8) // Partial ID for privacy
      });
    }
  }, [testConfig, trackEvent]);

  const trackConversion = useCallback((eventName, data = {}) => {
    if (!currentVariant) return;
    
    const conversionEvent = {
      testName: testConfig.name,
      variant: currentVariant,
      event: eventName,
      data,
      timestamp: Date.now()
    };
    
    setTestResults(prev => ({
      ...prev,
      [eventName]: [...(prev[eventName] || []), conversionEvent]
    }));
    
    trackEvent('ab_test_conversion', conversionEvent);
  }, [currentVariant, testConfig.name, trackEvent]);

  const getVariantConfig = useCallback((defaultConfig = {}) => {
    if (!currentVariant || !testConfig[currentVariant]) {
      return defaultConfig;
    }
    
    return { ...defaultConfig, ...testConfig[currentVariant] };
  }, [currentVariant, testConfig]);

  return (
    <ABTestContext.Provider value={{
      currentVariant,
      testResults,
      trackConversion,
      getVariantConfig
    }}>
      {children}
    </ABTestContext.Provider>
  );
};

const ABTestContext = createContext({});

// Performance-optimized Touch Event Handler
export const useOptimizedTouchHandler = (handler, dependencies = []) => {
  const handlerRef = useRef(handler);
  const lastCallTime = useRef(0);
  const rafId = useRef(null);
  const { trackUserInteraction } = useContext(PerformanceContext);

  // Update handler reference when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, dependencies);

  const optimizedHandler = useCallback((event) => {
    const now = performance.now();
    
    // Throttle to 60fps max
    if (now - lastCallTime.current < 16.67) {
      return;
    }

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      // Track the interaction
      const touch = event.touches ? event.touches[0] : event;
      trackUserInteraction(
        event.type,
        event.target,
        touch ? { x: touch.clientX, y: touch.clientY } : null
      );

      // Execute the actual handler
      handlerRef.current(event);
      lastCallTime.current = now;
    });
  }, [trackUserInteraction]);

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return optimizedHandler;
};

// Battery Usage Optimization Hook
export const useBatteryOptimization = () => {
  const [batteryInfo, setBatteryInfo] = useState(null);
  const [optimizationLevel, setOptimizationLevel] = useState('normal');

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryInfo({
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        });

        // Set optimization level based on battery
        if (battery.level < 0.2 && !battery.charging) {
          setOptimizationLevel('aggressive');
        } else if (battery.level < 0.5 && !battery.charging) {
          setOptimizationLevel('moderate');
        } else {
          setOptimizationLevel('normal');
        }

        // Listen for battery changes
        const updateBattery = () => {
          setBatteryInfo({
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          });
        };

        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);

        return () => {
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingchange', updateBattery);
        };
      });
    }
  }, []);

  const getOptimizationSettings = useCallback(() => {
    switch (optimizationLevel) {
      case 'aggressive':
        return {
          animationsEnabled: false,
          hapticEnabled: false,
          autoRefresh: false,
          imageQuality: 'low',
          particleEffects: false
        };
      case 'moderate':
        return {
          animationsEnabled: true,
          hapticEnabled: false,
          autoRefresh: false,
          imageQuality: 'medium',
          particleEffects: false
        };
      default:
        return {
          animationsEnabled: true,
          hapticEnabled: true,
          autoRefresh: true,
          imageQuality: 'high',
          particleEffects: true
        };
    }
  }, [optimizationLevel]);

  return {
    batteryInfo,
    optimizationLevel,
    optimizationSettings: getOptimizationSettings()
  };
};

// Helper Functions
const calculateEngagementScore = (interactions) => {
  if (!interactions.length) return 0;
  
  const weights = {
    'user_interaction': 1,
    'achievement_unlock': 10,
    'social_interaction': 5,
    'game_action': 3,
    'navigation': 1
  };
  
  const score = interactions.reduce((total, interaction) => {
    const weight = weights[interaction.name] || 1;
    return total + weight;
  }, 0);
  
  return Math.min(Math.round(score / interactions.length * 10), 100);
};

const sendAnalyticsData = (data) => {
  // Mock analytics service - replace with actual implementation
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Data:', data);
  }
  
  // Example: Send to analytics service
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
};

const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

export default {
  PerformanceProvider,
  PerformanceMetrics,
  InteractionHeatmap,
  ABTestProvider,
  useOptimizedTouchHandler,
  useBatteryOptimization,
  PerformanceContext
};