#!/bin/bash

# MRVL Production Deployment Script
# Run this to deploy to staging.mrvl.net

echo "🚀 MRVL DEPLOYMENT STARTING..."

# Step 1: Environment Setup
echo "📝 Setting up environment..."
cp .env.production .env
php artisan key:generate

# Step 2: Dependencies
echo "📦 Installing dependencies..."
composer install --optimize-autoloader --no-dev
npm install
npm run build

# Step 3: Database Setup
echo "🗄️ Setting up database..."
php artisan migrate:fresh --seed --force

# Step 4: Cache and Optimize
echo "⚡ Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Step 5: Storage Setup
echo "📁 Setting up storage..."
php artisan storage:link

# Step 6: Queue and WebSocket Setup
echo "🔄 Starting background services..."
php artisan queue:restart
php artisan websockets:serve > /dev/null 2>&1 &

# Step 7: Final Checks
echo "✅ Running final checks..."
php artisan about

echo ""
echo "🎉 MRVL DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Website: https://staging.mrvl.net"
echo "🔧 Admin Panel: https://staging.mrvl.net/admin"
echo "📡 API Docs: https://staging.mrvl.net/api/docs"
echo ""
echo "🔐 Default Admin Account:"
echo "Email: admin@mrvl.net"
echo "Password: MRVLAdmin2024!"
echo ""
echo "📊 Monitor logs with: php artisan pail"
echo "🔄 Check queues with: php artisan queue:monitor"
echo ""
echo "🚀 READY TO DOMINATE THE MARVEL RIVALS ESPORTS SCENE!"