/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // This will skip ESLint during build
  },
  typescript: {
    ignoreBuildErrors: true, // This will skip TypeScript errors during build
  },
}

module.exports = nextConfig