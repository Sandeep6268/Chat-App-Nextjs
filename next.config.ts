// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/OneSignalSDKWorker.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          },
          {
            key: 'Content-Type',
            value: 'application/javascript'
          }
        ],
      },
      {
        source: '/OneSignalSDK.sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          },
          {
            key: 'Content-Type',
            value: 'application/javascript'
          }
        ],
      },
    ];
  },
}

module.exports = nextConfig