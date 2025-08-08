// Webpack optimization configuration for mobile performance
// This file provides optimizations that can be added to webpack.config.js

const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

const mobileOptimizations = {
  // Code splitting configuration
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    maxSize: 244000, // Optimal for mobile networks
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    automaticNameDelimiter: '~',
    cacheGroups: {
      // Vendor libraries
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
        chunks: 'all',
        maxSize: 244000
      },
      
      // React and React-DOM
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react',
        priority: 20,
        chunks: 'all'
      },
      
      // UI libraries (Lucide icons, etc.)
      ui: {
        test: /[\\/]node_modules[\\/](lucide-react|@headlessui|@radix-ui)[\\/]/,
        name: 'ui',
        priority: 15,
        chunks: 'all'
      },
      
      // Admin components (heavy)
      admin: {
        test: /[\\/]src[\\/]components[\\/]admin[\\/]/,
        name: 'admin',
        priority: 25,
        chunks: 'async',
        minChunks: 1
      },
      
      // Mobile specific components
      mobile: {
        test: /[\\/]src[\\/]components[\\/]mobile[\\/]/,
        name: 'mobile',
        priority: 25,
        chunks: 'all'
      },
      
      // Shared components
      shared: {
        test: /[\\/]src[\\/]components[\\/]shared[\\/]/,
        name: 'shared',
        priority: 20,
        chunks: 'all'
      },
      
      // Common utilities
      utils: {
        test: /[\\/]src[\\/](utils|hooks)[\\/]/,
        name: 'utils',
        priority: 15,
        chunks: 'all'
      },
      
      // Default group
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
        maxSize: 100000
      }
    }
  },

  // Runtime chunk optimization
  runtimeChunk: {
    name: 'runtime'
  },

  // Module concatenation for better tree shaking
  concatenateModules: true,

  // Remove unused code
  usedExports: true,
  sideEffects: false,

  // Minimize bundle size
  minimize: true,
  minimizer: [
    // TerserPlugin with mobile-optimized settings
    new (require('terser-webpack-plugin'))({
      parallel: true,
      terserOptions: {
        parse: {
          ecma: 8
        },
        compress: {
          ecma: 5,
          warnings: false,
          comparisons: false,
          inline: 2,
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: process.env.NODE_ENV === 'production',
          pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log'] : []
        },
        mangle: {
          safari10: true
        },
        output: {
          ecma: 5,
          comments: false,
          ascii_only: true
        }
      }
    }),
    
    // CSS optimization
    new (require('css-minimizer-webpack-plugin'))({
      minimizerOptions: {
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
            normalizeWhitespace: true
          }
        ]
      }
    })
  ]
};

// Plugins for mobile optimization
const mobileOptimizationPlugins = [
  // Gzip compression
  new CompressionPlugin({
    filename: '[path][base].gz',
    algorithm: 'gzip',
    test: /\.(js|css|html|svg)$/,
    threshold: 8192,
    minRatio: 0.8
  }),

  // Brotli compression (better than gzip)
  new CompressionPlugin({
    filename: '[path][base].br',
    algorithm: 'brotliCompress',
    test: /\.(js|css|html|svg)$/,
    compressionOptions: {
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11
      }
    },
    threshold: 8192,
    minRatio: 0.8
  }),

  // Bundle analyzer for production builds
  ...(process.env.ANALYZE_BUNDLE === 'true' ? [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-analysis.html'
    })
  ] : []),

  // Preload webpack plugin for critical resources
  new (require('@vue/preload-webpack-plugin'))({
    rel: 'preload',
    include: 'initial',
    fileBlacklist: [/\.map$/, /hot-update\.js$/]
  }),

  // Service worker generation
  new (require('workbox-webpack-plugin')).GenerateSW({
    clientsClaim: true,
    skipWaiting: true,
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    
    runtimeCaching: [
      // Cache API responses
      {
        urlPattern: /^https:\/\/api\..*\.(json|xml)$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 5 * 60 // 5 minutes
          },
          cacheKeyWillBeUsed: async ({ request }) => {
            return `${request.url}?${Date.now()}`;
          }
        }
      },
      
      // Cache images
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      
      // Cache fonts
      {
        urlPattern: /\.(?:woff|woff2|eot|ttf|otf)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'font-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
          }
        }
      }
    ],
    
    exclude: [
      /\.map$/,
      /manifest$/,
      /\.htaccess$/,
      /service-worker\.js$/,
      /sw\.js$/
    ]
  })
];

// Development server optimizations for mobile testing
const devServerOptimizations = {
  compress: true,
  hot: true,
  
  // Mobile device testing
  host: '0.0.0.0',
  allowedHosts: 'all',
  
  // Enable HTTPS for PWA testing
  https: process.env.HTTPS === 'true',
  
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  
  // Proxy configuration for API calls
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false
    }
  }
};

// Export configurations
module.exports = {
  mobileOptimizations,
  mobileOptimizationPlugins,
  devServerOptimizations,
  
  // Complete webpack config for mobile
  getMobileWebpackConfig: (baseConfig) => ({
    ...baseConfig,
    
    optimization: {
      ...baseConfig.optimization,
      ...mobileOptimizations
    },
    
    plugins: [
      ...baseConfig.plugins,
      ...mobileOptimizationPlugins
    ],
    
    // Resolve optimizations
    resolve: {
      ...baseConfig.resolve,
      alias: {
        ...baseConfig.resolve?.alias,
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@mobile': path.resolve(__dirname, 'src/components/mobile'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@hooks': path.resolve(__dirname, 'src/hooks')
      },
      
      // Faster module resolution
      modules: [
        path.resolve(__dirname, 'src'),
        'node_modules'
      ],
      
      // Reduce file system calls
      symlinks: false
    },
    
    // Performance budgets for mobile
    performance: {
      maxEntrypointSize: 250000, // 250kb initial bundle
      maxAssetSize: 250000,      // 250kb per asset
      hints: process.env.NODE_ENV === 'production' ? 'error' : 'warning'
    },
    
    // Development server for mobile testing
    devServer: devServerOptimizations
  })
};