import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Immo Bénin',
        short_name: 'Immo Bénin',
        description: 'Location sereine, paiement en toute confiance',
        theme_color: '#059669',
        background_color: '#F9FAFB',
        display: 'standalone',
        icons: [
          { src: '/vite.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  server: {
    port: 5173,
    // Un seul préfixe /api pour le backend : les routes SPA (/property, /auth, etc.) ne sont pas proxiées.
    // En dev, définir VITE_API_BASE_URL=/api (voir .env.development).
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
