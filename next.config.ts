/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // This will skip ESLint during build
  },
  typescript: {
    ignoreBuildErrors: true, // This will skip TypeScript errors during build
  },
  // ✅ Added for better PWA and notification support
  experimental: {
    appDir: true,
  },
  // ✅ Added security headers for notifications
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // ✅ Important for service workers and notifications
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // ✅ Specific headers for service worker
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
  // ✅ Added for better static optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  // ✅ Environment variables for client-side
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // ✅ Better image optimization for Vercel
  images: {
    domains: ['localhost'], // Add your domains if needed
    unoptimized: process.env.NODE_ENV === 'development', // Optimize images in production
  },
}

module.exports = nextConfig