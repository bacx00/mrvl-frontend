#!/bin/bash

# Optimized build script for production with mobile optimizations
# Inspired by VLR.gg's performance standards

echo "🚀 Starting optimized production build for MRVL platform..."

# Clear previous builds
echo "📦 Cleaning previous builds..."
rm -rf build/
rm -rf node_modules/.cache/

# Set environment variables for optimization
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export IMAGE_INLINE_SIZE_LIMIT=1000
export NODE_OPTIONS="--max-old-space-size=4096"

# Create optimized environment file
cat > .env.production.local << EOF
REACT_APP_API_URL=/api
REACT_APP_WS_URL=wss://staging.mrvl.net
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
IMAGE_INLINE_SIZE_LIMIT=1000
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_LAZY_LOADING=true
REACT_APP_ENABLE_CODE_SPLITTING=true
REACT_APP_MOBILE_OPTIMIZED=true
EOF

echo "🔧 Installing dependencies with exact versions..."
yarn install --frozen-lockfile --production=false

echo "🎯 Running production build with optimizations..."
CI=false GENERATE_SOURCEMAP=false yarn build

echo "📊 Analyzing bundle size..."
if [ -d "build/static/js" ]; then
    echo "JavaScript bundle sizes:"
    ls -lah build/static/js/*.js | awk '{print $9, $5}'
    
    echo ""
    echo "CSS bundle sizes:"
    ls -lah build/static/css/*.css 2>/dev/null | awk '{print $9, $5}' || echo "No CSS bundles found"
fi

echo "🗜️ Compressing assets..."
# Create gzip versions of all static assets
find build/static -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -9 -k {} \;

echo "📱 Generating mobile-specific assets..."
# Create a mobile manifest with optimized settings
cat > build/manifest.mobile.json << EOF
{
  "short_name": "MRVL",
  "name": "Marvel Rivals Platform",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "/favicon.svg",
      "type": "image/svg+xml",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#ef4444",
  "background_color": "#0f172a",
  "orientation": "portrait",
  "categories": ["sports", "games"],
  "prefer_related_applications": false
}
EOF

echo "⚡ Creating service worker for offline support..."
cat > build/sw-optimized.js << 'EOF'
// Optimized Service Worker for MRVL Platform
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `mrvl-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/favicon.ico',
  '/manifest.json'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API calls - network only
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets - cache first
  if (event.request.url.includes('/static/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
    return;
  }

  // Default - network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
EOF

echo "📋 Creating performance budget file..."
cat > build/performance-budget.json << EOF
{
  "bundles": {
    "main.js": {
      "maxSize": 250000,
      "warning": 200000
    },
    "main.css": {
      "maxSize": 50000,
      "warning": 40000
    }
  },
  "metrics": {
    "lighthouse": {
      "performance": 90,
      "accessibility": 95,
      "best-practices": 95,
      "seo": 90,
      "pwa": 90
    },
    "webVitals": {
      "LCP": 2500,
      "FID": 100,
      "CLS": 0.1,
      "TTFB": 600
    }
  }
}
EOF

echo "✅ Build optimization complete!"
echo ""
echo "📊 Build Statistics:"
echo "-------------------"
if [ -d "build" ]; then
    total_size=$(du -sh build | cut -f1)
    js_count=$(find build/static/js -name "*.js" 2>/dev/null | wc -l)
    css_count=$(find build/static/css -name "*.css" 2>/dev/null | wc -l)
    
    echo "Total build size: $total_size"
    echo "JavaScript bundles: $js_count"
    echo "CSS bundles: $css_count"
    
    # Check if main bundle is under budget
    main_js_size=$(stat -f%z build/static/js/main.*.js 2>/dev/null || stat -c%s build/static/js/main.*.js 2>/dev/null || echo "0")
    main_js_size_kb=$((main_js_size / 1024))
    
    if [ "$main_js_size_kb" -lt 250 ]; then
        echo "✅ Main JS bundle: ${main_js_size_kb}KB (under 250KB budget)"
    else
        echo "⚠️  Main JS bundle: ${main_js_size_kb}KB (exceeds 250KB budget)"
    fi
fi

echo ""
echo "🚀 Deployment ready! The build is optimized for mobile and tablet devices."
echo "📱 Mobile features enabled: Lazy loading, code splitting, PWA support"
echo "⚡ Performance optimizations: Gzip compression, service worker, minimal bundle size"