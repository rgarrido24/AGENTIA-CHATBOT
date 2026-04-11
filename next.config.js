/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'qrcode', 'pdf-parse', 'ai', '@ai-sdk/google'],
  },
  transpilePackages: ['lucide-react'],
};

module.exports = nextConfig;
