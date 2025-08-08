<?php

namespace App\Services;

use App\Models\Team;
use App\Models\Player;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class LiquipediaScraper
{
    private Client $client;
    private array $scrapingReport = [];
    private int $totalTeamsFound = 0;
    private int $totalPlayersFound = 0;
    private int $successfulTeams = 0;
    private int $successfulPlayers = 0;
    private array $errors = [];
    private int $requestDelay = 2000; // 2 seconds between requests
    
    // Known Marvel Rivals roles
    private array $validRoles = [
        'Duelist', 'Vanguard', 'Strategist', 'Coach', 'Substitute', 'Flex'
    ];

    // Social media platforms to extract
    private array $socialPlatforms = [
        'twitter' => ['twitter.com', 'x.com'],
        'instagram' => ['instagram.com'],
        'youtube' => ['youtube.com', 'youtu.be'],
        'twitch' => ['twitch.tv'],
        'discord' => ['discord.gg', 'discord.com'],
        'tiktok' => ['tiktok.com'],
        'facebook' => ['facebook.com']
    ];

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'headers' => [
                'User-Agent' => 'Marvel Rivals Data Scraper (Educational/Research Purpose) - Contact: admin@mrvl-esports.com'
            ]
        ]);

        $this->initializeReport();
    }

    /**
     * Main scraping method - scrapes all teams and players
     */
    public function scrapeAllData(): array
    {
        try {
            Log::info('Starting comprehensive Marvel Rivals Liquipedia scraping');
            
            // Step 1: Get all team URLs from the Teams Portal
            $teamUrls = $this->scrapeTeamsPortal();
            $this->totalTeamsFound = count($teamUrls);
            
            Log::info("Found {$this->totalTeamsFound} teams to scrape");
            
            // Step 2: Scrape each team and their players
            foreach ($teamUrls as $teamUrl) {
                try {
                    $this->scrapeTeam($teamUrl);
                    $this->successfulTeams++;
                    
                    // Respect rate limiting
                    usleep($this->requestDelay * 1000);
                } catch (Exception $e) {
                    $this->logError("Team scraping failed for {$teamUrl}", $e);
                }
            }
            
            $this->finalizeReport();
            Log::info('Marvel Rivals scraping completed', $this->scrapingReport);
            
            return $this->scrapingReport;
            
        } catch (Exception $e) {
            Log::error('Marvel Rivals scraping failed completely', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $this->logError('Complete scraping failure', $e);
            return $this->scrapingReport;
        }
    }

    /**
     * Scrape the Teams Portal to get all team URLs
     */
    private function scrapeTeamsPortal(): array
    {
        $teamUrls = [];
        $portalUrl = 'https://liquipedia.net/marvelrivals/Portal:Teams';
        
        try {
            $response = $this->client->get($portalUrl);
            $html = $response->getBody()->getContents();
            $crawler = new Crawler($html);

            // Look for team links in various sections
            $teamLinks = $crawler->filter('a[href*="/marvelrivals/"]')->each(function (Crawler $node) {
                $href = $node->attr('href');
                if ($this->isTeamUrl($href)) {
                    return 'https://liquipedia.net' . $href;
                }
                return null;
            });

            $teamUrls = array_filter(array_unique($teamLinks));
            
            // If no teams found in portal, try alternative methods
            if (empty($teamUrls)) {
                $teamUrls = $this->scrapeTeamsFromTournaments();
            }

        } catch (Exception $e) {
            Log::warning('Failed to scrape teams portal, trying alternative methods', [
                'error' => $e->getMessage()
            ]);
            $teamUrls = $this->scrapeTeamsFromTournaments();
        }

        return array_values($teamUrls);
    }

    /**
     * Alternative method: scrape teams from tournament pages
     */
    private function scrapeTeamsFromTournaments(): array
    {
        $teamUrls = [];
        $tournamentUrls = [
            'https://liquipedia.net/marvelrivals/Marvel_Rivals_Invitational/2025/EMEA',
            'https://liquipedia.net/marvelrivals/MR_Ignite/2025/Stage_1/EMEA',
            'https://liquipedia.net/marvelrivals/MR_Ignite/2025/Stage_1/Americas',
            'https://liquipedia.net/marvelrivals/Marvel_Rivals_Invitational/2025/Americas',
        ];

        foreach ($tournamentUrls as $tournamentUrl) {
            try {
                $response = $this->client->get($tournamentUrl);
                $html = $response->getBody()->getContents();
                $crawler = new Crawler($html);

                $tournamentTeams = $crawler->filter('a[href*="/marvelrivals/"]')->each(function (Crawler $node) {
                    $href = $node->attr('href');
                    if ($this->isTeamUrl($href)) {
                        return 'https://liquipedia.net' . $href;
                    }
                    return null;
                });

                $teamUrls = array_merge($teamUrls, array_filter($tournamentTeams));
                usleep($this->requestDelay * 1000);

            } catch (Exception $e) {
                Log::warning("Failed to scrape tournament: {$tournamentUrl}", [
                    'error' => $e->getMessage()
                ]);
            }
        }

        return array_values(array_unique($teamUrls));
    }

    /**
     * Check if URL is a team page
     */
    private function isTeamUrl(string $href): bool
    {
        // Exclude common non-team pages
        $excludePatterns = [
            '/Portal:', '/Category:', '/File:', '/Template:', '/User:', '/Talk:',
            '/Main_Page', '/Special:', '/Help:', '/MediaWiki:'
        ];

        foreach ($excludePatterns as $pattern) {
            if (strpos($href, $pattern) !== false) {
                return false;
            }
        }

        // Check if it looks like a team URL (typically team names)
        return preg_match('/\/[A-Z][a-zA-Z0-9_\-\.]+$/', $href);
    }

    /**
     * Scrape comprehensive team data
     */
    private function scrapeTeam(string $teamUrl): void
    {
        try {
            $response = $this->client->get($teamUrl);
            $html = $response->getBody()->getContents();
            $crawler = new Crawler($html);

            // Extract team information
            $teamData = $this->extractTeamData($crawler, $teamUrl);
            
            if (!$teamData) {
                throw new Exception('No team data extracted');
            }

            // Create or update team
            $team = Team::updateOrCreate(
                ['liquipedia_url' => $teamUrl],
                array_merge($teamData, ['last_scraped_at' => now()])
            );

            // Extract and create players (6 main + coach)
            $playersData = $this->extractPlayersData($crawler, $team->id);
            
            foreach ($playersData as $playerData) {
                try {
                    Player::updateOrCreate(
                        [
                            'team_id' => $team->id,
                            'name' => $playerData['name']
                        ],
                        array_merge($playerData, ['last_scraped_at' => now()])
                    );
                    $this->successfulPlayers++;
                } catch (Exception $e) {
                    $this->logError("Player creation failed for {$playerData['name']}", $e);
                }
            }

            $this->totalPlayersFound += count($playersData);
            
            Log::info("Successfully scraped team: {$team->name}", [
                'team_id' => $team->id,
                'players_count' => count($playersData)
            ]);

        } catch (Exception $e) {
            $this->logError("Team scraping failed for {$teamUrl}", $e);
            throw $e;
        }
    }

    /**
     * Extract comprehensive team data from page
     */
    private function extractTeamData(Crawler $crawler, string $teamUrl): ?array
    {
        try {
            $teamData = [
                'liquipedia_url' => $teamUrl,
                'liquipedia_id' => $this->extractLiquipediaId($teamUrl),
            ];

            // Extract team name (from page title)
            $teamName = $crawler->filter('h1.firstHeading')->first();
            if ($teamName->count()) {
                $teamData['name'] = trim($teamName->text());
                $teamData['short_name'] = $this->generateShortName($teamData['name']);
            }

            // Extract team information from infobox
            $infobox = $crawler->filter('.infobox, .infobox-team');
            if ($infobox->count()) {
                $teamData = array_merge($teamData, $this->extractInfoboxData($infobox));
            }

            // Extract social media links
            $socialLinks = $this->extractSocialLinks($crawler);
            if (!empty($socialLinks)) {
                $teamData['social_links'] = $socialLinks;
            }

            // Extract earnings and statistics
            $earningsData = $this->extractEarningsData($crawler);
            if ($earningsData) {
                $teamData = array_merge($teamData, $earningsData);
            }

            // Extract coach information
            $coachData = $this->extractCoachData($crawler);
            if ($coachData) {
                $teamData = array_merge($teamData, $coachData);
            }

            return !empty($teamData['name']) ? $teamData : null;

        } catch (Exception $e) {
            Log::error('Team data extraction failed', [
                'url' => $teamUrl,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Extract team infobox data
     */
    private function extractInfoboxData(Crawler $infobox): array
    {
        $data = [];

        // Extract various fields from infobox rows
        $infobox->filter('tr')->each(function (Crawler $row) use (&$data) {
            $header = $row->filter('th, .infobox-header');
            $cell = $row->filter('td, .infobox-data');

            if ($header->count() && $cell->count()) {
                $fieldName = strtolower(trim($header->text()));
                $fieldValue = trim($cell->text());

                switch ($fieldName) {
                    case 'region':
                    case 'location':
                        $data['region'] = $fieldValue;
                        break;
                    case 'country':
                        $data['country'] = $fieldValue;
                        // Extract country code and flag
                        $flagImg = $cell->filter('img[src*="flag"]')->first();
                        if ($flagImg->count()) {
                            $data['flag_url'] = $this->resolveUrl($flagImg->attr('src'));
                            $data['country_code'] = $this->extractCountryCode($flagImg->attr('src'));
                        }
                        break;
                    case 'founded':
                    case 'formed':
                        $data['founded_at'] = $this->parseDate($fieldValue);
                        break;
                    case 'disbanded':
                        $data['disbanded_at'] = $this->parseDate($fieldValue);
                        $data['status'] = 'disbanded';
                        break;
                    case 'earnings':
                    case 'total earnings':
                        $data['total_earnings'] = $this->parseEarnings($fieldValue);
                        break;
                }
            }

            // Extract logo from infobox
            $logoImg = $row->filter('img[src*="logo"], img[alt*="logo"]')->first();
            if ($logoImg->count()) {
                $data['logo_url'] = $this->resolveUrl($logoImg->attr('src'));
            }
        });

        return $data;
    }

    /**
     * Extract social media links
     */
    private function extractSocialLinks(Crawler $crawler): array
    {
        $socialLinks = [];

        foreach ($this->socialPlatforms as $platform => $domains) {
            foreach ($domains as $domain) {
                $links = $crawler->filter("a[href*='{$domain}']")->each(function (Crawler $node) {
                    return $node->attr('href');
                });

                if (!empty($links)) {
                    $socialLinks[$platform] = $links[0]; // Take first valid link
                    break;
                }
            }
        }

        return $socialLinks;
    }

    /**
     * Extract earnings data
     */
    private function extractEarningsData(Crawler $crawler): ?array
    {
        $data = [];

        // Look for earnings in various places
        $earningsText = $crawler->filter('.earnings, .prize-pool, .total-earnings')->first();
        if ($earningsText->count()) {
            $earnings = $this->parseEarnings($earningsText->text());
            if ($earnings > 0) {
                $data['total_earnings'] = $earnings;
            }
        }

        return !empty($data) ? $data : null;
    }

    /**
     * Extract coach information
     */
    private function extractCoachData(Crawler $crawler): ?array
    {
        $coachData = [];

        // Look for coach in roster or staff sections
        $coachSection = $crawler->filter('.roster, .staff, .team-members')->first();
        if ($coachSection->count()) {
            $coachLinks = $coachSection->filter('a[href*="/marvelrivals/"]:contains("Coach")')->first();
            if ($coachLinks->count()) {
                $coachData['coach_name'] = trim($coachLinks->text());
                $coachUrl = $this->resolveUrl($coachLinks->attr('href'));
                
                // Scrape coach details if URL available
                if ($coachUrl) {
                    $coachDetails = $this->scrapeCoachDetails($coachUrl);
                    if ($coachDetails) {
                        $coachData = array_merge($coachData, $coachDetails);
                    }
                }
            }
        }

        return !empty($coachData) ? $coachData : null;
    }

    /**
     * Extract players data (6 main players + coach)
     */
    private function extractPlayersData(Crawler $crawler, int $teamId): array
    {
        $playersData = [];

        // Look for player roster in various sections
        $rosterSection = $crawler->filter('.roster, .team-members, .current-roster, table.wikitable');
        
        if ($rosterSection->count()) {
            $playerRows = $rosterSection->filter('tr')->each(function (Crawler $row) use ($teamId) {
                $playerData = $this->extractPlayerFromRow($row, $teamId);
                return $playerData;
            });

            $playersData = array_filter($playerRows);
        }

        // If no players found in roster, try alternative methods
        if (empty($playersData)) {
            $playersData = $this->extractPlayersAlternative($crawler, $teamId);
        }

        // Ensure we have exactly 6 main players + 1 coach maximum
        $playersData = $this->validatePlayerRoster($playersData);

        return $playersData;
    }

    /**
     * Extract player data from table row
     */
    private function extractPlayerFromRow(Crawler $row, int $teamId): ?array
    {
        try {
            $cells = $row->filter('td');
            if ($cells->count() < 2) {
                return null; // Not enough cells for player data
            }

            $playerData = [
                'team_id' => $teamId,
                'status' => 'active'
            ];

            // Extract player name (usually first column or with link)
            $nameCell = $cells->first();
            $playerLink = $nameCell->filter('a')->first();
            
            if ($playerLink->count()) {
                $playerData['name'] = trim($playerLink->text());
                $playerData['username'] = $playerData['name'];
                $playerData['liquipedia_url'] = $this->resolveUrl($playerLink->attr('href'));
                $playerData['liquipedia_id'] = $this->extractLiquipediaId($playerData['liquipedia_url']);
            } else {
                $playerData['name'] = trim($nameCell->text());
                $playerData['username'] = $playerData['name'];
            }

            // Extract country flag
            $flagImg = $row->filter('img[src*="flag"]')->first();
            if ($flagImg->count()) {
                $playerData['flag_url'] = $this->resolveUrl($flagImg->attr('src'));
                $playerData['country_code'] = $this->extractCountryCode($flagImg->attr('src'));
                $playerData['country'] = $this->extractCountryName($flagImg->attr('alt') ?: '');
            }

            // Extract role (look in various cells)
            $cells->each(function (Crawler $cell, $index) use (&$playerData) {
                $cellText = trim($cell->text());
                if (in_array($cellText, $this->validRoles)) {
                    $playerData['role'] = $cellText;
                }
            });

            // If player URL available, scrape detailed data
            if (!empty($playerData['liquipedia_url'])) {
                $detailedData = $this->scrapePlayerDetails($playerData['liquipedia_url']);
                if ($detailedData) {
                    $playerData = array_merge($playerData, $detailedData);
                }
            }

            return !empty($playerData['name']) ? $playerData : null;

        } catch (Exception $e) {
            Log::warning('Player extraction from row failed', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Alternative method to extract players
     */
    private function extractPlayersAlternative(Crawler $crawler, int $teamId): array
    {
        $playersData = [];

        // Look for player links in the page
        $playerLinks = $crawler->filter('a[href*="/marvelrivals/"]')->each(function (Crawler $node) {
            $href = $node->attr('href');
            $text = trim($node->text());
            
            // Skip if it looks like a non-player link
            if ($this->isPlayerUrl($href) && $this->isValidPlayerName($text)) {
                return [
                    'name' => $text,
                    'url' => $this->resolveUrl($href)
                ];
            }
            return null;
        });

        $playerLinks = array_filter($playerLinks);

        // Scrape each player found
        foreach (array_slice($playerLinks, 0, 7) as $playerLink) { // Max 7 (6 + 1 coach)
            try {
                $playerData = $this->scrapePlayerDetails($playerLink['url']);
                if ($playerData) {
                    $playerData['team_id'] = $teamId;
                    $playerData['name'] = $playerLink['name'];
                    $playersData[] = $playerData;
                }
            } catch (Exception $e) {
                Log::warning("Failed to scrape player details", [
                    'player' => $playerLink['name'],
                    'url' => $playerLink['url'],
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $playersData;
    }

    /**
     * Scrape detailed player information
     */
    private function scrapePlayerDetails(string $playerUrl): ?array
    {
        try {
            $response = $this->client->get($playerUrl);
            $html = $response->getBody()->getContents();
            $crawler = new Crawler($html);

            $playerData = [
                'liquipedia_url' => $playerUrl,
                'liquipedia_id' => $this->extractLiquipediaId($playerUrl)
            ];

            // Extract from infobox
            $infobox = $crawler->filter('.infobox, .infobox-player');
            if ($infobox->count()) {
                $playerData = array_merge($playerData, $this->extractPlayerInfoboxData($infobox));
            }

            // Extract social links
            $socialLinks = $this->extractSocialLinks($crawler);
            if (!empty($socialLinks)) {
                $playerData['social_links'] = $socialLinks;
            }

            // Extract earnings
            $earningsData = $this->extractEarningsData($crawler);
            if ($earningsData) {
                $playerData = array_merge($playerData, $earningsData);
            }

            // Rate limiting for player requests
            usleep(($this->requestDelay / 2) * 1000); // Half delay for player requests

            return $playerData;

        } catch (Exception $e) {
            Log::warning("Player details scraping failed", [
                'url' => $playerUrl,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Extract player infobox data
     */
    private function extractPlayerInfoboxData(Crawler $infobox): array
    {
        $data = [];

        $infobox->filter('tr')->each(function (Crawler $row) use (&$data) {
            $header = $row->filter('th, .infobox-header');
            $cell = $row->filter('td, .infobox-data');

            if ($header->count() && $cell->count()) {
                $fieldName = strtolower(trim($header->text()));
                $fieldValue = trim($cell->text());

                switch ($fieldName) {
                    case 'real name':
                    case 'name':
                        if (!empty($fieldValue) && $fieldValue !== 'TBD') {
                            $data['real_name'] = $fieldValue;
                        }
                        break;
                    case 'birth':
                    case 'born':
                    case 'birthday':
                        $data['birth_date'] = $this->parseDate($fieldValue);
                        if ($data['birth_date']) {
                            $data['age'] = now()->diffInYears($data['birth_date']);
                        }
                        break;
                    case 'country':
                    case 'nationality':
                        $data['country'] = $fieldValue;
                        $flagImg = $cell->filter('img[src*="flag"]')->first();
                        if ($flagImg->count()) {
                            $data['flag_url'] = $this->resolveUrl($flagImg->attr('src'));
                            $data['country_code'] = $this->extractCountryCode($flagImg->attr('src'));
                        }
                        break;
                    case 'role':
                    case 'position':
                        if (in_array($fieldValue, $this->validRoles)) {
                            $data['role'] = $fieldValue;
                        }
                        break;
                    case 'elo':
                    case 'rating':
                        $data['elo_rating'] = intval($fieldValue);
                        break;
                    case 'earnings':
                    case 'total earnings':
                        $data['total_earnings'] = $this->parseEarnings($fieldValue);
                        break;
                    case 'career start':
                    case 'debut':
                        $data['career_start'] = $this->parseDate($fieldValue);
                        break;
                }
            }

            // Extract player image
            $playerImg = $row->filter('img[src*="player"], img[alt*="player"]')->first();
            if ($playerImg->count()) {
                $data['profile_image_url'] = $this->resolveUrl($playerImg->attr('src'));
            }
        });

        return $data;
    }

    /**
     * Validate and ensure proper roster structure
     */
    private function validatePlayerRoster(array $playersData): array
    {
        $validatedRoster = [];
        $mainPlayers = [];
        $coach = null;
        $substitutes = [];

        foreach ($playersData as $player) {
            if (isset($player['role']) && strtolower($player['role']) === 'coach') {
                if (!$coach) {
                    $coach = $player;
                }
            } elseif (isset($player['status']) && $player['status'] === 'substitute') {
                $substitutes[] = $player;
            } else {
                $mainPlayers[] = $player;
            }
        }

        // Ensure exactly 6 main players
        $validatedRoster = array_slice($mainPlayers, 0, 6);

        // Add coach if available
        if ($coach) {
            $validatedRoster[] = $coach;
        }

        // Add substitutes if needed to reach minimum roster
        if (count($validatedRoster) < 6) {
            $needed = 6 - count($mainPlayers);
            $validatedRoster = array_merge($validatedRoster, array_slice($substitutes, 0, $needed));
        }

        return $validatedRoster;
    }

    // Utility methods

    private function isPlayerUrl(string $href): bool
    {
        // Player URLs typically don't contain certain patterns
        $excludePatterns = ['/Portal:', '/Category:', '/File:', '/Template:', '/Tournament', '/League'];
        
        foreach ($excludePatterns as $pattern) {
            if (strpos($href, $pattern) !== false) {
                return false;
            }
        }

        // Should look like a player name pattern
        return preg_match('/\/[a-zA-Z][a-zA-Z0-9_\-]{2,}$/', $href);
    }

    private function isValidPlayerName(string $name): bool
    {
        return !empty($name) && 
               strlen($name) >= 2 && 
               strlen($name) <= 50 &&
               !in_array(strtolower($name), ['tbd', 'unknown', 'staff', 'coach']);
    }

    private function extractLiquipediaId(string $url): string
    {
        return basename(parse_url($url, PHP_URL_PATH));
    }

    private function generateShortName(string $name): string
    {
        // Generate short name from full name
        $parts = explode(' ', $name);
        if (count($parts) > 1) {
            return strtoupper(substr($parts[0], 0, 2) . substr($parts[1], 0, 1));
        }
        return strtoupper(substr($name, 0, 3));
    }

    private function resolveUrl(string $url): string
    {
        if (strpos($url, 'http') === 0) {
            return $url;
        }
        return 'https://liquipedia.net' . $url;
    }

    private function extractCountryCode(string $flagSrc): string
    {
        if (preg_match('/([a-z]{2,3})\.png$/i', $flagSrc, $matches)) {
            return strtoupper($matches[1]);
        }
        return '';
    }

    private function extractCountryName(string $alt): string
    {
        return trim(str_replace(['Flag of', 'flag', 'Flag'], '', $alt));
    }

    private function parseEarnings(string $earningsText): float
    {
        $earningsText = preg_replace('/[^\d.,]/', '', $earningsText);
        $earningsText = str_replace(',', '', $earningsText);
        return floatval($earningsText);
    }

    private function parseDate(string $dateText): ?string
    {
        try {
            $timestamp = strtotime($dateText);
            return $timestamp ? date('Y-m-d H:i:s', $timestamp) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    private function scrapeCoachDetails(string $coachUrl): ?array
    {
        // Similar to scrapePlayerDetails but for coach
        try {
            return $this->scrapePlayerDetails($coachUrl);
        } catch (Exception $e) {
            Log::warning("Coach details scraping failed", [
                'url' => $coachUrl,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    // Reporting methods

    private function initializeReport(): void
    {
        $this->scrapingReport = [
            'started_at' => now()->toISOString(),
            'status' => 'in_progress',
            'teams' => [
                'found' => 0,
                'successful' => 0,
                'failed' => 0
            ],
            'players' => [
                'found' => 0,
                'successful' => 0,
                'failed' => 0
            ],
            'errors' => [],
            'summary' => []
        ];
    }

    private function logError(string $message, Exception $e): void
    {
        $error = [
            'message' => $message,
            'error' => $e->getMessage(),
            'timestamp' => now()->toISOString()
        ];
        
        $this->errors[] = $error;
        Log::error($message, $error);
    }

    private function finalizeReport(): void
    {
        $this->scrapingReport['completed_at'] = now()->toISOString();
        $this->scrapingReport['status'] = 'completed';
        $this->scrapingReport['teams'] = [
            'found' => $this->totalTeamsFound,
            'successful' => $this->successfulTeams,
            'failed' => $this->totalTeamsFound - $this->successfulTeams
        ];
        $this->scrapingReport['players'] = [
            'found' => $this->totalPlayersFound,
            'successful' => $this->successfulPlayers,
            'failed' => $this->totalPlayersFound - $this->successfulPlayers
        ];
        $this->scrapingReport['errors'] = $this->errors;
        $this->scrapingReport['summary'] = [
            'total_duration' => now()->diffInMinutes($this->scrapingReport['started_at']) . ' minutes',
            'success_rate_teams' => $this->totalTeamsFound > 0 ? round(($this->successfulTeams / $this->totalTeamsFound) * 100, 1) . '%' : '0%',
            'success_rate_players' => $this->totalPlayersFound > 0 ? round(($this->successfulPlayers / $this->totalPlayersFound) * 100, 1) . '%' : '0%',
            'total_errors' => count($this->errors)
        ];
    }

    /**
     * Get the scraping report
     */
    public function getScrapingReport(): array
    {
        return $this->scrapingReport;
    }
}