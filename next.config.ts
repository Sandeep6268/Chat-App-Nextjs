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
  // Disable server components for now to avoid issues
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  // Exclude firebase-admin from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        http2: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig