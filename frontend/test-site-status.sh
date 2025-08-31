#!/bin/bash

echo "=== MRVL Platform Status Check ==="
echo

# Check Frontend
echo "📱 Frontend Status:"
response=$(curl -s -o /dev/null -w "%{http_code}" https://staging.mrvl.net/)
if [ "$response" = "200" ]; then
    echo "✅ Home page: $response (Working)"
else
    echo "❌ Home page: $response (Issue detected)"
fi

# Check static assets
echo
echo "📦 Static Assets:"
curl -s -o /dev/null -w "JS Bundle: %{http_code} - %{time_total}s\n" https://staging.mrvl.net/static/js/main.*.js || echo "No JS bundle found"
curl -s -o /dev/null -w "CSS: %{http_code} - %{time_total}s\n" https://staging.mrvl.net/static/css/main.*.css || echo "No CSS found"

# Check API endpoints
echo
echo "🔌 API Endpoints:"
for endpoint in matches teams players news rankings; do
    response=$(curl -s -o /dev/null -w "%{http_code} - %{time_total}s" https://staging.mrvl.net/api/$endpoint)
    echo "$endpoint: $response"
done

# Check API health
echo
echo "💚 API Health:"
curl -s https://staging.mrvl.net/api/status/health | jq -r '.status' 2>/dev/null || echo "Unable to check health"

# Check build folder
echo
echo "🏗️ Build Status:"
if [ -d "/var/www/mrvl-frontend/frontend/build" ]; then
    echo "Build folder exists"
    ls -lah /var/www/mrvl-frontend/frontend/build/static/js/*.js 2>/dev/null | head -3 || echo "No JS files in build"
else
    echo "Build folder missing"
fi

# Check nginx
echo
echo "🌐 Nginx Status:"
sudo nginx -t 2>&1 | grep -E "syntax is ok|test is successful" && echo "✅ Nginx config valid" || echo "❌ Nginx config issue"

# Check processes
echo
echo "⚙️ Running Processes:"
ps aux | grep -E "yarn|react" | grep -v grep | wc -l | xargs -I {} echo "{} React/Yarn processes running"

echo
echo "=== End of Status Check ==="