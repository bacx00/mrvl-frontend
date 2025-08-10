/**
 * Advanced Marvel Rivals Liquipedia Player Scraper
 * Designed to systematically find and scrape all 358+ players
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class AdvancedMarvelRivalsPlayerScraper {
    constructor() {
        this.baseUrl = 'https://liquipedia.net/marvelrivals';
        this.players = new Map(); // Use Map to avoid duplicates
        this.teams = new Set();
        this.tournaments = new Set();
        this.visitedUrls = new Set();
        this.delay = 3000; // 3 second delay to be respectful
        this.maxRetries = 3;
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initBrowser() {
        this.browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setUserAgent(this.userAgent);
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Add extra headers to appear more like a real browser
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        });
    }

    async safeNavigate(url, retries = 0) {
        try {
            console.log(`Navigating to: ${url}`);
            await this.page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 45000 
            });
            await this.sleep(this.delay);
            return true;
        } catch (error) {
            console.error(`Navigation error for ${url}:`, error.message);
            if (retries < this.maxRetries) {
                console.log(`Retrying... (${retries + 1}/${this.maxRetries})`);
                await this.sleep(5000); // Wait longer before retry
                return this.safeNavigate(url, retries + 1);
            }
            return false;
        }
    }

    async scrapePlayerPage(playerUrl) {
        if (!await this.safeNavigate(playerUrl)) {
            return null;
        }

        try {
            const playerData = await this.page.evaluate((url) => {
                const data = {
                    url: url,
                    fullName: '',
                    inGameName: '',
                    alternateIds: [],
                    nationality: [],
                    birthDate: '',
                    age: '',
                    region: '',
                    status: '',
                    role: '',
                    currentTeam: '',
                    pastTeams: [],
                    totalEarnings: '',
                    signatureHeroes: [],
                    socialMedia: {},
                    achievements: [],
                    tournamentPlacements: [],
                    notablePerformances: [],
                    lastUpdated: new Date().toISOString()
                };

                // Extract player name from title
                const titleElement = document.querySelector('h1.firstHeading, h1');
                if (titleElement) {
                    data.inGameName = titleElement.textContent.trim();
                }

                // Extract from infobox - Marvel Rivals specific structure
                const infobox = document.querySelector('.infobox, .player-infobox, .infobox-player');
                if (infobox) {
                    const extractInfoboxData = () => {
                        // Try different infobox structures
                        const rows = infobox.querySelectorAll('tr, .infobox-row');
                        
                        rows.forEach(row => {
                            const labelEl = row.querySelector('th, .infobox-label, .infobox-header');
                            const valueEl = row.querySelector('td, .infobox-data');
                            
                            if (!labelEl || !valueEl) return;
                            
                            const label = labelEl.textContent.trim().toLowerCase();
                            const value = valueEl.textContent.trim();
                            
                            // Handle different label variations
                            if (label.includes('name') && !label.includes('in-game')) {
                                data.fullName = value;
                            } else if (label.includes('romanized name') || label.includes('real name')) {
                                if (!data.fullName) data.fullName = value;
                            } else if (label.includes('nationality') || label.includes('country')) {
                                // Extract flags and country names
                                const flags = valueEl.querySelectorAll('.flag, .flagicon, img[alt*="flag"]');
                                flags.forEach(flag => {
                                    const countryName = flag.getAttribute('alt') || flag.getAttribute('title') || 
                                                       flag.nextSibling?.textContent?.trim() || 
                                                       flag.parentElement?.textContent?.trim();
                                    if (countryName && !data.nationality.includes(countryName)) {
                                        data.nationality.push(countryName.replace(/flag|Flag/g, '').trim());
                                    }
                                });
                                // Fallback to text content
                                if (data.nationality.length === 0 && value) {
                                    data.nationality.push(value);
                                }
                            } else if (label.includes('birth') || label.includes('born')) {
                                data.birthDate = value;
                                const ageMatch = value.match(/\\((?:age\\s*)?([0-9]+)\\)/);
                                if (ageMatch) data.age = ageMatch[1];
                            } else if (label.includes('status')) {
                                data.status = value;
                            } else if (label.includes('role') || label.includes('position')) {
                                data.role = value;
                            } else if (label.includes('team') && !label.includes('former')) {
                                // Get current team
                                const teamLink = valueEl.querySelector('a');
                                data.currentTeam = teamLink ? teamLink.textContent.trim() : value;
                            } else if (label.includes('region')) {
                                data.region = value;
                            } else if (label.includes('earnings') || label.includes('prize')) {
                                data.totalEarnings = value;
                            }
                        });
                    };

                    extractInfoboxData();
                }

                // Extract team history from dedicated section
                const teamHistoryHeaders = ['team history', 'career', 'teams', 'player history'];
                let teamHistorySection = null;
                
                for (const header of teamHistoryHeaders) {
                    teamHistorySection = document.querySelector(`#${header.replace(/\\s+/g, '_')}, .mw-headline:contains("${header}"), h2:contains("${header}"), h3:contains("${header}"), span:contains("${header}")`);
                    if (teamHistorySection) break;
                }

                if (teamHistorySection) {
                    let section = teamHistorySection.closest('h1, h2, h3, h4, h5, h6')?.nextElementSibling;
                    if (!section) section = teamHistorySection.parentElement.nextElementSibling;
                    
                    while (section && !section.matches('h1, h2, h3, h4, h5, h6')) {
                        const table = section.querySelector('table') || (section.tagName === 'TABLE' ? section : null);
                        if (table) {
                            const rows = table.querySelectorAll('tr');
                            let headerProcessed = false;
                            
                            rows.forEach(row => {
                                const cells = row.querySelectorAll('th, td');
                                if (cells.length < 2) return;
                                
                                // Skip header row
                                if (!headerProcessed && row.querySelector('th')) {
                                    headerProcessed = true;
                                    return;
                                }
                                
                                const period = cells[0]?.textContent.trim() || '';
                                const team = cells[1]?.textContent.trim() || '';
                                const achievements = cells[2]?.textContent.trim() || '';
                                
                                if (team) {
                                    data.pastTeams.push({
                                        period,
                                        team,
                                        achievements
                                    });
                                }
                            });
                            break;
                        }
                        section = section.nextElementSibling;
                    }
                }

                // Extract achievements and tournament results
                const achievementHeaders = ['achievements', 'results', 'tournament results', 'notable results'];
                let achievementSection = null;
                
                for (const header of achievementHeaders) {
                    achievementSection = document.querySelector(`#${header.replace(/\\s+/g, '_')}, .mw-headline:contains("${header}"), h2:contains("${header}"), h3:contains("${header}")`);
                    if (achievementSection) break;
                }

                if (achievementSection) {
                    let section = achievementSection.closest('h1, h2, h3, h4, h5, h6')?.nextElementSibling;
                    if (!section) section = achievementSection.parentElement.nextElementSibling;
                    
                    while (section && !section.matches('h1, h2, h3, h4, h5, h6')) {
                        const table = section.querySelector('table') || (section.tagName === 'TABLE' ? section : null);
                        if (table) {
                            const rows = table.querySelectorAll('tr');
                            let headerProcessed = false;
                            
                            rows.forEach(row => {
                                const cells = row.querySelectorAll('th, td');
                                if (cells.length < 2) return;
                                
                                if (!headerProcessed && row.querySelector('th')) {
                                    headerProcessed = true;
                                    return;
                                }
                                
                                const date = cells[0]?.textContent.trim() || '';
                                const tournament = cells[1]?.textContent.trim() || '';
                                const placement = cells[2]?.textContent.trim() || '';
                                const prize = cells[3]?.textContent.trim() || '';
                                
                                if (tournament) {
                                    data.achievements.push({
                                        date,
                                        tournament,
                                        placement,
                                        prize
                                    });
                                }
                            });
                            break;
                        }
                        section = section.nextElementSibling;
                    }
                }

                // Extract social media links
                const socialSelectors = [
                    'a[href*="twitter.com"]', 'a[href*="x.com"]',
                    'a[href*="instagram.com"]', 'a[href*="twitch.tv"]',
                    'a[href*="youtube.com"]', 'a[href*="tiktok.com"]',
                    'a[href*="discord."]'
                ];
                
                socialSelectors.forEach(selector => {
                    const links = document.querySelectorAll(selector);
                    links.forEach(link => {
                        const url = link.href;
                        if (url.includes('twitter.com') || url.includes('x.com')) {
                            data.socialMedia.twitter = url;
                        } else if (url.includes('instagram.com')) {
                            data.socialMedia.instagram = url;
                        } else if (url.includes('twitch.tv')) {
                            data.socialMedia.twitch = url;
                        } else if (url.includes('youtube.com')) {
                            data.socialMedia.youtube = url;
                        } else if (url.includes('tiktok.com')) {
                            data.socialMedia.tiktok = url;
                        } else if (url.includes('discord.')) {
                            data.socialMedia.discord = url;
                        }
                    });
                });

                // Extract signature heroes/characters
                const heroSections = document.querySelectorAll('[class*="hero"], [class*="character"], [id*="hero"], [id*="character"]');
                heroSections.forEach(section => {
                    const images = section.querySelectorAll('img[alt]');
                    images.forEach(img => {
                        const heroName = img.getAttribute('alt');
                        if (heroName && !heroName.includes('flag') && !heroName.includes('logo')) {
                            data.signatureHeroes.push(heroName);
                        }
                    });
                });

                // Clean up data
                data.nationality = [...new Set(data.nationality.filter(n => n && n.length > 1))];
                data.signatureHeroes = [...new Set(data.signatureHeroes)];
                data.alternateIds = data.alternateIds.filter(id => id && id !== data.inGameName);

                return data;
            }, playerUrl);

            return playerData;

        } catch (error) {
            console.error(`Error scraping player page ${playerUrl}:`, error);
            return null;
        }
    }

    async discoverPlayerUrls() {
        const playerUrls = new Set();
        
        // Primary discovery sources
        const discoveryUrls = [
            `${this.baseUrl}/Portal:Players`,
            `${this.baseUrl}/Category:Players`,
            `${this.baseUrl}/Portal:Teams`,
            `${this.baseUrl}/Category:Teams`,
            `${this.baseUrl}/Main_Page`
        ];

        // Discover from main discovery pages
        for (const url of discoveryUrls) {
            if (!await this.safeNavigate(url)) continue;

            const foundUrls = await this.page.evaluate((baseUrl) => {
                const urls = new Set();
                const links = document.querySelectorAll('a[href*="/marvelrivals/"]');
                
                links.forEach(link => {
                    const href = link.href;
                    const path = href.split('/marvelrivals/')[1];
                    
                    if (!path) return;
                    
                    // Filter out non-player pages
                    const excluded = [
                        'Portal:', 'Category:', 'Template:', 'Special:', 'File:', 'User:', 'Talk:',
                        'Main_Page', 'Rules', 'Tournaments', 'Leagues', 'Patches', 'Heroes',
                        'Maps', 'Game_Modes', 'Statistics', 'News'
                    ];
                    
                    const isExcluded = excluded.some(ex => path.startsWith(ex));
                    if (isExcluded) return;
                    
                    // Likely player page patterns
                    if (path.match(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/)) {
                        urls.add(href);
                    }
                });
                
                return Array.from(urls);
            }, this.baseUrl);

            foundUrls.forEach(url => playerUrls.add(url));
            console.log(`Discovered ${foundUrls.length} URLs from ${url}`);
        }

        return Array.from(playerUrls);
    }

    async scrapeAllPlayers() {
        await this.initBrowser();
        
        try {
            console.log('🔍 Starting comprehensive player discovery...');
            const playerUrls = await this.discoverPlayerUrls();
            console.log(`📊 Found ${playerUrls.length} potential player URLs`);

            let processedCount = 0;
            let validPlayerCount = 0;
            
            for (const url of playerUrls) {
                if (this.visitedUrls.has(url)) continue;
                this.visitedUrls.add(url);

                processedCount++;
                console.log(`\\n[${processedCount}/${playerUrls.length}] Processing: ${url}`);
                
                const playerData = await this.scrapePlayerPage(url);
                
                if (this.isValidPlayer(playerData)) {
                    const playerId = this.getPlayerId(playerData);
                    this.players.set(playerId, playerData);
                    validPlayerCount++;
                    
                    console.log(`✅ Player #${validPlayerCount}: ${playerData.inGameName || playerData.fullName}`);
                    console.log(`   Role: ${playerData.role} | Team: ${playerData.currentTeam} | Region: ${playerData.region}`);
                    
                    // Save progress every 25 players
                    if (validPlayerCount % 25 === 0) {
                        await this.saveProgress();
                    }
                } else {
                    console.log(`❌ Not a valid player page`);
                }
            }

            console.log(`\\n🎉 Scraping completed!`);
            console.log(`📈 Total valid players found: ${validPlayerCount}`);
            console.log(`🔗 Total URLs processed: ${processedCount}`);
            
            await this.saveResults();

        } catch (error) {
            console.error('💥 Fatal error during scraping:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    isValidPlayer(data) {
        if (!data) return false;
        
        // Must have at least a name
        if (!data.inGameName && !data.fullName) return false;
        
        // Should have some player-specific information
        const hasPlayerInfo = data.role || data.currentTeam || data.pastTeams.length > 0 || 
                             data.nationality.length > 0 || data.achievements.length > 0;
        
        return hasPlayerInfo;
    }

    getPlayerId(playerData) {
        return playerData.inGameName || playerData.fullName || playerData.url.split('/').pop();
    }

    async saveProgress() {
        const playersArray = Array.from(this.players.values());
        const progressData = {
            timestamp: new Date().toISOString(),
            totalPlayers: playersArray.length,
            lastPlayer: playersArray[playersArray.length - 1]?.inGameName || 'Unknown',
            players: playersArray
        };
        
        fs.writeFileSync('marvel_rivals_players_progress.json', JSON.stringify(progressData, null, 2));
        console.log(`💾 Progress saved: ${playersArray.length} players`);
    }

    async saveResults() {
        const playersArray = Array.from(this.players.values()).sort((a, b) => 
            (a.inGameName || a.fullName || '').localeCompare(b.inGameName || b.fullName || '')
        );

        const finalData = {
            scrapedAt: new Date().toISOString(),
            totalPlayers: playersArray.length,
            source: 'https://liquipedia.net/marvelrivals/',
            metadata: {
                roles: this.getRoleDistribution(playersArray),
                regions: this.getRegionDistribution(playersArray),
                teams: this.getTeamDistribution(playersArray)
            },
            players: playersArray
        };

        // Save main JSON file
        fs.writeFileSync('marvel_rivals_complete_database.json', JSON.stringify(finalData, null, 2));
        
        // Save CSV for database import
        this.saveAsCSV(playersArray);
        
        // Save summary report
        this.saveSummaryReport(finalData);

        console.log(`\\n📊 === FINAL RESULTS ===`);
        console.log(`✅ Total players: ${playersArray.length}`);
        console.log(`📁 Files created:`);
        console.log(`   • marvel_rivals_complete_database.json`);
        console.log(`   • marvel_rivals_players.csv`);
        console.log(`   • marvel_rivals_scraping_report.json`);
    }

    getRoleDistribution(players) {
        const roles = {};
        players.forEach(p => {
            const role = p.role || 'Unknown';
            roles[role] = (roles[role] || 0) + 1;
        });
        return roles;
    }

    getRegionDistribution(players) {
        const regions = {};
        players.forEach(p => {
            const region = p.region || 'Unknown';
            regions[region] = (regions[region] || 0) + 1;
        });
        return regions;
    }

    getTeamDistribution(players) {
        const teams = {};
        players.forEach(p => {
            const team = p.currentTeam || 'Free Agent';
            teams[team] = (teams[team] || 0) + 1;
        });
        return Object.fromEntries(
            Object.entries(teams)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 20) // Top 20 teams
        );
    }

    saveAsCSV(players) {
        const csvHeaders = [
            'inGameName', 'fullName', 'nationality', 'birthDate', 'age', 'region', 
            'status', 'role', 'currentTeam', 'totalEarnings', 'socialTwitter', 
            'socialTwitch', 'url'
        ];
        
        const csvRows = players.map(player => [
            player.inGameName || '',
            player.fullName || '',
            player.nationality.join('; ') || '',
            player.birthDate || '',
            player.age || '',
            player.region || '',
            player.status || '',
            player.role || '',
            player.currentTeam || '',
            player.totalEarnings || '',
            player.socialMedia.twitter || '',
            player.socialMedia.twitch || '',
            player.url || ''
        ]);

        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\\n');
        
        fs.writeFileSync('marvel_rivals_players.csv', csvContent);
    }

    saveSummaryReport(data) {
        const report = {
            summary: {
                totalPlayersFound: data.totalPlayers,
                scrapingDate: data.scrapedAt,
                targetGoal: 358,
                completionPercentage: ((data.totalPlayers / 358) * 100).toFixed(1)
            },
            distributions: data.metadata,
            topPlayers: data.players.slice(0, 10).map(p => ({
                name: p.inGameName || p.fullName,
                team: p.currentTeam,
                role: p.role,
                achievements: p.achievements.length
            }))
        };
        
        fs.writeFileSync('marvel_rivals_scraping_report.json', JSON.stringify(report, null, 2));
    }
}

// Execute the scraper
console.log('🚀 Marvel Rivals Player Scraper Starting...');
console.log('Target: Find all 358+ players from Liquipedia');
console.log('⚠️  Please ensure stable internet connection');
console.log('⏱️  Estimated time: 30-60 minutes\\n');

const scraper = new AdvancedMarvelRivalsPlayerScraper();
scraper.scrapeAllPlayers().catch(console.error);

module.exports = AdvancedMarvelRivalsPlayerScraper;