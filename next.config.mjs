import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: false,
  disable: process.env.NODE_ENV === 'development',
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
  // 'standalone' conflicts with @ducanh2912/next-pwa's file copy logic —
  // it passes undefined path IDs to Node's path.resolve() during the build,
  // which is what causes "The id argument must be of type string. Received undefined".
  // Removed for Vercel deployment — Vercel manages its own output format.
  images: { unoptimized: true },
   typescript: {
    ignoreBuildErrors: true,
  },
}

export default withPWA(nextConfig)
