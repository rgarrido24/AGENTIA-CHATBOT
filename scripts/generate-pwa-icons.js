#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');

function svgText(bg, label) {
  const fontSize = label.length > 3 ? 88 : 140;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
      `<rect width="512" height="512" rx="96" fill="${bg}"/>` +
      `<text x="256" y="290" font-size="${fontSize}" text-anchor="middle" fill="#fff" ` +
      `font-family="Arial,sans-serif" font-weight="bold">${label}</text></svg>`,
  );
}

/** Icono CWF: cubeta + marca (Flood / distribuidor). */
function svgCwfBucket() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1208"/>
      <stop offset="55%" stop-color="#5c3a18"/>
      <stop offset="100%" stop-color="#c8863a"/>
    </linearGradient>
    <linearGradient id="bucket" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f5e6d3"/>
      <stop offset="100%" stop-color="#d4a574"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect x="36" y="36" width="440" height="440" rx="72" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>
  <!-- asa cubeta -->
  <path d="M176 168 C176 118 336 118 336 168" fill="none" stroke="#f5e6d3" stroke-width="18" stroke-linecap="round"/>
  <!-- cuerpo cubeta -->
  <path d="M148 188 L364 188 L332 372 C328 396 308 412 256 412 C204 412 184 396 180 372 Z" fill="url(#bucket)" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>
  <!-- líquido / producto -->
  <path d="M168 248 L344 248 L324 340 C320 358 296 368 256 368 C216 368 192 358 188 340 Z" fill="#c8863a" opacity="0.85"/>
  <ellipse cx="256" cy="248" rx="88" ry="14" fill="#8b5a2b" opacity="0.35"/>
  <!-- texto -->
  <text x="256" y="468" font-size="54" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" letter-spacing="6">CWF</text>
  <text x="256" y="92" font-size="22" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Arial,sans-serif" font-weight="600" letter-spacing="3">MÉXICO</text>
</svg>`);
}

async function gen(dir, svgBuffer) {
  fs.mkdirSync(dir, { recursive: true });
  for (const s of [192, 512]) {
    await sharp(svgBuffer).resize(s, s).png().toFile(`${dir}/icon-${s}.png`);
  }
}

(async () => {
  await gen('public/pwa/cwf', svgCwfBucket());
  await gen('public/pwa/agentia', svgText('#3b82f6', 'A'));
  console.log('PWA icons generated');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
