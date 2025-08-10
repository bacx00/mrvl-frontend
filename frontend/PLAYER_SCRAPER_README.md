# Marvel Rivals Player Scraper

Comprehensive solution to collect all 358+ Marvel Rivals players from Liquipedia with complete biographical and competitive data.

## 🎯 Goal

Extract detailed information for every Marvel Rivals professional player including:

- ✅ Personal details (name, nationality, age)
- ✅ Competitive info (team, role, region)
- ✅ Career history (past teams, achievements)
- ✅ Performance data (earnings, tournament results)
- ✅ Social media links
- ✅ Signature heroes/characters

## 📁 Files Overview

### Core Scrapers
- **`advanced-marvel-rivals-scraper.js`** - Main web scraper (most comprehensive)
- **`marvel-rivals-player-scraper.js`** - Alternative scraper implementation
- **`manual-player-data-collector.js`** - Fallback manual data generator

### Execution & Utilities
- **`run-player-scraper.js`** - Setup and execution script with monitoring
- **`PLAYER_SCRAPER_README.md`** - This documentation

## 🚀 Quick Start

### Option 1: Automated Web Scraping (Recommended)

```bash
# Navigate to the project directory
cd /var/www/mrvl-frontend/frontend

# Run the comprehensive scraper
node run-player-scraper.js --run

# Or run interactively
node run-player-scraper.js
```

### Option 2: Manual Data Generation (Fallback)

```bash
# Generate database with known + simulated data
node manual-player-data-collector.js
```

## 📊 Output Files

### Generated Files (Web Scraper)
- `marvel_rivals_complete_database.json` - Complete player database
- `marvel_rivals_players.csv` - CSV for database import  
- `marvel_rivals_scraping_report.json` - Summary report
- `marvel_rivals_players_progress.json` - Progress backup

### Generated Files (Manual)
- `marvel_rivals_manual_database.json` - Manual database
- `marvel_rivals_manual_players.csv` - Manual CSV export
- `marvel_rivals_manual_summary.json` - Manual summary

## 🔧 Technical Details

### Web Scraper Features
- **Respectful scraping**: 3-second delays between requests
- **Robust error handling**: Automatic retries and failover
- **Progress saving**: Saves every 25 players
- **Comprehensive discovery**: Multiple discovery methods
- **Advanced parsing**: Handles various Liquipedia page formats

### Data Structure
```json
{
  "fullName": "Mark Kvashin",
  "inGameName": "Korova", 
  "alternateIds": ["KorovaMR"],
  "nationality": ["Canada"],
  "birthDate": "1995-03-15",
  "age": "29",
  "region": "North America",
  "status": "Active",
  "role": "Strategist",
  "currentTeam": "Sentinels",
  "pastTeams": [
    {
      "period": "2023-2024",
      "team": "Previous Team",
      "achievements": "Tournament wins"
    }
  ],
  "totalEarnings": "$50,000",
  "signatureHeroes": ["Mantis", "Luna Snow"],
  "socialMedia": {
    "twitter": "https://twitter.com/KorovaMR",
    "twitch": "https://twitch.tv/korova"
  },
  "achievements": [
    {
      "date": "2024-01-15",
      "tournament": "Marvel Rivals Championship",
      "placement": "1st",
      "prize": "$25,000"
    }
  ],
  "url": "https://liquipedia.net/marvelrivals/Korova"
}
```

## ⚙️ Configuration

### Scraper Settings
```javascript
// In advanced-marvel-rivals-scraper.js
this.delay = 3000; // Delay between requests (ms)
this.maxRetries = 3; // Max retries per page
this.userAgent = 'Mozilla/5.0 ...'; // Browser user agent
```

### Discovery Sources
The scraper checks multiple sources:
- Portal:Players
- Category:Players  
- Portal:Teams
- Major team pages
- Tournament participant lists

## 🎮 Known Teams & Players

### North America
- **Sentinels**: Korova, Kawa, Tenzou, Fran, mikoyama, Mint
- **100 Thieves**: Oni, ImDylan, Vash
- **NRG Esports**
- **TSM**
- **Cloud9**

### Europe  
- **Fnatic**
- **Team Heretics**
- **Karmine Corp**
- **G2 Esports**

### Asia-Pacific
- **Gen.G** 
- **T1**
- **DRX**
- **Virtus.pro**

## 📈 Expected Results

### Target Metrics
- **Total Players**: 358+
- **Completion Time**: 30-60 minutes
- **Success Rate**: 90%+ valid player data
- **Data Completeness**: 80%+ fields populated

### Role Distribution (Expected)
- Strategist: ~30% (107 players)
- Duelist: ~40% (143 players)  
- Vanguard: ~30% (108 players)

### Regional Distribution (Expected)
- North America: ~35%
- Asia-Pacific: ~30%
- Europe: ~25%
- Other regions: ~10%

## 🛠️ Troubleshooting

### Common Issues

1. **Rate Limiting (429 errors)**
   ```bash
   # Increase delay in scraper
   this.delay = 5000; // 5 seconds
   ```

2. **Incomplete Data**
   - Check `marvel_rivals_players_progress.json` for partial results
   - Resume from last successful player
   - Run manual collector as fallback

3. **Browser Issues**
   ```bash
   # Install missing dependencies
   npm install puppeteer
   # Or use system Chrome
   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
   ```

4. **Memory Issues**
   - Run scraper in smaller batches
   - Clear browser cache periodically
   - Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 run-player-scraper.js --run
   ```

### Debug Mode
```bash
# Run with verbose logging
DEBUG=1 node advanced-marvel-rivals-scraper.js

# Monitor network requests
DEBUG=network node advanced-marvel-rivals-scraper.js
```

## 📋 Validation

### Data Quality Checks
- ✅ Player name present (inGameName or fullName)
- ✅ Valid role (Strategist/Duelist/Vanguard)
- ✅ Team information available
- ✅ Unique player entries (no duplicates)
- ✅ Valid URL format

### Post-Processing
```javascript
// Validate scraped data
const players = JSON.parse(fs.readFileSync('marvel_rivals_complete_database.json'));
const validPlayers = players.players.filter(p => p.inGameName && p.role);
console.log(`Valid players: ${validPlayers.length}/${players.players.length}`);
```

## 🔄 Integration

### Database Import (SQL)
```sql
CREATE TABLE marvel_rivals_players (
    id SERIAL PRIMARY KEY,
    in_game_name VARCHAR(100),
    full_name VARCHAR(200),
    nationality TEXT[],
    region VARCHAR(50),
    role VARCHAR(20),
    current_team VARCHAR(100),
    total_earnings VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Import CSV
COPY marvel_rivals_players FROM 'marvel_rivals_players.csv' WITH CSV HEADER;
```

### API Integration  
```javascript
// Load player database
const playerDB = require('./marvel_rivals_complete_database.json');

// Search players
function searchPlayers(query) {
    return playerDB.players.filter(p => 
        p.inGameName.toLowerCase().includes(query.toLowerCase()) ||
        p.fullName.toLowerCase().includes(query.toLowerCase())
    );
}

// Get by team
function getTeamRoster(teamName) {
    return playerDB.players.filter(p => p.currentTeam === teamName);
}
```

## 📞 Support

### Logs & Monitoring
- Check `scraper_log_*.txt` for detailed execution logs
- Monitor progress with `marvel_rivals_players_progress.json`
- Review summary in `marvel_rivals_scraping_report.json`

### Performance Tips
- Run during off-peak hours to avoid rate limits
- Use stable internet connection
- Monitor disk space (logs can be large)
- Consider running on server/VPS for reliability

## 🎯 Success Criteria

### Completion Indicators
- ✅ 358+ unique players discovered
- ✅ 90%+ data completeness rate
- ✅ All major teams covered
- ✅ Regional distribution matches expected
- ✅ Export files generated successfully

### Quality Metrics
- Player name accuracy: 100%
- Team affiliation accuracy: 95%+
- Role classification accuracy: 90%+
- Social media link validity: 80%+
- Tournament data completeness: 70%+

---

**Ready to collect all Marvel Rivals players? Run the scraper and build the most comprehensive player database available! 🚀**