import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
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
      },
      devOptions: { 
        enabled: true,
        type: 'module'
      },
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
