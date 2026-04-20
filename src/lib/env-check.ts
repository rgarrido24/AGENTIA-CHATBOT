/**
 * Validates required environment variables at server startup.
 * Call from the first server-side module that loads (e.g. app/layout.tsx server component or a lib init).
 * Does NOT throw — only logs clear warnings so the server keeps running.
 */

const REQUIRED_VARS: { name: string; description: string }[] = [
  { name: 'GEMINI_API_KEY',              description: 'Google Gemini AI key' },
  { name: 'MONGODB_URI',                 description: 'MongoDB Atlas connection string' },
  { name: 'ADMIN_PASSWORD',              description: 'Dashboard admin password' },
  { name: 'CRON_SECRET',                 description: 'Shared secret for cron/webhook endpoints' },
];

export function checkEnvVars(): void {
  const missing: string[] = [];

  for (const v of REQUIRED_VARS) {
    if (!process.env[v.name]) {
      missing.push(`  ✗ ${v.name.padEnd(35)} — ${v.description}`);
    }
  }

  if (missing.length > 0) {
    console.error('\n⚠️  [env-check] Missing environment variables:\n');
    missing.forEach((m) => console.error(m));
    console.error('\nThe server will continue, but some features may be broken.\n');
  }
}
