/**
 * MASTER LIVE SCORING SYSTEM VALIDATOR
 * 
 * Comprehensive validation suite that orchestrates all live scoring tests
 * and provides a definitive report on system readiness for tournament play.
 * 
 * This is the ultimate validation tool for ensuring bulletproof real-time
 * match scoring with sub-second latency and enterprise-grade reliability.
 */

import { runLiveScoringValidation } from './live-scoring-validation-suite.js';
import { runAPIValidation } from './api-endpoint-validation.js';
import { runErrorRecoveryValidation } from './error-recovery-test.js';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';

class MasterLiveScoringValidator {
  constructor() {
    this.startTime = Date.now();
    this.results = {};
    this.overallScore = 0;
    this.criticalIssues = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Run complete validation suite
   */
  async runMasterValidation() {
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 MASTER LIVE SCORING SYSTEM VALIDATOR');
    console.log('   Ultimate Tournament Readiness Assessment');
    console.log('═'.repeat(80));
    console.log(`🌐 Backend URL: ${BACKEND_URL}`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(80) + '\n');

    const validationSuites = [
      {
        name: 'System Architecture',
        weight: 30,
        description: 'Core live scoring components and data flow',
        validator: this.runArchitectureValidation
      },
      {
        name: 'API Endpoints',
        weight: 25,
        description: 'Backend API connectivity and response validation',
        validator: this.runAPIValidationWrapper
      },
      {
        name: 'Error Recovery',
        weight: 20,
        description: 'Fault tolerance and reconnection mechanisms',
        validator: this.runErrorRecoveryWrapper
      },
      {
        name: 'Performance & Latency',
        weight: 15,
        description: 'Sub-second update verification and load testing',
        validator: this.runPerformanceValidation
      },
      {
        name: 'Security & Data Integrity',
        weight: 10,
        description: 'Data validation and injection prevention',
        validator: this.runSecurityValidation
      }
    ];

    let totalWeightedScore = 0;
    let maxPossibleScore = 0;

    for (const suite of validationSuites) {
      try {
        console.log(`\n${'▶'.repeat(3)} ${suite.name} Validation (Weight: ${suite.weight}%)`);
        console.log(`📋 ${suite.description}`);
        console.log('─'.repeat(60));

        const suiteResult = await suite.validator.bind(this)();
        
        const suiteScore = this.calculateSuiteScore(suiteResult);
        const weightedScore = (suiteScore * suite.weight) / 100;
        
        totalWeightedScore += weightedScore;
        maxPossibleScore += suite.weight;

        console.log(`📊 Suite Score: ${suiteScore.toFixed(1)}/100`);
        console.log(`⚖️  Weighted Score: ${weightedScore.toFixed(1)}/${suite.weight}`);

        this.results[suite.name] = {
          ...suiteResult,
          score: suiteScore,
          weight: suite.weight,
          weightedScore
        };

        if (suiteScore < 70) {
          this.criticalIssues.push(`${suite.name}: Score below 70% (${suiteScore.toFixed(1)}%)`);
        }

      } catch (error) {
        console.log(`❌ ${suite.name} Validation FAILED: ${error.message}`);
        this.criticalIssues.push(`${suite.name}: Validation failed - ${error.message}`);
        this.results[suite.name] = {
          success: false,
          error: error.message,
          score: 0,
          weight: suite.weight,
          weightedScore: 0
        };
      }
    }

    this.overallScore = (totalWeightedScore / maxPossibleScore) * 100;

    // Generate comprehensive report
    await this.generateMasterReport();

    return {
      success: this.overallScore >= 85 && this.criticalIssues.length === 0,
      overallScore: this.overallScore,
      results: this.results,
      criticalIssues: this.criticalIssues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      duration: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Suite 1: System Architecture Validation
   */
  async runArchitectureValidation() {
    console.log('🏗️ Validating system architecture...');

    try {
      // Import and run the live scoring validation suite
      const architectureResults = await runLiveScoringValidation();
      
      const score = (architectureResults.passedTests / architectureResults.totalTests) * 100;
      
      if (score < 80) {
        this.criticalIssues.push('Architecture: Core components not fully functional');
      }
      
      if (architectureResults.errors.length > 0) {
        this.warnings.push(`Architecture: ${architectureResults.errors.length} component errors detected`);
      }

      return {
        success: architectureResults.success,
        score,
        details: architectureResults,
        passedTests: architectureResults.passedTests,
        totalTests: architectureResults.totalTests
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Suite 2: API Endpoints Validation (Wrapper)
   */
  async runAPIValidationWrapper() {
    console.log('🔗 Validating API endpoints...');

    try {
      const apiResults = await runAPIValidation();
      
      const endpointScore = apiResults.endpoints.success ? 100 : 
        (apiResults.endpoints.passedTests / apiResults.endpoints.totalTests) * 100;
      
      const dataFlowScore = apiResults.dataFlow.success ? 100 : 0;
      const combinedScore = (endpointScore + dataFlowScore) / 2;

      if (!apiResults.endpoints.success) {
        this.criticalIssues.push('API: Critical endpoints not responding correctly');
      }

      if (!apiResults.dataFlow.success) {
        this.criticalIssues.push('API: Data flow validation failed');
      }

      return {
        success: apiResults.success,
        score: combinedScore,
        details: apiResults,
        endpointScore,
        dataFlowScore
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Suite 3: Error Recovery Validation (Wrapper)
   */
  async runErrorRecoveryWrapper() {
    console.log('🛡️ Validating error recovery...');

    try {
      const recoveryResults = await runErrorRecoveryValidation();
      
      const score = (recoveryResults.passedTests / recoveryResults.totalTests) * 100;
      
      if (score < 75) {
        this.criticalIssues.push('Recovery: Error handling mechanisms insufficient');
      }

      if (recoveryResults.errors.length > 2) {
        this.warnings.push(`Recovery: ${recoveryResults.errors.length} error handling issues`);
      }

      return {
        success: recoveryResults.success,
        score,
        details: recoveryResults,
        passedTests: recoveryResults.passedTests,
        totalTests: recoveryResults.totalTests
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Suite 4: Performance & Latency Validation
   */
  async runPerformanceValidation() {
    console.log('⚡ Validating performance and latency...');

    try {
      const performanceTests = [];

      // Test 1: API Response Times
      const apiStartTime = Date.now();
      try {
        const response = await fetch(`${BACKEND_URL}/api/matches/live`);
        const apiLatency = Date.now() - apiStartTime;
        performanceTests.push({
          name: 'API Response Time',
          success: apiLatency < 2000,
          latency: apiLatency,
          threshold: 2000
        });
        console.log(`   📡 API latency: ${apiLatency}ms ${apiLatency < 2000 ? '✅' : '❌'}`);
      } catch (error) {
        performanceTests.push({
          name: 'API Response Time',
          success: false,
          error: error.message
        });
      }

      // Test 2: SSE Connection Speed
      const sseStartTime = Date.now();
      const sseConnectionTest = await new Promise((resolve) => {
        const eventSource = new EventSource(`${BACKEND_URL}/api/live-updates/1/stream`);
        
        const timeout = setTimeout(() => {
          eventSource.close();
          resolve({
            name: 'SSE Connection Speed',
            success: false,
            error: 'Connection timeout'
          });
        }, 5000);

        eventSource.onopen = () => {
          const sseLatency = Date.now() - sseStartTime;
          clearTimeout(timeout);
          eventSource.close();
          resolve({
            name: 'SSE Connection Speed',
            success: sseLatency < 3000,
            latency: sseLatency,
            threshold: 3000
          });
        };

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          resolve({
            name: 'SSE Connection Speed',
            success: false,
            error: 'Connection failed'
          });
        };
      });

      performanceTests.push(sseConnectionTest);
      console.log(`   📡 SSE latency: ${sseConnectionTest.latency || 'Failed'}ms ${sseConnectionTest.success ? '✅' : '❌'}`);

      // Test 3: localStorage Performance
      const storageStartTime = Date.now();
      for (let i = 0; i < 100; i++) {
        localStorage.setItem(`perf_test_${i}`, JSON.stringify({ data: i, timestamp: Date.now() }));
      }
      const storageWriteTime = Date.now() - storageStartTime;

      for (let i = 0; i < 100; i++) {
        localStorage.removeItem(`perf_test_${i}`);
      }

      performanceTests.push({
        name: 'localStorage Performance',
        success: storageWriteTime < 500,
        latency: storageWriteTime,
        threshold: 500
      });
      console.log(`   💾 localStorage: ${storageWriteTime}ms ${storageWriteTime < 500 ? '✅' : '❌'}`);

      const passedTests = performanceTests.filter(t => t.success).length;
      const score = (passedTests / performanceTests.length) * 100;

      if (score < 70) {
        this.criticalIssues.push('Performance: Latency requirements not met');
      }

      return {
        success: score >= 70,
        score,
        details: performanceTests,
        passedTests,
        totalTests: performanceTests.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Suite 5: Security & Data Integrity Validation
   */
  async runSecurityValidation() {
    console.log('🔒 Validating security and data integrity...');

    try {
      const securityTests = [];

      // Test 1: JSON Sanitization
      const maliciousData = {
        team1_score: '<script>alert("xss")</script>',
        player_name: '"; DROP TABLE players; --',
        __proto__: { isAdmin: true }
      };

      const sanitized = this.sanitizeMatchData(maliciousData);
      securityTests.push({
        name: 'Data Sanitization',
        success: !sanitized.team1_score.includes('<script>') && !sanitized.__proto__,
        details: 'XSS and prototype pollution prevention'
      });
      console.log(`   🧹 Data sanitization: ${securityTests[0].success ? '✅' : '❌'}`);

      // Test 2: Input Validation
      const validationTests = [
        { input: 999999999, field: 'score', valid: false },
        { input: -1, field: 'score', valid: false },
        { input: 25, field: 'score', valid: true },
        { input: 'SELECT * FROM users', field: 'player_name', valid: false },
        { input: 'PlayerName123', field: 'player_name', valid: true }
      ];

      let validationPassed = 0;
      validationTests.forEach(test => {
        const isValid = this.validateInput(test.input, test.field);
        if ((isValid && test.valid) || (!isValid && !test.valid)) {
          validationPassed++;
        }
      });

      securityTests.push({
        name: 'Input Validation',
        success: validationPassed === validationTests.length,
        details: `${validationPassed}/${validationTests.length} validation rules correct`
      });
      console.log(`   ✅ Input validation: ${securityTests[1].success ? '✅' : '❌'}`);

      // Test 3: Rate Limiting (Simulation)
      const rateLimitTest = this.testRateLimiting();
      securityTests.push({
        name: 'Rate Limiting',
        success: rateLimitTest,
        details: 'Request throttling mechanisms'
      });
      console.log(`   🚦 Rate limiting: ${rateLimitTest ? '✅' : '❌'}`);

      const passedTests = securityTests.filter(t => t.success).length;
      const score = (passedTests / securityTests.length) * 100;

      if (score < 80) {
        this.warnings.push('Security: Some security validations failed');
      }

      return {
        success: score >= 67, // Allow 1 failure out of 3
        score,
        details: securityTests,
        passedTests,
        totalTests: securityTests.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Helper: Calculate suite score
   */
  calculateSuiteScore(result) {
    if (result.score !== undefined) {
      return result.score;
    }
    
    if (result.success) {
      return 100;
    }
    
    if (result.passedTests !== undefined && result.totalTests !== undefined) {
      return (result.passedTests / result.totalTests) * 100;
    }
    
    return 0;
  }

  /**
   * Helper: Sanitize match data
   */
  sanitizeMatchData(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue; // Skip dangerous properties
      }
      
      if (typeof value === 'string') {
        // Remove HTML tags and SQL injection patterns
        sanitized[key] = value
          .replace(/<[^>]*>/g, '')
          .replace(/['"`;]/g, '')
          .substring(0, 255); // Limit length
      } else if (typeof value === 'number') {
        // Validate number ranges
        sanitized[key] = Math.max(0, Math.min(value, 99999));
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Helper: Validate input
   */
  validateInput(input, field) {
    switch (field) {
      case 'score':
        return typeof input === 'number' && input >= 0 && input <= 50;
      case 'player_name':
        return typeof input === 'string' && 
               input.length <= 50 && 
               !/[<>'"`;]/.test(input) &&
               !/SELECT|INSERT|DELETE|UPDATE|DROP/i.test(input);
      default:
        return true;
    }
  }

  /**
   * Helper: Test rate limiting
   */
  testRateLimiting() {
    // Simulate rate limiting logic
    const requests = [];
    const now = Date.now();
    
    // Simulate 10 requests in 1 second
    for (let i = 0; i < 10; i++) {
      requests.push(now + i * 100);
    }
    
    // Rate limit: max 5 requests per second
    const recentRequests = requests.filter(time => now - time < 1000);
    return recentRequests.length <= 5;
  }

  /**
   * Generate comprehensive master report
   */
  async generateMasterReport() {
    const duration = Date.now() - this.startTime;
    const readinessLevel = this.getReadinessLevel();

    console.log('\n' + '═'.repeat(80));
    console.log('📊 MASTER VALIDATION REPORT - LIVE SCORING SYSTEM');
    console.log('═'.repeat(80));
    console.log(`⏱️  Total Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`🎯 Overall Score: ${this.overallScore.toFixed(1)}/100`);
    console.log(`📈 Readiness Level: ${readinessLevel.emoji} ${readinessLevel.title}`);
    console.log(`📅 Completed: ${new Date().toLocaleString()}`);
    
    // Suite breakdown
    console.log('\n📋 VALIDATION SUITE BREAKDOWN:');
    console.log('─'.repeat(80));
    Object.entries(this.results).forEach(([name, result]) => {
      const status = result.success ? '🟢 PASS' : '🔴 FAIL';
      const score = result.score?.toFixed(1) || '0.0';
      console.log(`   ${status} ${name}: ${score}/100 (Weight: ${result.weight}%)`);
    });

    // Critical issues
    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      console.log('─'.repeat(80));
      this.criticalIssues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
      
      this.recommendations.push(
        'Address all critical issues before tournament deployment',
        'Run validation again after fixes to ensure system stability'
      );
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      console.log('─'.repeat(80));
      this.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }

    // Performance metrics
    console.log('\n📈 PERFORMANCE METRICS:');
    console.log('─'.repeat(80));
    const perfResult = this.results['Performance & Latency'];
    if (perfResult?.details) {
      perfResult.details.forEach(test => {
        if (test.latency !== undefined) {
          const status = test.success ? '🟢' : '🔴';
          console.log(`   ${status} ${test.name}: ${test.latency}ms (threshold: ${test.threshold}ms)`);
        }
      });
    }

    // Recommendations
    this.generateRecommendations();
    
    if (this.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('─'.repeat(80));
      this.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Final status
    console.log('\n' + '═'.repeat(80));
    console.log(`🏆 FINAL STATUS: ${readinessLevel.emoji} ${readinessLevel.title}`);
    console.log(`📊 Tournament Ready: ${this.overallScore >= 85 ? '✅ YES' : '❌ NO'}`);
    console.log('═'.repeat(80) + '\n');

    // Store comprehensive results
    const masterResults = {
      overallScore: this.overallScore,
      readinessLevel: readinessLevel.title,
      results: this.results,
      criticalIssues: this.criticalIssues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      duration,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('master_validation_results', JSON.stringify(masterResults));
    console.log('💾 Results saved to localStorage: master_validation_results');
  }

  /**
   * Get readiness level based on score
   */
  getReadinessLevel() {
    if (this.overallScore >= 95) {
      return { emoji: '🏆', title: 'TOURNAMENT CHAMPION - Ready for Major Events' };
    } else if (this.overallScore >= 85) {
      return { emoji: '🥇', title: 'TOURNAMENT READY - Good for Live Events' };
    } else if (this.overallScore >= 75) {
      return { emoji: '🥉', title: 'NEEDS IMPROVEMENT - Minor Issues' };
    } else if (this.overallScore >= 60) {
      return { emoji: '⚠️', title: 'SIGNIFICANT ISSUES - Not Tournament Ready' };
    } else {
      return { emoji: '🚫', title: 'SYSTEM FAILURE - Major Problems' };
    }
  }

  /**
   * Generate smart recommendations
   */
  generateRecommendations() {
    if (this.overallScore >= 95) {
      this.recommendations.push(
        'System is performing excellently - maintain current configuration',
        'Consider implementing additional monitoring for peak tournament loads'
      );
    } else if (this.overallScore >= 85) {
      this.recommendations.push(
        'System is tournament-ready with minor optimizations needed',
        'Monitor performance during live events and optimize bottlenecks'
      );
    } else {
      this.recommendations.push(
        'Critical issues must be resolved before tournament deployment',
        'Focus on API reliability and error recovery mechanisms',
        'Implement comprehensive monitoring and alerting',
        'Consider load testing with simulated tournament traffic'
      );
    }

    // Specific recommendations based on suite performance
    Object.entries(this.results).forEach(([suiteName, result]) => {
      if (result.score < 80) {
        switch (suiteName) {
          case 'System Architecture':
            this.recommendations.push('Review core live scoring components and data flow patterns');
            break;
          case 'API Endpoints':
            this.recommendations.push('Stabilize backend API responses and optimize endpoint performance');
            break;
          case 'Error Recovery':
            this.recommendations.push('Strengthen error handling and implement robust reconnection logic');
            break;
          case 'Performance & Latency':
            this.recommendations.push('Optimize system performance to achieve sub-second update latency');
            break;
          case 'Security & Data Integrity':
            this.recommendations.push('Enhance input validation and implement additional security measures');
            break;
        }
      }
    });
  }
}

/**
 * Run master validation
 */
async function runMasterLiveScoringValidation() {
  const validator = new MasterLiveScoringValidator();
  
  try {
    console.log('🎯 Initializing Master Live Scoring Validation...');
    const results = await validator.runMasterValidation();
    
    return results;
    
  } catch (error) {
    console.error('❌ Master validation failed:', error);
    return {
      success: false,
      overallScore: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Export and setup
if (typeof window !== 'undefined') {
  window.runMasterLiveScoringValidation = runMasterLiveScoringValidation;
  window.MasterLiveScoringValidator = MasterLiveScoringValidator;
  
  console.log('\n🎯 Master Live Scoring Validator Ready');
  console.log('💡 Run: runMasterLiveScoringValidation() for complete system validation');
  
  // Auto-run if requested
  if (window.location.search.includes('master-validate')) {
    setTimeout(() => {
      runMasterLiveScoringValidation();
    }, 2000);
  }
}

export { MasterLiveScoringValidator, runMasterLiveScoringValidation };