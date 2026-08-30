/* eslint-disable no-console */
const { spawn } = require('child_process');
const path = require('path');

function parsePort(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const host = '0.0.0.0';
const port = parsePort(process.env.PORT) ?? 3010;

const nextBin = process.platform === 'win32'
  ? path.join(__dirname, '..', 'node_modules', '.bin', 'next.cmd')
  : path.join(__dirname, '..', 'node_modules', '.bin', 'next');

console.log(`[start-next] Starting Next on ${host}:${port}`);

const child = spawn(nextBin, ['start', '-H', host, '-p', String(port)], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 1));

