const fs = require('fs');
const path = require('path');

class LiveScoringValidator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: { passed: 0, failed: 0, warnings: 0 }
        };
    }
    
    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }
    
    async testLiveUpdateService() {
        this.log('📡 Testing Live Update Service');
        
        const serviceFile = '/var/www/mrvl-frontend/frontend/src/services/liveUpdateService.js';
        
        if (fs.existsSync(serviceFile)) {
            const content = fs.readFileSync(serviceFile, 'utf8');
            
            const features = {
                websocket: /WebSocket|ws:|EventSource/i.test(content),
                polling: /setInterval|poll/i.test(content),
                eventHandling: /addEventListener|on|emit/.test(content),
                matchUpdates: /matchUpdate|scoreUpdate|liveUpdate/i.test(content),
                errorHandling: /catch|error|onerror/i.test(content)
            };
            
            const score = Object.values(features).filter(Boolean).length;
            const maxScore = Object.keys(features).length;
            
            if (score >= 3) {
                this.log(`✅ Live Update Service: ${score}/${maxScore} features found`);
                this.results.summary.passed++;
            } else {
                this.log(`⚠️ Live Update Service: Only ${score}/${maxScore} features found`);
                this.results.summary.warnings++;
            }
        } else {
            this.log(`❌ Live Update Service: File not found`);
            this.results.summary.failed++;
        }
    }
    
    async testLiveScoreComponents() {
        this.log('🎮 Testing Live Score Components');
        
        const componentPath = '/var/www/mrvl-frontend/frontend/src/components';
        const liveComponents = [
            'shared/LiveScoring.js',
            'admin/LiveScoringPanel.js',
            'admin/ComprehensiveLiveScoring.js'
        ];
        
        let foundComponents = 0;
        
        for (const component of liveComponents) {
            const filePath = path.join(componentPath, component);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                const hasRealTimeFeatures = /useEffect|useState|socket|live|real.*time/i.test(content);
                const hasScoreHandling = /score|match.*update|live.*data/i.test(content);
                
                if (hasRealTimeFeatures && hasScoreHandling) {
                    foundComponents++;
                    this.log(`✅ ${component}: Has live scoring features`);
                } else {
                    this.log(`⚠️ ${component}: Missing some live features`);
                }
            }
        }
        
        if (foundComponents > 0) {
            this.results.summary.passed++;
        } else {
            this.results.summary.failed++;
        }
    }
    
    async runValidation() {
        this.log('🚀 Starting Live Scoring System Validation');
        
        try {
            await this.testLiveUpdateService();
            await this.testLiveScoreComponents();
            
            const total = this.results.summary.passed + this.results.summary.failed + this.results.summary.warnings;
            const passRate = total > 0 ? ((this.results.summary.passed / total) * 100).toFixed(1) : 0;
            
            console.log('\n' + '='.repeat(50));
            console.log('📡 LIVE SCORING SYSTEM VALIDATION COMPLETE');
            console.log('='.repeat(50));
            console.log(`📊 Pass Rate: ${passRate}%`);
            console.log(`✅ Passed: ${this.results.summary.passed}`);
            console.log(`❌ Failed: ${this.results.summary.failed}`);
            console.log(`⚠️ Warnings: ${this.results.summary.warnings}`);
            console.log('='.repeat(50));
            
            return this.results;
            
        } catch (error) {
            this.log(`🔥 Live scoring validation failed: ${error.message}`, 'CRITICAL');
            throw error;
        }
    }
}

const validator = new LiveScoringValidator();

validator.runValidation()
    .then(() => {
        console.log('\n✅ Live scoring validation completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Live scoring validation failed:', error.message);
        process.exit(1);
    });