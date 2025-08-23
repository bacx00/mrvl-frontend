# Real-Time User Profile Update Test Suite

This comprehensive test suite validates the real-time functionality of the user profile system, ensuring that activity stats, live indicators, and WebSocket/polling mechanisms work correctly.

## 🎯 Test Coverage

### 1. Real-Time Profile Updates (`realtime-profile-update-test.js`)
**Comprehensive end-to-end testing of profile update functionality**

- ✅ **30-Second Polling Mechanism**: Verifies automatic stats updates every 30 seconds
- ✅ **Activity Context Triggers**: Tests immediate updates when users post/comment
- ✅ **Live Indicators**: Validates green pulsing dot and timestamp displays
- ✅ **Multi-Client Consistency**: Ensures data sync across multiple browser tabs
- ✅ **Performance Under Load**: Tests system behavior under rapid user actions

### 2. WebSocket Communication (`websocket-profile-test.js`)
**Tests real-time WebSocket connections and fallback mechanisms**

- 🌐 **WebSocket Connection**: Verifies WebSocket server connectivity
- 🔄 **Polling Fallback**: Tests HTTP polling when WebSocket unavailable
- 👥 **Multi-Client Sync**: Validates data consistency across WebSocket clients
- 💪 **Connection Resilience**: Tests reconnection and error recovery

### 3. Live Visual Indicators (`profile-live-indicator-test.js`)
**Focused testing of UI/UX real-time elements**

- 🎨 **Green Pulsing Indicator**: Verifies animated live status dot
- ⏰ **Timestamp Updates**: Tests "Updated: HH:MM:SS" automatic refresh
- ✨ **CSS Animations**: Validates visual animation states
- 📱 **Responsive Design**: Tests indicators across device sizes

### 4. Manual Interactive Testing (`manual-profile-test.js`)
**Guided manual testing with browser automation assistance**

- 🔍 **Visual Inspection**: Open browser for manual verification
- 📋 **Step-by-Step Guide**: Interactive testing instructions
- 🛠️ **DevTools Integration**: Console monitoring for debug info
- 👁️ **Real-Time Observation**: Watch updates happen live

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Frontend running on `http://localhost:3000`
- API server running on `http://localhost:8000`
- Test user credentials configured

### Installation & Setup
```bash
# Install dependencies (if not already installed)
npm install puppeteer ws axios --save-dev --legacy-peer-deps

# Run setup script
node setup-profile-tests.js

# Or run individual tests
npm run test:profile-realtime    # All tests
npm run test:profile-manual      # Interactive manual testing
npm run test:profile-websocket   # WebSocket-specific tests
npm run test:profile-indicators  # Live indicator tests only
```

## 🎮 Running Tests

### Complete Test Suite (Recommended)
```bash
npm run test:profile-realtime
```
**Duration**: ~3-5 minutes  
**Output**: Comprehensive HTML + JSON reports

### Individual Test Components
```bash
# WebSocket and networking tests
npm run test:profile-websocket

# Visual indicator tests
npm run test:profile-indicators

# Manual verification (interactive)
npm run test:profile-manual
```

## 📊 Understanding Test Results

### Test Report Files
- `profile-realtime-test-report-[timestamp].html` - Human-readable results
- `profile-realtime-test-report-[timestamp].json` - Detailed technical data
- `websocket-profile-test-report-[timestamp].json` - WebSocket-specific results

### Success Criteria
- ✅ **Polling Mechanism**: API calls every 28-32 seconds
- ✅ **Activity Triggers**: Stats update within 2-5 seconds of user actions
- ✅ **Live Indicators**: Green dot visible and pulsing
- ✅ **Timestamp Updates**: "Updated:" time changes every 30 seconds
- ✅ **Multi-Client Sync**: Same data across multiple browser tabs

## 🔧 Test Scenarios

### Scenario 1: Basic Real-Time Updates
1. Navigate to profile page
2. Observe initial stats and timestamp
3. Wait 35 seconds
4. Verify timestamp updated
5. Confirm stats refreshed via API call

### Scenario 2: Activity Context Triggers
1. Open profile page in tab 1
2. Open forum/news page in tab 2
3. Create post/comment in tab 2
4. Switch to tab 1
5. Verify stats updated immediately

### Scenario 3: Visual Indicators
1. Check for green pulsing dot
2. Verify "Live updates every 30 seconds" text
3. Monitor timestamp format and updates
4. Test across different screen sizes

### Scenario 4: WebSocket Fallback
1. Test WebSocket connection availability
2. If WebSocket fails, verify HTTP polling works
3. Confirm 30-second poll intervals
4. Test multi-client data consistency

## 🔍 Debugging Failed Tests

### Common Issues & Solutions

#### ❌ Login Failed
- **Cause**: Invalid test credentials or auth system changes
- **Solution**: Update credentials in `.env.test` or test script

#### ❌ No Live Indicators Found
- **Cause**: CSS classes changed or elements not rendered
- **Solution**: Check UserProfile.js component for indicator elements

#### ❌ Polling Not Working
- **Cause**: API endpoints changed or network issues  
- **Solution**: Verify `/api/users/{id}/stats` endpoint availability

#### ❌ WebSocket Connection Failed
- **Cause**: WebSocket server not running or wrong URL
- **Solution**: Check WebSocket server and update `WEBSOCKET_URL`

#### ❌ Activity Triggers Not Firing
- **Cause**: ActivityStatsContext not triggering updates
- **Solution**: Check forum/comment submission triggers `triggerStatsUpdate()`

### Debug Mode
```bash
# Run with extra logging
DEBUG=true npm run test:profile-realtime

# Manual testing with DevTools
npm run test:profile-manual
```

## 📈 Performance Expectations

### Response Times
- **Profile Page Load**: < 5 seconds
- **Stats API Call**: < 2 seconds
- **Activity Trigger Update**: < 5 seconds
- **WebSocket Message**: < 1 second

### Resource Usage
- **Memory**: < 200MB heap usage during tests
- **Network**: Minimal bandwidth for polling
- **CPU**: Low usage for background updates

## 🛠️ Customizing Tests

### Environment Variables (.env.test)
```env
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000
WEBSOCKET_URL=ws://localhost:3001
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=password123
```

### Test Configuration
Modify test parameters in the respective test files:
- **Polling interval testing**: Change `monitoringDuration` 
- **Update timeouts**: Adjust `debounceDelay`
- **Performance thresholds**: Update success criteria

## 🎯 Live Scoring Engineering Features

This test suite validates critical live scoring system capabilities:

### Real-Time Data Synchronization
- **Sub-second updates** for user activity stats
- **Conflict resolution** for simultaneous updates
- **State consistency** across multiple clients

### Performance Optimization
- **Efficient polling** with 30-second intervals
- **Debounced updates** to prevent API spam
- **Connection pooling** for WebSocket clients

### Resilience & Reliability
- **Automatic fallback** from WebSocket to HTTP polling
- **Error recovery** and reconnection logic
- **Graceful degradation** when services unavailable

### User Experience
- **Visual feedback** with live indicators
- **Real-time timestamps** showing last update
- **Responsive design** across all devices

## 📞 Support

For issues with the test suite:
1. Check the generated HTML report for detailed error information
2. Review console logs during manual testing
3. Verify all prerequisites are met (servers running, credentials valid)
4. Run individual test components to isolate issues

## 🔄 Continuous Integration

To integrate with CI/CD:
```yaml
# Example GitHub Actions integration
- name: Run Profile Real-Time Tests
  run: |
    npm install
    npm run test:profile-realtime
  env:
    FRONTEND_URL: ${{ secrets.FRONTEND_URL }}
    API_URL: ${{ secrets.API_URL }}
```

The test suite provides comprehensive coverage of real-time profile functionality and generates detailed reports for tracking system performance and reliability.