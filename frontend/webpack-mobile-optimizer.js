// Mobile-First Webpack Optimization Plugin
// Reduces bundle size specifically for mobile performance

const path = require('path');

module.exports = function mobileWebpackOptimizer(config, env) {
  if (env === 'production') {
    // Enhanced code splitting for mobile
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 250000, // Smaller chunks for mobile
      cacheGroups: {
        // Critical path components
        critical: {
          name: 'critical',
          chunks: 'all',
          test: /[\\/](MobileNavigation|MobileMatchCard|TabletLayout)[\\/]/,
          priority: 40,
          enforce: true
        },
        // Mobile-specific chunk
        mobile: {
          name: 'mobile',
          chunks: 'all',
          test: /[\\/]components[\\/]mobile[\\/]/,
          priority: 35,
          enforce: true
        },
        // Tablet-specific chunk
        tablet: {
          name: 'tablet',
          chunks: 'all',
          test: /[\\/]components[\\/]tablet[\\/]/,
          priority: 33,
          enforce: true
        },
        // Icons and assets
        icons: {
          name: 'icons',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          priority: 30,
          enforce: true
        },
        // Utilities
        utils: {
          name: 'utils',
          chunks: 'all',
          test: /[\\/]utils[\\/]/,
          priority: 25,
          enforce: true
        }
      }
    };

    // Tree shaking optimization
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    // Module concatenation
    config.optimization.concatenateModules = true;

    // Preload critical mobile resources
    config.plugins.push({
      apply: (compiler) => {
        compiler.hooks.compilation.tap('MobilePreloadPlugin', (compilation) => {
          compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tap(
            'MobilePreloadPlugin',
            (data) => {
              // Add preload hints for mobile-critical resources
              const preloadLinks = [
                '<link rel="preload" href="/static/js/mobile.js" as="script">',
                '<link rel="preload" href="/static/css/mobile.css" as="style">',
                '<link rel="preload" href="/api/matches?filter=live" as="fetch" crossorigin>'
              ];
              
              data.html = data.html.replace(
                '</head>',
                preloadLinks.join('\n') + '\n</head>'
              );
            }
          );
        });
      }
    });
  }

  return config;
};