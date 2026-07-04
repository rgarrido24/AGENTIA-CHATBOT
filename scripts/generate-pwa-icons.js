#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');

function svg(bg, label) {
  const fontSize = label.length > 3 ? 88 : 140;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
      `<rect width="512" height="512" rx="96" fill="${bg}"/>` +
      `<text x="256" y="290" font-size="${fontSize}" text-anchor="middle" fill="#fff" ` +
      `font-family="Arial,sans-serif" font-weight="bold">${label}</text></svg>`,
  );
}

async function gen(dir, bg, label) {
  fs.mkdirSync(dir, { recursive: true });
  for (const s of [192, 512]) {
    await sharp(svg(bg, label)).resize(s, s).png().toFile(`${dir}/icon-${s}.png`);
  }
}

(async () => {
  await gen('public/pwa/cwf', '#c8863a', 'CWF');
  await gen('public/pwa/agentia', '#3b82f6', 'A');
  console.log('PWA icons generated');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
