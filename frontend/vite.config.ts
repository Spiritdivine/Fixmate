import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon.png',
        'apple-touch-icon.png',
        'brand/*.png',
      ],
      manifest: {
        name: 'Artifix — The Verified Artisan Trust Network',
        short_name: 'Artifix',
        description: 'Hire verified artisans with zero-dispute smart contract escrow protection across Nigeria.',
        theme_color: '#0284c7',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/?source=pwa',
        scope: '/',
        categories: ['business', 'finance', 'utilities'],
        icons: [
          {
            src: '/brand/artifix-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/brand/artifix-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/brand/artifix-icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Browse Jobs',
            short_name: 'Jobs',
            description: 'Find artisan jobs matching your trade',
            url: '/artisan/jobs',
            icons: [{ src: '/brand/artifix-icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Post a Job',
            short_name: 'Post Job',
            description: 'Post a new artisan service request',
            url: '/client/post-job',
            icons: [{ src: '/brand/artifix-icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Active Contracts',
            short_name: 'Contracts',
            description: 'View active escrow contracts and milestones',
            url: '/artisan/contracts',
            icons: [{ src: '/brand/artifix-icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'My Wallet',
            short_name: 'Wallet',
            description: 'Manage escrow deposits and withdrawals',
            url: '/artisan/wallet',
            icons: [{ src: '/brand/artifix-icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        importScripts: ['/sw-push.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/images/auth/**', '**/images/test-*', '**/test-*', '**/*.map'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Cache Leaflet OpenStreetMap tiles for offline map navigation
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache external fonts (Fontshare, Google Fonts)
            urlPattern: /^https:\/\/(api\.fontshare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'artifix-fonts-cache',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache public artisan directory and trade categories
            urlPattern: /\/api\/v1\/(categories|skills|artisans\/public)/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'artifix-public-api-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Contracts & user details (Network First with offline cache fallback)
            urlPattern: /\/api\/v1\/(contracts|users\/me)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'artifix-user-contracts-cache',
              networkTimeoutSeconds: 3.5,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['react-is', 'recharts', '@stripe/stripe-js'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5050',
        ws: true,
      },
    },
  },
});

