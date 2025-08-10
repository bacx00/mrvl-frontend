/**
 * URL DISPLAY & PLAYER NAME VALIDATION TEST
 * Specifically tests URL categorization, capitalization, and player name formatting
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class URLPlayerNameValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      urlTests: [],
      playerNameTests: [],
      uiPositioningTests: [],
      warnings: [],
      errors: []
    };
  }

  async validateSystem() {
    console.log('🔗 URL DISPLAY & PLAYER NAME VALIDATION');
    console.log('=========================================');
    
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      defaultViewport: { width: 1600, height: 1200 }
    });

    try {
      const page = await browser.newPage();
      await this.testURLDisplayAndCategorization(page);
      await this.testPlayerNameFormatting(page);
      await this.testUIPositioning(page);
      
      this.generateReport();
      
    } catch (error) {
      this.results.errors.push({
        type: 'System Error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await browser.close();
    }
  }

  async testURLDisplayAndCategorization(page) {
    console.log('\n🔗 Testing URL Display & Categorization...');
    
    try {
      // Navigate to a match detail page
      await page.goto('http://localhost:3000/matches/1', { waitUntil: 'networkidle0' });
      
      // Look for URL buttons with categories
      const urlButtons = await page.evaluate(() => {
        const buttons = [];
        const urlElements = document.querySelectorAll('.url-btn, .match-url, .external-link');
        
        urlElements.forEach(button => {
          const text = button.textContent || button.innerText || '';
          const href = button.href || button.getAttribute('href') || '';
          const category = button.getAttribute('data-category') || 
                          button.className.match(/category-(\w+)/)?.[1] || 
                          'uncategorized';
          
          buttons.push({
            text: text.trim(),
            href: href,
            category: category,
            className: button.className
          });
        });
        
        return buttons;
      });
      
      console.log(`   Found ${urlButtons.length} URL buttons`);
      
      // Analyze URL categorization
      const categorization = {
        streaming: urlButtons.filter(btn => 
          btn.category === 'streaming' || 
          btn.text.toLowerCase().includes('stream') ||
          btn.text.toLowerCase().includes('twitch') ||
          btn.text.toLowerCase().includes('youtube')
        ),
        betting: urlButtons.filter(btn =>
          btn.category === 'betting' ||
          btn.text.toLowerCase().includes('bet') ||
          btn.text.toLowerCase().includes('odds')
        ),
        vod: urlButtons.filter(btn =>
          btn.category === 'vod' ||
          btn.text.toLowerCase().includes('vod') ||
          btn.text.toLowerCase().includes('replay') ||
          btn.text.toLowerCase().includes('video')
        )
      };
      
      // Test URL capitalization (MarvelRivals vs marvelrivals)
      const capitalizationIssues = urlButtons.filter(btn => {
        const text = btn.text.toLowerCase();
        return text.includes('marvelrivals') && !btn.text.includes('MarvelRivals');
      });
      
      this.results.urlTests.push({
        test: 'URL Categorization',
        status: 'COMPLETED',
        details: {
          totalURLs: urlButtons.length,
          streaming: categorization.streaming.length,
          betting: categorization.betting.length,
          vod: categorization.vod.length,
          uncategorized: urlButtons.length - (categorization.streaming.length + categorization.betting.length + categorization.vod.length)
        }
      });
      
      if (capitalizationIssues.length > 0) {
        this.results.warnings.push({
          type: 'URL Capitalization',
          message: `${capitalizationIssues.length} URLs with capitalization issues`,
          details: capitalizationIssues.map(btn => btn.text),
          severity: 'medium'
        });
      }
      
      console.log(`   ✅ Streaming: ${categorization.streaming.length}, Betting: ${categorization.betting.length}, VOD: ${categorization.vod.length}`);
      
      if (capitalizationIssues.length > 0) {
        console.log(`   ⚠️  ${capitalizationIssues.length} capitalization issues found`);
      }
      
    } catch (error) {
      this.results.urlTests.push({
        test: 'URL Display & Categorization',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ URL test failed: ${error.message}`);
    }
  }

  async testPlayerNameFormatting(page) {
    console.log('\n👤 Testing Player Name Formatting...');
    
    try {
      // Look for player names across different components
      const playerNames = await page.evaluate(() => {
        const names = [];
        const playerElements = document.querySelectorAll(
          '.player-name, .username, .player-display, .roster-player, [class*="player"]'
        );
        
        playerElements.forEach(el => {
          const text = el.textContent || el.innerText || '';
          if (text.trim() && text.length > 0) {
            names.push({
              text: text.trim(),
              className: el.className,
              elementType: el.tagName.toLowerCase()
            });
          }
        });
        
        // Also check for any text that might be player names (looking for common patterns)
        const allText = document.body.innerText;
        const potentialNames = allText.match(/\b[A-Z][a-z]+ "[A-Za-z0-9_]+" [A-Z][a-z]+\b/g) || [];
        
        potentialNames.forEach(name => {
          names.push({
            text: name,
            className: 'detected-pattern',
            elementType: 'pattern'
          });
        });
        
        return names;
      });
      
      console.log(`   Found ${playerNames.length} potential player name elements`);
      
      // Analyze name formats
      const formatAnalysis = {
        usernameOnly: [],
        fullNameWithQuotes: [],
        mixedFormat: [],
        other: []
      };
      
      playerNames.forEach(player => {
        const name = player.text;
        
        if (name.includes('"')) {
          // Format like: Mikkel "Sypeh" Klein
          formatAnalysis.fullNameWithQuotes.push(player);
        } else if (name.split(' ').length === 1 && /^[A-Za-z0-9_]+$/.test(name)) {
          // Format like: Sypeh
          formatAnalysis.usernameOnly.push(player);
        } else if (name.split(' ').length > 1) {
          // Multiple words but no quotes
          formatAnalysis.mixedFormat.push(player);
        } else {
          formatAnalysis.other.push(player);
        }
      });
      
      // Check for inconsistent formatting
      const needsFormatting = formatAnalysis.fullNameWithQuotes.filter(player => {
        // Should be converted to username only
        return player.text.includes('"');
      });
      
      this.results.playerNameTests.push({
        test: 'Player Name Formatting',
        status: 'COMPLETED',
        details: {
          totalNames: playerNames.length,
          usernameOnly: formatAnalysis.usernameOnly.length,
          fullNameWithQuotes: formatAnalysis.fullNameWithQuotes.length,
          mixedFormat: formatAnalysis.mixedFormat.length,
          other: formatAnalysis.other.length
        }
      });
      
      if (needsFormatting.length > 0) {
        this.results.warnings.push({
          type: 'Player Name Format',
          message: `${needsFormatting.length} player names need format conversion to username-only`,
          details: needsFormatting.map(p => p.text),
          severity: 'medium'
        });
      }
      
      console.log(`   ✅ Username-only: ${formatAnalysis.usernameOnly.length}, Full names: ${formatAnalysis.fullNameWithQuotes.length}`);
      
      if (needsFormatting.length > 0) {
        console.log(`   ⚠️  ${needsFormatting.length} names need username-only conversion`);
        needsFormatting.slice(0, 3).forEach(name => {
          console.log(`      "${name.text}"`);
        });
      }
      
    } catch (error) {
      this.results.playerNameTests.push({
        test: 'Player Name Formatting',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ Player name test failed: ${error.message}`);
    }
  }

  async testUIPositioning(page) {
    console.log('\n📐 Testing UI Positioning...');
    
    try {
      // Check button positioning relative to blue box
      const positionAnalysis = await page.evaluate(() => {
        const urlSection = document.querySelector('.url-section, .match-urls, .external-links');
        const blueBox = document.querySelector('.blue-box, .info-box, .match-info, [class*="blue"]');
        
        if (!urlSection && !blueBox) {
          return { status: 'elements_not_found' };
        }
        
        let positioning = {};
        
        if (urlSection && blueBox) {
          const urlRect = urlSection.getBoundingClientRect();
          const boxRect = blueBox.getBoundingClientRect();
          
          positioning = {
            urlSection: {
              top: urlRect.top,
              left: urlRect.left,
              width: urlRect.width,
              height: urlRect.height
            },
            blueBox: {
              top: boxRect.top,
              left: boxRect.left,
              width: boxRect.width,
              height: boxRect.height
            },
            urlAboveBox: urlRect.top < boxRect.top,
            verticalGap: Math.abs(urlRect.bottom - boxRect.top)
          };
        }
        
        // Check button sizing
        const buttons = document.querySelectorAll('.url-btn, button[class*="url"]');
        const buttonSizes = Array.from(buttons).map(btn => {
          const rect = btn.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          };
        });
        
        return {
          status: 'completed',
          positioning: positioning,
          buttonSizes: buttonSizes,
          totalButtons: buttons.length
        };
      });
      
      if (positionAnalysis.status === 'elements_not_found') {
        this.results.warnings.push({
          type: 'UI Elements',
          message: 'URL section or blue box elements not found for positioning test',
          severity: 'high'
        });
      } else if (positionAnalysis.positioning && !positionAnalysis.positioning.urlAboveBox) {
        this.results.warnings.push({
          type: 'UI Positioning',
          message: 'URL buttons appear below blue box instead of above',
          severity: 'high'
        });
      }
      
      // Check button visibility
      const visibleButtons = positionAnalysis.buttonSizes?.filter(btn => btn.visible).length || 0;
      const totalButtons = positionAnalysis.totalButtons || 0;
      
      this.results.uiPositioningTests.push({
        test: 'UI Positioning',
        status: 'COMPLETED',
        details: {
          elementsFound: positionAnalysis.status === 'completed',
          urlAboveBox: positionAnalysis.positioning?.urlAboveBox,
          visibleButtons: visibleButtons,
          totalButtons: totalButtons,
          buttonVisibilityRate: totalButtons > 0 ? ((visibleButtons / totalButtons) * 100).toFixed(1) : '0'
        }
      });
      
      console.log(`   ✅ Positioning: URLs ${positionAnalysis.positioning?.urlAboveBox ? 'above' : 'below'} blue box`);
      console.log(`   ✅ Button visibility: ${visibleButtons}/${totalButtons} (${totalButtons > 0 ? ((visibleButtons / totalButtons) * 100).toFixed(1) : '0'}%)`);
      
    } catch (error) {
      this.results.uiPositioningTests.push({
        test: 'UI Positioning',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ UI positioning test failed: ${error.message}`);
    }
  }

  generateReport() {
    const allTests = [
      ...this.results.urlTests,
      ...this.results.playerNameTests,
      ...this.results.uiPositioningTests
    ];
    
    const completed = allTests.filter(t => t.status === 'COMPLETED').length;
    const failed = allTests.filter(t => t.status === 'FAILED').length;
    
    const summary = {
      totalTests: allTests.length,
      completed: completed,
      failed: failed,
      warnings: this.results.warnings.length,
      errors: this.results.errors.length
    };
    
    // Save report
    const reportData = {
      ...this.results,
      summary: summary
    };
    
    const reportPath = '/var/www/mrvl-frontend/frontend/url-player-name-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log('\n📋 URL & PLAYER NAME VALIDATION SUMMARY');
    console.log('========================================');
    console.log(`Tests Completed: ${completed}/${allTests.length}`);
    console.log(`Warnings: ${this.results.warnings.length}`);
    console.log(`Errors: ${this.results.errors.length}`);
    console.log(`Report saved: ${reportPath}`);
    
    // Show critical warnings
    const highSeverityWarnings = this.results.warnings.filter(w => w.severity === 'high');
    if (highSeverityWarnings.length > 0) {
      console.log('\n🚨 HIGH PRIORITY ISSUES:');
      highSeverityWarnings.forEach(warning => {
        console.log(`   ${warning.type}: ${warning.message}`);
      });
    }
    
    const mediumSeverityWarnings = this.results.warnings.filter(w => w.severity === 'medium');
    if (mediumSeverityWarnings.length > 0) {
      console.log('\n⚠️  MEDIUM PRIORITY ISSUES:');
      mediumSeverityWarnings.forEach(warning => {
        console.log(`   ${warning.type}: ${warning.message}`);
      });
    }
  }
}

// Execute validation
const validator = new URLPlayerNameValidator();
validator.validateSystem().catch(console.error);

module.exports = URLPlayerNameValidator;