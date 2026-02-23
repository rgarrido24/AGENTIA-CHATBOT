/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'qrcode', 'pdf-parse'],
  },
  transpilePackages: ['lucide-react'],
};

module.exports = nextConfig;
