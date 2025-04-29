/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mod-file.dn.nexoncdn.co.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;