#!/bin/bash
# MRVL Frontend Deployment Script
# Run this on your server at /var/www/mrvl-frontend/

echo "🚀 MRVL Frontend Deployment Starting..."

# 1. Backup existing content
echo "📦 Creating backup..."
cd /var/www/mrvl-frontend/
sudo cp -r . ../mrvl-frontend-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "No existing content to backup"

# 2. Clear current directory (preserve .git)
echo "🧹 Clearing old content..."
sudo find . -maxdepth 1 ! -name '.' ! -name '..' ! -name '.git' -exec rm -rf {} + 2>/dev/null

# 3. Create the new React build structure
echo "📁 Creating new structure..."

# Create index.html
cat > index.html << 'EOF'
<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8"/>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="icon" href="/favicon.ico" type="image/x-icon"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="manifest" href="/manifest.json"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="description" content="MRVL - The ultimate Marvel Rivals esports platform for competitive gaming, tournaments, teams, and community."/>
<meta name="keywords" content="Marvel Rivals, esports, gaming, tournaments, teams, competitive, MRVL"/>
<meta name="author" content="MRVL Esports"/>
<meta property="og:title" content="MRVL - Marvel Rivals Esports Platform"/>
<meta property="og:description" content="The ultimate Marvel Rivals esports platform for competitive gaming, tournaments, teams, and community."/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://staging.mrvl.net"/>
<meta property="og:image" content="https://staging.mrvl.net/og-image.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="MRVL - Marvel Rivals Esports Platform"/>
<meta name="twitter:description" content="The ultimate Marvel Rivals esports platform for competitive gaming, tournaments, teams, and community."/>
<meta name="twitter:image" content="https://staging.mrvl.net/og-image.png"/>
<title>MRVL - Marvel Rivals Esports Platform</title>
<script defer="defer" src="/static/js/main.js"></script>
<link href="/static/css/main.css" rel="stylesheet">
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
code{font-family:source-code-pro,Menlo,Monaco,Consolas,'Courier New',monospace}
.loading-spinner{width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #ef4444;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style>
</head>
<body>
<noscript>You need to enable JavaScript to run this app.</noscript>
<div id="root"></div>
<script>
if('serviceWorker' in navigator){
window.addEventListener('load',()=>{
navigator.serviceWorker.register('/service-worker.js').then((registration)=>{
console.log('SW registered: ',registration);
}).catch((registrationError)=>{
console.log('SW registration failed: ',registrationError);
});
});
}
</script>
</body>
</html>
EOF

# 4. Create directories
mkdir -p static/js static/css

# 5. Create manifest.json
cat > manifest.json << 'EOF'
{
  "short_name": "MRVL",
  "name": "MRVL - Marvel Rivals Esports Platform",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOF

# 6. Create favicon files
echo "🎨 Creating favicon..."
cat > favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#ef4444"/>
  <text x="50" y="65" font-family="Arial" font-size="60" fill="white" text-anchor="middle" font-weight="bold">M</text>
</svg>
EOF

# 7. Download and extract the React bundle
echo "⬇️ Setting up React application..."
echo "Please run this command to get the React bundle:"
echo "curl -o static/js/main.js https://raw.githubusercontent.com/your-repo/main/static/js/main.js"
echo "curl -o static/css/main.css https://raw.githubusercontent.com/your-repo/main/static/css/main.css"
echo ""
echo "Or copy the files from your development build..."

# 8. Set permissions
echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data /var/www/mrvl-frontend/ 2>/dev/null || chown -R nginx:nginx /var/www/mrvl-frontend/ 2>/dev/null || echo "Permissions set"
sudo chmod -R 755 /var/www/mrvl-frontend/

echo "✅ Basic structure created!"
echo "📝 Next: Copy your React build files to complete deployment"
echo "🌐 Files should be accessible at your domain"
EOF