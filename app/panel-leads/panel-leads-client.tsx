'use client';

const css = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

#pl-root *, #pl-root *::before, #pl-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
#pl-root a { color: inherit; text-decoration: none; }

#pl-root {
  --bg:         #08090b;
  --bg-2:       #0f1013;
  --bg-3:       #16181c;
  --bg-4:       #1e2026;
  --line:       rgba(255,255,255,.06);
  --line-2:     rgba(255,255,255,.10);
  --line-3:     rgba(255,255,255,.18);
  --t1:         #f5f5f7;
  --t2:         rgba(245,245,247,.56);
  --t3:         rgba(245,245,247,.30);
  --blue:       #2563eb;
  --blue-hi:    #3b82f6;
  --blue-soft:  rgba(37,99,235,.10);
  --green:      #16a34a;
  --green-hi:   #22c55e;
  --green-soft: rgba(22,163,74,.09);
  --amber:      #d97706;
  --amber-hi:   #f59e0b;
  --r4:4px; --r8:8px; --r12:12px; --r-pill:999px;
  font-family: 'Geist', system-ui, sans-serif;
  background: var(--bg);
  color: var(--t1);
  overflow-x: hidden;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  color-scheme: dark;
  min-height: 100vh;
}

#pl-root::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 50% 35% at 65% -5%,rgba(37,99,235,.06) 0%,transparent 55%),
    radial-gradient(ellipse 40% 20% at 15% 85%,rgba(22,163,74,.035) 0%,transparent 50%);
}

/* ── LAYOUT ── */
.pl-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding-left: max(24px, env(safe-area-inset-left,0px));
  padding-right: max(24px, env(safe-area-inset-right,0px));
}

/* ── NAV ── */
#pl-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 52px;
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  background: rgba(8,9,11,.8);
}
.pl-nav-inner { height: 100%; display: flex; align-items: center; justify-content: space-between; }
.pl-nav-brand { display: flex; align-items: center; gap: 8px; }
.pl-nav-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--green-hi); box-shadow: 0 0 8px var(--green-hi);
  animation: pl-pulse 2.4s ease-in-out infinite;
}
@keyframes pl-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }
.pl-nav-name { font-size: 14px; font-weight: 600; letter-spacing: -.01em; }
.pl-nav-actions { display: flex; align-items: center; gap: 10px; }
.pl-nav-link { font-size: 13px; color: var(--t2); transition: color .15s; }
.pl-nav-link:hover { color: var(--t1); }
.pl-nav-cta {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 16px; border-radius: var(--r-pill);
  background: var(--t1); color: var(--bg);
  font-size: 13px; font-weight: 600; letter-spacing: -.01em;
  transition: opacity .12s, transform .12s;
}
.pl-nav-cta:hover { opacity: .88; }
.pl-nav-cta:active { transform: scale(.97); }

/* ── KEYFRAMES ── */
@keyframes pl-fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pl-rowIn {
  from { opacity: 0; background: rgba(37,99,235,.07); }
  to   { opacity: 1; background: transparent; }
}
@keyframes pl-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* ── HERO ── */
#pl-hero {
  min-height: 100svh;
  padding-top: 52px;
  display: flex; flex-direction: column;
  position: relative; overflow: hidden;
}
.pl-hero-body {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  padding-block: 72px 0;
}
.pl-proof-badge {
  display: inline-flex; align-items: center; gap: 10px;
  margin-bottom: 28px;
  animation: pl-fadeUp .6s cubic-bezier(.16,1,.3,1) both;
}
.pl-proof-avatars { display: flex; }
.pl-proof-av {
  width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--bg);
  background: linear-gradient(135deg,#3b82f6,#60a5fa);
  font-size: 9px; font-weight: 700; color: #fff;
  display: flex; align-items: center; justify-content: center;
  margin-left: -8px;
}
.pl-proof-av:first-child { margin-left: 0; background: linear-gradient(135deg,#22c55e,#4ade80); }
.pl-proof-av:nth-child(2) { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
.pl-proof-av:nth-child(3) { background: linear-gradient(135deg,#ec4899,#f9a8d4); }
.pl-proof-text { font-size: 12px; color: var(--t2); }
.pl-proof-text strong { color: var(--t1); font-weight: 500; }

#pl-root h1 {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: clamp(46px, 7.8vw, 92px);
  font-weight: 400; line-height: 1.01; letter-spacing: -.035em;
  text-wrap: balance; max-width: 860px;
  animation: pl-fadeUp .7s .06s cubic-bezier(.16,1,.3,1) both;
}
#pl-root h1 em { font-style: italic; color: var(--t2); }

.pl-hero-sub {
  margin-top: 24px;
  font-size: clamp(15px, 1.6vw, 18px); line-height: 1.65;
  color: var(--t2); max-width: 520px; text-wrap: balance;
  animation: pl-fadeUp .7s .12s cubic-bezier(.16,1,.3,1) both;
}
.pl-hero-stats {
  display: flex; flex-wrap: wrap; gap: 28px;
  margin-top: 36px; padding-top: 32px;
  border-top: 1px solid var(--line);
  animation: pl-fadeUp .7s .18s cubic-bezier(.16,1,.3,1) both;
}
.pl-hstat { display: flex; flex-direction: column; gap: 4px; }
.pl-hstat-n {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(28px, 3.2vw, 38px); font-weight: 400;
  letter-spacing: -.03em; line-height: 1;
}
.pl-hstat-l { font-size: 11px; color: var(--t3); letter-spacing: .05em; text-transform: uppercase; font-weight: 500; }
.pl-hstat-sep { width: 1px; background: var(--line-2); align-self: stretch; }

.pl-hero-actions {
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 40px;
  animation: pl-fadeUp .7s .22s cubic-bezier(.16,1,.3,1) both;
}
.pl-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 26px; border-radius: var(--r-pill);
  background: var(--t1); color: var(--bg);
  font-size: 14px; font-weight: 600; letter-spacing: -.01em;
  transition: transform .12s cubic-bezier(.16,1,.3,1), box-shadow .15s;
}
.pl-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,0,0,.45); }
.pl-btn-primary:active { transform: scale(.97); }
.pl-btn-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 24px; border-radius: var(--r-pill);
  border: 1px solid var(--line-2);
  font-size: 14px; font-weight: 400; color: var(--t2);
  transition: border-color .15s, color .15s;
}
.pl-btn-secondary:hover { border-color: var(--line-3); color: var(--t1); }

/* ── PANEL SCREENSHOT ── */
.pl-hero-screen {
  position: relative; z-index: 1;
  margin-top: 52px;
  animation: pl-fadeUp .9s .28s cubic-bezier(.16,1,.3,1) both;
}
.pl-screen-chrome {
  background: var(--bg-2);
  border: 1px solid var(--line-2); border-bottom: none;
  border-radius: 14px 14px 0 0; overflow: hidden;
  box-shadow: 0 -4px 0 rgba(255,255,255,.04), 0 -24px 80px rgba(37,99,235,.05);
}
.pl-chrome-bar {
  display: flex; align-items: center;
  padding: 11px 16px; border-bottom: 1px solid var(--line);
  background: var(--bg-3);
}
.pl-chrome-dots { display: flex; gap: 6px; margin-right: 14px; }
.pl-cd { width: 9px; height: 9px; border-radius: 50%; }
.pl-cd-r { background: #ff5f57; } .pl-cd-y { background: #febc2e; } .pl-cd-g { background: #28c840; }
.pl-chrome-url {
  flex: 1; text-align: center; padding: 5px 12px; border-radius: 6px;
  background: rgba(255,255,255,.04); border: 1px solid var(--line);
  font-family: 'Geist Mono', monospace; font-size: 11px; color: var(--t3);
}
.pl-panel-shell {
  display: grid; grid-template-columns: 192px 1fr;
  min-height: 380px; background: var(--bg-2);
}
.pl-p-sidebar {
  background: rgba(255,255,255,.016); border-right: 1px solid var(--line);
  padding: 14px 10px; display: flex; flex-direction: column; gap: 1px;
}
.pl-psec { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--t3); padding: 12px 10px 6px; }
.pl-pitem {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px; border-radius: var(--r8);
  font-size: 12px; color: var(--t2); cursor: pointer; transition: background .1s, color .1s;
}
.pl-pitem.on { background: rgba(37,99,235,.09); color: var(--t1); }
.pl-pitem:hover:not(.on) { background: rgba(255,255,255,.04); }
.pl-pitem-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--line-2); flex-shrink: 0; }
.pl-pitem.on .pl-pitem-dot { background: var(--blue-hi); }
.pl-p-main { padding: 18px 20px; overflow: hidden; }
.pl-pmain-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.pl-pmain-title { font-size: 13.5px; font-weight: 600; letter-spacing: -.01em; }
.pl-pmain-chips { display: flex; gap: 7px; align-items: center; }
.pl-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: var(--r-pill); font-size: 10.5px; font-weight: 500; }
.pl-chip-live { background: rgba(22,163,74,.08); color: var(--green-hi); border: 1px solid rgba(22,163,74,.14); }
.pl-chip-live::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--green-hi); animation: pl-pulse 1.6s infinite; }
.pl-chip-date { background: rgba(37,99,235,.08); color: #93c5fd; border: 1px solid rgba(37,99,235,.12); }
.pl-ltable { width: 100%; border-collapse: collapse; font-size: 12px; }
.pl-ltable thead th { padding: 0 10px 9px; text-align: left; font-size: 9.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--t3); border-bottom: 1px solid var(--line); }
.pl-ltable tbody tr { cursor: default; transition: background .1s; }
.pl-ltable tbody tr:hover { background: rgba(255,255,255,.022); }
.pl-ltable td { padding: 11px 10px; border-bottom: 1px solid rgba(255,255,255,.028); vertical-align: middle; line-height: 1.3; }
.pl-lead-name { font-size: 12.5px; font-weight: 500; }
.pl-lead-time { font-size: 10px; color: var(--t3); margin-top: 2px; }
.pl-lead-src { font-size: 11.5px; color: var(--t2); }
.pl-badge { display: inline-flex; padding: 3px 9px; border-radius: var(--r-pill); font-size: 9.5px; font-weight: 600; letter-spacing: .03em; white-space: nowrap; }
.pl-b-new { background: rgba(37,99,235,.10); color: #93c5fd; border: 1px solid rgba(37,99,235,.14); }
.pl-b-hot { background: rgba(245,158,11,.08); color: #fcd34d; border: 1px solid rgba(245,158,11,.12); }
.pl-b-won { background: rgba(22,163,74,.08); color: #86efac; border: 1px solid rgba(22,163,74,.12); }
.pl-b-trk { background: rgba(168,85,247,.08); color: #d8b4fe; border: 1px solid rgba(168,85,247,.12); }
.pl-wa-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: var(--r8);
  background: rgba(37,211,102,.06); border: 1px solid rgba(37,211,102,.14);
  color: #4ade80; font-size: 10.5px; font-weight: 500; cursor: pointer; white-space: nowrap;
  transition: background .12s;
}
.pl-wa-btn:hover { background: rgba(37,211,102,.12); }
.pl-row-new td { animation: pl-rowIn .45s cubic-bezier(.16,1,.3,1) both; }

/* ── TICKER ── */
.pl-ticker { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); overflow: hidden; padding: 10px 0; background: rgba(255,255,255,.012); }
.pl-ticker-track { display: flex; gap: 36px; width: max-content; animation: pl-marquee 28s linear infinite; }
.pl-ticker-item { display: flex; align-items: center; gap: 8px; white-space: nowrap; font-size: 11.5px; color: var(--t3); }
.pl-ticker-item b { color: var(--t2); font-weight: 500; }
.pl-ticker-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--line-2); }

/* ── SECTION SHARED ── */
#pl-root section { position: relative; z-index: 1; }
.pl-sec-label { display: block; margin-bottom: 12px; font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--t3); }
#pl-root h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(30px, 4.2vw, 50px); font-weight: 400; line-height: 1.08; letter-spacing: -.028em; text-wrap: balance; }
.pl-sub { margin-top: 14px; font-size: clamp(14px, 1.5vw, 16px); line-height: 1.7; color: var(--t2); max-width: 480px; text-wrap: balance; }

/* ── SOCIAL PROOF ── */
#pl-social { padding: 60px 0; border-bottom: 1px solid var(--line); }
.pl-social-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 28px; }
.pl-social-left { max-width: 460px; }
.pl-social-left p { font-size: 13.5px; line-height: 1.7; color: var(--t2); }
.pl-social-left p strong { color: var(--t1); font-weight: 500; }
.pl-stats-row { display: flex; gap: 1px; background: var(--line); border: 1px solid var(--line-2); border-radius: var(--r12); overflow: hidden; }
.pl-stat-tile { background: var(--bg-2); padding: 22px 28px; flex: 1; min-width: 130px; transition: background .15s; }
.pl-stat-tile:hover { background: var(--bg-3); }
.pl-st-n { font-family: 'Instrument Serif', serif; font-size: clamp(32px, 3.5vw, 42px); font-weight: 400; letter-spacing: -.04em; line-height: 1; }
.pl-st-l { font-size: 10.5px; color: var(--t3); margin-top: 6px; letter-spacing: .04em; text-transform: uppercase; font-weight: 500; line-height: 1.4; }
.pl-st-delta { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 11px; color: var(--green-hi); font-weight: 500; }

/* ── PROBLEMA ── */
#pl-prob { padding: 100px 0; border-top: 1px solid var(--line); }
.pl-prob-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
.pl-pain-items { margin-top: 40px; }
.pl-pain { display: grid; grid-template-columns: 28px 1fr; gap: 16px; padding: 20px 0; border-bottom: 1px solid var(--line); transition: border-color .2s; }
.pl-pain:first-child { border-top: 1px solid var(--line); }
.pl-pain:hover { border-color: var(--line-2); }
.pl-pain-n { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 14px; color: var(--t3); padding-top: 2px; text-align: right; }
.pl-pain h3 { font-size: 13.5px; font-weight: 500; margin-bottom: 5px; }
.pl-pain p { font-size: 12.5px; line-height: 1.65; color: var(--t2); }
.pl-compare { background: var(--bg-2); border: 1px solid var(--line-2); border-radius: var(--r12); overflow: hidden; }
.pl-compare-tabs { display: flex; border-bottom: 1px solid var(--line); }
.pl-ctab { flex: 1; padding: 11px 16px; font-size: 12px; font-weight: 500; text-align: center; color: var(--t3); cursor: pointer; transition: color .15s, background .15s; border-right: 1px solid var(--line); }
.pl-ctab:last-child { border-right: none; }
.pl-ctab.on { color: var(--t1); background: rgba(255,255,255,.028); }
.pl-cpane { padding: 20px; display: none; }
.pl-cpane.on { display: block; }
.pl-xrow { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.04); font-size: 11.5px; }
.pl-xcell { flex: 1; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-xhead .pl-xcell { font-size: 9.5px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--t3); }
.pl-xwarn { margin-top: 12px; padding: 10px 12px; border-radius: var(--r8); background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.12); font-size: 11.5px; color: #fca5a5; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start; }
.pl-notif { display: flex; gap: 12px; padding: 12px 14px; border-radius: 10px; background: var(--bg-3); border: 1px solid var(--line-2); margin-bottom: 8px; animation: pl-fadeUp .35s cubic-bezier(.16,1,.3,1) both; }
.pl-notif:nth-child(2) { animation-delay: .08s; }
.pl-notif-ic { width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.pl-notif-ic-blue { background: rgba(37,99,235,.1); border: 1px solid rgba(37,99,235,.18); }
.pl-notif-ic-green { background: rgba(22,163,74,.08); border: 1px solid rgba(22,163,74,.15); }
.pl-notif-title { font-size: 12.5px; font-weight: 500; margin-bottom: 3px; }
.pl-notif-body { font-size: 11.5px; color: var(--t2); line-height: 1.5; }
.pl-notif-t { font-size: 10px; color: var(--t3); margin-top: 3px; }
.pl-notif-wa { margin-top: 8px; display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: var(--r-pill); background: rgba(37,211,102,.07); border: 1px solid rgba(37,211,102,.14); font-size: 11px; font-weight: 500; color: #4ade80; }

/* ── VIDEO ── */
#pl-video { padding: 100px 0; border-top: 1px solid var(--line); }
.pl-video-layout { display: grid; grid-template-columns: 1fr 1.6fr; gap: 60px; align-items: center; }
.pl-vwrap { position: relative; border-radius: var(--r12); overflow: hidden; border: 1px solid var(--line-2); background: var(--bg-3); aspect-ratio: 16/9; cursor: pointer; box-shadow: 0 0 60px rgba(37,99,235,.07); }
.pl-vwrap video { width: 100%; height: 100%; object-fit: cover; display: block; }
.pl-voverlay { position: absolute; inset: 0; background: rgba(8,9,11,.45); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; transition: opacity .25s cubic-bezier(.16,1,.3,1); }
.pl-vplay-btn { width: 60px; height: 60px; border-radius: 50%; background: var(--t1); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px rgba(0,0,0,.5); transition: transform .15s cubic-bezier(.16,1,.3,1); }
.pl-vplay-btn:hover { transform: scale(1.08); }
.pl-vplay-btn:active { transform: scale(.94); }
.pl-voverlay-label { font-size: 12px; color: rgba(255,255,255,.65); font-weight: 500; }
.pl-vwrap.playing .pl-voverlay { opacity: 0; pointer-events: none; }

/* ── CÓMO FUNCIONA ── */
#pl-como { padding: 100px 0; border-top: 1px solid var(--line); }
.pl-como-grid { display: grid; grid-template-columns: 380px 1fr; gap: 80px; align-items: start; margin-top: 52px; }
.pl-steps { display: flex; flex-direction: column; }
.pl-step { display: flex; gap: 20px; padding: 24px 0; border-bottom: 1px solid var(--line); transition: border-color .2s; cursor: default; }
.pl-step:first-child { border-top: 1px solid var(--line); }
.pl-step:hover { border-color: var(--line-2); }
.pl-step-n { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 22px; color: var(--t3); flex-shrink: 0; width: 28px; text-align: right; padding-top: 2px; }
.pl-step h3 { font-size: 13.5px; font-weight: 500; margin-bottom: 6px; }
.pl-step p { font-size: 12.5px; line-height: 1.65; color: var(--t2); }
.pl-step-time { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 10.5px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; color: var(--green-hi); }
.pl-step-vis { position: sticky; top: 72px; background: var(--bg-2); border: 1px solid var(--line-2); border-radius: var(--r12); overflow: hidden; }
.pl-sv-top { padding: 14px 18px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 500; color: var(--t2); }
.pl-sv-body { padding: 16px 18px; }
.pl-sv-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--r8); background: var(--bg-3); margin-bottom: 8px; border: 1px solid var(--line); }
.pl-sv-av { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; font-size: 11px; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.pl-sv-name { font-size: 12.5px; font-weight: 500; }
.pl-sv-sub { font-size: 10.5px; color: var(--t3); margin-top: 1px; }
.pl-sv-code { margin-top: 12px; padding: 12px 14px; border-radius: var(--r8); background: rgba(0,0,0,.35); border: 1px solid var(--line); font-family: 'Geist Mono', monospace; font-size: 10.5px; color: #86efac; line-height: 1.65; }

/* ── FEATURES ── */
#pl-feat { padding: 100px 0; border-top: 1px solid var(--line); }
.pl-feat-intro { margin-bottom: 52px; }
.pl-bento { display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: auto auto; gap: 1px; background: var(--line); border: 1px solid var(--line-2); border-radius: var(--r12); overflow: hidden; }
.pl-bc { background: var(--bg-2); padding: 28px 26px; transition: background .15s; }
.pl-bc:hover { background: var(--bg-3); }
.pl-bc.span2 { grid-column: 1/3; }
.pl-bc.tall { grid-row: 1/3; grid-column: 3; display: flex; flex-direction: column; }
.pl-bc-label { font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--t3); margin-bottom: 14px; display: block; }
.pl-bc h3 { font-size: 14.5px; font-weight: 500; letter-spacing: -.01em; margin-bottom: 8px; }
.pl-bc p { font-size: 12.5px; line-height: 1.65; color: var(--t2); }
.pl-bc-tag { display: inline-flex; margin-top: 14px; padding: 3px 10px; border-radius: var(--r-pill); font-size: 9.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; background: rgba(245,158,11,.07); color: var(--amber-hi); border: 1px solid rgba(245,158,11,.12); }
.pl-mini-bars { margin-top: auto; padding-top: 24px; display: flex; flex-direction: column; gap: 9px; }
.pl-mbar-row { display: flex; align-items: center; gap: 10px; font-size: 11.5px; }
.pl-mbar-label { color: var(--t3); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pl-mbar-wrap { flex: 2; height: 3px; background: var(--line-2); border-radius: 2px; overflow: hidden; }
.pl-mbar-fill { height: 100%; border-radius: 2px; background: var(--blue-hi); }
.pl-mbar-val { font-family: 'Geist Mono', monospace; font-size: 10.5px; font-weight: 500; color: var(--t2); min-width: 24px; text-align: right; }

/* ── PRICING ── */
#pl-prices { padding: 100px 0; border-top: 1px solid var(--line); }
.pl-price-intro { text-align: center; margin-bottom: 52px; }
.pl-price-intro .pl-sub { margin: 14px auto 0; text-align: center; }
.pl-price-table { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--line); border: 1px solid var(--line-2); border-radius: var(--r12); overflow: hidden; max-width: 880px; margin: 0 auto; }
.pl-pt { background: var(--bg-2); padding: 28px 22px; position: relative; transition: background .15s; }
.pl-pt:hover { background: var(--bg-3); }
.pl-pt.featured { background: linear-gradient(160deg,rgba(37,99,235,.06) 0%,var(--bg-2) 55%); }
.pl-pt-pop { display: inline-flex; padding: 3px 9px; border-radius: var(--r-pill); margin-bottom: 14px; font-size: 9px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; background: var(--blue); color: #fff; }
.pl-pt-tier { font-size: 10.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--t3); margin-bottom: 14px; }
.pl-pt-price { font-family: 'Instrument Serif', serif; font-size: clamp(34px, 4vw, 44px); font-weight: 400; letter-spacing: -.04em; line-height: 1; }
.pl-pt-price sup { font-size: 17px; vertical-align: super; margin-right: 1px; font-family: 'Geist', sans-serif; font-weight: 300; }
.pl-pt-price sub { font-size: 13px; font-family: 'Geist', sans-serif; font-weight: 300; color: var(--t3); vertical-align: bottom; }
.pl-pt-range { margin-top: 10px; font-size: 12px; color: var(--t2); line-height: 1.5; }
.pl-pt-from { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 11.5px; color: var(--t3); line-height: 1.6; }
.pl-pt-from strong { color: var(--t2); font-weight: 500; }
.pl-price-anchor { max-width: 880px; margin: 20px auto 0; padding: 16px 20px; border-radius: var(--r8); background: var(--bg-2); border: 1px solid var(--line-2); font-size: 13px; color: var(--t2); line-height: 1.6; display: flex; align-items: center; gap: 14px; }
.pl-price-anchor strong { color: var(--t1); font-weight: 500; }
.pl-anchor-sep { flex-shrink: 0; font-size: 18px; color: var(--t3); }

/* ── DEMO ── */
#pl-demo { padding: 100px 0; border-top: 1px solid var(--line); }
.pl-demo-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
.pl-demo-creds { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pl-cred { background: var(--bg-2); border: 1px solid var(--line-2); border-radius: var(--r8); padding: 14px 16px; }
.pl-cred-k { font-size: 9.5px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--t3); margin-bottom: 7px; }
.pl-cred-v { font-family: 'Geist Mono', monospace; font-size: 14px; font-weight: 500; letter-spacing: .01em; }
.pl-demo-action { margin-top: 20px; }
.pl-btn-outline { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: var(--r-pill); border: 1px solid var(--line-2); font-size: 13px; font-weight: 400; color: var(--t2); transition: border-color .15s, color .15s; }
.pl-btn-outline:hover { border-color: var(--line-3); color: var(--t1); }
.pl-demo-screen { background: var(--bg-2); border: 1px solid var(--line-2); border-radius: var(--r12); overflow: hidden; }
.pl-ds-top { padding: 14px 18px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 500; color: var(--t2); }
.pl-ds-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--line); border-bottom: 1px solid var(--line); }
.pl-ds-s { background: var(--bg-2); padding: 14px 16px; }
.pl-ds-n { font-family: 'Instrument Serif', serif; font-size: 28px; font-weight: 400; letter-spacing: -.035em; line-height: 1; }
.pl-ds-l { font-size: 10px; color: var(--t3); margin-top: 3px; letter-spacing: .04em; text-transform: uppercase; }
.pl-ds-chg { font-size: 11px; color: var(--green-hi); margin-top: 2px; }
.pl-ds-body { padding: 14px 16px; }
.pl-ds-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); }
.pl-ds-row:last-child { border: none; }
.pl-ds-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.pl-ds-dot-b { background: var(--blue-hi); box-shadow: 0 0 6px var(--blue-hi); }
.pl-ds-dot-g { background: var(--green-hi); box-shadow: 0 0 5px var(--green-hi); }
.pl-ds-dot-a { background: var(--amber-hi); }
.pl-ds-nm { font-size: 12px; font-weight: 500; flex: 1; }
.pl-ds-hr { font-size: 10.5px; color: var(--t3); }

/* ── FAQ ── */
#pl-faq { padding: 100px 0; border-top: 1px solid var(--line); }
.pl-faq-layout { display: grid; grid-template-columns: 300px 1fr; gap: 80px; align-items: start; }
.pl-faq-left { position: sticky; top: 72px; }
.pl-faq-items { display: flex; flex-direction: column; }
details.pl-fq { border-bottom: 1px solid var(--line); }
details.pl-fq:first-child { border-top: 1px solid var(--line); }
details[open].pl-fq { border-color: var(--line-2); }
.pl-fq summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 0; cursor: pointer; list-style: none; font-size: 13.5px; font-weight: 400; transition: color .15s; user-select: none; }
.pl-fq summary::-webkit-details-marker { display: none; }
.pl-fq-arrow { width: 16px; height: 16px; flex-shrink: 0; color: var(--t3); transition: transform .2s cubic-bezier(.16,1,.3,1), color .15s; }
details[open] .pl-fq-arrow { transform: rotate(45deg); color: var(--t2); }
.pl-fq-a { padding: 0 0 18px; font-size: 13px; line-height: 1.7; color: var(--t2); animation: pl-fadeUp .2s cubic-bezier(.16,1,.3,1) both; }

/* ── CTA FINAL ── */
#pl-cta { padding: 120px max(24px,env(safe-area-inset-left,0px)); text-align: center; position: relative; overflow: hidden; border-top: 1px solid var(--line); }
#pl-cta::before { content: ''; position: absolute; width: 600px; height: 400px; border-radius: 50%; background: radial-gradient(ellipse,rgba(37,99,235,.07) 0%,transparent 65%); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
#pl-cta h2 { font-size: clamp(34px, 5vw, 62px); max-width: 720px; margin: 0 auto 20px; }
#pl-cta .pl-sub { margin: 0 auto 42px; font-size: 17px; text-align: center; max-width: 460px; }
.pl-cta-note { margin-top: 16px; font-size: 12px; color: var(--t3); }
.pl-cta-micro { margin-top: 28px; display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
.pl-cta-micro-item { font-size: 12px; color: var(--t3); display: flex; align-items: center; gap: 5px; }
.pl-cta-micro-item::before { content: '✓'; color: var(--green-hi); font-size: 11px; }

/* ── FOOTER ── */
#pl-footer { padding: 28px max(24px,env(safe-area-inset-left,0px)); border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.pl-foot-left { font-size: 12px; color: var(--t3); }
.pl-foot-left a { transition: color .15s; }
.pl-foot-left a:hover { color: var(--t2); }
.pl-foot-right { font-size: 11px; color: var(--t3); display: flex; gap: 16px; flex-wrap: wrap; }

/* ── WA FLOTANTE ── */
.pl-wa-float { position: fixed; bottom: 20px; right: 20px; z-index: 300; display: flex; align-items: center; gap: 9px; padding: 11px 20px; border-radius: var(--r-pill); background: #25D366; color: #fff; font-size: 13px; font-weight: 600; box-shadow: 0 4px 24px rgba(37,211,102,.28); transition: transform .12s cubic-bezier(.16,1,.3,1), box-shadow .15s; animation: pl-fadeUp .6s 1.4s cubic-bezier(.16,1,.3,1) both; }
.pl-wa-float:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(37,211,102,.38); }
.pl-wa-float:active { transform: scale(.96); }

/* ── SCROLL REVEAL ── */
.pl-rv { opacity: 0; transform: translateY(16px); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
.pl-rv.in { opacity: 1; transform: translateY(0); }
.pl-rv-d1 { transition-delay: .05s; } .pl-rv-d2 { transition-delay: .1s; } .pl-rv-d3 { transition-delay: .15s; } .pl-rv-d4 { transition-delay: .2s; }

/* ── RESPONSIVE ── */
@media (max-width: 800px) {
  .pl-como-grid { grid-template-columns: 1fr; gap: 40px; }
  .pl-step-vis { display: none; }
}
@media (max-width: 760px) {
  .pl-video-layout { grid-template-columns: 1fr; gap: 36px; }
  .pl-bento { grid-template-columns: 1fr; }
  .pl-bc.span2, .pl-bc.tall { grid-column: 1; grid-row: auto; }
}
@media (max-width: 720px) {
  .pl-prob-grid { grid-template-columns: 1fr; gap: 40px; }
  .pl-demo-layout { grid-template-columns: 1fr; gap: 40px; }
  .pl-faq-layout { grid-template-columns: 1fr; gap: 40px; }
  .pl-faq-left { position: static; }
}
@media (max-width: 680px) {
  .pl-price-table { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 620px) {
  .pl-panel-shell { grid-template-columns: 1fr; }
  .pl-p-sidebar { display: none; }
}
@media (max-width: 580px) {
  .pl-hero-actions { flex-direction: column; align-items: flex-start; }
  .pl-btn-primary, .pl-btn-secondary { width: 100%; justify-content: center; }
}
@media (max-width: 420px) {
  .pl-price-table { grid-template-columns: 1fr; }
}
`;

// SVG WA inline
const WaSvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z"/>
  </svg>
);

export default function PanelLeadsContent() {
  return (
    <div id="pl-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* NAV */}
      <nav id="pl-nav">
        <div className="pl-wrap pl-nav-inner">
          <a href="/" className="pl-nav-brand">
            <span className="pl-nav-dot" />
            <span className="pl-nav-name">Agentia</span>
          </a>
          <div className="pl-nav-actions">
            <a href="#pl-demo" className="pl-nav-link">Demo</a>
            <a href="#pl-prices" className="pl-nav-link">Precios</a>
            <a href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads" className="pl-nav-cta" target="_blank" rel="noopener noreferrer">
              Agendar demo
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="pl-hero">
        <div className="pl-hero-body pl-wrap">
          <div className="pl-proof-badge">
            <div className="pl-proof-avatars">
              <span className="pl-proof-av">RF</span>
              <span className="pl-proof-av">DP</span>
              <span className="pl-proof-av">GP</span>
              <span className="pl-proof-av">+</span>
            </div>
            <span className="pl-proof-text"><strong>52 negocios</strong> ya reciben sus leads aquí</span>
          </div>

          <h1>Tus clientes ven<br />sus leads. <em>Al instante.</em></h1>

          <p className="pl-hero-sub">
            Panel con marca blanca para agencias de Facebook Ads. Cada lead llega al celular de tu cliente en segundos — con nombre, número y un tap para contactar.
          </p>

          <div className="pl-hero-stats">
            <div className="pl-hstat">
              <span className="pl-hstat-n">+15,000</span>
              <span className="pl-hstat-l">Leads gestionados</span>
            </div>
            <div className="pl-hstat-sep" />
            <div className="pl-hstat">
              <span className="pl-hstat-n">+3,700</span>
              <span className="pl-hstat-l">Solo el último mes</span>
            </div>
            <div className="pl-hstat-sep" />
            <div className="pl-hstat">
              <span className="pl-hstat-n">24 h</span>
              <span className="pl-hstat-l">Primer panel activo</span>
            </div>
          </div>

          <div className="pl-hero-actions">
            <a href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads%20para%20mi%20agencia" className="pl-btn-primary" target="_blank" rel="noopener noreferrer">
              <WaSvg /> Agendar demo
            </a>
            <a href="#pl-demo" className="pl-btn-secondary">Ver acceso demo →</a>
          </div>
        </div>

        {/* Panel screenshot */}
        <div className="pl-hero-screen pl-wrap">
          <div className="pl-screen-chrome">
            <div className="pl-chrome-bar">
              <div className="pl-chrome-dots">
                <span className="pl-cd pl-cd-r" /><span className="pl-cd pl-cd-y" /><span className="pl-cd pl-cd-g" />
              </div>
              <span className="pl-chrome-url">agentia.software / panel · demo-agencia</span>
            </div>
            <div className="pl-panel-shell">
              <nav className="pl-p-sidebar">
                <span className="pl-psec">Panel</span>
                <div className="pl-pitem on"><span className="pl-pitem-dot" />Leads</div>
                <div className="pl-pitem"><span className="pl-pitem-dot" />Clientes</div>
                <div className="pl-pitem"><span className="pl-pitem-dot" />WhatsApp</div>
                <span className="pl-psec">Reportes</span>
                <div className="pl-pitem"><span className="pl-pitem-dot" />Campañas</div>
                <div className="pl-pitem"><span className="pl-pitem-dot" />Resultados</div>
              </nav>
              <div className="pl-p-main">
                <div className="pl-pmain-header">
                  <span className="pl-pmain-title">Leads — hoy</span>
                  <div className="pl-pmain-chips">
                    <span className="pl-chip pl-chip-live">En vivo</span>
                    <span className="pl-chip pl-chip-date">Nov 5, 2026</span>
                  </div>
                </div>
                <table className="pl-ltable">
                  <thead>
                    <tr><th>Nombre</th><th>Campaña</th><th>Hora</th><th>Estado</th><th /></tr>
                  </thead>
                  <tbody id="pl-leads-body">
                    {[
                      { n: 'María González', t: 'ahora', c: 'Promo Verano', h: '09:41', b: 'pl-b-new', bl: 'Nuevo' },
                      { n: 'Carlos Mendoza', t: 'hace 4 min', c: 'Remarketing', h: '09:37', b: 'pl-b-hot', bl: 'Interesado' },
                      { n: 'Ana Pérez', t: 'hace 19 min', c: 'Video Ads', h: '09:22', b: 'pl-b-won', bl: 'Vendido' },
                      { n: 'Luis Ramírez', t: 'hace 32 min', c: 'Promo Verano', h: '09:09', b: 'pl-b-trk', bl: 'Seguimiento' },
                    ].map((r) => (
                      <tr key={r.n}>
                        <td><div className="pl-lead-name">{r.n}</div><div className="pl-lead-time">{r.t}</div></td>
                        <td><span className="pl-lead-src">{r.c}</span></td>
                        <td className="pl-lead-time">{r.h}</td>
                        <td><span className={`pl-badge ${r.b}`}>{r.bl}</span></td>
                        <td><span className="pl-wa-btn"><WaSvg /> Llamar</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="pl-ticker">
          <div className="pl-ticker-track">
            {['Restaurante El Fogón · ahora','Clínica DentalPro · 1 min','Gym PowerFit · 2 min','Academia de Inglés · 3 min','Inmobiliaria Sur · 5 min','Autoservicio Mérida · 7 min','Estética Canina · 9 min'].flatMap((item, i) => [
              <span key={`a${i}`} className="pl-ticker-item"><b>Lead nuevo</b> · {item}<span className="pl-ticker-dot" /></span>,
              <span key={`b${i}`} className="pl-ticker-item"><b>Contactado</b> · {item}<span className="pl-ticker-dot" /></span>,
            ])}
          </div>
        </div>
      </section>

      {/* PRUEBA SOCIAL */}
      <section id="pl-social">
        <div className="pl-wrap">
          <div className="pl-social-row">
            <div className="pl-social-left pl-rv">
              <span className="pl-sec-label">Producto en uso real</span>
              <p>Estos números son los de hoy. <strong>+15,000 leads procesados</strong> por negocios reales en México — restaurantes, clínicas, gimnasios, escuelas — que usan el panel para dar seguimiento a sus prospectos de Facebook Ads sin depender de su agencia para ver qué llegó.</p>
            </div>
            <div className="pl-stats-row pl-rv pl-rv-d2">
              <div className="pl-stat-tile"><div className="pl-st-n">+15k</div><div className="pl-st-l">Leads gestionados</div><div className="pl-st-delta">↑ en curso</div></div>
              <div className="pl-stat-tile"><div className="pl-st-n">+3,700</div><div className="pl-st-l">Últimos 30 días</div><div className="pl-st-delta">↑ mes activo</div></div>
              <div className="pl-stat-tile"><div className="pl-st-n">52</div><div className="pl-st-l">Negocios activos</div><div className="pl-st-delta">↑ este mes</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="pl-prob">
        <div className="pl-wrap">
          <div className="pl-prob-grid">
            <div>
              <span className="pl-sec-label pl-rv">El problema</span>
              <h2 className="pl-rv pl-rv-d1">Tu agencia trabaja bien.<br />Los leads llegan mal.</h2>
              <p className="pl-sub pl-rv pl-rv-d2">El trafficker optimiza. Las campañas convierten. Y después de todo eso, el lead le llega al cliente una semana después en un Excel.</p>
              <div className="pl-pain-items">
                {[
                  { n:'01', t:'Excel desactualizado', p:'Exportas leads a mano. El cliente pregunta cuántos llegaron ayer y tú buscas el archivo.' },
                  { n:'02', t:'Screenshots por WhatsApp', p:'Mandas capturas del Ads Manager. El cliente no sabe qué significa CTR ni le importa.' },
                  { n:'03', t:'Lead frío al día siguiente', p:'Llegó a las 3pm. Tu cliente lo vio el lunes. Para entonces ya compró con la competencia.' },
                  { n:'04', t:'Automatizaciones que se rompen', p:'Zapier caído, leads perdidos. Y cuando falla, la culpa la carga la agencia.' },
                ].map((item, i) => (
                  <div key={item.n} className={`pl-pain pl-rv${i > 0 ? ` pl-rv-d${i}` : ''}`}>
                    <span className="pl-pain-n">{item.n}</span>
                    <div><h3>{item.t}</h3><p>{item.p}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pl-rv pl-rv-d2">
              <div className="pl-compare">
                <div className="pl-compare-tabs">
                  <div className="pl-ctab on" onClick={() => {
                    const tabs = document.querySelectorAll('.pl-ctab');
                    const panes = document.querySelectorAll('.pl-cpane');
                    tabs.forEach(t => t.classList.remove('on'));
                    panes.forEach(p => p.classList.remove('on'));
                    (tabs[0] as HTMLElement).classList.add('on');
                    document.getElementById('pl-cp-excel')?.classList.add('on');
                  }}>Sin panel</div>
                  <div className="pl-ctab" onClick={() => {
                    const tabs = document.querySelectorAll('.pl-ctab');
                    const panes = document.querySelectorAll('.pl-cpane');
                    tabs.forEach(t => t.classList.remove('on'));
                    panes.forEach(p => p.classList.remove('on'));
                    (tabs[1] as HTMLElement).classList.add('on');
                    document.getElementById('pl-cp-panel')?.classList.add('on');
                  }}>Con panel</div>
                </div>
                <div className="pl-cpane on" id="pl-cp-excel">
                  <div className="pl-xrow pl-xhead"><span className="pl-xcell">Nombre</span><span className="pl-xcell">Tel</span><span className="pl-xcell">Fecha</span><span className="pl-xcell">Status</span></div>
                  {['María G.','Carlos M.','Ana P.'].map(n => (
                    <div key={n} className="pl-xrow"><span className="pl-xcell">{n}</span><span className="pl-xcell" style={{color:'var(--t3)'}}>—</span><span className="pl-xcell" style={{color:'var(--t3)'}}>28/oct</span><span className="pl-xcell" style={{color:'var(--t3)'}}>pendiente</span></div>
                  ))}
                  <div className="pl-xwarn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:'1px'}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    8 días sin contactar. El cliente no sabe que llegaron.
                  </div>
                </div>
                <div className="pl-cpane" id="pl-cp-panel">
                  <div className="pl-notif">
                    <div className="pl-notif-ic pl-notif-ic-blue">🔔</div>
                    <div>
                      <div className="pl-notif-title">Lead nuevo — María González</div>
                      <div className="pl-notif-body">Promo Verano · +52 999 123 4567</div>
                      <div className="pl-notif-t">hace 4 segundos</div>
                      <div className="pl-notif-wa"><WaSvg />Llamar ahora</div>
                    </div>
                  </div>
                  <div className="pl-notif">
                    <div className="pl-notif-ic pl-notif-ic-green">✓</div>
                    <div>
                      <div className="pl-notif-title">Carlos Mendoza — Contactado</div>
                      <div className="pl-notif-body">Remarketing · respondido en 3 min</div>
                      <div className="pl-notif-t">hace 11 minutos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO */}
      <section id="pl-video">
        <div className="pl-wrap">
          <div className="pl-video-layout">
            <div className="pl-video-left">
              <span className="pl-sec-label pl-rv">En acción</span>
              <h2 className="pl-rv pl-rv-d1">Míralo en<br />60 segundos</h2>
              <p className="pl-sub pl-rv pl-rv-d2">El panel funcionando con un cliente real. Sin demo fabricada — el mismo que usan las 52 agencias activas hoy.</p>
            </div>
            <div className="pl-vwrap pl-rv pl-rv-d2" id="pl-vwrap">
              <video id="pl-vid" src="/anuncio-agentia-MX-subtitulado.mp4" preload="metadata" playsInline />
              <div className="pl-voverlay" id="pl-voverlay">
                <div className="pl-vplay-btn" id="pl-vplay">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--bg)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <span className="pl-voverlay-label">Ver video — 60 seg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="pl-como">
        <div className="pl-wrap">
          <span className="pl-sec-label pl-rv">Cómo funciona</span>
          <h2 className="pl-rv pl-rv-d1">Tres pasos. Listo en 24 horas.</h2>
          <div className="pl-como-grid">
            <div className="pl-steps">
              {[
                { n:'1', t:'Conectas la campaña', p:'Enlazas el formulario de Facebook Ads. Menos de 5 minutos con la guía de Agentia.', time:'⏱ 5 min' },
                { n:'2', t:'Tu cliente recibe su acceso', p:'Le mandas un link. Entra al panel con tu logo. No ve nada de Agentia — tú eres el proveedor.', time:'⏱ 24 h después del alta' },
                { n:'3', t:'Leads en tiempo real', p:'Cada lead dispara una notificación push al celular. Un tap abre WhatsApp con el número del prospecto.', time:'⏱ segundos por lead' },
              ].map((s, i) => (
                <div key={s.n} className={`pl-step pl-rv${i > 0 ? ` pl-rv-d${i}` : ''}`}>
                  <span className="pl-step-n">{s.n}</span>
                  <div><h3>{s.t}</h3><p>{s.p}</p><span className="pl-step-time">{s.time}</span></div>
                </div>
              ))}
            </div>
            <div className="pl-step-vis pl-rv pl-rv-d2">
              <div className="pl-sv-top">
                <span>Clientes activos — panel maestro</span>
                <span className="pl-chip pl-chip-live">En vivo</span>
              </div>
              <div className="pl-sv-body">
                {[
                  { av:'RF', name:'Restaurante El Fogón', sub:'14 leads · activo hoy', bg:'linear-gradient(135deg,#2563eb,#60a5fa)', badge:'pl-b-new', bl:'Activo' },
                  { av:'DP', name:'Clínica DentalPro', sub:'8 leads · activo hoy', bg:'linear-gradient(135deg,#16a34a,#4ade80)', badge:'pl-b-won', bl:'Activo' },
                  { av:'GP', name:'Gym PowerFit', sub:'22 leads · activo hoy', bg:'linear-gradient(135deg,#d97706,#fbbf24)', badge:'pl-b-hot', bl:'Activo' },
                ].map(r => (
                  <div key={r.av} className="pl-sv-row">
                    <div className="pl-sv-av" style={{background: r.bg}}>{r.av}</div>
                    <div><div className="pl-sv-name">{r.name}</div><div className="pl-sv-sub">{r.sub}</div></div>
                    <span className={`pl-badge ${r.badge}`} style={{marginLeft:'auto',fontSize:'9px'}}>{r.bl}</span>
                  </div>
                ))}
                <div className="pl-sv-code">
                  → lead.nombre: &quot;María González&quot;<br />
                  → lead.telefono: &quot;+52 999 123 4567&quot;<br />
                  → notif.push: ✓ enviada<br />
                  → tiempo_respuesta: 3 min
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="pl-feat">
        <div className="pl-wrap">
          <div className="pl-feat-intro">
            <span className="pl-sec-label pl-rv">Funciones</span>
            <h2 className="pl-rv pl-rv-d1">Todo lo que necesita<br />tu agencia para escalar</h2>
          </div>
          <div className="pl-bento pl-rv pl-rv-d2">
            <div className="pl-bc span2"><span className="pl-bc-label">Marca blanca</span><h3>Tu marca, no la nuestra</h3><p>El panel lleva tu logo y el nombre de tu agencia. El cliente nunca ve &quot;Agentia&quot;. Tú eres el proveedor de tecnología.</p></div>
            <div className="pl-bc"><span className="pl-bc-label">Notificaciones</span><h3>Push al celular</h3><p>Vibra en el momento exacto. Sin abrir apps, sin esperar reportes semanales.</p></div>
            <div className="pl-bc tall">
              <span className="pl-bc-label">Panel maestro</span>
              <h3>Todos tus clientes, una vista</h3>
              <p>Desde tu acceso de agencia ves qué paneles están activos, cuántos leads llegaron hoy y qué cuentas necesitan atención.</p>
              <div className="pl-mini-bars">
                {[{l:'El Fogón',w:'78%',v:'14'},{l:'DentalPro',w:'52%',v:'8',c:' style="background:var(--green-hi)"'},{l:'PowerFit',w:'95%',v:'22'},{l:'Inglés Pro',w:'36%',v:'6'}].map(b => (
                  <div key={b.l} className="pl-mbar-row">
                    <span className="pl-mbar-label">{b.l}</span>
                    <div className="pl-mbar-wrap"><div className="pl-mbar-fill" style={{width: b.w}} /></div>
                    <span className="pl-mbar-val">{b.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pl-bc"><span className="pl-bc-label">Pipeline</span><h3>Seguimiento de ventas</h3><p>Nuevo → Seguimiento → Interesado → Vendido. El cliente actualiza el estatus y tú ves qué campañas convierten.</p></div>
            <div className="pl-bc"><span className="pl-bc-label">PWA · Sin App Store</span><h3>Se instala desde el navegador</h3><p>Android e iPhone, 2 taps. Funciona como app nativa. Sin descargas, sin aprobaciones.</p></div>
            <div className="pl-bc"><span className="pl-bc-label">API oficial · WhatsApp Business</span><h3>Bandeja de WhatsApp</h3><p>Integración con la API oficial de WhatsApp Business. Responde conversaciones y lanza campañas desde el mismo panel.</p><span className="pl-bc-tag">Add-on disponible</span></div>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="pl-prices">
        <div className="pl-wrap">
          <div className="pl-price-intro pl-rv">
            <span className="pl-sec-label">Precios</span>
            <h2>Paga por paneles activos.<br />Escala sin límite.</h2>
            <p className="pl-sub">Por panel al mes. Entre más clientes tengas, menos pagas por cada uno.</p>
          </div>
          <div className="pl-price-table pl-rv pl-rv-d1">
            <div className="pl-pt">
              <div className="pl-pt-tier">Starter</div>
              <div className="pl-pt-price"><sup>$</sup>12<sub> usd</sub></div>
              <div className="pl-pt-range">por panel / mes<br />mínimo 5 paneles</div>
              <div className="pl-pt-from">Desde <strong>$60 usd / mes</strong><br />1–9 clientes</div>
            </div>
            <div className="pl-pt featured">
              <div className="pl-pt-pop">Más popular</div>
              <div className="pl-pt-tier">Growth</div>
              <div className="pl-pt-price"><sup>$</sup>10<sub> usd</sub></div>
              <div className="pl-pt-range">por panel / mes</div>
              <div className="pl-pt-from">Desde <strong>$100 usd / mes</strong><br />10–29 clientes</div>
            </div>
            <div className="pl-pt">
              <div className="pl-pt-tier">Scale</div>
              <div className="pl-pt-price"><sup>$</sup>8<span style={{fontFamily:'Geist,sans-serif',fontSize:'.6em',fontWeight:300}}>.50</span><sub> usd</sub></div>
              <div className="pl-pt-range">por panel / mes</div>
              <div className="pl-pt-from">Desde <strong>$255 usd / mes</strong><br />30–55 clientes</div>
            </div>
            <div className="pl-pt">
              <div className="pl-pt-tier">Enterprise</div>
              <div className="pl-pt-price" style={{fontFamily:'Geist,sans-serif',fontSize:'28px',fontWeight:300,letterSpacing:'-.02em'}}>Cotiza</div>
              <div className="pl-pt-range">56 o más paneles</div>
              <div className="pl-pt-from">Desde <strong>$400 usd / mes</strong><br />precio por volumen</div>
            </div>
          </div>
          <div className="pl-price-anchor pl-rv pl-rv-d2">
            <span>¿Cuánto cuesta <strong>no tener panel</strong>?</span>
            <span className="pl-anchor-sep">→</span>
            <span>Zapier (~$50/mes) + tiempo de exportar Excels (~2h/semana) + leads perdidos por respuesta tardía. <strong>$10 por cliente activo al mes es menos que un café a la semana.</strong></span>
          </div>
          <div style={{textAlign:'center',marginTop:'28px'}} className="pl-rv pl-rv-d3">
            <a href="https://wa.me/529844927769?text=Quiero%20cotizar%20el%20Panel%20de%20Leads" className="pl-btn-primary" style={{fontSize:'14px'}} target="_blank" rel="noopener noreferrer">Cotizar por WhatsApp</a>
            <p style={{marginTop:'12px',fontSize:'12px',color:'var(--t3)'}}>Sin contrato anual · Sin prueba gratis · Activo en 24 horas</p>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="pl-demo">
        <div className="pl-wrap">
          <div className="pl-demo-layout">
            <div>
              <span className="pl-sec-label pl-rv">Demo</span>
              <h2 className="pl-rv pl-rv-d1">Entra ahora.<br />Sin registrarte.</h2>
              <p className="pl-sub pl-rv pl-rv-d2">Panel de demostración con datos reales de prueba. Ve exactamente lo que vería uno de tus clientes.</p>
              <div className="pl-demo-creds pl-rv pl-rv-d2">
                <div className="pl-cred"><div className="pl-cred-k">Usuario</div><div className="pl-cred-v">demo-agencia</div></div>
                <div className="pl-cred"><div className="pl-cred-k">Contraseña</div><div className="pl-cred-v">demo2026</div></div>
              </div>
              <div className="pl-demo-action pl-rv pl-rv-d3">
                <a href="/agentia-panel?demo=1" className="pl-btn-outline" target="_blank" rel="noopener noreferrer">
                  Abrir panel demo
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            </div>
            <div className="pl-demo-screen pl-rv pl-rv-d2">
              <div className="pl-ds-top"><span>Resumen del día</span><span className="pl-chip pl-chip-date">demo-agencia</span></div>
              <div className="pl-ds-stats">
                <div className="pl-ds-s"><div className="pl-ds-n">47</div><div className="pl-ds-l">Leads hoy</div><div className="pl-ds-chg">↑ +12 vs ayer</div></div>
                <div className="pl-ds-s"><div className="pl-ds-n">23%</div><div className="pl-ds-l">Tasa contacto</div><div className="pl-ds-chg">↑ vs 18%</div></div>
                <div className="pl-ds-s"><div className="pl-ds-n">4</div><div className="pl-ds-l">Paneles activos</div><div className="pl-ds-chg">↑ estable</div></div>
              </div>
              <div className="pl-ds-body">
                {[{dot:'b',n:'María González',h:'09:41'},{dot:'g',n:'Carlos Mendoza',h:'09:35'},{dot:'a',n:'Ana Pérez',h:'09:23'},{dot:'b',n:'Luis Ramírez',h:'09:10'}].map(r=>(
                  <div key={r.n} className="pl-ds-row">
                    <span className={`pl-ds-dot pl-ds-dot-${r.dot}`} />
                    <span className="pl-ds-nm">{r.n}</span>
                    <span className="pl-ds-hr">{r.h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="pl-faq">
        <div className="pl-wrap">
          <div className="pl-faq-layout">
            <div className="pl-faq-left">
              <span className="pl-sec-label pl-rv">FAQ</span>
              <h2 className="pl-rv pl-rv-d1">Preguntas<br />frecuentes</h2>
              <p className="pl-sub pl-rv pl-rv-d2">Las que llegan antes de contratar.</p>
            </div>
            <div className="pl-faq-items pl-rv pl-rv-d1">
              {[
                { q:'¿Mis clientes saben que usan Agentia?', a:'No. El panel lleva tu marca — tu logo, tu nombre. Para tu cliente, tú eres el proveedor. Agentia es la infraestructura invisible.' },
                { q:'¿Cómo conecta con Facebook Ads?', a:'Integración nativa con Meta Lead Ads. En menos de 5 minutos enlazas la página de Facebook del cliente. Sin Zapier, sin webhooks, sin código.' },
                { q:'¿Funciona en iPhone sin App Store?', a:'Sí. Es una PWA. Se instala desde Safari o Chrome en dos taps. Aparece en la pantalla de inicio y recibe notificaciones push como una app nativa.' },
                { q:'¿Cuánto tarda el primer panel?', a:'Entre 24 y 48 horas desde que confirmas. Recibes el acceso al panel maestro y una guía paso a paso. No instalas nada.' },
                { q:'¿Qué pasa si un cliente cancela?', a:'Solo pagas paneles activos ese mes. Sin penalizaciones, sin contratos anuales.' },
                { q:'¿Incluye soporte?', a:'Sí. Soporte directo por WhatsApp con el equipo de Agentia. No hay bot — hablas con la persona que configuró tu cuenta.' },
              ].map(item => (
                <details key={item.q} className="pl-fq">
                  <summary>
                    {item.q}
                    <svg className="pl-fq-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  </summary>
                  <div className="pl-fq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="pl-cta">
        <h2 className="pl-rv">¿Lista tu agencia para<br />dejar de mandar Excels?</h2>
        <p className="pl-sub pl-rv pl-rv-d1">Una demo en vivo con tus datos, no un genérico.</p>
        <a href="https://wa.me/529844927769?text=Quiero%20agendar%20demo%20del%20Panel%20de%20Leads" className="pl-btn-primary pl-rv pl-rv-d2" style={{fontSize:'15px',padding:'14px 32px'}} target="_blank" rel="noopener noreferrer">
          <WaSvg /> Agendar demo por WhatsApp
        </a>
        <div className="pl-cta-micro pl-rv pl-rv-d3">
          <span className="pl-cta-micro-item">Sin contrato anual</span>
          <span className="pl-cta-micro-item">Activo en 24 horas</span>
          <span className="pl-cta-micro-item">API oficial de WhatsApp Business</span>
          <span className="pl-cta-micro-item">Tu marca, no la nuestra</span>
        </div>
        <p className="pl-cta-note pl-rv pl-rv-d4">+52 984 492 7769 · Respondemos en menos de 2 horas</p>
      </section>

      {/* FOOTER */}
      <footer id="pl-footer">
        <div className="pl-foot-left">© 2026 <a href="https://agentia.software">Agentia Software</a> · <a href="/legal">Privacidad</a></div>
        <div className="pl-foot-right">
          <span>panel de leads facebook ads</span>
          <span>crm para agencias</span>
          <span>crm para traffickers</span>
        </div>
      </footer>

      {/* WA flotante */}
      <a href="https://wa.me/529844927769?text=Info%20Panel%20de%20Leads" className="pl-wa-float" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z"/></svg>
        WhatsApp
      </a>

      {/* Scripts */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Scroll reveal
        var rv=new IntersectionObserver(function(e){
          e.forEach(function(i){if(i.isIntersecting){i.target.classList.add('in');rv.unobserve(i.target)}})
        },{threshold:0.08,rootMargin:'0px 0px -24px 0px'});
        document.querySelectorAll('.pl-rv').forEach(function(el){rv.observe(el)});

        // Video
        var vid=document.getElementById('pl-vid');
        var vwrap=document.getElementById('pl-vwrap');
        if(vid){
          document.getElementById('pl-vplay').addEventListener('click',function(){
            vid.play();vwrap.classList.add('playing');
          });
          vid.addEventListener('click',function(){
            if(vid.paused){vid.play();vwrap.classList.add('playing')}
            else{vid.pause();vwrap.classList.remove('playing')}
          });
          vid.addEventListener('ended',function(){vwrap.classList.remove('playing')});
        }

        // Live leads simulator
        var PLN=['Roberto A.','Sofía L.','Miguel T.','Carmen V.','Diego F.','Valeria S.','Héctor R.','Laura M.'];
        var PLC=['Promo Verano','Remarketing','Video Ads','Nuevos clientes','Stories'];
        var PLB=[['pl-b-new','Nuevo'],['pl-b-trk','Seguimiento'],['pl-b-hot','Interesado']];
        function plPad(n){return n<10?'0'+n:n}
        var PLH=['09:','10:','11:'];
        var waIco='<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z"/></svg>';
        function plAddRow(){
          var tb=document.getElementById('pl-leads-body');if(!tb)return;
          var n=PLN[Math.floor(Math.random()*PLN.length)];
          var c=PLC[Math.floor(Math.random()*PLC.length)];
          var b=PLB[Math.floor(Math.random()*PLB.length)];
          var h=PLH[Math.floor(Math.random()*PLH.length)]+plPad(Math.floor(Math.random()*59));
          var tr=document.createElement('tr');tr.className='pl-row-new';
          tr.innerHTML='<td><div class="pl-lead-name">'+n+'</div><div class="pl-lead-time">ahora</div></td><td><span class="pl-lead-src">'+c+'</span></td><td class="pl-lead-time">'+h+'</td><td><span class="pl-badge '+b[0]+'">'+b[1]+'</span></td><td><span class="pl-wa-btn">'+waIco+' Llamar</span></td>';
          tb.insertBefore(tr,tb.firstChild);
          if(tb.rows.length>5)tb.deleteRow(tb.rows.length-1);
        }
        setInterval(plAddRow,5200);

        // Smooth scroll
        document.querySelectorAll('a[href^="#pl-"]').forEach(function(a){
          a.addEventListener('click',function(e){
            var t=document.querySelector(a.getAttribute('href'));
            if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'})}
          });
        });
      `}} />
    </div>
  );
}
