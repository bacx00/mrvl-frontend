// Aggressive mobile optimization for bundle size < 512KB
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  
  entry: {
    // Split entry points for better code splitting
    main: './src/index.js',
    // Lazy load admin features
    admin: {
      import: './src/components/admin/index.js',
      dependOn: 'shared'
    },
    shared: ['react', 'react-dom']
  },
  
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    clean: true,
    // Use smaller paths in production
    pathinfo: false
  },
  
  optimization: {
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    minimize: true,
    
    minimizer: [
      // Aggressive Terser configuration
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          parse: {
            ecma: 2020
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            passes: 3,
            // Aggressive dead code elimination
            dead_code: true,
            evaluate: true,
            if_return: true,
            join_vars: true,
            reduce_vars: true,
            collapse_vars: true,
            booleans: true,
            loops: true,
            toplevel: true,
            top_retain: null,
            hoist_funs: true,
            keep_fargs: false,
            hoist_props: true,
            hoist_vars: true,
            inline: 3,
            sequences: true,
            side_effects: true,
            conditionals: true,
            unused: true,
            // Remove all comments
            comments: false
          },
          mangle: {
            safari10: true,
            // Aggressive mangling
            toplevel: true,
            properties: {
              regex: /^_/
            }
          },
          format: {
            ecma: 5,
            comments: false,
            ascii_only: true,
            // Minimize output size
            beautify: false,
            indent_level: 0,
            indent_start: 0,
            inline_script: true,
            keep_numbers: false,
            keep_quoted_props: false,
            max_line_len: false,
            preamble: '',
            preserve_annotations: false,
            quote_keys: false,
            quote_style: 0,
            wrap_iife: false,
            wrap_func_args: false
          }
        },
        extractComments: false
      }),
      
      // Aggressive CSS minification
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              discardDuplicates: true,
              discardEmpty: true,
              minifySelectors: true,
              minifyParams: true,
              minifyFontValues: true,
              normalizeUrl: true,
              colormin: true,
              mergeLonghand: true,
              mergeRules: true,
              calc: true
            }
          ]
        }
      })
    ],
    
    splitChunks: {
      chunks: 'all',
      minSize: 10000,
      maxSize: 50000, // Aggressive splitting at 50KB
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      automaticNameDelimiter: '.',
      
      cacheGroups: {
        // React core (essential)
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'react',
          priority: 40,
          chunks: 'all',
          enforce: true
        },
        
        // Router (essential for navigation)
        router: {
          test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,
          name: 'router',
          priority: 35,
          chunks: 'all'
        },
        
        // State management (if using Redux/Zustand)
        state: {
          test: /[\\/]node_modules[\\/](redux|react-redux|zustand|@reduxjs)[\\/]/,
          name: 'state',
          priority: 30,
          chunks: 'all'
        },
        
        // UI components (lazy load)
        ui: {
          test: /[\\/]node_modules[\\/](lucide-react|@headlessui|@radix-ui)[\\/]/,
          name: 'ui',
          priority: 25,
          chunks: 'async',
          reuseExistingChunk: true
        },
        
        // Utils and helpers
        utils: {
          test: /[\\/]node_modules[\\/](axios|date-fns|clsx|classnames)[\\/]/,
          name: 'utils',
          priority: 20,
          chunks: 'all',
          maxSize: 30000
        },
        
        // Remaining vendors
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
          priority: 10,
          chunks: 'async',
          maxSize: 30000
        },
        
        // App code splitting
        pages: {
          test: /[\\/]src[\\/]components[\\/]pages[\\/]/,
          name(module) {
            const pageName = module.rawRequest.match(/pages[\\/](.*?)(\.js|\.jsx|\.ts|\.tsx)/)[1];
            return `page.${pageName}`;
          },
          chunks: 'async',
          priority: 15,
          minSize: 5000,
          maxSize: 40000
        },
        
        // Admin features (heavy, lazy load)
        admin: {
          test: /[\\/]src[\\/]components[\\/]admin[\\/]/,
          name: 'admin',
          chunks: 'async',
          priority: 5,
          enforce: true
        },
        
        // Mobile specific
        mobile: {
          test: /[\\/]src[\\/]components[\\/]mobile[\\/]/,
          name: 'mobile',
          chunks: 'all',
          priority: 25,
          maxSize: 30000
        },
        
        // Default chunks
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          maxSize: 20000
        }
      }
    },
    
    // Separate runtime for better caching
    runtimeChunk: {
      name: 'runtime'
    },
    
    // Tree shaking
    usedExports: true,
    sideEffects: false,
    providedExports: true,
    concatenateModules: true,
    
    // Remove empty chunks
    removeEmptyChunks: true,
    
    // Merge duplicate chunks
    mergeDuplicateChunks: true
  },
  
  module: {
    rules: [
      // JavaScript/JSX with aggressive optimizations
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', 'not dead', 'not ie 11']
                },
                modules: false,
                loose: true,
                useBuiltIns: 'usage',
                corejs: 3
              }],
              ['@babel/preset-react', {
                runtime: 'automatic',
                development: false,
                // Remove prop-types in production
                importSource: '@emotion/react'
              }]
            ],
            plugins: [
              // Remove prop-types
              ['transform-react-remove-prop-types', {
                removeImport: true
              }],
              // Optimize React
              '@babel/plugin-transform-react-inline-elements',
              '@babel/plugin-transform-react-constant-elements',
              // Dead code elimination
              'babel-plugin-transform-remove-console',
              'babel-plugin-transform-remove-debugger',
              // Optimize imports
              ['babel-plugin-import', {
                libraryName: 'lodash',
                libraryDirectory: '',
                camel2DashComponentName: false
              }],
              // Class properties
              '@babel/plugin-proposal-class-properties',
              // Dynamic imports
              '@babel/plugin-syntax-dynamic-import'
            ],
            cacheDirectory: true,
            cacheCompression: true,
            compact: true
          }
        }
      },
      
      // CSS with extraction and minification
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: '[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'postcss-preset-env',
                  'cssnano'
                ]
              }
            }
          }
        ]
      },
      
      // Images optimization
      {
        test: /\.(png|jpg|jpeg|gif|webp|avif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 2000 // Only inline images < 2KB
          }
        },
        generator: {
          filename: 'static/media/[hash][ext]'
        }
      },
      
      // SVG as components
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgo: true,
              svgoConfig: {
                plugins: [
                  { removeViewBox: false },
                  { removeDimensions: true }
                ]
              }
            }
          }
        ]
      }
    ]
  },
  
  plugins: [
    // Environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.PUBLIC_URL': JSON.stringify('')
    }),
    
    // Extract CSS
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css'
    }),
    
    // Ignore unnecessary files
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    }),
    
    // Limit chunks
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 15
    }),
    
    // Minimum chunk size
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 10000
    }),
    
    // Aggressive compression
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 5000,
      minRatio: 0.7,
      deleteOriginalAssets: false
    }),
    
    // Brotli compression
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11
        }
      },
      threshold: 5000,
      minRatio: 0.7,
      deleteOriginalAssets: false
    }),
    
    // Bundle analyzer (only when needed)
    ...(process.env.ANALYZE === 'true' ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-report.html',
        openAnalyzer: false
      })
    ] : [])
  ],
  
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      // Replace heavy libraries with lighter alternatives
      'moment': 'dayjs',
      'lodash': 'lodash-es'
    },
    fallback: {
      // Remove Node.js polyfills
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
      assert: false
    }
  },
  
  // Performance hints
  performance: {
    maxEntrypointSize: 200000, // 200KB warning
    maxAssetSize: 150000, // 150KB per asset
    hints: 'error',
    assetFilter: function(assetFilename) {
      return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    }
  },
  
  // Build stats
  stats: {
    assets: true,
    chunks: true,
    modules: false,
    entrypoints: true,
    children: false,
    cached: false,
    cachedAssets: false
  }
};