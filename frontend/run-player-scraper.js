#!/usr/bin/env node

/**
 * Marvel Rivals Player Scraper Execution Script
 * Comprehensive setup and execution with monitoring
 */

const fs = require('fs');
const path = require('path');

class ScraperRunner {
    constructor() {
        this.startTime = new Date();
        this.logFile = `scraper_log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        fs.appendFileSync(this.logFile, logMessage + '\n');
    }

    async checkDependencies() {
        this.log('🔍 Checking dependencies...');
        
        try {
            require('puppeteer');
            this.log('✅ Puppeteer is installed');
        } catch (error) {
            this.log('❌ Puppeteer not found. Installing...');
            const { exec } = require('child_process');
            return new Promise((resolve, reject) => {
                exec('npm install puppeteer', (error, stdout, stderr) => {
                    if (error) {
                        this.log(`❌ Installation failed: ${error}`);
                        reject(error);
                    } else {
                        this.log('✅ Puppeteer installed successfully');
                        resolve();
                    }
                });
            });
        }
    }

    async run() {
        try {
            await this.checkDependencies();
            
            this.log('🚀 Starting Marvel Rivals Player Scraper');
            this.log('📊 Target: Collect all 358+ Marvel Rivals players from Liquipedia');
            this.log('⚠️  This process may take 30-60 minutes');
            this.log('💡 The scraper will save progress every 25 players');
            this.log('');

            // Import and run the advanced scraper
            const AdvancedMarvelRivalsPlayerScraper = require('./advanced-marvel-rivals-scraper');
            const scraper = new AdvancedMarvelRivalsPlayerScraper();
            
            // Override console.log to include in our log file
            const originalLog = console.log;
            console.log = (...args) => {
                originalLog(...args);
                const message = args.join(' ');
                if (!message.startsWith('[')) { // Avoid duplicate timestamps
                    fs.appendFileSync(this.logFile, `[${new Date().toISOString()}] ${message}\n`);
                }
            };

            await scraper.scrapeAllPlayers();

            const endTime = new Date();
            const duration = Math.round((endTime - this.startTime) / 1000);
            this.log(`✅ Scraping completed in ${duration} seconds`);
            this.log('📁 Check the generated files:');
            this.log('   - marvel_rivals_complete_database.json');
            this.log('   - marvel_rivals_players.csv');
            this.log('   - marvel_rivals_scraping_report.json');
            this.log(`   - ${this.logFile}`);

        } catch (error) {
            this.log(`💥 Fatal error: ${error.message}`);
            this.log(`Stack trace: ${error.stack}`);
            process.exit(1);
        }
    }

    displayInstructions() {
        console.log('\n=== MARVEL RIVALS PLAYER SCRAPER ===');
        console.log('');
        console.log('This scraper will systematically collect data for all Marvel Rivals players from Liquipedia.');
        console.log('');
        console.log('📊 DATA COLLECTED PER PLAYER:');
        console.log('• Full name & in-game handle');
        console.log('• Nationality & region');
        console.log('• Birth date & age');
        console.log('• Current team & role');
        console.log('• Complete team history');
        console.log('• Tournament achievements');
        console.log('• Prize earnings');
        console.log('• Social media links');
        console.log('• Signature heroes');
        console.log('');
        console.log('⚙️ FEATURES:');
        console.log('• Respectful 3-second delays between requests');
        console.log('• Automatic retry on failures');
        console.log('• Progress saving every 25 players');
        console.log('• Multiple output formats (JSON, CSV)');
        console.log('• Comprehensive logging');
        console.log('');
        console.log('⏱️ ESTIMATED TIME: 30-60 minutes');
        console.log('📁 OUTPUT FILES: 4 files will be generated');
        console.log('');
        console.log('Press CTRL+C to cancel, or any key to continue...');
    }
}

// Main execution
const runner = new ScraperRunner();

if (process.argv.includes('--help') || process.argv.includes('-h')) {
    runner.displayInstructions();
    process.exit(0);
}

if (process.argv.includes('--run')) {
    runner.run();
} else {
    runner.displayInstructions();
    
    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
        process.stdin.setRawMode(false);
        runner.run();
    });
}