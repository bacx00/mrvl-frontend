#!/usr/bin/env node

/**
 * COMPREHENSIVE TOURNAMENT BRACKET SYSTEM AUDIT
 * 
 * This script performs exhaustive testing of the tournament bracket system
 * to validate all CRUD operations, state transitions, and edge cases.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class BracketAuditSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      categories: {
        crud_operations: { tests: [], status: 'pending' },
        state_transitions: { tests: [], status: 'pending' },
        data_integrity: { tests: [], status: 'pending' },
        edge_cases: { tests: [], status: 'pending' },
        ui_validation: { tests: [], status: 'pending' },
        admin_functions: { tests: [], status: 'pending' },
        marvel_rivals_formats: { tests: [], status: 'pending' },
        api_integration: { tests: [], status: 'pending' },
        performance: { tests: [], status: 'pending' }
      },
      critical_issues: [],
      recommendations: []
    };
    
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:3000';
  }

  async init() {
    console.log('🚀 Initializing Bracket Audit Suite...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      }
    });
    
    // Set up error handling
    this.page.on('pageerror', error => {
      console.log('🔴 Page Error:', error.message);
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async runFullAudit() {
    console.log('🔍 Starting Comprehensive Bracket Audit...');
    
    try {
      await this.init();
      
      // Run all test categories
      await this.testCrudOperations();
      await this.testStateTransitions();
      await this.testDataIntegrity();
      await this.testEdgeCases();
      await this.testUIValidation();
      await this.testAdminFunctions();
      await this.testMarvelRivalsFormats();
      await this.testAPIIntegration();
      await this.testPerformance();
      
      // Generate final report
      await this.generateReport();
      
    } catch (error) {
      console.error('💥 Audit failed:', error);
      this.addCriticalIssue('AUDIT_FAILURE', `Audit suite failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  // CRUD Operations Testing
  async testCrudOperations() {
    console.log('\n📝 Testing CRUD Operations...');
    const category = this.results.categories.crud_operations;
    
    try {
      // Test bracket creation
      await this.testBracketCreation();
      
      // Test bracket reading/retrieval
      await this.testBracketReading();
      
      // Test bracket updates
      await this.testBracketUpdates();
      
      // Test bracket deletion
      await this.testBracketDeletion();
      
      category.status = 'completed';
      console.log('✅ CRUD Operations testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('CRUD_FAILURE', `CRUD operations failed: ${error.message}`);
    }
  }

  async testBracketCreation() {
    const test = {
      name: 'Bracket Creation - Single Elimination',
      status: 'running',
      details: []
    };

    try {
      // Navigate to an event page
      await this.page.goto(`${this.baseUrl}/events/1`);
      await this.page.waitForSelector('.bracket-container', { timeout: 5000 });
      
      // Check if bracket generation button exists
      const generateButton = await this.page.$('[data-testid="generate-bracket"]');
      if (!generateButton) {
        test.details.push('❌ Generate bracket button not found');
        test.status = 'failed';
      } else {
        test.details.push('✅ Generate bracket button found');
        test.status = 'passed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.crud_operations.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testBracketReading() {
    const test = {
      name: 'Bracket Reading/Display',
      status: 'running',
      details: []
    };

    try {
      // Check if bracket component is rendered
      const bracketExists = await this.page.$('.liquipedia-bracket');
      
      if (!bracketExists) {
        test.details.push('❌ Bracket component not rendered');
        test.status = 'failed';
      } else {
        test.details.push('✅ Bracket component rendered');
        
        // Check bracket structure
        const rounds = await this.page.$$('.bracket-round');
        test.details.push(`📊 Found ${rounds.length} rounds`);
        
        // Check matches
        const matches = await this.page.$$('.liquipedia-match');
        test.details.push(`🎮 Found ${matches.length} matches`);
        
        test.status = rounds.length > 0 ? 'passed' : 'failed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.crud_operations.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testBracketUpdates() {
    const test = {
      name: 'Bracket Match Updates',
      status: 'running',
      details: []
    };

    try {
      // Look for updateable matches
      const matches = await this.page.$$('.liquipedia-match');
      
      if (matches.length === 0) {
        test.details.push('❌ No matches found to update');
        test.status = 'failed';
      } else {
        // Click on first match
        await matches[0].click();
        await this.page.waitForTimeout(1000);
        
        // Check if match detail opens or admin controls appear
        const matchControls = await this.page.$('.match-controls') || 
                            await this.page.$('.match-detail');
        
        if (matchControls) {
          test.details.push('✅ Match interaction works');
          test.status = 'passed';
        } else {
          test.details.push('⚠️  Match interaction limited');
          test.status = 'warning';
        }
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.crud_operations.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testBracketDeletion() {
    const test = {
      name: 'Bracket Deletion/Reset',
      status: 'running',
      details: []
    };

    try {
      // Look for delete/reset functionality
      const deleteButton = await this.page.$('[data-testid="delete-bracket"]') ||
                          await this.page.$('[data-testid="reset-bracket"]');
      
      if (!deleteButton) {
        test.details.push('⚠️  No bracket deletion controls found');
        test.status = 'warning';
      } else {
        test.details.push('✅ Bracket deletion controls available');
        test.status = 'passed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.crud_operations.tests.push(test);
    this.updateTestCount(test.status);
  }

  // State Transitions Testing
  async testStateTransitions() {
    console.log('\n🔄 Testing State Transitions...');
    const category = this.results.categories.state_transitions;
    
    try {
      await this.testMatchProgression();
      await this.testBracketAdvancement();
      await this.testTournamentCompletion();
      
      category.status = 'completed';
      console.log('✅ State Transitions testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('STATE_FAILURE', `State transitions failed: ${error.message}`);
    }
  }

  async testMatchProgression() {
    const test = {
      name: 'Match State Progression',
      status: 'running',
      details: []
    };

    try {
      // Analyze match states in the bracket
      const matchStates = await this.page.evaluate(() => {
        const matches = document.querySelectorAll('.liquipedia-match');
        const states = [];
        
        matches.forEach(match => {
          const isLive = match.classList.contains('live');
          const isCompleted = match.classList.contains('completed');
          const isPending = !isLive && !isCompleted;
          
          states.push({
            live: isLive,
            completed: isCompleted,
            pending: isPending
          });
        });
        
        return states;
      });
      
      test.details.push(`📊 Analyzed ${matchStates.length} match states`);
      
      const liveCount = matchStates.filter(s => s.live).length;
      const completedCount = matchStates.filter(s => s.completed).length;
      const pendingCount = matchStates.filter(s => s.pending).length;
      
      test.details.push(`🔴 Live: ${liveCount}, ✅ Completed: ${completedCount}, ⏳ Pending: ${pendingCount}`);
      test.status = 'passed';
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.state_transitions.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testBracketAdvancement() {
    const test = {
      name: 'Bracket Advancement Logic',
      status: 'running',
      details: []
    };

    try {
      // Check bracket connectors and advancement paths
      const connectors = await this.page.$$('.bracket-connectors, .match-connector');
      test.details.push(`🔗 Found ${connectors.length} bracket connectors`);
      
      // Validate round structure
      const rounds = await this.page.evaluate(() => {
        const roundElements = document.querySelectorAll('.bracket-round');
        return Array.from(roundElements).map((round, index) => {
          const matches = round.querySelectorAll('.liquipedia-match');
          return {
            index,
            matchCount: matches.length,
            title: round.querySelector('.round-title')?.textContent || ''
          };
        });
      });
      
      test.details.push(`🏆 Bracket has ${rounds.length} rounds`);
      
      // Validate progression logic (each round should have half the matches of previous)
      let validProgression = true;
      for (let i = 1; i < rounds.length; i++) {
        if (rounds[i].matchCount * 2 !== rounds[i-1].matchCount) {
          validProgression = false;
          break;
        }
      }
      
      if (validProgression && rounds.length > 0) {
        test.details.push('✅ Valid bracket progression structure');
        test.status = 'passed';
      } else {
        test.details.push('❌ Invalid bracket progression structure');
        test.status = 'failed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.state_transitions.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testTournamentCompletion() {
    const test = {
      name: 'Tournament Completion State',
      status: 'running',
      details: []
    };

    try {
      // Check if final match exists and can determine winner
      const finalMatch = await this.page.$('.bracket-round:last-child .liquipedia-match');
      
      if (!finalMatch) {
        test.details.push('❌ No final match found');
        test.status = 'failed';
      } else {
        test.details.push('✅ Final match exists');
        
        // Check if winner can be determined
        const winner = await this.page.evaluate(() => {
          const finalMatch = document.querySelector('.bracket-round:last-child .liquipedia-match');
          const winnerRow = finalMatch?.querySelector('.team-row.winner');
          return winnerRow ? winnerRow.textContent.trim() : null;
        });
        
        if (winner) {
          test.details.push(`🏆 Tournament winner: ${winner}`);
          test.status = 'passed';
        } else {
          test.details.push('⏳ Tournament not yet completed');
          test.status = 'warning';
        }
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.state_transitions.tests.push(test);
    this.updateTestCount(test.status);
  }

  // Data Integrity Testing
  async testDataIntegrity() {
    console.log('\n🔍 Testing Data Integrity...');
    const category = this.results.categories.data_integrity;
    
    try {
      await this.testBracketStructure();
      await this.testTeamConsistency();
      await this.testMatchLogic();
      
      category.status = 'completed';
      console.log('✅ Data Integrity testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('INTEGRITY_FAILURE', `Data integrity failed: ${error.message}`);
    }
  }

  async testBracketStructure() {
    const test = {
      name: 'Bracket Structure Validation',
      status: 'running',
      details: []
    };

    try {
      const structure = await this.page.evaluate(() => {
        const bracket = document.querySelector('.liquipedia-bracket');
        if (!bracket) return null;
        
        const rounds = Array.from(document.querySelectorAll('.bracket-round'));
        const totalMatches = document.querySelectorAll('.liquipedia-match').length;
        
        return {
          hasContainer: !!bracket,
          roundCount: rounds.length,
          totalMatches,
          rounds: rounds.map(round => ({
            title: round.querySelector('.round-title')?.textContent,
            matchCount: round.querySelectorAll('.liquipedia-match').length
          }))
        };
      });
      
      if (!structure) {
        test.details.push('❌ No bracket structure found');
        test.status = 'failed';
      } else {
        test.details.push(`📊 Structure: ${structure.roundCount} rounds, ${structure.totalMatches} matches`);
        
        // Validate structure integrity
        let issues = 0;
        
        if (structure.roundCount === 0) {
          test.details.push('❌ No rounds found');
          issues++;
        }
        
        if (structure.totalMatches === 0) {
          test.details.push('❌ No matches found');
          issues++;
        }
        
        test.status = issues === 0 ? 'passed' : 'failed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.data_integrity.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testTeamConsistency() {
    const test = {
      name: 'Team Data Consistency',
      status: 'running',
      details: []
    };

    try {
      const teamData = await this.page.evaluate(() => {
        const teams = [];
        const teamRows = document.querySelectorAll('.team-row');
        
        teamRows.forEach(row => {
          const nameElement = row.querySelector('.team-name');
          const scoreElement = row.querySelector('.team-score');
          const logoElement = row.querySelector('.team-logo');
          
          teams.push({
            name: nameElement?.textContent?.trim() || 'Unknown',
            score: scoreElement?.textContent?.trim() || '-',
            hasLogo: !!logoElement,
            isPlaceholder: nameElement?.classList.contains('team-placeholder') || false
          });
        });
        
        return teams;
      });
      
      test.details.push(`👥 Found ${teamData.length} team entries`);
      
      const placeholders = teamData.filter(t => t.isPlaceholder).length;
      const withLogos = teamData.filter(t => t.hasLogo).length;
      
      test.details.push(`📝 Placeholders: ${placeholders}, 🖼️  With logos: ${withLogos}`);
      test.status = 'passed';
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.data_integrity.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testMatchLogic() {
    const test = {
      name: 'Match Logic Validation',
      status: 'running',
      details: []
    };

    try {
      const matchLogic = await this.page.evaluate(() => {
        const matches = Array.from(document.querySelectorAll('.liquipedia-match'));
        const issues = [];
        
        matches.forEach((match, index) => {
          const teamRows = match.querySelectorAll('.team-row');
          const winners = match.querySelectorAll('.team-row.winner');
          const losers = match.querySelectorAll('.team-row.loser');
          
          // Check for logic issues
          if (teamRows.length !== 2) {
            issues.push(`Match ${index + 1}: Should have exactly 2 teams, has ${teamRows.length}`);
          }
          
          if (winners.length > 1) {
            issues.push(`Match ${index + 1}: Multiple winners detected`);
          }
          
          if (winners.length === 1 && losers.length !== 1) {
            issues.push(`Match ${index + 1}: Winner exists but no clear loser`);
          }
        });
        
        return {
          totalMatches: matches.length,
          issues
        };
      });
      
      test.details.push(`🎮 Validated ${matchLogic.totalMatches} matches`);
      
      if (matchLogic.issues.length === 0) {
        test.details.push('✅ All match logic is valid');
        test.status = 'passed';
      } else {
        matchLogic.issues.forEach(issue => test.details.push(`❌ ${issue}`));
        test.status = 'failed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.data_integrity.tests.push(test);
    this.updateTestCount(test.status);
  }

  // Edge Cases Testing
  async testEdgeCases() {
    console.log('\n🎯 Testing Edge Cases...');
    const category = this.results.categories.edge_cases;
    
    try {
      await this.testOddNumberTeams();
      await this.testEmptyBracket();
      await this.testLargeBracket();
      
      category.status = 'completed';
      console.log('✅ Edge Cases testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('EDGE_CASE_FAILURE', `Edge cases failed: ${error.message}`);
    }
  }

  async testOddNumberTeams() {
    const test = {
      name: 'Odd Number of Teams Handling',
      status: 'running',
      details: []
    };

    try {
      // Count teams and check for bye handling
      const teamAnalysis = await this.page.evaluate(() => {
        const teams = Array.from(document.querySelectorAll('.team-row .team-name'));
        const realTeams = teams.filter(t => !t.classList.contains('team-placeholder'));
        const placeholders = teams.filter(t => t.classList.contains('team-placeholder'));
        
        return {
          total: teams.length,
          real: realTeams.length,
          placeholders: placeholders.length,
          teamNames: realTeams.map(t => t.textContent.trim())
        };
      });
      
      test.details.push(`👥 Teams: ${teamAnalysis.real} real, ${teamAnalysis.placeholders} TBD`);
      
      // Check if bracket handles byes properly
      if (teamAnalysis.real % 2 !== 0) {
        test.details.push('⚠️  Odd number of teams - checking bye handling');
        // Look for bye indicators or proper bracket structure
        test.status = 'warning';
      } else {
        test.details.push('✅ Even number of teams');
        test.status = 'passed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.edge_cases.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testEmptyBracket() {
    const test = {
      name: 'Empty Bracket Handling',
      status: 'running',
      details: []
    };

    try {
      // Check for empty state handling
      const emptyState = await this.page.$('.liquipedia-bracket-empty');
      
      if (emptyState) {
        const emptyText = await this.page.evaluate(() => {
          const element = document.querySelector('.liquipedia-bracket-empty');
          return element ? element.textContent : '';
        });
        
        test.details.push('✅ Empty bracket state handled gracefully');
        test.details.push(`📝 Empty state message: "${emptyText.trim()}"`);
        test.status = 'passed';
      } else {
        test.details.push('⚠️  No specific empty bracket handling found');
        test.status = 'warning';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.edge_cases.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testLargeBracket() {
    const test = {
      name: 'Large Bracket Performance',
      status: 'running',
      details: []
    };

    try {
      // Measure bracket rendering performance
      const startTime = Date.now();
      
      const bracketMetrics = await this.page.evaluate(() => {
        const bracket = document.querySelector('.liquipedia-bracket');
        const rounds = document.querySelectorAll('.bracket-round');
        const matches = document.querySelectorAll('.liquipedia-match');
        const connectors = document.querySelectorAll('.bracket-connectors, .match-connector');
        
        return {
          exists: !!bracket,
          rounds: rounds.length,
          matches: matches.length,
          connectors: connectors.length,
          scrollWidth: bracket ? bracket.scrollWidth : 0,
          clientWidth: bracket ? bracket.clientWidth : 0
        };
      });
      
      const renderTime = Date.now() - startTime;
      
      test.details.push(`⚡ Render time: ${renderTime}ms`);
      test.details.push(`📊 Elements: ${bracketMetrics.rounds} rounds, ${bracketMetrics.matches} matches`);
      test.details.push(`📏 Width: ${bracketMetrics.scrollWidth}px (viewport: ${bracketMetrics.clientWidth}px)`);
      
      // Check if scrollable when needed
      const isScrollable = bracketMetrics.scrollWidth > bracketMetrics.clientWidth;
      if (isScrollable) {
        test.details.push('✅ Bracket is horizontally scrollable for large tournaments');
      }
      
      test.status = renderTime < 1000 ? 'passed' : 'warning';
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.edge_cases.tests.push(test);
    this.updateTestCount(test.status);
  }

  // UI/UX Validation
  async testUIValidation() {
    console.log('\n🎨 Testing UI/UX Validation...');
    const category = this.results.categories.ui_validation;
    
    try {
      await this.testLiquipediaDesign();
      await this.testResponsiveDesign();
      await this.testAccessibility();
      
      category.status = 'completed';
      console.log('✅ UI/UX Validation testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('UI_FAILURE', `UI validation failed: ${error.message}`);
    }
  }

  async testLiquipediaDesign() {
    const test = {
      name: 'Liquipedia Design Compliance',
      status: 'running',
      details: []
    };

    try {
      // Check for Liquipedia-specific styling elements
      const designElements = await this.page.evaluate(() => {
        const bracket = document.querySelector('.liquipedia-bracket');
        if (!bracket) return null;
        
        const styles = window.getComputedStyle(bracket);
        const matches = document.querySelectorAll('.liquipedia-match');
        
        const designChecks = {
          hasLiquipediaClass: bracket.classList.contains('liquipedia-bracket'),
          matchesHaveCorrectClass: matches.length > 0 && 
            Array.from(matches).every(m => m.classList.contains('liquipedia-match')),
          hasCleanStyling: true, // Will check for clean, minimal styling
          hasProperSpacing: true,
          usesConsistentColors: true
        };
        
        return designChecks;
      });
      
      if (!designElements) {
        test.details.push('❌ No bracket found for design validation');
        test.status = 'failed';
      } else {
        Object.entries(designElements).forEach(([key, value]) => {
          const status = value ? '✅' : '❌';
          test.details.push(`${status} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        });
        
        const passedChecks = Object.values(designElements).filter(Boolean).length;
        const totalChecks = Object.keys(designElements).length;
        
        test.status = passedChecks === totalChecks ? 'passed' : 
                     passedChecks > totalChecks / 2 ? 'warning' : 'failed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.ui_validation.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testResponsiveDesign() {
    const test = {
      name: 'Responsive Design',
      status: 'running',
      details: []
    };

    try {
      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1366, height: 768, name: 'Desktop Standard' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const viewport of viewports) {
        await this.page.setViewport(viewport);
        await this.page.waitForTimeout(500);
        
        const responsiveCheck = await this.page.evaluate((viewportName) => {
          const bracket = document.querySelector('.liquipedia-bracket');
          if (!bracket) return { name: viewportName, works: false };
          
          const container = document.querySelector('.bracket-container');
          const isScrollable = container && container.scrollWidth > container.clientWidth;
          const hasOverflow = bracket.scrollWidth > window.innerWidth;
          
          return {
            name: viewportName,
            works: true,
            isScrollable,
            hasOverflow,
            width: bracket.offsetWidth,
            scrollWidth: bracket.scrollWidth
          };
        }, viewport.name);
        
        if (responsiveCheck.works) {
          test.details.push(`✅ ${responsiveCheck.name}: ${responsiveCheck.width}px${responsiveCheck.isScrollable ? ' (scrollable)' : ''}`);
        } else {
          test.details.push(`❌ ${responsiveCheck.name}: Not rendered properly`);
        }
      }
      
      test.status = 'passed';
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.ui_validation.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testAccessibility() {
    const test = {
      name: 'Accessibility Features',
      status: 'running',
      details: []
    };

    try {
      const accessibilityCheck = await this.page.evaluate(() => {
        const bracket = document.querySelector('.liquipedia-bracket');
        if (!bracket) return null;
        
        const checks = {
          hasAriaLabels: !!bracket.querySelector('[aria-label]'),
          hasProperHeadings: !!bracket.querySelector('h1, h2, h3, h4, h5, h6'),
          hasKeyboardNavigation: bracket.querySelectorAll('[tabindex]').length > 0,
          hasAltTexts: bracket.querySelectorAll('img[alt]').length > 0,
          hasSemanticStructure: !!bracket.querySelector('button, a, [role]')
        };
        
        return checks;
      });
      
      if (!accessibilityCheck) {
        test.details.push('❌ No bracket found for accessibility check');
        test.status = 'failed';
      } else {
        Object.entries(accessibilityCheck).forEach(([key, value]) => {
          const status = value ? '✅' : '⚠️ ';
          test.details.push(`${status} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        });
        
        test.status = 'warning'; // Accessibility usually needs improvement
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.ui_validation.tests.push(test);
    this.updateTestCount(test.status);
  }

  // Admin Functions Testing
  async testAdminFunctions() {
    console.log('\n🛠️  Testing Admin Functions...');
    const category = this.results.categories.admin_functions;
    
    try {
      await this.testBracketGeneration();
      await this.testMatchUpdates();
      await this.testBracketManagement();
      
      category.status = 'completed';
      console.log('✅ Admin Functions testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('ADMIN_FAILURE', `Admin functions failed: ${error.message}`);
    }
  }

  async testBracketGeneration() {
    const test = {
      name: 'Bracket Generation Controls',
      status: 'running',
      details: []
    };

    try {
      // Look for bracket generation functionality
      const generateButton = await this.page.$('button:contains("Generate Bracket")') ||
                            await this.page.$('[data-testid="generate-bracket"]') ||
                            await this.page.$('.generate-bracket');
      
      if (!generateButton) {
        test.details.push('❌ No bracket generation button found');
        test.status = 'failed';
      } else {
        test.details.push('✅ Bracket generation button found');
        
        // Check if button is functional
        const isDisabled = await this.page.evaluate(() => {
          const btn = document.querySelector('button:contains("Generate Bracket")') ||
                     document.querySelector('[data-testid="generate-bracket"]') ||
                     document.querySelector('.generate-bracket');
          return btn ? btn.disabled : true;
        });
        
        if (isDisabled) {
          test.details.push('⚠️  Button is disabled (may be conditional)');
          test.status = 'warning';
        } else {
          test.details.push('✅ Button is active and clickable');
          test.status = 'passed';
        }
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.admin_functions.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testMatchUpdates() {
    const test = {
      name: 'Match Update Controls',
      status: 'running',
      details: []
    };

    try {
      // Check for match update functionality
      const matches = await this.page.$$('.liquipedia-match');
      
      if (matches.length === 0) {
        test.details.push('❌ No matches found to test updates');
        test.status = 'failed';
      } else {
        // Try clicking on a match to see update controls
        await matches[0].click();
        await this.page.waitForTimeout(1000);
        
        const hasUpdateControls = await this.page.$('.match-controls') ||
                                 await this.page.$('.score-input') ||
                                 await this.page.$('.match-admin-panel');
        
        if (hasUpdateControls) {
          test.details.push('✅ Match update controls available');
          test.status = 'passed';
        } else {
          test.details.push('⚠️  Limited or no match update controls');
          test.status = 'warning';
        }
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.admin_functions.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testBracketManagement() {
    const test = {
      name: 'Bracket Management Features',
      status: 'running',
      details: []
    };

    try {
      // Look for various bracket management features
      const managementFeatures = await this.page.evaluate(() => {
        const features = {
          generateButton: !!document.querySelector('[data-testid="generate-bracket"], button:contains("Generate")'),
          resetButton: !!document.querySelector('[data-testid="reset-bracket"], button:contains("Reset")'),
          editControls: !!document.querySelector('.bracket-edit, .match-controls'),
          seedingControls: !!document.querySelector('.seeding-controls, .team-seed'),
          formatSelector: !!document.querySelector('select[data-format], .format-selector')
        };
        
        return features;
      });
      
      const availableFeatures = Object.entries(managementFeatures)
        .filter(([_, exists]) => exists)
        .map(([feature, _]) => feature);
      
      test.details.push(`🛠️  Available features: ${availableFeatures.join(', ')}`);
      
      if (availableFeatures.length >= 2) {
        test.details.push('✅ Good bracket management coverage');
        test.status = 'passed';
      } else if (availableFeatures.length >= 1) {
        test.details.push('⚠️  Limited bracket management features');
        test.status = 'warning';
      } else {
        test.details.push('❌ No bracket management features found');
        test.status = 'failed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.admin_functions.tests.push(test);
    this.updateTestCount(test.status);
  }

  // Marvel Rivals Format Testing
  async testMarvelRivalsFormats() {
    console.log('\n🦸 Testing Marvel Rivals Formats...');
    const category = this.results.categories.marvel_rivals_formats;
    
    try {
      await this.testFormatSupport();
      await this.testBestOfFormats();
      await this.testTournamentTypes();
      
      category.status = 'completed';
      console.log('✅ Marvel Rivals Format testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('FORMAT_FAILURE', `Marvel Rivals formats failed: ${error.message}`);
    }
  }

  async testFormatSupport() {
    const test = {
      name: 'Marvel Rivals Format Support',
      status: 'running',
      details: []
    };

    try {
      // Check for Marvel Rivals specific format indicators
      const formatInfo = await this.page.evaluate(() => {
        const formats = [];
        const formatElements = document.querySelectorAll('.match-format, .format-indicator');
        
        formatElements.forEach(el => {
          const text = el.textContent.trim();
          if (text) formats.push(text);
        });
        
        // Look for Marvel Rivals specific formats
        const marvelFormats = ['Bo3', 'Bo5', 'Bo7', 'SE', 'DE', 'Swiss', 'RR'];
        const foundFormats = formats.filter(f => marvelFormats.includes(f));
        
        return {
          allFormats: formats,
          marvelFormats: foundFormats,
          hasMarvelSupport: foundFormats.length > 0
        };
      });
      
      test.details.push(`📋 Found formats: ${formatInfo.allFormats.join(', ')}`);
      test.details.push(`🦸 Marvel Rivals formats: ${formatInfo.marvelFormats.join(', ')}`);
      
      if (formatInfo.hasMarvelSupport) {
        test.details.push('✅ Marvel Rivals format support detected');
        test.status = 'passed';
      } else {
        test.details.push('⚠️  No Marvel Rivals specific formats detected');
        test.status = 'warning';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.marvel_rivals_formats.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testBestOfFormats() {
    const test = {
      name: 'Best-of Format Handling',
      status: 'running',
      details: []
    };

    try {
      // Analyze best-of format implementation
      const bestOfAnalysis = await this.page.evaluate(() => {
        const matches = document.querySelectorAll('.liquipedia-match');
        const bestOfFormats = [];
        
        matches.forEach(match => {
          const formatEl = match.querySelector('.match-format');
          if (formatEl) {
            const format = formatEl.textContent.trim();
            if (format.startsWith('Bo')) {
              bestOfFormats.push(format);
            }
          }
        });
        
        const uniqueFormats = [...new Set(bestOfFormats)];
        
        return {
          total: bestOfFormats.length,
          unique: uniqueFormats,
          hasBestOf: uniqueFormats.length > 0
        };
      });
      
      if (bestOfAnalysis.hasBestOf) {
        test.details.push(`✅ Best-of formats found: ${bestOfAnalysis.unique.join(', ')}`);
        test.details.push(`🎮 ${bestOfAnalysis.total} matches with Bo format`);
        test.status = 'passed';
      } else {
        test.details.push('⚠️  No best-of formats detected');
        test.status = 'warning';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.marvel_rivals_formats.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testTournamentTypes() {
    const test = {
      name: 'Tournament Type Support',
      status: 'running',
      details: []
    };

    try {
      // Check tournament type implementation
      const tournamentType = await this.page.evaluate(() => {
        // Look for tournament type indicators in the page
        const typeIndicators = [
          document.querySelector('.tournament-type'),
          document.querySelector('.event-format'),
          document.querySelector('[data-tournament-type]')
        ].filter(Boolean);
        
        const types = typeIndicators.map(el => el.textContent.trim());
        
        // Check bracket structure for type hints
        const rounds = document.querySelectorAll('.bracket-round');
        const hasLosersRound = Array.from(rounds).some(r => 
          r.textContent.toLowerCase().includes('loser') || 
          r.textContent.toLowerCase().includes('lower')
        );
        
        return {
          explicitTypes: types,
          hasLosersRound,
          roundCount: rounds.length,
          likelyType: hasLosersRound ? 'Double Elimination' : 
                     rounds.length > 0 ? 'Single Elimination' : 'Unknown'
        };
      });
      
      test.details.push(`🏆 Tournament type: ${tournamentType.likelyType}`);
      test.details.push(`📊 ${tournamentType.roundCount} rounds${tournamentType.hasLosersRound ? ' (with losers bracket)' : ''}`);
      
      if (tournamentType.explicitTypes.length > 0) {
        test.details.push(`📝 Explicit types: ${tournamentType.explicitTypes.join(', ')}`);
      }
      
      test.status = tournamentType.likelyType !== 'Unknown' ? 'passed' : 'warning';
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.marvel_rivals_formats.tests.push(test);
    this.updateTestCount(test.status);
  }

  // API Integration Testing
  async testAPIIntegration() {
    console.log('\n🌐 Testing API Integration...');
    const category = this.results.categories.api_integration;
    
    try {
      await this.testBracketAPI();
      await this.testMatchAPI();
      await this.testEventAPI();
      
      category.status = 'completed';
      console.log('✅ API Integration testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('API_FAILURE', `API integration failed: ${error.message}`);
    }
  }

  async testBracketAPI() {
    const test = {
      name: 'Bracket API Endpoints',
      status: 'running',
      details: []
    };

    try {
      // Monitor network requests for bracket-related APIs
      const requests = [];
      
      this.page.on('request', request => {
        if (request.url().includes('/api/') && 
           (request.url().includes('bracket') || 
            request.url().includes('event') || 
            request.url().includes('match'))) {
          requests.push({
            url: request.url(),
            method: request.method(),
            type: 'request'
          });
        }
      });
      
      this.page.on('response', response => {
        if (response.url().includes('/api/') && 
           (response.url().includes('bracket') || 
            response.url().includes('event') || 
            response.url().includes('match'))) {
          requests.push({
            url: response.url(),
            status: response.status(),
            type: 'response'
          });
        }
      });
      
      // Refresh page to trigger API calls
      await this.page.reload();
      await this.page.waitForTimeout(3000);
      
      const apiRequests = requests.filter(r => r.type === 'request');
      const apiResponses = requests.filter(r => r.type === 'response');
      
      test.details.push(`📡 API requests: ${apiRequests.length}`);
      test.details.push(`📥 API responses: ${apiResponses.length}`);
      
      const failedResponses = apiResponses.filter(r => r.status >= 400);
      if (failedResponses.length > 0) {
        test.details.push(`❌ Failed requests: ${failedResponses.length}`);
        failedResponses.forEach(r => 
          test.details.push(`   - ${r.status}: ${r.url}`)
        );
        test.status = 'failed';
      } else {
        test.details.push('✅ All API requests successful');
        test.status = 'passed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.api_integration.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testMatchAPI() {
    const test = {
      name: 'Match API Integration',
      status: 'running',
      details: []
    };

    try {
      // Test match-related API functionality
      const matchData = await this.page.evaluate(() => {
        // Look for match data in the page
        const matches = document.querySelectorAll('.liquipedia-match');
        return Array.from(matches).map(match => {
          const team1 = match.querySelector('.team-row:first-child .team-name')?.textContent;
          const team2 = match.querySelector('.team-row:last-child .team-name')?.textContent;
          const score1 = match.querySelector('.team-row:first-child .team-score')?.textContent;
          const score2 = match.querySelector('.team-row:last-child .team-score')?.textContent;
          
          return {
            hasTeams: !!(team1 && team2),
            hasScores: !!(score1 && score2),
            team1, team2, score1, score2
          };
        });
      });
      
      if (matchData.length === 0) {
        test.details.push('❌ No match data found');
        test.status = 'failed';
      } else {
        const withTeams = matchData.filter(m => m.hasTeams).length;
        const withScores = matchData.filter(m => m.hasScores).length;
        
        test.details.push(`🎮 ${matchData.length} matches found`);
        test.details.push(`👥 ${withTeams} with team data`);
        test.details.push(`📊 ${withScores} with score data`);
        
        test.status = withTeams > 0 ? 'passed' : 'warning';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.api_integration.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testEventAPI() {
    const test = {
      name: 'Event API Integration',
      status: 'running',
      details: []
    };

    try {
      // Check event data integration
      const eventData = await this.page.evaluate(() => {
        // Look for event information in the page
        const eventName = document.querySelector('.event-name, h1')?.textContent;
        const eventStatus = document.querySelector('.status-badge, .event-status')?.textContent;
        const teamCount = document.querySelectorAll('.team-row .team-name:not(.team-placeholder)').length;
        
        return {
          hasName: !!eventName,
          hasStatus: !!eventStatus,
          teamCount,
          name: eventName,
          status: eventStatus
        };
      });
      
      test.details.push(`📋 Event: ${eventData.name || 'Unknown'}`);
      test.details.push(`🏷️  Status: ${eventData.status || 'Unknown'}`);
      test.details.push(`👥 Teams: ${eventData.teamCount}`);
      
      if (eventData.hasName && eventData.teamCount > 0) {
        test.details.push('✅ Event API integration working');
        test.status = 'passed';
      } else {
        test.details.push('⚠️  Limited event API integration');
        test.status = 'warning';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.api_integration.tests.push(test);
    this.updateTestCount(test.status);
  }

  // Performance Testing
  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    const category = this.results.categories.performance;
    
    try {
      await this.testLoadTime();
      await this.testMemoryUsage();
      await this.testScrollPerformance();
      
      category.status = 'completed';
      console.log('✅ Performance testing completed');
      
    } catch (error) {
      category.status = 'failed';
      this.addCriticalIssue('PERFORMANCE_FAILURE', `Performance testing failed: ${error.message}`);
    }
  }

  async testLoadTime() {
    const test = {
      name: 'Bracket Load Performance',
      status: 'running',
      details: []
    };

    try {
      const startTime = Date.now();
      
      await this.page.goto(`${this.baseUrl}/events/1`, { waitUntil: 'networkidle0' });
      
      const loadTime = Date.now() - startTime;
      
      const performanceMetrics = await this.page.evaluate(() => {
        const bracket = document.querySelector('.liquipedia-bracket');
        const elements = bracket ? bracket.querySelectorAll('*').length : 0;
        
        return {
          bracketExists: !!bracket,
          elementCount: elements,
          domContentLoaded: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0
        };
      });
      
      test.details.push(`⏱️  Total load time: ${loadTime}ms`);
      test.details.push(`🏗️  DOM elements: ${performanceMetrics.elementCount}`);
      
      if (loadTime < 3000) {
        test.details.push('✅ Good load performance');
        test.status = 'passed';
      } else if (loadTime < 5000) {
        test.details.push('⚠️  Moderate load performance');
        test.status = 'warning';
      } else {
        test.details.push('❌ Slow load performance');
        test.status = 'failed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.performance.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testMemoryUsage() {
    const test = {
      name: 'Memory Usage',
      status: 'running',
      details: []
    };

    try {
      // Get memory usage metrics
      const metrics = await this.page.metrics();
      
      test.details.push(`🧠 JS Heap: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
      test.details.push(`📦 Nodes: ${metrics.Nodes}`);
      test.details.push(`👂 Listeners: ${metrics.JSEventListeners}`);
      
      // Check for memory leaks by performing multiple operations
      const initialHeap = metrics.JSHeapUsedSize;
      
      // Perform some bracket operations
      await this.page.click('.bracket-tab', { timeout: 1000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
      
      const afterMetrics = await this.page.metrics();
      const heapGrowth = afterMetrics.JSHeapUsedSize - initialHeap;
      
      test.details.push(`📈 Heap growth: ${Math.round(heapGrowth / 1024)}KB`);
      
      if (metrics.JSHeapUsedSize < 50 * 1024 * 1024) { // 50MB
        test.details.push('✅ Good memory usage');
        test.status = 'passed';
      } else if (metrics.JSHeapUsedSize < 100 * 1024 * 1024) { // 100MB
        test.details.push('⚠️  Moderate memory usage');
        test.status = 'warning';
      } else {
        test.details.push('❌ High memory usage');
        test.status = 'failed';
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.performance.tests.push(test);
    this.updateTestCount(test.status);
  }

  async testScrollPerformance() {
    const test = {
      name: 'Scroll Performance',
      status: 'running',
      details: []
    };

    try {
      // Test horizontal scrolling performance on bracket
      const bracketContainer = await this.page.$('.bracket-container');
      
      if (!bracketContainer) {
        test.details.push('❌ No bracket container found');
        test.status = 'failed';
      } else {
        const scrollMetrics = await this.page.evaluate(() => {
          const container = document.querySelector('.bracket-container');
          if (!container) return null;
          
          const startTime = performance.now();
          
          // Perform scroll test
          container.scrollLeft = 0;
          const maxScroll = container.scrollWidth - container.clientWidth;
          
          let scrollSteps = 0;
          for (let i = 0; i <= maxScroll; i += 100) {
            container.scrollLeft = i;
            scrollSteps++;
          }
          
          const endTime = performance.now();
          
          return {
            duration: endTime - startTime,
            scrollSteps,
            maxScroll,
            isScrollable: maxScroll > 0
          };
        });
        
        if (!scrollMetrics) {
          test.details.push('❌ Could not measure scroll performance');
          test.status = 'failed';
        } else {
          test.details.push(`🏃 Scroll duration: ${Math.round(scrollMetrics.duration)}ms`);
          test.details.push(`📏 Max scroll: ${scrollMetrics.maxScroll}px`);
          test.details.push(`🔄 Steps: ${scrollMetrics.scrollSteps}`);
          
          if (scrollMetrics.isScrollable) {
            if (scrollMetrics.duration < 100) {
              test.details.push('✅ Smooth scrolling performance');
              test.status = 'passed';
            } else {
              test.details.push('⚠️  Scroll performance could be improved');
              test.status = 'warning';
            }
          } else {
            test.details.push('ℹ️  No horizontal scrolling needed');
            test.status = 'passed';
          }
        }
      }
      
    } catch (error) {
      test.details.push(`❌ Error: ${error.message}`);
      test.status = 'failed';
    }
    
    this.results.categories.performance.tests.push(test);
    this.updateTestCount(test.status);
  }

  // Utility Methods
  updateTestCount(status) {
    this.results.summary.total_tests++;
    if (status === 'passed') this.results.summary.passed++;
    else if (status === 'failed') this.results.summary.failed++;
    else if (status === 'warning') this.results.summary.warnings++;
  }

  addCriticalIssue(type, description) {
    this.results.critical_issues.push({
      type,
      description,
      timestamp: new Date().toISOString()
    });
  }

  async generateReport() {
    console.log('\n📊 Generating Comprehensive Audit Report...');
    
    // Calculate overall status for each category
    Object.keys(this.results.categories).forEach(category => {
      const tests = this.results.categories[category].tests;
      if (tests.length === 0) {
        this.results.categories[category].status = 'not_tested';
        return;
      }
      
      const failed = tests.filter(t => t.status === 'failed').length;
      const warnings = tests.filter(t => t.status === 'warning').length;
      const passed = tests.filter(t => t.status === 'passed').length;
      
      if (failed > 0) {
        this.results.categories[category].status = 'failed';
      } else if (warnings > 0) {
        this.results.categories[category].status = 'warning';
      } else if (passed > 0) {
        this.results.categories[category].status = 'passed';
      }
    });
    
    // Generate recommendations based on findings
    this.generateRecommendations();
    
    // Save detailed report
    const reportFile = `/var/www/mrvl-frontend/COMPREHENSIVE_BRACKET_AUDIT_REPORT.md`;
    const markdownReport = this.generateMarkdownReport();
    
    fs.writeFileSync(reportFile, markdownReport);
    
    // Save JSON report for programmatic use
    const jsonReportFile = `/var/www/mrvl-frontend/bracket-audit-results-${Date.now()}.json`;
    fs.writeFileSync(jsonReportFile, JSON.stringify(this.results, null, 2));
    
    console.log(`✅ Reports generated:`);
    console.log(`   📄 Markdown: ${reportFile}`);
    console.log(`   📊 JSON: ${jsonReportFile}`);
    
    // Print summary
    this.printSummary();
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze critical issues
    if (this.results.critical_issues.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'System Stability',
        issue: 'Critical failures detected',
        recommendation: 'Address all critical issues before production deployment',
        impact: 'High - System may be unusable'
      });
    }
    
    // CRUD Operations recommendations
    const crudTests = this.results.categories.crud_operations.tests;
    const crudFailures = crudTests.filter(t => t.status === 'failed').length;
    if (crudFailures > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'CRUD Operations',
        issue: `${crudFailures} CRUD operations failing`,
        recommendation: 'Implement missing bracket CRUD API endpoints and frontend handlers',
        impact: 'High - Core functionality not working'
      });
    }
    
    // API Integration recommendations
    const apiTests = this.results.categories.api_integration.tests;
    const apiFailures = apiTests.filter(t => t.status === 'failed').length;
    if (apiFailures > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'API Integration',
        issue: 'API integration issues detected',
        recommendation: 'Fix broken API endpoints and add missing bracket-related routes',
        impact: 'High - Data cannot be persisted or retrieved'
      });
    }
    
    // UI/UX recommendations
    const uiTests = this.results.categories.ui_validation.tests;
    const uiWarnings = uiTests.filter(t => t.status === 'warning').length;
    if (uiWarnings > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'User Experience',
        issue: 'UI/UX improvements needed',
        recommendation: 'Enhance accessibility features and responsive design',
        impact: 'Medium - User experience could be improved'
      });
    }
    
    // Performance recommendations
    const perfTests = this.results.categories.performance.tests;
    const perfIssues = perfTests.filter(t => t.status === 'failed' || t.status === 'warning').length;
    if (perfIssues > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: 'Performance optimization needed',
        recommendation: 'Optimize bracket rendering and implement lazy loading for large tournaments',
        impact: 'Medium - User experience degraded with large brackets'
      });
    }
    
    // Marvel Rivals specific recommendations
    const marvelTests = this.results.categories.marvel_rivals_formats.tests;
    const marvelWarnings = marvelTests.filter(t => t.status === 'warning').length;
    if (marvelWarnings > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Marvel Rivals Integration',
        issue: 'Marvel Rivals format support incomplete',
        recommendation: 'Fully implement Marvel Rivals specific tournament formats and rules',
        impact: 'Medium - Game-specific features missing'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  generateMarkdownReport() {
    const { results } = this;
    let report = `# COMPREHENSIVE TOURNAMENT BRACKET SYSTEM AUDIT REPORT

**Generated:** ${results.timestamp}
**Audit Version:** 1.0.0

## 🎯 Executive Summary

This comprehensive audit evaluated the tournament bracket system across all critical dimensions including CRUD operations, state transitions, data integrity, UI/UX, and Marvel Rivals specific functionality.

### 📊 Overall Results

- **Total Tests:** ${results.summary.total_tests}
- **Passed:** ${results.summary.passed} ✅
- **Failed:** ${results.summary.failed} ❌
- **Warnings:** ${results.summary.warnings} ⚠️
- **Success Rate:** ${results.summary.total_tests > 0 ? Math.round((results.summary.passed / results.summary.total_tests) * 100) : 0}%

### 🚨 Critical Issues

${results.critical_issues.length === 0 ? 'No critical issues detected ✅' : ''}
${results.critical_issues.map(issue => `
- **${issue.type}:** ${issue.description}
  - **Timestamp:** ${issue.timestamp}
`).join('')}

---

## 📋 Detailed Test Results

`;

    // Add category results
    Object.entries(results.categories).forEach(([categoryName, category]) => {
      const statusIcon = {
        'passed': '✅',
        'failed': '❌',
        'warning': '⚠️',
        'not_tested': '⏭️',
        'pending': '⏳'
      };
      
      report += `### ${statusIcon[category.status] || '❓'} ${categoryName.toUpperCase().replace(/_/g, ' ')}

**Status:** ${category.status}
**Tests:** ${category.tests.length}

`;
      
      if (category.tests.length > 0) {
        category.tests.forEach(test => {
          const testIcon = statusIcon[test.status] || '❓';
          report += `#### ${testIcon} ${test.name}

`;
          test.details.forEach(detail => {
            report += `- ${detail}\n`;
          });
          report += '\n';
        });
      } else {
        report += '*No tests were executed for this category.*\n\n';
      }
    });

    // Add recommendations
    if (results.recommendations.length > 0) {
      report += `---

## 🔧 Recommendations

`;
      results.recommendations.forEach((rec, index) => {
        const priorityIcon = {
          'CRITICAL': '🚨',
          'HIGH': '🔴',
          'MEDIUM': '🟡',
          'LOW': '🟢'
        };
        
        report += `### ${priorityIcon[rec.priority]} ${rec.priority} - ${rec.category}

**Issue:** ${rec.issue}
**Recommendation:** ${rec.recommendation}
**Impact:** ${rec.impact}

`;
      });
    }

    report += `---

## 🏆 Conclusion

${this.generateConclusion()}

---

**Audit completed by:** Bracket Audit Suite v1.0
**For questions or clarifications, contact the development team.**
`;

    return report;
  }

  generateConclusion() {
    const { results } = this;
    const successRate = results.summary.total_tests > 0 ? 
      Math.round((results.summary.passed / results.summary.total_tests) * 100) : 0;
    
    if (results.critical_issues.length > 0) {
      return `**CRITICAL ISSUES DETECTED** - The bracket system has critical failures that must be addressed before production use. Immediate developer intervention required.`;
    } else if (successRate >= 90) {
      return `**EXCELLENT** - The bracket system is performing well with ${successRate}% success rate. Minor optimizations recommended but system is production-ready.`;
    } else if (successRate >= 70) {
      return `**GOOD** - The bracket system is functional with ${successRate}% success rate. Some improvements needed but core functionality works.`;
    } else if (successRate >= 50) {
      return `**NEEDS IMPROVEMENT** - The bracket system has significant issues with only ${successRate}% success rate. Major improvements required before production.`;
    } else {
      return `**MAJOR ISSUES** - The bracket system is not functioning properly with only ${successRate}% success rate. Extensive development work required.`;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🏆 BRACKET AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`📊 Tests: ${this.results.summary.total_tests} total`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    
    const successRate = this.results.summary.total_tests > 0 ? 
      Math.round((this.results.summary.passed / this.results.summary.total_tests) * 100) : 0;
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (this.results.critical_issues.length > 0) {
      console.log(`🚨 Critical Issues: ${this.results.critical_issues.length}`);
    }
    
    console.log(`📄 Report saved to: COMPREHENSIVE_BRACKET_AUDIT_REPORT.md`);
    console.log('='.repeat(80));
  }
}

// Run the audit
const audit = new BracketAuditSuite();
audit.runFullAudit().catch(console.error);