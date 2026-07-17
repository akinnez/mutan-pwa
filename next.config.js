const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  // We register the service worker ourselves via sw-register.js
  // (loaded in app/layout.tsx) — don't let next-pwa double-register it.
  register: false,
  disable: process.env.NODE_ENV === 'development',
  // This is the actual offline-fallback wiring. Without this, /offline
  // exists as a page but nothing ever routes a failed navigation to it —
  // the browser's own native "no internet" screen shows instead.
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https?:\/\/.*\/api\/v1\/auth\/.*/i,
        handler: 'NetworkOnly',
        method: 'GET',
      },
      {
        urlPattern: /^https?:\/\/.*\/api\/v1\/(members\/me|schemes|loans|investments|shares).*/i,
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'api-data',
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        method: 'GET',
        options: {
          cacheName: 'next-static',
          expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/(dashboard|savings|loans|investments|shares|payments|profile).*/i,
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'app-pages',
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
}

module.exports = withPWA(nextConfig)
