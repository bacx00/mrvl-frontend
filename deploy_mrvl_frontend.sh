#!/bin/bash
# MRVL Frontend Deployment Script
# Run this on your server at /var/www/mrvl-frontend/

echo "🚀 MRVL Frontend Deployment Starting..."

# Backup current frontend
if [ -d "frontend" ]; then
    echo "📁 Backing up current frontend..."
    mv frontend frontend_backup_$(date +%Y%m%d_%H%M%S)
fi

# Pull latest changes
echo "📡 Pulling latest changes..."
git pull origin main

# Install dependencies and build
echo "📦 Installing dependencies..."
cd frontend
npm install

echo "🔨 Building production version..."
npm run build

echo "🌐 Copying build files for serving..."
# Copy build contents to serve directory
cp -r build/* ./

echo "✅ Deployment Complete!"
echo "🎯 Frontend ready at your domain!"
echo "🔑 Admin login: jhonny@ar-mediia.com / password123"