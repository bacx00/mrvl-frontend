/**
 * Marvel Rivals Liquipedia Player Scraper
 * Comprehensive scraper to collect all 358 players from Liquipedia
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class MarvelRivalsPlayerScraper {
    constructor() {
        this.baseUrl = 'https://liquipedia.net/marvelrivals';
        this.players = [];
        this.visitedUrls = new Set();
        this.delay = 2000; // 2 second delay between requests
        this.maxRetries = 3;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initBrowser() {
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for production
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async scrapePlayerPage(playerUrl) {
        try {
            console.log(`Scraping player: ${playerUrl}`);
            await this.page.goto(playerUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.sleep(this.delay);

            const playerData = await this.page.evaluate(() => {
                const data = {
                    url: window.location.href,
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
                    notablePerformances: []
                };

                // Extract player name from title or header
                const titleElement = document.querySelector('h1.firstHeading') || document.querySelector('.infobox-header');
                if (titleElement) {
                    data.inGameName = titleElement.textContent.trim();
                }

                // Extract from infobox
                const infobox = document.querySelector('.infobox');
                if (infobox) {
                    const rows = infobox.querySelectorAll('tr');
                    rows.forEach(row => {
                        const label = row.querySelector('th, .infobox-label');
                        const value = row.querySelector('td, .infobox-data');
                        
                        if (!label || !value) return;
                        
                        const labelText = label.textContent.trim().toLowerCase();
                        const valueText = value.textContent.trim();
                        
                        switch(labelText) {
                            case 'name':
                            case 'real name':
                                data.fullName = valueText;
                                break;
                            case 'nationality':
                            case 'country':
                                // Extract country flags and names
                                const countryElements = value.querySelectorAll('.flag, .flagicon');
                                countryElements.forEach(el => {
                                    const country = el.nextSibling?.textContent?.trim() || el.getAttribute('title');
                                    if (country) data.nationality.push(country);
                                });
                                break;
                            case 'birth':
                            case 'born':
                                data.birthDate = valueText;
                                // Extract age if present
                                const ageMatch = valueText.match(/\(age (\d+)\)/);
                                if (ageMatch) data.age = ageMatch[1];
                                break;
                            case 'status':
                                data.status = valueText;
                                break;
                            case 'role':
                            case 'position':
                                data.role = valueText;
                                break;
                            case 'team':
                            case 'current team':
                                data.currentTeam = valueText;
                                break;
                            case 'region':
                                data.region = valueText;
                                break;
                            case 'earnings':
                            case 'total earnings':
                                data.totalEarnings = valueText;
                                break;
                        }
                    });
                }

                // Extract team history
                const teamHistorySection = document.querySelector('#Team_History, #Career, #Teams');
                if (teamHistorySection) {
                    const teamTable = teamHistorySection.parentElement.querySelector('table');
                    if (teamTable) {
                        const rows = teamTable.querySelectorAll('tr');
                        rows.forEach((row, index) => {
                            if (index === 0) return; // Skip header
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 2) {
                                data.pastTeams.push({
                                    period: cells[0]?.textContent.trim(),
                                    team: cells[1]?.textContent.trim(),
                                    achievements: cells[2]?.textContent.trim() || ''
                                });
                            }
                        });
                    }
                }

                // Extract achievements and tournament results
                const achievementsSection = document.querySelector('#Achievements, #Results, #Tournament_Results');
                if (achievementsSection) {
                    const achievementTable = achievementsSection.parentElement.querySelector('table');
                    if (achievementTable) {
                        const rows = achievementTable.querySelectorAll('tr');
                        rows.forEach((row, index) => {
                            if (index === 0) return; // Skip header
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 2) {
                                data.achievements.push({
                                    date: cells[0]?.textContent.trim(),
                                    tournament: cells[1]?.textContent.trim(),
                                    placement: cells[2]?.textContent.trim() || '',
                                    prize: cells[3]?.textContent.trim() || ''
                                });
                            }
                        });
                    }
                }

                // Extract social media links
                const socialLinks = document.querySelectorAll('a[href*="twitter.com"], a[href*="instagram.com"], a[href*="twitch.tv"], a[href*="youtube.com"], a[href*="tiktok.com"]');
                socialLinks.forEach(link => {
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
                    }
                });

                // Extract alternate IDs/aliases
                const aliasSection = document.querySelector('#Aliases, #Former_IDs, #Also_known_as');
                if (aliasSection) {
                    const aliases = aliasSection.parentElement.textContent.match(/Also known as:?\s*([^.]+)/i);
                    if (aliases) {
                        data.alternateIds = aliases[1].split(',').map(id => id.trim());
                    }
                }

                return data;
            });

            return playerData;
        } catch (error) {
            console.error(`Error scraping player ${playerUrl}:`, error);
            return null;
        }
    }

    async findAllPlayerUrls() {
        const playerUrls = new Set();
        
        // Starting points to find players
        const startingPages = [
            `${this.baseUrl}/Portal:Players`,
            `${this.baseUrl}/Category:Players`,
            `${this.baseUrl}/Players`,
            `${this.baseUrl}/Teams`
        ];

        // Also check major teams
        const majorTeams = [
            'Sentinels', '100_Thieves', 'Virtus.pro', 'Fnatic', 'T1', 'Gen.G',
            'Team_Liquid', 'Cloud9', 'TSM', 'NRG_Esports', 'FaZe_Clan',
            'OpTic_Gaming', 'Team_Heretics', 'Karmine_Corp', 'G2_Esports'
        ];

        // Add team pages to starting points
        majorTeams.forEach(team => {
            startingPages.push(`${this.baseUrl}/${team}`);
        });

        for (const startingPage of startingPages) {
            try {
                console.log(`Checking starting page: ${startingPage}`);
                await this.page.goto(startingPage, { waitUntil: 'networkidle2', timeout: 30000 });
                await this.sleep(this.delay);

                const pagePlayerUrls = await this.page.evaluate((baseUrl) => {
                    const urls = new Set();
                    
                    // Find all links that could be player pages
                    const links = document.querySelectorAll('a[href]');
                    links.forEach(link => {
                        const href = link.href;
                        // Player pages usually follow certain patterns
                        if (href.includes('/marvelrivals/') && 
                            (href.match(/\/[A-Z][a-z]+$/) || // Single word names
                             href.match(/\/[A-Z][a-z]+_[A-Z][a-z]+$/) || // Two word names
                             href.match(/\/[A-Za-z0-9_-]+$/) && // Player handles
                             !href.includes('Portal:') &&
                             !href.includes('Category:') &&
                             !href.includes('Template:') &&
                             !href.includes('Special:') &&
                             !href.includes('File:') &&
                             !href.includes('Main_Page') &&
                             !href.includes('Teams') &&
                             !href.includes('Tournaments'))) {
                            urls.add(href);
                        }
                    });
                    
                    return Array.from(urls);
                }, this.baseUrl);

                pagePlayerUrls.forEach(url => playerUrls.add(url));
                console.log(`Found ${pagePlayerUrls.length} potential player URLs on ${startingPage}`);
                
            } catch (error) {
                console.error(`Error checking starting page ${startingPage}:`, error);
            }
        }

        return Array.from(playerUrls);
    }

    async scrapeAllPlayers() {
        await this.initBrowser();
        
        try {
            console.log('Finding all player URLs...');
            const playerUrls = await this.findAllPlayerUrls();
            console.log(`Found ${playerUrls.length} potential player URLs`);

            let validPlayerCount = 0;
            
            for (let i = 0; i < playerUrls.length; i++) {
                const url = playerUrls[i];
                
                if (this.visitedUrls.has(url)) continue;
                this.visitedUrls.add(url);

                console.log(`Processing ${i + 1}/${playerUrls.length}: ${url}`);
                
                const playerData = await this.scrapePlayerPage(url);
                
                if (playerData && (playerData.fullName || playerData.inGameName)) {
                    this.players.push(playerData);
                    validPlayerCount++;
                    console.log(`✓ Valid player found: ${playerData.inGameName || playerData.fullName} (Total: ${validPlayerCount})`);
                    
                    // Save progress every 10 players
                    if (validPlayerCount % 10 === 0) {
                        await this.saveProgress();
                    }
                } else {
                    console.log(`✗ Not a valid player page: ${url}`);
                }

                // Add delay between requests
                await this.sleep(this.delay);
            }

            console.log(`\nScraping complete! Found ${validPlayerCount} valid players.`);
            await this.saveResults();

        } catch (error) {
            console.error('Error during scraping:', error);
        } finally {
            await this.browser.close();
        }
    }

    async saveProgress() {
        const timestamp = new Date().toISOString();
        const progressData = {
            timestamp,
            totalPlayers: this.players.length,
            players: this.players
        };
        
        fs.writeFileSync('marvel_rivals_players_progress.json', JSON.stringify(progressData, null, 2));
        console.log(`Progress saved: ${this.players.length} players`);
    }

    async saveResults() {
        const timestamp = new Date().toISOString();
        const finalData = {
            scrapedAt: timestamp,
            totalPlayers: this.players.length,
            source: 'https://liquipedia.net/marvelrivals/',
            players: this.players.sort((a, b) => (a.inGameName || a.fullName || '').localeCompare(b.inGameName || b.fullName || ''))
        };

        // Save as JSON
        fs.writeFileSync('marvel_rivals_players_complete.json', JSON.stringify(finalData, null, 2));
        
        // Save as CSV for easy import
        const csvHeaders = [
            'inGameName', 'fullName', 'nationality', 'birthDate', 'age', 'region', 
            'status', 'role', 'currentTeam', 'totalEarnings', 'url'
        ];
        
        const csvRows = this.players.map(player => [
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
            player.url || ''
        ]);

        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
            .join('\n');
        
        fs.writeFileSync('marvel_rivals_players_complete.csv', csvContent);

        console.log(`\n=== SCRAPING COMPLETE ===`);
        console.log(`Total players found: ${this.players.length}`);
        console.log(`Files saved:`);
        console.log(`- marvel_rivals_players_complete.json`);
        console.log(`- marvel_rivals_players_complete.csv`);
        console.log(`- marvel_rivals_players_progress.json`);
    }
}

// Run the scraper
const scraper = new MarvelRivalsPlayerScraper();
scraper.scrapeAllPlayers().catch(console.error);

module.exports = MarvelRivalsPlayerScraper;