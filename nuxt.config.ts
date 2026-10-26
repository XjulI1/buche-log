export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: { compatibilityVersion: 4 },

  ssr: false,

  modules: ['@pinia/nuxt', '@vite-pwa/nuxt', '@nuxt/eslint'],

  css: ['~/assets/styles/main.css'],

  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        noFallthroughCasesInSwitch: true,
      },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Buche-Log',
      meta: [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'theme-color', content: '#8b4513' },
        {
          name: 'description',
          content: 'Application de suivi de consommation de bois de chauffage',
        },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  runtimeConfig: {
    dbHost: '',
    dbPort: '3306',
    dbName: '',
    dbUser: '',
    dbPassword: '',
    jwtSecret: '',
  },

  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
    manifest: {
      name: 'Buche-Log - Suivi Bois de Chauffage',
      short_name: 'Buche-Log',
      description: 'Application de suivi de consommation de bois de chauffage',
      theme_color: '#8b4513',
      background_color: '#faf8f5',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      navigateFallbackDenylist: [/^\/api\//],
    },
  },
})
