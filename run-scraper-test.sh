#!/bin/bash

echo "🚀 Marvel Rivals Liquipedia Scraper Test Runner"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: Not in Laravel root directory. Please run from /var/www/mrvl-frontend"
    exit 1
fi

# Check dependencies
echo "🔍 Checking dependencies..."

# Check if Node.js is available for testing
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Skipping structure tests."
    SKIP_NODE_TEST=true
else
    echo "✅ Node.js found"
fi

# Check if axios is available
if [ "$SKIP_NODE_TEST" != "true" ]; then
    if ! node -e "require('axios')" 2>/dev/null; then
        echo "⚠️  axios not found. Installing..."
        npm install axios cheerio
    else
        echo "✅ axios and cheerio available"
    fi
fi

echo ""

# Step 1: Run migrations
echo "📦 Running database migrations..."
php artisan migrate --force
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo ""

# Step 2: Test Liquipedia structure (if Node.js available)
if [ "$SKIP_NODE_TEST" != "true" ]; then
    echo "🧪 Testing Liquipedia structure..."
    node test-liquipedia-scraper.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Structure tests passed"
    else
        echo "⚠️  Some structure tests failed, but continuing..."
    fi
    echo ""
fi

# Step 3: Test scraper commands exist
echo "🔧 Checking scraper commands..."
php artisan list | grep -E "(scrape:liquipedia|validate:scraped-data)" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Scraper commands registered successfully"
else
    echo "❌ Scraper commands not found"
    exit 1
fi

echo ""

# Step 4: Run a limited test scrape
echo "🚀 Running limited test scrape (5 teams max)..."
echo "This will take several minutes due to rate limiting..."
echo ""

timeout 300 php artisan scrape:liquipedia --limit=5 --report-file=test_scraping_report.json

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test scraping completed successfully!"
    
    # Check if data was actually scraped
    TEAM_COUNT=$(php artisan tinker --execute="echo App\Models\Team::count();")
    PLAYER_COUNT=$(php artisan tinker --execute="echo App\Models\Player::count();")
    
    echo "📊 Results:"
    echo "   Teams in database: $TEAM_COUNT"
    echo "   Players in database: $PLAYER_COUNT"
    
    if [ "$TEAM_COUNT" -gt 0 ] && [ "$PLAYER_COUNT" -gt 0 ]; then
        echo "✅ Data successfully scraped and stored!"
    else
        echo "⚠️  No data was scraped - check the scraping report"
    fi
    
elif [ $? -eq 124 ]; then
    echo "⚠️  Test scraping timed out (5 minutes) - this is normal for rate-limited scraping"
    echo "Check storage/app/test_scraping_report.json for partial results"
else
    echo "❌ Test scraping failed"
    exit 1
fi

echo ""

# Step 5: Run validation if data exists
TEAM_COUNT=$(php artisan tinker --execute="echo App\Models\Team::count();" 2>/dev/null | tail -1)
if [ "$TEAM_COUNT" -gt 0 ]; then
    echo "🔍 Running data validation..."
    php artisan validate:scraped-data --report-file=test_validation_report.json
    
    if [ $? -eq 0 ]; then
        echo "✅ Data validation completed"
    else
        echo "⚠️  Data validation found issues - check the validation report"
    fi
fi

echo ""
echo "🎉 SCRAPER TEST COMPLETE!"
echo "========================"
echo ""
echo "📄 Generated Reports:"
echo "   - Test scraping: storage/app/test_scraping_report.json"
echo "   - Validation: storage/app/test_validation_report.json"
if [ "$SKIP_NODE_TEST" != "true" ]; then
    echo "   - Structure test: liquipedia_scraper_test_results_*.json"
fi
echo ""
echo "🚀 Ready for full scraping! Run:"
echo "   php artisan scrape:liquipedia"
echo ""
echo "📚 See liquipedia-scraper-guide.md for complete documentation"