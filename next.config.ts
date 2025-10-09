// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      }
    ];
  },
  // Important for OneSignal service worker
  async rewrites() {
    return [
      {
        source: '/onesignal/:path*',
        destination: 'https://cdn.onesignal.com/:path*'
      }
    ];
  }
}

module.exports = nextConfig;