import React, { useState, useEffect } from 'react';
import { 
  Monitor, Smartphone, Wifi, Memory, Gauge, Settings, 
  TrendingUp, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Zap, Database, Activity
} from 'lucide-react';
import { useMobileOptimization, useDeviceCapabilities, useAdaptiveLoading } from '../../hooks/useMobileOptimization';
import { hapticFeedback } from './MobileGestures';

// Performance grade indicator
const PerformanceGrade = ({ grade, metrics }) => {
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-500 bg-green-50 border-green-200';
      case 'B': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'F': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  if (!grade) {
    return (
      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
        <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-600">Measuring...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getGradeColor(grade)}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-current">
        <span className="text-xl font-bold">{grade}</span>
      </div>
      <div>
        <div className="font-semibold">Performance Grade</div>
        <div className="text-sm opacity-80">
          {metrics.fcp && `FCP: ${Math.round(metrics.fcp)}ms`}
          {metrics.lcp && ` • LCP: ${Math.round(metrics.lcp)}ms`}
        </div>
      </div>
    </div>
  );
};

// Connection quality indicator
const ConnectionIndicator = ({ connectionInfo }) => {
  const getConnectionDetails = (effectiveType, downlink, saveData) => {
    const types = {
      'slow-2g': { label: 'Slow 2G', color: 'red', icon: '📶' },
      '2g': { label: '2G', color: 'orange', icon: '📶' },
      '3g': { label: '3G', color: 'yellow', icon: '📶' },
      '4g': { label: '4G', color: 'green', icon: '📶' }
    };

    return types[effectiveType] || { label: 'Unknown', color: 'gray', icon: '📶' };
  };

  const connection = getConnectionDetails(
    connectionInfo.effectiveType, 
    connectionInfo.downlink, 
    connectionInfo.saveData
  );

  return (
    <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 bg-white">
      <Wifi className={`w-5 h-5 text-${connection.color}-500`} />
      <div>
        <div className="font-medium text-gray-900">{connection.label}</div>
        <div className="text-sm text-gray-600">
          {connectionInfo.downlink && `${connectionInfo.downlink} Mbps`}
          {connectionInfo.saveData && ' • Data Saver'}
        </div>
      </div>
    </div>
  );
};

// Memory usage indicator
const MemoryIndicator = ({ memoryInfo }) => {
  if (!memoryInfo) return null;

  const { used, total, usagePercent } = memoryInfo;
  const getMemoryColor = (percent) => {
    if (percent > 80) return 'red';
    if (percent > 60) return 'yellow';
    return 'green';
  };

  const color = getMemoryColor(usagePercent);

  return (
    <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 bg-white">
      <Memory className={`w-5 h-5 text-${color}-500`} />
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-900">Memory Usage</span>
          <span className="text-sm text-gray-600">{usagePercent}%</span>
        </div>
        <div className="mt-1">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className={`h-2 bg-${color}-500 rounded-full transition-all duration-300`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {used}MB / {total}MB
          </div>
        </div>
      </div>
    </div>
  );
};

// Device capabilities panel
const DeviceCapabilities = ({ capabilities }) => {
  const capabilityItems = [
    { 
      key: 'isHighEnd', 
      label: 'High-End Device', 
      icon: capabilities.isHighEnd ? CheckCircle : XCircle,
      color: capabilities.isHighEnd ? 'green' : 'gray'
    },
    { 
      key: 'supportsPWA', 
      label: 'PWA Support', 
      icon: capabilities.supportsPWA ? CheckCircle : XCircle,
      color: capabilities.supportsPWA ? 'green' : 'red'
    },
    { 
      key: 'supportsWebP', 
      label: 'WebP Images', 
      icon: capabilities.supportsWebP ? CheckCircle : XCircle,
      color: capabilities.supportsWebP ? 'green' : 'orange'
    },
    { 
      key: 'supportsHaptics', 
      label: 'Haptic Feedback', 
      icon: capabilities.supportsHaptics ? CheckCircle : XCircle,
      color: capabilities.supportsHaptics ? 'green' : 'gray'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Device Capabilities</h3>
      <div className="grid grid-cols-2 gap-3">
        {capabilityItems.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 bg-white">
            <Icon className={`w-4 h-4 text-${color}-500`} />
            <span className="text-sm text-gray-700">{label}</span>
          </div>
        ))}
      </div>
      
      {capabilities.deviceMemory && (
        <div className="text-sm text-gray-600 mt-2">
          Device Memory: {capabilities.deviceMemory}GB
        </div>
      )}
      
      {capabilities.hardwareConcurrency && (
        <div className="text-sm text-gray-600">
          CPU Cores: {capabilities.hardwareConcurrency}
        </div>
      )}
    </div>
  );
};

// Recommendations panel
const RecommendationsPanel = ({ recommendations, onOptimize }) => {
  if (recommendations.length === 0) {
    return (
      <div className="flex items-center space-x-3 p-4 rounded-lg border border-green-200 bg-green-50">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-sm text-green-800">All optimizations look good!</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Recommendations</h3>
        <button
          onClick={onOptimize}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 touch-optimized"
        >
          <Zap className="w-4 h-4" />
          <span>Optimize</span>
        </button>
      </div>
      
      {recommendations.map((rec, index) => (
        <div key={index} className={`p-3 rounded-lg border ${
          rec.type === 'error' ? 'border-red-200 bg-red-50' :
          rec.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
          'border-blue-200 bg-blue-50'
        }`}>
          <div className="flex items-start space-x-2">
            <AlertTriangle className={`w-4 h-4 mt-0.5 ${
              rec.type === 'error' ? 'text-red-500' :
              rec.type === 'warning' ? 'text-yellow-500' :
              'text-blue-500'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{rec.message}</div>
              <div className="text-xs text-gray-600 mt-1">{rec.suggestion}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main performance panel component
export const MobilePerformancePanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    optimizationStatus,
    performanceMetrics,
    connectionInfo,
    memoryInfo,
    performanceGrade,
    recommendations,
    loadingStrategy,
    forceOptimization,
    logMetrics
  } = useMobileOptimization();

  const deviceCapabilities = useDeviceCapabilities();
  const adaptiveLoading = useAdaptiveLoading();

  const handleOptimize = async () => {
    setRefreshing(true);
    hapticFeedback.medium();
    
    try {
      await forceOptimization();
      hapticFeedback.success();
    } catch (error) {
      hapticFeedback.error();
      console.error('Optimization failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light();
    logMetrics();
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'device', label: 'Device', icon: Smartphone },
    { id: 'network', label: 'Network', icon: Wifi }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance Monitor</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg text-gray-600 hover:text-gray-800 touch-optimized ${
                refreshing ? 'opacity-50' : ''
              }`}
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 touch-optimized"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors touch-optimized ${
                activeTab === tab.id
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <PerformanceGrade grade={performanceGrade} metrics={performanceMetrics} />
              <RecommendationsPanel 
                recommendations={recommendations} 
                onOptimize={handleOptimize}
              />
              {memoryInfo && <MemoryIndicator memoryInfo={memoryInfo} />}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {performanceMetrics.fcp && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="text-sm text-gray-600">First Contentful Paint</div>
                    <div className="text-lg font-semibold">{Math.round(performanceMetrics.fcp)}ms</div>
                  </div>
                )}
                {performanceMetrics.lcp && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="text-sm text-gray-600">Largest Contentful Paint</div>
                    <div className="text-lg font-semibold">{Math.round(performanceMetrics.lcp)}ms</div>
                  </div>
                )}
                {performanceMetrics.fid && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="text-sm text-gray-600">First Input Delay</div>
                    <div className="text-lg font-semibold">{Math.round(performanceMetrics.fid)}ms</div>
                  </div>
                )}
                {performanceMetrics.cls !== null && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
                    <div className="text-lg font-semibold">{performanceMetrics.cls.toFixed(3)}</div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                <h3 className="font-medium text-blue-900 mb-2">Loading Strategy</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>Image Quality: {loadingStrategy.imageQuality}</div>
                  <div>Lazy Loading: {loadingStrategy.enableLazyLoading ? 'Enabled' : 'Disabled'}</div>
                  <div>Prefetch: {loadingStrategy.enablePrefetch ? 'Enabled' : 'Disabled'}</div>
                  <div>Virtual Scrolling: {loadingStrategy.enableVirtualScrolling ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'device' && (
            <DeviceCapabilities capabilities={deviceCapabilities} />
          )}

          {activeTab === 'network' && (
            <div className="space-y-4">
              <ConnectionIndicator connectionInfo={connectionInfo} />
              
              <div className="p-4 rounded-lg border border-gray-200 bg-white">
                <h3 className="font-medium text-gray-900 mb-3">Network Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective Type:</span>
                    <span className="font-medium">{connectionInfo.effectiveType}</span>
                  </div>
                  {connectionInfo.downlink && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Downlink:</span>
                      <span className="font-medium">{connectionInfo.downlink} Mbps</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Saver:</span>
                    <span className="font-medium">{connectionInfo.saveData ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Performance debug overlay for development
export const PerformanceDebugOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { performanceGrade, performanceMetrics, memoryInfo } = useMobileOptimization();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 z-40 bg-black bg-opacity-70 text-white p-2 rounded-full touch-optimized"
      >
        <Activity className="w-5 h-5" />
      </button>

      <MobilePerformancePanel 
        isOpen={isVisible}
        onClose={() => setIsVisible(false)}
      />
    </>
  );
};

export default {
  MobilePerformancePanel,
  PerformanceDebugOverlay
};