/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'qrcode', 'pdf-parse', 'ai', '@ai-sdk/google'],
  },
  transpilePackages: ['lucide-react'],

  // Fix for EISDIR/readlink error on Windows with Next.js 14 + webpack cache
  webpack: (config) => {
    config.resolve.symlinks = false;
    // Disable persistent filesystem cache (triggers readlink on Windows NTFS)
    config.cache = { type: 'memory' };
    return config;
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },

  async headers() {
    return [
      // Long-lived cache for static assets (Next.js hashes filenames)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache for public images and fonts
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Minimal referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS — only applied by browsers over HTTPS
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Content Security Policy
          // unsafe-inline needed for Tailwind inline styles and Next.js hydration
          // unsafe-eval needed for Next.js dynamic imports in some builds
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://generativelanguage.googleapis.com",
              "font-src 'self' data:",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
