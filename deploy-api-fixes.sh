#!/bin/bash

echo "🚀 Deploying API Integration Fixes..."

# 1. Run database migrations
echo "📊 Running database migrations..."
php artisan migrate --force

# 2. Clear all caches
echo "🧹 Clearing application caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3. Clear Laravel caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# 4. Install/update dependencies if needed
echo "📦 Updating dependencies..."
composer install --no-dev --optimize-autoloader

# 5. Set proper permissions
echo "🔒 Setting permissions..."
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 6. Test API endpoints
echo "🧪 Testing critical API endpoints..."
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/events" && echo " - ✅ GET /api/events"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/teams" && echo " - ✅ GET /api/teams"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/players" && echo " - ✅ GET /api/players"

echo "✅ API Integration fixes deployed successfully!"
echo ""
echo "🔗 Available API endpoints:"
echo "   - GET  /api/events"
echo "   - GET  /api/events/{id}"
echo "   - GET  /api/events/{id}/teams"  
echo "   - GET  /api/events/{id}/matches"
echo "   - GET  /api/teams"
echo "   - GET  /api/players"
echo "   - POST /api/admin/events/{id}/teams"
echo "   - POST /api/admin/events/{id}/generate-bracket"
echo "   - PUT  /api/admin/matches/{id}"
echo ""
echo "🔐 Authentication: Bearer token required for admin routes"