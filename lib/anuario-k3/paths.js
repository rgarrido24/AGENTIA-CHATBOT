export const ANUARIO_BASE = '/anuariok3asbaje';

export function anuarioPath(subpath = '') {
  if (!subpath || subpath === '/') return ANUARIO_BASE;
  const p = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${ANUARIO_BASE}${p}`;
}

export const ANUARIO_COOKIE = 'anuario-k3-admin-auth';

export function anuarioAdminPassword() {
  return process.env.ANUARIO_K3_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
}
