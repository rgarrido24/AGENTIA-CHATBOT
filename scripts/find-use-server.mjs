import fs from 'fs';
import path from 'path';

const roots = ['app', 'lib', 'components', 'src', 'api'];
const skip = new Set(['node_modules', '.git', '.next', 'dist', 'build']);

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) {
      let t;
      try {
        t = fs.readFileSync(p, 'utf8');
      } catch {
        continue;
      }
      if (/'use server'|"use server"/.test(t)) out.push(p);
    }
  }
}

const hits = [];
for (const r of roots) walk(r, hits);
hits.sort();
if (hits.length) {
  console.log("'use server' found in:");
  hits.forEach((h) => console.log(' ', h));
  process.exit(1);
}
console.log("No 'use server' in app/, lib/, components/, src/, api/");
