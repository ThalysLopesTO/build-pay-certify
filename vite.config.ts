import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  esbuild: {
    target: 'es2020', // Target modern browsers to avoid unnecessary transpilation
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      injectRegister: null, // Don't inject SW registration to avoid blocking
      registerType: 'autoUpdate',
      disable: false, // Ensure PWA is enabled
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: [
          '**/lovable-uploads/**', // Exclude large user uploads
          '**/screenshots/**' // Exclude large screenshots
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\/lovable-uploads\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'user-uploads-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'StackBuild – Construction Management',
        short_name: 'StackBuild',
        description: 'Professional construction payroll and safety certification management system',
        theme_color: '#F97316',
        background_color: '#FFFFFF',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true, // Generate source maps for debugging and SEO tools
    cssCodeSplit: true, // Split CSS per route for faster loading
    modulePreload: {
      polyfill: false, // Skip polyfill for modern browsers
      resolveDependencies: (filename, deps, { hostId, hostType }) => {
        // Preload critical dependencies for faster LCP
        return deps.filter(dep => 
          dep.includes('react') || 
          dep.includes('router') || 
          dep.includes('index')
        );
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Optimized chunk splitting for better Speed Index
          if (id.includes('node_modules')) {
            // Critical path - keep small for faster initial load
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Router - essential for navigation
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // UI libraries - split by usage frequency
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Form libraries - defer loading
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'form-vendor';
            }
            // Query libraries - essential for data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Supabase - critical for auth/data
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Heavy libraries - defer loading
            if (id.includes('recharts') || id.includes('framer-motion')) {
              return 'charts-vendor';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx')) {
              return 'heavy-vendor';
            }
            // Utils - lightweight, can be grouped
            if (id.includes('date-fns') || id.includes('zod') || id.includes('clsx') || id.includes('tailwind')) {
              return 'utils-vendor';
            }
            // All other vendor code
            return 'vendor';
          }
          // Split app code by routes for better lazy loading
          if (id.includes('/pages/') || id.includes('/routes/')) {
            return 'pages';
          }
          if (id.includes('/components/admin/')) {
            return 'admin';
          }
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset';
          const info = name.split('.');
          const ext = info[info.length - 1];
          
          // Add cache-busting hash for static assets
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
        preset: 'smallest'
      },
      experimentalMinChunkSize: 20000 // Merge small chunks to reduce overhead
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true
      },
      mangle: {
        safari10: true
      }
    },
    target: 'es2020',
    assetsInlineLimit: 4096 // Inline small assets to reduce requests
  }
}));