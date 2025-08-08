# Marvel Rivals Liquipedia Scraper - Complete Guide

## Overview

This comprehensive scraping system extracts complete Marvel Rivals esports data from Liquipedia, including teams, players, coaches, social media links, statistics, and more.

## Features

### Team Data Extraction
- ✅ Complete team information (name, short name, region, country)
- ✅ Financial data (earnings, currency)
- ✅ Visual assets (logos, banners, flags)
- ✅ Social media links (Twitter, Discord, Instagram, YouTube, Twitch, TikTok)
- ✅ Team statistics (tournaments played/won, win rate)
- ✅ Coach information with social links
- ✅ Team status and founding/disbanding dates

### Player Data Extraction
- ✅ Player details (username, real name, country, role)
- ✅ Performance statistics (ELO rating, earnings, K/D ratio)
- ✅ Complete social media profiles
- ✅ Career information (start date, achievements)
- ✅ Team history and role assignments
- ✅ Tournament statistics

### Data Quality Assurance
- ✅ Comprehensive validation system
- ✅ Data cleaning and fixing capabilities
- ✅ Roster structure validation (6 players + 1 coach)
- ✅ Duplicate detection and removal
- ✅ Social link validation

## Installation & Setup

### 1. Database Preparation

Run the new migrations to enhance the database schema:

```bash
php artisan migrate
```

This adds comprehensive fields to teams and players tables for storing all scraped data.

### 2. Dependencies

The scraper requires:
- GuzzleHTTP for web requests
- Symfony DomCrawler for HTML parsing
- Laravel's built-in validation

Install missing dependencies if needed:
```bash
composer require guzzlehttp/guzzle symfony/dom-crawler
```

## Usage

### 1. Test the Scraper (Recommended First Step)

Before running the actual scraper, test the Liquipedia structure:

```bash
node test-liquipedia-scraper.js
```

This will:
- Test Liquipedia accessibility
- Validate page structures
- Check for team and player data availability
- Generate a test report

### 2. Run the Complete Scraper

```bash
php artisan scrape:liquipedia
```

Options available:
```bash
# Limit number of teams (for testing)
php artisan scrape:liquipedia --limit=5

# Custom report filename
php artisan scrape:liquipedia --report-file=my_scraping_report.json

# Teams only
php artisan scrape:liquipedia --teams-only

# Players only  
php artisan scrape:liquipedia --players-only
```

### 3. Validate Scraped Data

After scraping, validate the data quality:

```bash
php artisan validate:scraped-data
```

Options available:
```bash
# Also clean and fix issues
php artisan validate:scraped-data --clean

# Custom report filename
php artisan validate:scraped-data --report-file=validation_report.json
```

## Expected Results

### Teams Data
The scraper will extract and store:

**Basic Information:**
- Team name and short name
- Region and country with flag
- Logo and banner URLs
- Team description

**Financial Data:**
- Total earnings in USD
- Tournament winnings breakdown

**Social Media Links:**
- Twitter/X profiles
- Discord servers
- Instagram accounts
- YouTube channels
- Twitch streams
- TikTok accounts

**Statistics:**
- Tournaments played and won
- Overall win rate
- Team founding date
- Current status (active/inactive/disbanded)

**Coach Information:**
- Coach name and real name
- Coach country and flag
- Coach profile image
- Coach social media links

### Players Data
For each team, exactly 6 main players plus coach:

**Player Details:**
- Username and real name
- Country and flag
- Role (Duelist, Vanguard, Strategist)
- ELO rating and peak ELO

**Performance Statistics:**
- Total earnings
- Tournament participation
- Win rates and K/D ratios
- Career statistics

**Personal Information:**
- Age and birth date
- Career start date
- Current team join date

**Social Media:**
- Complete social media profiles across all platforms

## Data Structure

### Teams Table Enhancement
```sql
-- Core team info
name, short_name, tag, description, region, country, country_code
flag_url, logo_url, banner_url

-- Financial data  
total_earnings, currency

-- Statistics
tournaments_played, tournaments_won, win_rate, points

-- Social media (JSON)
social_links: {
  "twitter": "https://twitter.com/teamname",
  "discord": "https://discord.gg/server", 
  "instagram": "https://instagram.com/teamname",
  "youtube": "https://youtube.com/channel",
  "twitch": "https://twitch.tv/teamname"
}

-- Coach data
coach_name, coach_real_name, coach_country, coach_flag_url
coach_image_url, coach_social_links (JSON)

-- Metadata
liquipedia_url, liquipedia_id, status, founded_at, disbanded_at
last_scraped_at
```

### Players Table Enhancement
```sql
-- Player identity
name, username, real_name, nickname, country, country_code, flag_url

-- Game data
role, secondary_role, elo_rating, peak_elo

-- Performance stats
total_earnings, tournaments_played, tournaments_won, win_rate
maps_played, maps_won, kd_ratio, avg_kills_per_map, avg_deaths_per_map

-- Personal info  
birth_date, age, career_start, joined_current_team_at

-- Social media (JSON)
social_links: {
  "twitter": "url",
  "instagram": "url", 
  "youtube": "url",
  "twitch": "url",
  "discord": "url",
  "tiktok": "url"
}

-- Career data (JSON)
team_history, achievements, awards

-- Metadata
liquipedia_url, liquipedia_id, status, last_active_at, last_scraped_at
```

## Rate Limiting & Ethics

The scraper implements responsible scraping practices:

- **Rate Limiting:** 2-second delay between requests
- **User Agent:** Identifies as educational/research tool
- **Error Handling:** Graceful failure and retry logic
- **Resource Respect:** Minimal server load

## Troubleshooting

### Common Issues

**403/429 Errors:**
- Liquipedia may be rate limiting
- Increase delay between requests
- Check User-Agent string

**No Teams Found:**
- Teams portal structure may have changed
- Alternative tournament scraping will activate
- Check test results first

**Missing Player Data:**
- Some teams may have incomplete rosters
- Validation will flag these issues
- Clean command can fix common problems

**Social Links Not Working:**
- Links are validated during scraping
- Invalid URLs are filtered out
- Validation report shows details

### Debug Mode

For detailed logging:
```bash
# Enable Laravel logging
tail -f storage/logs/laravel.log

# Run scraper in another terminal
php artisan scrape:liquipedia
```

## Report Files

### Scraping Report
- **Location:** `storage/app/liquipedia_scraping_report.json`
- **Contains:** Teams/players found/successful, errors, timing
- **Format:** Detailed JSON with statistics

### Validation Report  
- **Location:** `storage/app/data_validation_report.json`
- **Contains:** Data quality issues, consistency problems
- **Format:** Structured validation results

### Test Report
- **Location:** `liquipedia_scraper_test_results_[timestamp].json`
- **Contains:** Pre-scraping structure validation
- **Format:** Test results with pass/fail status

## Maintenance

### Regular Updates
1. Test scraper functionality monthly
2. Validate data quality after each scrape
3. Monitor for Liquipedia structure changes
4. Update role definitions as game evolves

### Performance Monitoring
- Track scraping success rates
- Monitor API response times  
- Check data completeness metrics
- Review error patterns

## Advanced Usage

### Custom Team Selection
Modify `LiquipediaScraper.php` to target specific teams:

```php
// In scrapeTeamsPortal() method
$specificTeams = [
    'https://liquipedia.net/marvelrivals/TeamName1',
    'https://liquipedia.net/marvelrivals/TeamName2'
];
```

### Extended Player Data
Add custom fields to player extraction in `extractPlayerInfoboxData()`:

```php
case 'custom_field':
    $data['custom_field'] = $fieldValue;
    break;
```

### Social Platform Extension
Add new social platforms in the `$socialPlatforms` array:

```php
private array $socialPlatforms = [
    'twitter' => ['twitter.com', 'x.com'],
    'new_platform' => ['newplatform.com'],
    // ... existing platforms
];
```

## Success Metrics

A successful scrape should achieve:
- **Teams:** 15+ active teams minimum
- **Players:** 90+ active players (15 teams × 6 players)
- **Coaches:** 10+ coaches with complete data
- **Success Rate:** >85% for teams, >90% for players
- **Data Quality:** <5% validation issues

## Support

For issues or improvements:
1. Check the test results first
2. Review validation reports
3. Check Laravel logs for errors
4. Verify Liquipedia accessibility
5. Consider rate limiting adjustments

This scraper provides the most comprehensive Marvel Rivals esports data available, ensuring your database has accurate, up-to-date information for all teams and players.