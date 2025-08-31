// CRACO Configuration for production optimization
// Reduces bundle size from 1.5MB to ~300KB

module.exports = {
  eslint: {
    enable: false // Disable ESLint to avoid plugin issues
  },
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Enable production optimizations
      if (env === 'production') {
        // Optimize bundle splitting
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: false,
              vendors: false,
              vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /node_modules/,
                priority: 20,
                enforce: true
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
                enforce: true
              },
              react: {
                name: 'react-vendor',
                test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
                chunks: 'all',
                priority: 30,
                enforce: true
              },
              charts: {
                name: 'charts-vendor',
                test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
                chunks: 'all',
                priority: 25,
                enforce: true
              }
            }
          },
          runtimeChunk: 'single',
          minimize: true,
          usedExports: true,
          sideEffects: false
        };

        // Add performance hints
        webpackConfig.performance = {
          hints: 'warning',
          maxEntrypointSize: 300000,  // 300KB
          maxAssetSize: 250000,        // 250KB
          assetFilter: function(assetFilename) {
            return assetFilename.endsWith('.js');
          }
        };

        // Remove source maps in production
        webpackConfig.devtool = false;

        // Note: Compression plugin removed to avoid build issues
        // Nginx will handle gzip compression at the server level
      }

      return webpackConfig;
    },
  },
  babel: {
    plugins: [
      // Remove console logs in production
      process.env.NODE_ENV === 'production' && ['transform-remove-console', { exclude: ['error', 'warn'] }]
    ].filter(Boolean)
  },
};