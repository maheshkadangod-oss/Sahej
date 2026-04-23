import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // autoUpdate: new SW takes over on next visit; no "update available" prompt required.
      // For a postpartum app used erratically, silent updates are the right default — we never
      // want to nag a 3am user to tap a refresh button.
      registerType: 'autoUpdate',
      // Precache everything in dist so first-offline-visit works, not just warm-cache reloads.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png,webmanifest}'],
        // Single-page app: any unknown route falls back to index.html (client routes /share/*, /report/print).
        navigateFallback: '/index.html',
        // Don't fall back for actual API misses — let them 404 naturally so the UI can handle it.
        navigateFallbackDenylist: [/^\/api\//],
        // 5MB precache ceiling — our build is ~1.2MB so plenty of headroom.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Clean up caches from old SW versions automatically.
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Google Fonts stylesheets — small, refresh weekly in background.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Google Fonts woff2 binaries — large, rarely change, cache 1 year.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // AI calls — never cache. Privacy (each response is personal) + freshness.
            urlPattern: /\/api\/gemini/,
            handler: 'NetworkOnly',
          },
          {
            // Share link creation + reads — never cache. Tokens are one-shot reads.
            urlPattern: /\/api\/share/,
            handler: 'NetworkOnly',
          },
          {
            // Admin analytics — network first but fall back to cache so the dashboard loads
            // offline with stale data rather than a blank screen.
            urlPattern: /\/api\/admin/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'admin-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'Sahej - Postpartum Wellness',
        short_name: 'Sahej',
        description: 'A gentle companion for postpartum wellness — mood tracking, journaling, EPDS screening, and AI support.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FDF8F4',
        theme_color: '#FDF8F4',
        categories: ['health', 'medical', 'lifestyle'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
  build: {
    // Don't prefetch lazy chunks at initial load — they're only needed when
    // the user navigates to MoodTab (recharts), ChatTab (markdown), or falls
    // back to the Gemini client SDK (genai). Prefetching them inflates the
    // first-paint network bill for no gain.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter(d => !/\/(recharts|markdown|genai)-/.test(d)),
    },
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          markdown: ['react-markdown'],
          genai: ['@google/genai'],
        },
      },
    },
  },
});
