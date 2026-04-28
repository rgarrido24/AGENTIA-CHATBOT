// exFAT fix: EISDIR → EINVAL for readlink on USB/SD card drives.
// exFAT returns EISDIR where NTFS/ext4 return EINVAL; build tools crash on EISDIR.
// Patches both callback and promise APIs, and webpack's inputFileSystem.
// This is a no-op on Linux/Render (readlink never returns EISDIR there).
const nodefs = require('fs');

// 1. Patch fs.readlink (callback) — used by graceful-fs / enhanced-resolve
const _rlCb = nodefs.readlink.bind(nodefs);
nodefs.readlink = function (p, opts, cb) {
  if (typeof opts === 'function') { cb = opts; opts = null; }
  const done = cb;
  const args = opts ? [p, opts, handler] : [p, handler];
  _rlCb(...args);
  function handler(err, link) {
    if (err && err.code === 'EISDIR') {
      const e = new Error(`EINVAL: invalid argument, readlink '${p}'`); e.code = 'EINVAL'; e.syscall = 'readlink'; e.path = p;
      done(e);
    } else done(err, link);
  }
};

// 2. Patch fs.readlinkSync
const _rlSync = nodefs.readlinkSync.bind(nodefs);
nodefs.readlinkSync = function (p, opts) {
  try { return _rlSync(p, opts); } catch (err) {
    if (err && err.code === 'EISDIR') { const e = new Error(`EINVAL: invalid argument, readlink '${p}'`); e.code = 'EINVAL'; e.syscall = 'readlink'; e.path = p; throw e; }
    throw err;
  }
};

// 3. Patch fs.promises.readlink — used by @vercel/nft (collect-build-traces)
const _rlPromise = nodefs.promises.readlink.bind(nodefs.promises);
nodefs.promises.readlink = async function (p, opts) {
  try { return await _rlPromise(p, opts); } catch (err) {
    if (err && err.code === 'EISDIR') { const e = new Error(`EINVAL: invalid argument, readlink '${p}'`); e.code = 'EINVAL'; e.syscall = 'readlink'; e.path = p; throw e; }
    throw err;
  }
};

// 4. Patch webpack's compiler.inputFileSystem (captured before our module-level patch)
function patchFsForExFat(fsObj) {
  if (!fsObj || !fsObj.readlink || fsObj.__exfat_patched) return;
  fsObj.__exfat_patched = true;
  const _orig = fsObj.readlink.bind(fsObj);
  fsObj.readlink = function (p, opts, cb) {
    if (typeof opts === 'function') { cb = opts; opts = null; }
    _orig(...(opts ? [p, opts, done] : [p, done]));
    function done(err, link) {
      if (err && err.code === 'EISDIR') {
        const e = new Error(`EINVAL: invalid argument, readlink '${p}'`); e.code = 'EINVAL'; e.syscall = 'readlink'; e.path = p;
        cb(e);
      } else cb(err, link);
    }
  };
}

class ExFatReadlinkPlugin {
  apply(compiler) {
    compiler.hooks.beforeRun.tap('ExFatReadlinkPlugin', () => {
      patchFsForExFat(compiler.inputFileSystem);
      patchFsForExFat(compiler.inputFileSystem && compiler.inputFileSystem._fileSystem);
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'qrcode', 'pdf-parse', 'ai', '@ai-sdk/google'],
  },
  transpilePackages: ['lucide-react'],

  webpack: (config) => {
    config.resolve.symlinks = false;
    config.cache = { type: 'memory' };
    config.plugins.push(new ExFatReadlinkPlugin());
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
