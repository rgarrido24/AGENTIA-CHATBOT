/**
 * Lista URLs públicas del anuario K3 en agentia.software.
 * Requiere ANUARIO_VERCEL_BYPASS_SECRET (o VERCEL_AUTOMATION_BYPASS_SECRET) si Vercel tiene Deployment Protection.
 *
 * Uso: node scripts/list-anuario-k3-links.mjs
 */
const fs = require('fs');
const path = require('path');

function getEnv(key) {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(__dirname, '..', file);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (m) {
      let v = m[1].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v) return v;
    }
  }
  return process.env[key] || '';
}

const UPSTREAM = (getEnv('ANUARIO_K3_UPSTREAM_URL') || 'https://anuario-k3-git-main-rgos-projects-0215a8f4.vercel.app').replace(
  /\/$/,
  ''
);
const PUBLIC = (getEnv('NEXT_PUBLIC_APP_URL') || 'https://agentia.software').replace(/\/$/, '');
const PREFIX = '/anuariok3asbaje';
const bypass = getEnv('ANUARIO_VERCEL_BYPASS_SECRET') || getEnv('VERCEL_AUTOMATION_BYPASS_SECRET');

async function fetchPath(pathSeg) {
  const url = `${UPSTREAM}/${pathSeg}`;
  const headers = { accept: 'text/html,application/json' };
  if (bypass) {
    headers['x-vercel-protection-bypass'] = bypass;
    headers['x-vercel-set-bypass-cookie'] = 'true';
  }
  const res = await fetch(url, { headers, redirect: 'manual' });
  const text = await res.text();
  return { status: res.status, text };
}

function extractHrefs(html) {
  const hrefs = new Set();
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    hrefs.add(m[1]);
  }
  return [...hrefs];
}

async function main() {
  console.log('Dashboard:', `${PUBLIC}${PREFIX}/dashboard`);
  console.log('Raíz:', `${PUBLIC}${PREFIX}/`);
  console.log('');

  if (!bypass) {
    console.warn('⚠️  Sin ANUARIO_VERCEL_BYPASS_SECRET — el upstream puede responder 401 (Vercel Protection).');
    console.warn('   Configuralo en Render y en .env.local para listar los 14 niños automáticamente.\n');
  }

  const { status, text } = await fetchPath('dashboard');
  if (status >= 400) {
    console.error(`Upstream /dashboard → HTTP ${status}. No se pudieron extraer slugs.`);
    process.exit(status === 401 ? 0 : 1);
  }

  const internal = extractHrefs(text).filter(
    (h) =>
      h.startsWith('/') &&
      !h.startsWith('/_next') &&
      !h.startsWith('/api') &&
      h !== '/dashboard' &&
      h !== '/'
  );

  const slugs = [...new Set(internal.map((h) => h.replace(/^\//, '').split('?')[0]).filter(Boolean))].sort();

  if (slugs.length === 0) {
    console.log('No se encontraron enlaces internos en /dashboard. Revisá el HTML del proyecto anuario-k3.');
    return;
  }

  console.log(`Enlaces (${slugs.length} rutas detectadas):`);
  for (const slug of slugs) {
    console.log(`  ${PUBLIC}${PREFIX}/${slug}`);
  }
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
