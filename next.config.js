/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['mongodb', 'qrcode', 'pdf-parse'] },
  transpilePackages: ['lucide-react'],
  async redirects() {
    return [{ source: '/demo-barber', destination: '/demo/barber', permanent: true }];
  },
};
module.exports = nextConfig;
