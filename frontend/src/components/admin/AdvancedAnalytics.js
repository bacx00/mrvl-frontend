import React from 'react';
import ComprehensiveAnalyticsDashboard from '../analytics/ComprehensiveAnalyticsDashboard';

function AdvancedAnalytics({ api }) {
  // Legacy component - now uses the comprehensive analytics dashboard
  // Component replaced with comprehensive analytics dashboard
  return <ComprehensiveAnalyticsDashboard />;
}

// Legacy wrapper - maintain backward compatibility
AdvancedAnalytics.displayName = 'AdvancedAnalytics';

export default AdvancedAnalytics;