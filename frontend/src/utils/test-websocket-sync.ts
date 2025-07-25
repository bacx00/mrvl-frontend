// WebSocket Synchronization Test Utility
// Use this to verify frontend-backend event synchronization

import pusherManager from '@/lib/pusher';
import { WEBSOCKET_EVENTS, CHANNEL_PATTERNS } from '@/config/websocket-events';

export class WebSocketSyncTester {
  private testResults: Map<string, boolean> = new Map();
  private channel: any = null;
  private matchId: string;
  private timeoutMs: number = 5000;

  constructor(matchId: string) {
    this.matchId = matchId;
  }

  // Test all match events
  async testMatchEvents(): Promise<void> {
    console.log('🧪 Starting WebSocket synchronization test for match:', this.matchId);
    
    // Subscribe to match channel
    const channelName = CHANNEL_PATTERNS.MATCH(this.matchId);
    this.channel = pusherManager.subscribe(channelName);
    
    if (!this.channel) {
      console.error('❌ Failed to subscribe to channel:', channelName);
      return;
    }

    console.log('✅ Subscribed to channel:', channelName);

    // Set up event listeners with timeout
    const eventTests = Object.entries(WEBSOCKET_EVENTS).map(([key, eventName]) => {
      return this.testEvent(eventName);
    });

    // Also test for any unhandled events
    this.channel.bind_global((eventName: string, data: any) => {
      console.log('📨 Received event:', eventName, data);
      
      // Check if this event is in our known events
      const isKnownEvent = Object.values(WEBSOCKET_EVENTS).includes(eventName);
      if (!isKnownEvent && !eventName.startsWith('pusher:')) {
        console.warn('⚠️ Unknown event received:', eventName);
      }
    });

    // Wait for all tests with timeout
    await Promise.race([
      Promise.all(eventTests),
      new Promise(resolve => setTimeout(resolve, this.timeoutMs * 2))
    ]);

    this.printResults();
  }

  private testEvent(eventName: string): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.testResults.set(eventName, false);
        console.log(`⏱️ Timeout waiting for event: ${eventName}`);
        resolve();
      }, this.timeoutMs);

      this.channel.bind(eventName, (data: any) => {
        clearTimeout(timeout);
        this.testResults.set(eventName, true);
        console.log(`✅ Event received: ${eventName}`, data);
        resolve();
      });
    });
  }

  private printResults(): void {
    console.log('\n📊 WebSocket Synchronization Test Results:');
    console.log('=========================================');
    
    const working: string[] = [];
    const notWorking: string[] = [];
    
    this.testResults.forEach((success, eventName) => {
      if (success) {
        working.push(eventName);
      } else {
        notWorking.push(eventName);
      }
    });

    if (working.length > 0) {
      console.log('\n✅ Working Events:');
      working.forEach(event => console.log(`  - ${event}`));
    }

    if (notWorking.length > 0) {
      console.log('\n❌ Not Detected Events (may not be triggered during test):');
      notWorking.forEach(event => console.log(`  - ${event}`));
    }

    console.log('\n📝 Summary:');
    console.log(`  Total events tested: ${this.testResults.size}`);
    console.log(`  Working: ${working.length}`);
    console.log(`  Not detected: ${notWorking.length}`);
  }

  cleanup(): void {
    if (this.channel) {
      this.channel.unbind_all();
      pusherManager.unsubscribe(CHANNEL_PATTERNS.MATCH(this.matchId));
    }
  }
}

// Manual trigger test functions (call from backend or admin panel)
export const triggerTestEvents = async (matchId: string) => {
  const testData = {
    match_id: matchId,
    test: true,
    timestamp: new Date().toISOString()
  };

  console.log('🚀 Triggering test events for match:', matchId);
  
  // These would normally be triggered from the backend
  // Log what backend endpoints should be called
  console.log('\n📋 Backend endpoints to test:');
  console.log('POST /api/matches/' + matchId + '/start');
  console.log('POST /api/matches/' + matchId + '/pause');
  console.log('POST /api/matches/' + matchId + '/resume');
  console.log('POST /api/matches/' + matchId + '/maps/1/start');
  console.log('POST /api/matches/' + matchId + '/maps/1/end');
  console.log('POST /api/matches/' + matchId + '/hero-update');
  console.log('POST /api/matches/' + matchId + '/kill-event');
  console.log('POST /api/matches/' + matchId + '/objective-update');
};

// Usage example:
// const tester = new WebSocketSyncTester('123');
// await tester.testMatchEvents();
// tester.cleanup();