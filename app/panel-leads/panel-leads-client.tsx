'use client';

/* ─────────────────────────────────────────────────────────────
   PANEL DE LEADS — LANDING PAGE
   Diseño premium dark-first. Tipografía masiva. Mobile-first.
   ───────────────────────────────────────────────────────────── */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

/* ── RESET ── */
#pl *,#pl *::before,#pl *::after{box-sizing:border-box;margin:0;padding:0}
#pl a{color:inherit;text-decoration:none}
#pl img{max-width:100%;display:block}
#pl button{background:none;border:none;cursor:pointer;font:inherit;color:inherit}

/* ── TOKENS ── */
#pl {
  --bg:   #07080a;
  --bg1:  #0d0e11;
  --bg2:  #141518;
  --bg3:  #1b1d21;
  --bg4:  #22242a;
  --ln:   rgba(255,255,255,.055);
  --ln2:  rgba(255,255,255,.10);
  --ln3:  rgba(255,255,255,.18);
  --t1:   #f4f4f6;
  --t2:   rgba(244,244,246,.55);
  --t3:   rgba(244,244,246,.28);
  --bl:   #2563eb;
  --blh:  #3b82f6;
  --bls:  rgba(37,99,235,.12);
  --gr:   #16a34a;
  --grh:  #22c55e;
  --amb:  #d97706;
  --ambh: #f59e0b;
  --r4:4px;--r8:8px;--r12:12px;--r16:16px;--rpill:999px;
  --s12: 12px;--s14: 14px;--s16: 16px;
  font-family:'Geist',system-ui,sans-serif;
  background:var(--bg);
  color:var(--t1);
  overflow-x:hidden;
  line-height:1;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  color-scheme:dark;
  min-height:100vh;
}

/* ── GRID GLOBAL ── */
/* Contenedor: 1200px max, padding responsivo */
.w{
  width:100%;
  max-width:1200px;
  margin:0 auto;
  padding-left:max(32px,env(safe-area-inset-left,0px));
  padding-right:max(32px,env(safe-area-inset-right,0px));
}

/* ── TIPOGRAFÍA BASE ── */
.serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
.mono{font-family:'Geist Mono',monospace}

/* ── NAV ── */
#pl-nav{
  position:fixed;top:0;left:0;right:0;z-index:500;
  height:56px;
  border-bottom:1px solid var(--ln);
  backdrop-filter:blur(24px) saturate(180%);
  -webkit-backdrop-filter:blur(24px) saturate(180%);
  background:rgba(7,8,10,.82);
}
.nav-in{
  height:100%;display:flex;align-items:center;
  justify-content:space-between;
}
.nav-logo{display:flex;align-items:center;gap:9px}
.nav-dot{
  width:7px;height:7px;border-radius:50%;
  background:var(--grh);box-shadow:0 0 10px var(--grh);
  animation:pulse 2.4s ease-in-out infinite;
}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
.nav-name{font-size:15px;font-weight:600;letter-spacing:-.015em}
.nav-links{display:flex;align-items:center;gap:6px}
.nav-link{
  padding:7px 14px;border-radius:var(--rpill);
  font-size:13px;color:var(--t2);
  transition:color .15s,background .15s;
}
.nav-link:hover{color:var(--t1);background:rgba(255,255,255,.05)}
.nav-cta{
  margin-left:6px;
  padding:8px 20px;border-radius:var(--rpill);
  background:var(--t1);color:var(--bg);
  font-size:13px;font-weight:600;letter-spacing:-.01em;
  transition:opacity .12s,transform .12s;
}
.nav-cta:hover{opacity:.88}
.nav-cta:active{transform:scale(.96)}

/* ── HERO ── */
#pl-hero{
  position:relative;
  padding-top:56px; /* nav height */
  overflow:hidden;
}
/* Gradientes de fondo */
#pl-hero::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 60% 50% at 70% 0%,rgba(37,99,235,.07) 0%,transparent 60%),
    radial-gradient(ellipse 40% 30% at 10% 90%,rgba(22,163,74,.04) 0%,transparent 55%);
}
.hero-wrap{
  position:relative;z-index:1;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:0;
  align-items:start;
  min-height:calc(100svh - 56px);
}
/* Columna izquierda: texto */
.hero-left{
  display:flex;flex-direction:column;justify-content:center;
  padding-top:72px;padding-bottom:72px;
  padding-right:48px;
}
/* Badge "trusted by" */
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  margin-bottom:28px;
  animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both;
}
.hero-eyebrow-dot{
  width:5px;height:5px;border-radius:50%;
  background:var(--grh);box-shadow:0 0 8px var(--grh);
}
.hero-eyebrow-txt{
  font-size:11px;font-weight:500;letter-spacing:.08em;
  text-transform:uppercase;color:var(--t3);
}
/* Headline MASIVA */
.hero-h1{
  font-family:'Instrument Serif',Georgia,serif;
  font-size:clamp(52px,6.5vw,88px);
  font-weight:400;
  line-height:.98;
  letter-spacing:-.035em;
  text-wrap:balance;
  animation:fadeUp .6s .04s cubic-bezier(.16,1,.3,1) both;
}
.hero-h1 em{font-style:italic;color:var(--t2)}
.hero-h1 .accent-line{
  display:block;
  background:linear-gradient(90deg,var(--t1) 0%,rgba(244,244,246,.5) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;
}
.hero-sub{
  margin-top:24px;
  font-size:clamp(15px,1.4vw,17px);line-height:1.72;
  color:var(--t2);max-width:430px;
  animation:fadeUp .6s .08s cubic-bezier(.16,1,.3,1) both;
}
/* Stats inline */
.hero-stats{
  display:flex;gap:28px;
  margin-top:36px;
  animation:fadeUp .6s .12s cubic-bezier(.16,1,.3,1) both;
}
.hstat-n{
  font-family:'Instrument Serif',serif;
  font-size:clamp(28px,3vw,38px);font-weight:400;
  letter-spacing:-.03em;line-height:1;
}
.hstat-l{
  font-size:10px;color:var(--t3);
  letter-spacing:.06em;text-transform:uppercase;
  font-weight:500;margin-top:4px;line-height:1.4;
}
.hstat-sep{
  width:1px;background:var(--ln2);align-self:stretch;
  flex-shrink:0;margin:0 4px;
}
/* CTAs */
.hero-actions{
  display:flex;gap:12px;margin-top:36px;flex-wrap:wrap;
  animation:fadeUp .6s .16s cubic-bezier(.16,1,.3,1) both;
}
.btn-primary{
  display:inline-flex;align-items:center;gap:9px;
  padding:16px 32px;border-radius:var(--rpill);
  background:var(--t1);color:var(--bg);
  font-size:15px;font-weight:600;letter-spacing:-.01em;
  transition:transform .12s cubic-bezier(.16,1,.3,1),box-shadow .15s;
  white-space:nowrap;
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(0,0,0,.5)}
.btn-primary:active{transform:scale(.97)}
.btn-ghost{
  display:inline-flex;align-items:center;gap:8px;
  padding:16px 28px;border-radius:var(--rpill);
  border:1px solid var(--ln2);
  font-size:15px;font-weight:400;color:var(--t2);
  transition:border-color .15s,color .15s;
  white-space:nowrap;
}
.btn-ghost:hover{border-color:var(--ln3);color:var(--t1)}
/* Agency pills */
.hero-agencies{
  display:flex;align-items:center;gap:7px;flex-wrap:wrap;
  margin-top:28px;
  animation:fadeUp .6s .20s cubic-bezier(.16,1,.3,1) both;
}
.agency-pill{
  height:28px;padding:0 13px;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.09);
  border-radius:var(--rpill);
  display:inline-flex;align-items:center;
  font-size:11.5px;font-weight:400;color:rgba(255,255,255,.45);
  white-space:nowrap;
}
.agency-more{
  font-size:11.5px;color:var(--t3);
}

/* Columna derecha: panel demo */
.hero-right{
  position:relative;
  padding-top:72px;padding-bottom:0;
  display:flex;flex-direction:column;align-items:flex-start;
  overflow:hidden;
}
/* Chrome del browser */
.browser-chrome{
  width:100%;max-width:620px;
  background:var(--bg1);
  border:1px solid var(--ln2);border-bottom:none;
  border-radius:14px 14px 0 0;
  box-shadow:
    0 -1px 0 rgba(255,255,255,.04),
    0 -32px 100px rgba(37,99,235,.06),
    0 -16px 60px rgba(0,0,0,.35);
  animation:slideUp .9s .24s cubic-bezier(.16,1,.3,1) both;
  overflow:hidden;
}
.browser-bar{
  display:flex;align-items:center;
  padding:11px 16px;border-bottom:1px solid var(--ln);
  background:var(--bg2);gap:14px;
}
.b-dots{display:flex;gap:6px}
.b-dot{width:9px;height:9px;border-radius:50%}
.b-r{background:#ff5f57}.b-y{background:#febc2e}.b-g{background:#28c840}
.b-url{
  flex:1;text-align:center;padding:5px 12px;border-radius:6px;
  background:rgba(255,255,255,.036);border:1px solid var(--ln);
  font-family:'Geist Mono',monospace;font-size:11px;color:var(--t3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
/* Panel interior */
.panel-shell{
  display:grid;grid-template-columns:180px 1fr;
  min-height:420px;background:var(--bg1);
}
.panel-side{
  background:rgba(255,255,255,.013);
  border-right:1px solid var(--ln);
  padding:14px 10px;
  display:flex;flex-direction:column;gap:1px;
}
.p-sec{
  font-size:9px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--t3);
  padding:12px 10px 6px;
}
.p-item{
  display:flex;align-items:center;gap:9px;
  padding:7px 10px;border-radius:var(--r8);
  font-size:11.5px;color:var(--t2);
  transition:background .1s,color .1s;
}
.p-item.on{background:rgba(37,99,235,.09);color:var(--t1)}
.p-item:hover:not(.on){background:rgba(255,255,255,.036)}
.p-item-dot{
  width:5px;height:5px;border-radius:50%;
  background:var(--ln2);flex-shrink:0;
}
.p-item.on .p-item-dot{background:var(--blh)}
.panel-main{padding:18px 20px;overflow:hidden}
.panel-hdr{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:16px;flex-wrap:wrap;gap:8px;
}
.panel-title{font-size:13px;font-weight:600;letter-spacing:-.01em}
.panel-chips{display:flex;gap:7px}
.chip{
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 10px;border-radius:var(--rpill);
  font-size:10px;font-weight:500;
}
.chip-live{
  background:rgba(22,163,74,.08);color:var(--grh);
  border:1px solid rgba(22,163,74,.14);
}
.chip-live::before{
  content:'';width:5px;height:5px;border-radius:50%;
  background:var(--grh);animation:pulse 1.6s infinite;
}
.chip-date{
  background:rgba(37,99,235,.08);color:#93c5fd;
  border:1px solid rgba(37,99,235,.12);
}
/* Tabla leads */
.ltable{width:100%;border-collapse:collapse;font-size:11.5px}
.ltable thead th{
  padding:0 10px 9px;text-align:left;
  font-size:9px;font-weight:700;letter-spacing:.09em;
  text-transform:uppercase;color:var(--t3);
  border-bottom:1px solid var(--ln);
}
.ltable tbody tr{transition:background .1s}
.ltable tbody tr:hover{background:rgba(255,255,255,.018)}
.ltable td{
  padding:10px 10px;
  border-bottom:1px solid rgba(255,255,255,.025);
  vertical-align:middle;line-height:1.3;
}
.lead-name{font-size:12px;font-weight:500}
.lead-time{font-size:9.5px;color:var(--t3);margin-top:2px}
.lead-src{font-size:11px;color:var(--t2)}
.badge{
  display:inline-flex;padding:3px 8px;border-radius:var(--rpill);
  font-size:9px;font-weight:600;letter-spacing:.03em;white-space:nowrap;
}
.b-new{background:rgba(37,99,235,.10);color:#93c5fd;border:1px solid rgba(37,99,235,.14)}
.b-hot{background:rgba(245,158,11,.08);color:#fcd34d;border:1px solid rgba(245,158,11,.12)}
.b-won{background:rgba(22,163,74,.08);color:#86efac;border:1px solid rgba(22,163,74,.12)}
.b-trk{background:rgba(168,85,247,.08);color:#d8b4fe;border:1px solid rgba(168,85,247,.12)}
.wa-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 10px;border-radius:var(--r8);
  background:rgba(37,211,102,.06);border:1px solid rgba(37,211,102,.14);
  color:#4ade80;font-size:10px;font-weight:500;cursor:pointer;white-space:nowrap;
  transition:background .12s;
}
.wa-btn:hover{background:rgba(37,211,102,.12)}
@keyframes rowIn{
  from{opacity:0;background:rgba(37,99,235,.07)}
  to{opacity:1;background:transparent}
}
.row-new td{animation:rowIn .45s cubic-bezier(.16,1,.3,1) both}

/* ── TICKER ── */
.ticker{
  position:relative;z-index:1;
  border-top:1px solid var(--ln);
  border-bottom:1px solid var(--ln);
  overflow:hidden;padding:12px 0;
  background:rgba(255,255,255,.01);
  /* Fade masks left/right */
  -webkit-mask-image:linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%);
  mask-image:linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%);
}
.ticker-track{
  display:flex;gap:40px;width:max-content;
  animation:marquee 30s linear infinite;
}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ticker-item{
  display:flex;align-items:center;gap:9px;
  white-space:nowrap;font-size:11.5px;color:var(--t3);
}
.ticker-item b{color:var(--t2);font-weight:500}
.ticker-dot{width:3px;height:3px;border-radius:50%;background:var(--ln2)}

/* ── KEYFRAMES GLOBALES ── */
@keyframes fadeUp{
  from{opacity:0;transform:translateY(22px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes slideUp{
  from{opacity:0;transform:translateY(44px)}
  to{opacity:1;transform:translateY(0)}
}

/* ── SCROLL REVEAL ── */
.rv{opacity:0;transform:translateY(18px);transition:opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1)}
.rv.in{opacity:1;transform:translateY(0)}
.d1{transition-delay:.06s}.d2{transition-delay:.12s}.d3{transition-delay:.18s}.d4{transition-delay:.24s}

/* ── SECCIONES: TOKEN COMPARTIDO ── */
#pl section{position:relative;z-index:1}
.sec-label{
  display:block;margin-bottom:14px;
  font-size:10.5px;font-weight:700;letter-spacing:.10em;
  text-transform:uppercase;color:var(--t3);
}
.sec-h2{
  font-family:'Instrument Serif',Georgia,serif;
  font-size:clamp(32px,4.5vw,58px);
  font-weight:400;line-height:1.05;letter-spacing:-.03em;
  text-wrap:balance;
}
.sec-sub{
  margin-top:16px;
  font-size:clamp(14px,1.4vw,16px);line-height:1.72;
  color:var(--t2);max-width:460px;text-wrap:balance;
}
.sec-pad{padding:100px 0}
.sec-border{border-top:1px solid var(--ln)}

/* ── NÚMEROS REALES ── */
#pl-numbers{
  padding:80px 0;
  border-top:1px solid var(--ln);
  border-bottom:1px solid var(--ln);
  background:linear-gradient(180deg,rgba(37,99,235,.025) 0%,transparent 100%);
}
.numbers-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:1px;
  background:var(--ln);
  border:1px solid var(--ln2);
  border-radius:var(--r16);
  overflow:hidden;
}
.number-card{
  background:var(--bg1);
  padding:40px 36px;
  display:flex;flex-direction:column;gap:6px;
  transition:background .2s;
  position:relative;
  overflow:hidden;
}
.number-card::before{
  content:'';position:absolute;
  width:120px;height:120px;border-radius:50%;
  top:-30px;right:-30px;pointer-events:none;
  opacity:.6;
  background:radial-gradient(ellipse,rgba(37,99,235,.12) 0%,transparent 70%);
}
.number-card:hover{background:var(--bg2)}
.number-big{
  font-family:'Instrument Serif',serif;
  font-size:clamp(44px,5vw,66px);font-weight:400;
  letter-spacing:-.04em;line-height:1;
}
.number-label{
  font-size:11px;font-weight:600;letter-spacing:.08em;
  text-transform:uppercase;color:var(--t3);margin-top:4px;
}
.number-delta{
  font-size:12px;color:var(--grh);font-weight:500;margin-top:2px;
}

/* ── PROBLEMA ── */
#pl-prob{
  padding:100px 0;
  border-top:1px solid var(--ln);
}
.prob-layout{
  display:grid;grid-template-columns:1fr 1fr;
  gap:100px;align-items:start;
}
.pain-list{margin-top:48px;display:flex;flex-direction:column}
.pain-item{
  display:grid;grid-template-columns:32px 1fr;gap:16px;
  padding:22px 0;border-bottom:1px solid var(--ln);
  transition:border-color .2s;
}
.pain-item:first-child{border-top:1px solid var(--ln)}
.pain-item:hover{border-color:var(--ln2)}
.pain-num{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:15px;color:var(--t3);
  text-align:right;padding-top:2px;
}
.pain-item h3{font-size:14px;font-weight:500;margin-bottom:5px;line-height:1.3}
.pain-item p{font-size:13px;line-height:1.65;color:var(--t2)}
/* Comparador */
.compare-box{
  background:var(--bg1);border:1px solid var(--ln2);
  border-radius:var(--r16);overflow:hidden;
  position:sticky;top:72px;
}
.compare-tabs{display:flex;border-bottom:1px solid var(--ln)}
.ctab{
  flex:1;padding:13px 16px;text-align:center;
  font-size:12.5px;font-weight:500;
  color:var(--t3);cursor:pointer;
  border-right:1px solid var(--ln);
  transition:color .15s,background .15s;
}
.ctab:last-child{border-right:none}
.ctab.on{color:var(--t1);background:rgba(255,255,255,.025)}
.cpane{padding:22px;display:none}
.cpane.on{display:block}
.xrow{display:flex;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.036);font-size:11.5px}
.xcell{flex:1;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xhead .xcell{font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t3)}
.xwarn{
  margin-top:12px;padding:11px 13px;border-radius:var(--r8);
  background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.12);
  font-size:11.5px;color:#fca5a5;line-height:1.5;
  display:flex;gap:9px;align-items:flex-start;
}
.notif{
  display:flex;gap:12px;padding:12px 14px;border-radius:12px;
  background:var(--bg2);border:1px solid var(--ln2);
  margin-bottom:9px;
  animation:fadeUp .35s cubic-bezier(.16,1,.3,1) both;
}
.notif:nth-child(2){animation-delay:.08s}
.notif-ic{
  width:34px;height:34px;border-radius:9px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:14px;
}
.ni-blue{background:rgba(37,99,235,.1);border:1px solid rgba(37,99,235,.18)}
.ni-green{background:rgba(22,163,74,.08);border:1px solid rgba(22,163,74,.15)}
.notif-title{font-size:12.5px;font-weight:500;margin-bottom:3px}
.notif-body{font-size:11.5px;color:var(--t2);line-height:1.5}
.notif-t{font-size:10px;color:var(--t3);margin-top:3px}
.notif-wa{
  margin-top:9px;display:inline-flex;align-items:center;gap:5px;
  padding:5px 12px;border-radius:var(--rpill);
  background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.14);
  font-size:11px;font-weight:500;color:#4ade80;
}

/* ── VIDEO ── */
#pl-video{padding:100px 0;border-top:1px solid var(--ln)}
.video-layout{
  display:grid;grid-template-columns:1fr 380px;
  gap:80px;align-items:center;
}
.video-left .sec-h2{font-size:clamp(36px,5vw,64px)}
.vwrap{
  position:relative;
  border-radius:var(--r16);overflow:hidden;
  border:1px solid var(--ln2);background:var(--bg2);
  aspect-ratio:9/16;
  width:100%;max-width:380px;
  margin:0 auto;cursor:pointer;
  box-shadow:0 0 80px rgba(37,99,235,.08),0 24px 60px rgba(0,0,0,.4);
}
.vwrap video{width:100%;height:100%;object-fit:cover;display:block}
.v-overlay{
  position:absolute;inset:0;
  background:rgba(7,8,10,.42);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:14px;
  transition:opacity .25s cubic-bezier(.16,1,.3,1);
}
.v-play{
  width:64px;height:64px;border-radius:50%;
  background:var(--t1);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 48px rgba(0,0,0,.55);
  transition:transform .15s cubic-bezier(.16,1,.3,1);
}
.v-play:hover{transform:scale(1.08)}
.v-play:active{transform:scale(.93)}
.v-label{font-size:12px;color:rgba(255,255,255,.65);font-weight:500}
.vwrap.playing .v-overlay{opacity:0;pointer-events:none}

/* ── CÓMO FUNCIONA ── */
#pl-como{padding:100px 0;border-top:1px solid var(--ln)}
.como-layout{
  display:grid;grid-template-columns:1fr 1fr;
  gap:80px;align-items:start;margin-top:60px;
}
.steps-col{display:flex;flex-direction:column}
.step{
  display:grid;grid-template-columns:28px 1fr;
  gap:18px;padding:24px 0;
  border-bottom:1px solid var(--ln);
  transition:border-color .2s;
}
.step:first-child{border-top:1px solid var(--ln)}
.step:hover{border-color:var(--ln2)}
.step-n{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:22px;color:var(--t3);
  text-align:right;padding-top:2px;flex-shrink:0;
}
.step h3{font-size:14px;font-weight:500;margin-bottom:6px;line-height:1.3}
.step p{font-size:13px;line-height:1.65;color:var(--t2)}
.step-time{
  display:inline-flex;align-items:center;gap:5px;
  margin-top:10px;font-size:10px;font-weight:700;
  letter-spacing:.05em;text-transform:uppercase;color:var(--grh);
}
/* Panel maestro mockup */
.master-panel{
  position:sticky;top:72px;
  background:var(--bg1);border:1px solid var(--ln2);
  border-radius:var(--r16);overflow:hidden;
}
.mp-top{
  padding:14px 18px;border-bottom:1px solid var(--ln);
  display:flex;align-items:center;justify-content:space-between;
  font-size:12px;font-weight:500;color:var(--t2);
}
.mp-body{padding:16px 18px}
.mp-row{
  display:flex;align-items:center;gap:10px;
  padding:10px 12px;border-radius:var(--r8);
  background:var(--bg2);margin-bottom:7px;border:1px solid var(--ln);
}
.mp-av{
  width:30px;height:30px;border-radius:50%;flex-shrink:0;
  font-size:10.5px;color:#fff;font-weight:700;
  display:flex;align-items:center;justify-content:center;
}
.mp-name{font-size:12.5px;font-weight:500}
.mp-sub{font-size:10px;color:var(--t3);margin-top:1px}
.mp-code{
  margin-top:12px;padding:12px 14px;border-radius:var(--r8);
  background:rgba(0,0,0,.35);border:1px solid var(--ln);
  font-family:'Geist Mono',monospace;font-size:10px;
  color:#86efac;line-height:1.65;
}

/* ── FEATURES BENTO ── */
#pl-feat{padding:100px 0;border-top:1px solid var(--ln)}
.feat-head{margin-bottom:60px}
.bento{
  display:grid;
  grid-template-columns:repeat(12,1fr);
  grid-template-rows:auto auto;
  gap:1px;background:var(--ln);
  border:1px solid var(--ln2);border-radius:var(--r16);overflow:hidden;
}
/* Layout bento: top row span distinto */
.bc{background:var(--bg1);padding:30px 28px;transition:background .2s;position:relative;overflow:hidden}
.bc:hover{background:var(--bg2)}
/* Span definidos */
.bc1{grid-column:1/8}   /* Marca blanca — ancho */
.bc2{grid-column:8/13}  /* Notificaciones */
.bc3{grid-column:1/5}   /* Pipeline */
.bc4{grid-column:5/9}   /* PWA */
.bc5{grid-column:9/13;grid-row:2/4}  /* Panel maestro — alto */
.bc6{grid-column:1/5;grid-row:3}  /* WhatsApp API */
.bc7{grid-column:5/9;grid-row:3}  /* Soporte */
.bc-label{
  font-size:9px;font-weight:700;letter-spacing:.10em;
  text-transform:uppercase;color:var(--t3);margin-bottom:16px;display:block;
}
.bc h3{font-size:15px;font-weight:500;letter-spacing:-.01em;margin-bottom:9px}
.bc p{font-size:13px;line-height:1.65;color:var(--t2)}
.bc-tag{
  display:inline-flex;margin-top:16px;
  padding:4px 11px;border-radius:var(--rpill);
  font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  background:rgba(245,158,11,.07);color:var(--ambh);
  border:1px solid rgba(245,158,11,.12);
}
/* Mini bars dentro de bc5 */
.mini-bars{margin-top:auto;padding-top:28px;display:flex;flex-direction:column;gap:9px}
.mbar{display:flex;align-items:center;gap:10px;font-size:11.5px}
.mbar-label{color:var(--t3);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mbar-wrap{flex:2;height:3px;background:var(--ln2);border-radius:2px;overflow:hidden}
.mbar-fill{height:100%;border-radius:2px;background:var(--blh)}
.mbar-val{font-family:'Geist Mono',monospace;font-size:10px;font-weight:500;color:var(--t2);min-width:22px;text-align:right}
/* bc5 es columna flexbox para mini-bars abajo */
.bc5{display:flex;flex-direction:column}

/* ── PRICING ── */
#pl-prices{padding:100px 0;border-top:1px solid var(--ln)}
.price-head{text-align:center;margin-bottom:60px}
.price-head .sec-sub{margin:16px auto 0;text-align:center}
.price-grid{
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:1px;background:var(--ln);
  border:1px solid var(--ln2);border-radius:var(--r16);
  overflow:hidden;max-width:900px;margin:0 auto;
}
.pt{background:var(--bg1);padding:32px 24px;position:relative;transition:background .2s}
.pt:hover{background:var(--bg2)}
.pt.feat{background:linear-gradient(160deg,rgba(37,99,235,.07) 0%,var(--bg1) 55%)}
.pt-pop{
  display:inline-flex;padding:4px 10px;border-radius:var(--rpill);
  margin-bottom:16px;font-size:9.5px;font-weight:700;letter-spacing:.07em;
  text-transform:uppercase;background:var(--bl);color:#fff;
}
.pt-tier{
  font-size:10.5px;font-weight:700;letter-spacing:.09em;
  text-transform:uppercase;color:var(--t3);margin-bottom:16px;
}
.pt-price{
  font-family:'Instrument Serif',serif;
  font-size:clamp(38px,4.2vw,50px);font-weight:400;
  letter-spacing:-.04em;line-height:1;
}
.pt-price sup{font-size:18px;vertical-align:super;margin-right:1px;font-family:'Geist',sans-serif;font-weight:300}
.pt-price sub{font-size:13px;font-family:'Geist',sans-serif;font-weight:300;color:var(--t3);vertical-align:bottom}
.pt-range{margin-top:11px;font-size:12.5px;color:var(--t2);line-height:1.5}
.pt-from{
  margin-top:16px;padding-top:16px;border-top:1px solid var(--ln);
  font-size:11.5px;color:var(--t3);line-height:1.6;
}
.pt-from strong{color:var(--t2);font-weight:500}
.price-anchor{
  max-width:900px;margin:20px auto 0;padding:18px 22px;
  border-radius:var(--r12);background:var(--bg1);border:1px solid var(--ln2);
  font-size:13px;color:var(--t2);line-height:1.65;
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;
}
.price-anchor strong{color:var(--t1);font-weight:500}
.anchor-sep{flex-shrink:0;font-size:18px;color:var(--t3)}

/* ── DEMO ── */
#pl-demo{padding:100px 0;border-top:1px solid var(--ln)}
.demo-layout{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start}
.demo-creds{
  margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:12px;
}
.cred{
  background:var(--bg1);border:1px solid var(--ln2);
  border-radius:var(--r12);padding:16px 18px;
}
.cred-k{
  font-size:9.5px;font-weight:700;letter-spacing:.09em;
  text-transform:uppercase;color:var(--t3);margin-bottom:8px;
}
.cred-v{font-family:'Geist Mono',monospace;font-size:15px;font-weight:500;letter-spacing:.01em}
.demo-action{margin-top:22px}
.btn-outline{
  display:inline-flex;align-items:center;gap:9px;
  padding:12px 24px;border-radius:var(--rpill);
  border:1px solid var(--ln2);font-size:13px;font-weight:400;color:var(--t2);
  transition:border-color .15s,color .15s;
}
.btn-outline:hover{border-color:var(--ln3);color:var(--t1)}
/* Demo screen mockup */
.demo-screen{
  background:var(--bg1);border:1px solid var(--ln2);
  border-radius:var(--r16);overflow:hidden;
}
.ds-top{
  padding:14px 18px;border-bottom:1px solid var(--ln);
  display:flex;align-items:center;justify-content:space-between;
  font-size:12px;font-weight:500;color:var(--t2);
}
.ds-stats{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:var(--ln);border-bottom:1px solid var(--ln);
}
.ds-s{background:var(--bg1);padding:16px}
.ds-n{
  font-family:'Instrument Serif',serif;
  font-size:30px;font-weight:400;letter-spacing:-.035em;line-height:1;
}
.ds-l{font-size:9.5px;color:var(--t3);margin-top:3px;letter-spacing:.05em;text-transform:uppercase}
.ds-chg{font-size:11px;color:var(--grh);margin-top:2px}
.ds-body{padding:14px 16px}
.ds-row{
  display:flex;align-items:center;gap:10px;
  padding:8px 0;border-bottom:1px solid var(--ln);
}
.ds-row:last-child{border:none}
.ds-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.dot-b{background:var(--blh);box-shadow:0 0 6px var(--blh)}
.dot-g{background:var(--grh);box-shadow:0 0 5px var(--grh)}
.dot-a{background:var(--ambh)}
.ds-nm{font-size:12px;font-weight:500;flex:1}
.ds-hr{font-size:10.5px;color:var(--t3)}

/* ── FAQ ── */
#pl-faq{padding:100px 0;border-top:1px solid var(--ln)}
.faq-layout{display:grid;grid-template-columns:320px 1fr;gap:100px;align-items:start}
.faq-left{position:sticky;top:72px}
.faq-items{display:flex;flex-direction:column}
details.fq{border-bottom:1px solid var(--ln)}
details.fq:first-child{border-top:1px solid var(--ln)}
details[open].fq{border-color:var(--ln2)}
.fq summary{
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:20px 0;cursor:pointer;list-style:none;
  font-size:14px;font-weight:400;line-height:1.4;
  transition:color .15s;user-select:none;
}
.fq summary::-webkit-details-marker{display:none}
.fq-arrow{
  width:16px;height:16px;flex-shrink:0;color:var(--t3);
  transition:transform .2s cubic-bezier(.16,1,.3,1),color .15s;
}
details[open] .fq-arrow{transform:rotate(45deg);color:var(--t2)}
.fq-a{
  padding:0 0 20px;font-size:13.5px;line-height:1.72;color:var(--t2);
  animation:fadeUp .2s cubic-bezier(.16,1,.3,1) both;
}

/* ── CTA FINAL ── */
#pl-cta{
  padding:120px max(32px,env(safe-area-inset-left,0px));
  text-align:center;position:relative;overflow:hidden;
  border-top:1px solid var(--ln);
}
#pl-cta::before{
  content:'';position:absolute;
  width:800px;height:500px;border-radius:50%;
  background:radial-gradient(ellipse,rgba(37,99,235,.06) 0%,transparent 65%);
  top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;
}
.cta-h2{
  font-family:'Instrument Serif',serif;
  font-size:clamp(40px,6vw,78px);
  font-weight:400;line-height:.98;letter-spacing:-.035em;
  max-width:800px;margin:0 auto 24px;
  text-wrap:balance;
}
.cta-h2 em{font-style:italic;color:var(--t2)}
#pl-cta .sec-sub{margin:0 auto 48px;font-size:17px;text-align:center;max-width:460px}
.cta-micro{
  margin-top:32px;display:flex;align-items:center;
  justify-content:center;gap:24px;flex-wrap:wrap;
}
.cta-micro-item{
  font-size:12.5px;color:var(--t3);
  display:flex;align-items:center;gap:5px;
}
.cta-micro-item::before{content:'✓';color:var(--grh);font-size:11px}
.cta-note{margin-top:18px;font-size:12px;color:var(--t3)}

/* ── FOOTER ── */
#pl-footer{
  padding:28px max(32px,env(safe-area-inset-left,0px));
  border-top:1px solid var(--ln);
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
}
.foot-l{font-size:12px;color:var(--t3)}
.foot-l a{transition:color .15s}.foot-l a:hover{color:var(--t2)}
.foot-r{font-size:11px;color:var(--t3);display:flex;gap:16px;flex-wrap:wrap}

/* ── FLOAT WA ── */
.wa-float{
  position:fixed;bottom:22px;right:22px;z-index:400;
  display:flex;align-items:center;gap:9px;
  padding:12px 22px;border-radius:var(--rpill);
  background:#25D366;color:#fff;
  font-size:13px;font-weight:600;
  box-shadow:0 4px 28px rgba(37,211,102,.3);
  transition:transform .12s cubic-bezier(.16,1,.3,1),box-shadow .15s;
  animation:fadeUp .6s 1.5s cubic-bezier(.16,1,.3,1) both;
}
.wa-float:hover{transform:translateY(-2px);box-shadow:0 8px 36px rgba(37,211,102,.4)}
.wa-float:active{transform:scale(.95)}

/* ════════════════════════════════════════
   RESPONSIVE — MOBILE FIRST
   ════════════════════════════════════════ */

/* ── TABLET ≤ 900px ── */
@media(max-width:900px){
  .w{
    padding-left:max(24px,env(safe-area-inset-left,0px));
    padding-right:max(24px,env(safe-area-inset-right,0px));
  }
  /* Hero: 1 columna */
  .hero-wrap{
    grid-template-columns:1fr;
    min-height:auto;
    gap:40px;
  }
  .hero-left{
    padding-top:52px;padding-bottom:0;
    padding-right:0;
  }
  .hero-right{
    padding-top:0;padding-bottom:48px;
    align-items:center;
    max-width:520px;
    margin:0 auto;
    width:100%;
  }
  .browser-chrome{max-width:100%}
  /* Hero mobile card — solo 2 leads, sin sidebar */
  .panel-side{display:none}
  .panel-shell{grid-template-columns:1fr}
  /* Layouts 2-col a 1-col */
  .prob-layout{grid-template-columns:1fr;gap:52px}
  .compare-box{position:static}
  .video-layout{grid-template-columns:1fr;gap:40px}
  .video-left .sec-h2{max-width:100%}
  .vwrap{max-width:280px}
  .como-layout{grid-template-columns:1fr;gap:40px}
  .master-panel{position:static;display:none}
  .demo-layout{grid-template-columns:1fr;gap:40px}
  .faq-layout{grid-template-columns:1fr;gap:40px}
  .faq-left{position:static}
  /* Bento a 2-col */
  .bento{grid-template-columns:1fr 1fr}
  .bc1,.bc2,.bc3,.bc4,.bc5,.bc6,.bc7{
    grid-column:auto;grid-row:auto;
  }
  .bc1{grid-column:1/-1}
  /* Pricing 2-col */
  .price-grid{grid-template-columns:1fr 1fr}
  /* Numbers 3 en fila */
  .numbers-grid{grid-template-columns:repeat(3,1fr)}
  /* Sections padding */
  .sec-pad,.sec-border{padding-top:72px;padding-bottom:72px}
  #pl-cta{padding-top:88px;padding-bottom:88px}
}

/* ── MOBILE ≤ 600px ── */
@media(max-width:600px){
  .w{
    padding-left:max(20px,env(safe-area-inset-left,0px));
    padding-right:max(20px,env(safe-area-inset-right,0px));
  }
  /* NAV */
  .nav-links .nav-link{display:none}

  /* HERO — ocultar panel en mobile, solo texto */
  .hero-wrap{display:block}
  .hero-right{display:none}
  .hero-left{
    padding-top:40px;padding-bottom:52px;
    padding-right:0;
  }
  .hero-h1{font-size:clamp(46px,12vw,60px);letter-spacing:-.03em;line-height:.97}
  .hero-sub{font-size:15px;margin-top:20px;line-height:1.65}
  .hero-stats{gap:20px;margin-top:32px;flex-wrap:nowrap}
  .hstat-n{font-size:clamp(28px,8vw,36px)}
  .hstat-l{font-size:9.5px}
  .hero-actions{
    flex-direction:column;align-items:stretch;
    gap:11px;margin-top:32px;
  }
  .btn-primary{
    width:100%;justify-content:center;
    padding:17px 24px;font-size:15px;
  }
  .btn-ghost{
    width:100%;justify-content:center;
    padding:15px 24px;font-size:14px;
  }
  .hero-agencies{margin-top:24px}
  .vwrap{max-width:220px}

  /* Tabla panel: en mobile solo col Nombre + Estado + WA */
  .ltable th:nth-child(2),
  .ltable td:nth-child(2),
  .ltable th:nth-child(3),
  .ltable td:nth-child(3){display:none}
  .ltable{font-size:12px}
  .panel-main{padding:14px 14px}
  .panel-hdr{margin-bottom:12px}
  .ltable thead th{font-size:8.5px;padding:0 8px 8px}
  .ltable td{padding:9px 8px}

  /* NUMBERS */
  .numbers-grid{grid-template-columns:1fr}
  .number-card{padding:28px 24px}
  .number-big{font-size:clamp(44px,13vw,60px)}

  /* SECTIONS */
  #pl-numbers{padding:60px 0}
  #pl-prob,#pl-video,#pl-como,#pl-feat,#pl-prices,#pl-demo,#pl-faq{
    padding-top:72px;padding-bottom:72px;
  }
  #pl-cta{padding:80px max(20px,env(safe-area-inset-left,0px))}

  /* H2 */
  .sec-h2{font-size:clamp(28px,8.5vw,40px)}
  .sec-sub{font-size:14px}

  /* BENTO: 1-col */
  .bento{grid-template-columns:1fr}
  .bc1,.bc2,.bc3,.bc4,.bc5,.bc6,.bc7{grid-column:1}

  /* PANEL shell: ocultar sidebar en mobile */
  .panel-shell{grid-template-columns:1fr}
  .panel-side{display:none}

  /* HERO BROWSER: ajuste */
  .browser-chrome{border-radius:12px 12px 0 0}

  /* PRICING: 1-col */
  .price-grid{grid-template-columns:1fr;max-width:340px}
  .price-anchor{flex-direction:column;gap:8px}
  .anchor-sep{display:none}

  /* DEMO */
  .demo-creds{grid-template-columns:1fr}
  .ds-stats{grid-template-columns:1fr 1fr}
  .ds-s:last-child{grid-column:1/-1}

  /* FAQ */
  .fq summary{font-size:13.5px;padding:17px 0}

  /* CTA */
  .cta-h2{font-size:clamp(36px,10.5vw,52px)}
  #pl-cta .sec-sub{font-size:15px}
  .cta-micro{gap:16px}

  /* FLOAT */
  .wa-float{bottom:16px;right:16px;padding:10px 18px;font-size:12px}
}

/* ── ULTRA NARROW ≤ 380px ── */
@media(max-width:380px){
  .hero-h1{font-size:clamp(38px,11.5vw,48px)}
  .w{
    padding-left:max(16px,env(safe-area-inset-left,0px));
    padding-right:max(16px,env(safe-area-inset-right,0px));
  }
}
`;

// ── SVG WhatsApp ──
const WaIcon = ({size=12}:{size?:number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z"/>
  </svg>
);

// ── LEADS DEMO DATA ──
const DEMO_LEADS = [
  {n:'María González', t:'ahora',      c:'Promo Verano',   h:'09:41', b:'b-new', bl:'Nuevo'},
  {n:'Carlos Mendoza', t:'hace 4 min', c:'Remarketing',    h:'09:37', b:'b-hot', bl:'Interesado'},
  {n:'Ana Pérez',      t:'hace 19 min',c:'Video Ads',      h:'09:22', b:'b-won', bl:'Vendido'},
  {n:'Luis Ramírez',   t:'hace 32 min',c:'Promo Verano',   h:'09:09', b:'b-trk', bl:'Seguimiento'},
];

// ── TICKER ITEMS ──
const TICKER_ITEMS = [
  'Restaurante El Fogón · ahora',
  'Clínica DentalPro · 1 min',
  'Gym PowerFit · 2 min',
  'Academia de Inglés · 3 min',
  'Inmobiliaria Sur · 5 min',
  'Autoservicio Mérida · 7 min',
  'Estética Canina · 9 min',
];

export default function PanelLeadsContent() {
  return (
    <div id="pl">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ═══ NAV ═══ */}
      <nav id="pl-nav">
        <div className="w nav-in">
          <a href="/" className="nav-logo">
            <span className="nav-dot" />
            <span className="nav-name">Agentia</span>
          </a>
          <div className="nav-links">
            <a href="#pl-numbers" className="nav-link">Resultados</a>
            <a href="#pl-prices"  className="nav-link">Precios</a>
            <a href="#pl-demo"    className="nav-link">Demo</a>
            <a
              href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads"
              className="nav-cta"
              target="_blank" rel="noopener noreferrer"
            >
              Agendar demo
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="pl-hero">
        <div className="w hero-wrap">

          {/* ── Texto ── */}
          <div className="hero-left">

            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              <span className="hero-eyebrow-txt">Panel de leads · marca blanca para agencias</span>
            </div>

            <h1 className="hero-h1">
              Tus clientes<br />
              ven sus leads.<br />
              <em>Al instante.</em>
            </h1>

            <p className="hero-sub">
              Panel con tu marca para agencias de Facebook Ads. Cada lead llega al celular de tu cliente en segundos — con nombre, número y un tap para contactar.
            </p>

            {/* Stats */}
            <div className="hero-stats">
              <div>
                <div className="hstat-n">+15k</div>
                <div className="hstat-l">Leads gestionados</div>
              </div>
              <div className="hstat-sep" />
              <div>
                <div className="hstat-n">+3,700</div>
                <div className="hstat-l">Último mes</div>
              </div>
              <div className="hstat-sep" />
              <div>
                <div className="hstat-n">24 h</div>
                <div className="hstat-l">Primer panel</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="hero-actions">
              <a
                href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads%20para%20mi%20agencia"
                className="btn-primary"
                target="_blank" rel="noopener noreferrer"
              >
                <WaIcon size={13} /> Agendar demo
              </a>
              <a href="#pl-demo" className="btn-ghost">Ver panel demo →</a>
            </div>

            {/* Agency trust */}
            <div className="hero-agencies">
              <span className="agency-pill">Puntillo Agency</span>
              <span className="agency-pill">Nexo Digital</span>
              <span className="agency-pill">Rojo Tráfico</span>
              <span className="agency-more">+49 agencias más</span>
            </div>
          </div>

          {/* ── Panel Demo Screenshot ── */}
          <div className="hero-right">
            <div className="browser-chrome">
              <div className="browser-bar">
                <div className="b-dots">
                  <span className="b-dot b-r"/><span className="b-dot b-y"/><span className="b-dot b-g"/>
                </div>
                <span className="b-url">agentia.software / panel · demo-agencia</span>
              </div>
              <div className="panel-shell">
                <nav className="panel-side">
                  <span className="p-sec">Panel</span>
                  <div className="p-item on"><span className="p-item-dot"/>Leads</div>
                  <div className="p-item"><span className="p-item-dot"/>Clientes</div>
                  <div className="p-item"><span className="p-item-dot"/>WhatsApp</div>
                  <span className="p-sec">Reportes</span>
                  <div className="p-item"><span className="p-item-dot"/>Campañas</div>
                  <div className="p-item"><span className="p-item-dot"/>Resultados</div>
                </nav>
                <div className="panel-main">
                  <div className="panel-hdr">
                    <span className="panel-title">Leads — hoy</span>
                    <div className="panel-chips">
                      <span className="chip chip-live">En vivo</span>
                      <span className="chip chip-date">Nov 5, 2026</span>
                    </div>
                  </div>
                  <table className="ltable">
                    <thead>
                      <tr><th>Nombre</th><th>Campaña</th><th>Hora</th><th>Estado</th><th/></tr>
                    </thead>
                    <tbody id="pl-leads-body">
                      {DEMO_LEADS.map(r => (
                        <tr key={r.n}>
                          <td><div className="lead-name">{r.n}</div><div className="lead-time">{r.t}</div></td>
                          <td><span className="lead-src">{r.c}</span></td>
                          <td className="lead-time">{r.h}</td>
                          <td><span className={`badge ${r.b}`}>{r.bl}</span></td>
                          <td><span className="wa-btn"><WaIcon/> Llamar</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="ticker">
          <div className="ticker-track">
            {TICKER_ITEMS.flatMap((item,i) => [
              <span key={`a${i}`} className="ticker-item"><b>Lead nuevo</b> · {item}<span className="ticker-dot"/></span>,
              <span key={`b${i}`} className="ticker-item"><b>Contactado</b> · {item}<span className="ticker-dot"/></span>,
            ])}
          </div>
        </div>
      </section>

      {/* ═══ NÚMEROS REALES ═══ */}
      <section id="pl-numbers">
        <div className="w">
          <span className="sec-label rv">Producto en uso real</span>
          <div className="numbers-grid" style={{marginTop:'28px'}}>
            {[
              {n:'+15,000', l:'Leads procesados',    d:'↑ en curso'},
              {n:'+3,700',  l:'Últimos 30 días',     d:'↑ mes activo'},
              {n:'52',      l:'Negocios activos hoy',d:'↑ este mes'},
            ].map((s,i) => (
              <div key={s.l} className={`number-card rv${i>0?` d${i}`:''}`}>
                <div className="number-big">{s.n}</div>
                <div className="number-label">{s.l}</div>
                <div className="number-delta">{s.d}</div>
              </div>
            ))}
          </div>
          <p className="sec-sub rv d2" style={{marginTop:'28px',maxWidth:'600px'}}>
            Estos números son los de hoy. Restaurantes, clínicas, gimnasios y escuelas en México que usan el panel para dar seguimiento a sus prospectos de Facebook Ads — sin depender de un Excel o de su agencia para ver qué llegó.
          </p>
        </div>
      </section>

      {/* ═══ PROBLEMA ═══ */}
      <section id="pl-prob" className="sec-border">
        <div className="w">
          <div className="prob-layout">
            <div>
              <span className="sec-label rv">El problema</span>
              <h2 className="sec-h2 rv d1">Tu agencia trabaja bien.<br/>Los leads llegan mal.</h2>
              <p className="sec-sub rv d2">El trafficker optimiza. Las campañas convierten. Y después de todo eso, el lead le llega al cliente una semana después en un Excel.</p>
              <div className="pain-list" style={{marginTop:'48px'}}>
                {[
                  {n:'01', t:'Excel desactualizado',         p:'Exportas leads a mano. El cliente pregunta cuántos llegaron ayer y tú buscas el archivo.'},
                  {n:'02', t:'Screenshots por WhatsApp',     p:'Mandas capturas del Ads Manager. El cliente no sabe qué significa CTR ni le importa.'},
                  {n:'03', t:'Lead frío al día siguiente',   p:'Llegó a las 3pm. Tu cliente lo vio el lunes. Para entonces ya compró con la competencia.'},
                  {n:'04', t:'Automatizaciones que se rompen',p:'Zapier caído, leads perdidos. Y cuando falla, la culpa la carga la agencia.'},
                ].map((item,i) => (
                  <div key={item.n} className={`pain-item rv${i>0?` d${i}`:''}`}>
                    <span className="pain-num">{item.n}</span>
                    <div>
                      <h3>{item.t}</h3>
                      <p>{item.p}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rv d2">
              <div className="compare-box">
                <div className="compare-tabs">
                  <div className="ctab on" id="ctab-0" onClick={()=>{
                    document.querySelectorAll('.ctab').forEach(t=>t.classList.remove('on'));
                    document.querySelectorAll('.cpane').forEach(p=>p.classList.remove('on'));
                    document.getElementById('ctab-0')?.classList.add('on');
                    document.getElementById('cpane-0')?.classList.add('on');
                  }}>Sin panel</div>
                  <div className="ctab" id="ctab-1" onClick={()=>{
                    document.querySelectorAll('.ctab').forEach(t=>t.classList.remove('on'));
                    document.querySelectorAll('.cpane').forEach(p=>p.classList.remove('on'));
                    document.getElementById('ctab-1')?.classList.add('on');
                    document.getElementById('cpane-1')?.classList.add('on');
                  }}>Con panel</div>
                </div>
                <div className="cpane on" id="cpane-0">
                  <div className="xrow xhead">
                    <span className="xcell">Nombre</span><span className="xcell">Tel</span>
                    <span className="xcell">Fecha</span><span className="xcell">Status</span>
                  </div>
                  {['María G.','Carlos M.','Ana P.'].map(n=>(
                    <div key={n} className="xrow">
                      <span className="xcell">{n}</span>
                      <span className="xcell" style={{color:'var(--t3)'}}>—</span>
                      <span className="xcell" style={{color:'var(--t3)'}}>28/oct</span>
                      <span className="xcell" style={{color:'var(--t3)'}}>pendiente</span>
                    </div>
                  ))}
                  <div className="xwarn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:'1px'}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    8 días sin contactar. El cliente no sabe que llegaron.
                  </div>
                </div>
                <div className="cpane" id="cpane-1">
                  <div className="notif">
                    <div className="notif-ic ni-blue">🔔</div>
                    <div>
                      <div className="notif-title">Lead nuevo — María González</div>
                      <div className="notif-body">Promo Verano · +52 999 123 4567</div>
                      <div className="notif-t">hace 4 segundos</div>
                      <div className="notif-wa"><WaIcon/>Llamar ahora</div>
                    </div>
                  </div>
                  <div className="notif">
                    <div className="notif-ic ni-green">✓</div>
                    <div>
                      <div className="notif-title">Carlos Mendoza — Contactado</div>
                      <div className="notif-body">Remarketing · respondido en 3 min</div>
                      <div className="notif-t">hace 11 minutos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VIDEO ═══ */}
      <section id="pl-video" className="sec-border">
        <div className="w">
          <div className="video-layout">
            <div className="video-left">
              <span className="sec-label rv">En acción</span>
              <h2 className="sec-h2 rv d1">Míralo en<br/>60 segundos.</h2>
              <p className="sec-sub rv d2">
                El panel funcionando con un cliente real. Sin demo fabricada — el mismo que usan las 52 agencias activas hoy.
              </p>
              <div style={{marginTop:'36px'}} className="rv d3">
                <a
                  href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads"
                  className="btn-primary"
                  target="_blank" rel="noopener noreferrer"
                >
                  <WaIcon size={13}/> Agendar demo
                </a>
              </div>
            </div>
            <div className="vwrap rv d2" id="pl-vwrap">
              <video id="pl-vid" src="/anuncio-agentia-MX-subtitulado.mp4" preload="metadata" playsInline />
              <div className="v-overlay" id="pl-voverlay">
                <div className="v-play" id="pl-vplay">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--bg)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <span className="v-label">Ver video — 60 seg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section id="pl-como" className="sec-border">
        <div className="w">
          <span className="sec-label rv">Cómo funciona</span>
          <h2 className="sec-h2 rv d1">Tres pasos.<br/>Listo en 24 horas.</h2>
          <div className="como-layout">
            <div className="steps-col">
              {[
                {n:'1', t:'Conectas la campaña',       p:'Enlazas el formulario de Facebook Ads. Menos de 5 minutos con la guía de Agentia.',          time:'⏱ 5 min'},
                {n:'2', t:'Tu cliente recibe su acceso',p:'Le mandas un link. Entra al panel con tu logo. No ve nada de Agentia — tú eres el proveedor.',time:'⏱ 24 h después del alta'},
                {n:'3', t:'Leads en tiempo real',       p:'Cada lead dispara una notificación push al celular. Un tap abre WhatsApp con el número del prospecto.',time:'⏱ segundos por lead'},
              ].map((s,i) => (
                <div key={s.n} className={`step rv${i>0?` d${i}`:''}`}>
                  <span className="step-n">{s.n}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.p}</p>
                    <span className="step-time">{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="master-panel rv d2">
              <div className="mp-top">
                <span>Clientes activos — panel maestro</span>
                <span className="chip chip-live">En vivo</span>
              </div>
              <div className="mp-body">
                {[
                  {av:'RF', name:'Restaurante El Fogón', sub:'14 leads · activo hoy', bg:'linear-gradient(135deg,#2563eb,#60a5fa)', badge:'b-new', bl:'Activo'},
                  {av:'DP', name:'Clínica DentalPro',    sub:'8 leads · activo hoy',  bg:'linear-gradient(135deg,#16a34a,#4ade80)', badge:'b-won', bl:'Activo'},
                  {av:'GP', name:'Gym PowerFit',         sub:'22 leads · activo hoy', bg:'linear-gradient(135deg,#d97706,#fbbf24)', badge:'b-hot', bl:'Activo'},
                ].map(r => (
                  <div key={r.av} className="mp-row">
                    <div className="mp-av" style={{background:r.bg}}>{r.av}</div>
                    <div><div className="mp-name">{r.name}</div><div className="mp-sub">{r.sub}</div></div>
                    <span className={`badge ${r.badge}`} style={{marginLeft:'auto',fontSize:'9px'}}>{r.bl}</span>
                  </div>
                ))}
                <div className="mp-code">
                  → lead.nombre: &quot;María González&quot;<br/>
                  → lead.telefono: &quot;+52 999 123 4567&quot;<br/>
                  → notif.push: ✓ enviada<br/>
                  → tiempo_respuesta: 3 min
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES BENTO ═══ */}
      <section id="pl-feat" className="sec-border">
        <div className="w">
          <div className="feat-head">
            <span className="sec-label rv">Funciones</span>
            <h2 className="sec-h2 rv d1">Todo lo que necesita<br/>tu agencia para escalar.</h2>
          </div>
          <div className="bento rv d2">
            <div className="bc bc1">
              <span className="bc-label">Marca blanca</span>
              <h3>Tu marca, no la nuestra</h3>
              <p>El panel lleva tu logo y el nombre de tu agencia. El cliente nunca ve &quot;Agentia&quot;. Tú eres el proveedor de tecnología para tus clientes.</p>
            </div>
            <div className="bc bc2">
              <span className="bc-label">Notificaciones</span>
              <h3>Push al celular</h3>
              <p>Vibra en el momento exacto que llega el lead. Sin abrir apps, sin esperar reportes semanales.</p>
            </div>
            <div className="bc bc3">
              <span className="bc-label">Pipeline</span>
              <h3>Seguimiento de ventas</h3>
              <p>Nuevo → Seguimiento → Interesado → Vendido. El cliente actualiza el estatus y tú ves qué campañas convierten.</p>
            </div>
            <div className="bc bc4">
              <span className="bc-label">PWA · Sin App Store</span>
              <h3>Se instala desde el navegador</h3>
              <p>Android e iPhone, 2 taps. Funciona como app nativa. Sin descargas, sin aprobaciones de tienda.</p>
            </div>
            <div className="bc bc5">
              <span className="bc-label">Panel maestro</span>
              <h3>Todos tus clientes, una vista</h3>
              <p>Desde tu acceso de agencia ves qué paneles están activos, cuántos leads llegaron hoy y qué cuentas necesitan atención.</p>
              <div className="mini-bars">
                {[
                  {l:'El Fogón',   w:'78%', v:'14'},
                  {l:'DentalPro', w:'52%', v:'8'},
                  {l:'PowerFit',  w:'95%', v:'22'},
                  {l:'Inglés Pro',w:'36%', v:'6'},
                ].map(b=>(
                  <div key={b.l} className="mbar">
                    <span className="mbar-label">{b.l}</span>
                    <div className="mbar-wrap"><div className="mbar-fill" style={{width:b.w}}/></div>
                    <span className="mbar-val">{b.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bc bc6">
              <span className="bc-label">API oficial · WhatsApp Business</span>
              <h3>Bandeja de WhatsApp</h3>
              <p>Integración con la API oficial de WhatsApp Business. Responde conversaciones y lanza campañas desde el mismo panel.</p>
              <span className="bc-tag">Add-on disponible</span>
            </div>
            <div className="bc bc7">
              <span className="bc-label">Soporte</span>
              <h3>Humano, por WhatsApp</h3>
              <p>Soporte directo con el equipo de Agentia. No hay bot — hablas con la persona que configuró tu cuenta.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRECIOS ═══ */}
      <section id="pl-prices" className="sec-border">
        <div className="w">
          <div className="price-head rv">
            <span className="sec-label">Precios</span>
            <h2 className="sec-h2">Paga por paneles activos.<br/>Escala sin límite.</h2>
            <p className="sec-sub">Por panel al mes. Entre más clientes tengas, menos pagas por cada uno.</p>
          </div>
          <div className="price-grid rv d1">
            <div className="pt">
              <div className="pt-tier">Starter</div>
              <div className="pt-price"><sup>$</sup>12<sub> usd</sub></div>
              <div className="pt-range">por panel / mes<br/>mínimo 5 paneles</div>
              <div className="pt-from">Desde <strong>$60 usd / mes</strong><br/>1–9 clientes</div>
            </div>
            <div className="pt feat">
              <div className="pt-pop">Más popular</div>
              <div className="pt-tier">Growth</div>
              <div className="pt-price"><sup>$</sup>10<sub> usd</sub></div>
              <div className="pt-range">por panel / mes</div>
              <div className="pt-from">Desde <strong>$100 usd / mes</strong><br/>10–29 clientes</div>
            </div>
            <div className="pt">
              <div className="pt-tier">Scale</div>
              <div className="pt-price"><sup>$</sup>8<span style={{fontFamily:'Geist,sans-serif',fontSize:'.55em',fontWeight:300}}>.50</span><sub> usd</sub></div>
              <div className="pt-range">por panel / mes</div>
              <div className="pt-from">Desde <strong>$255 usd / mes</strong><br/>30–55 clientes</div>
            </div>
            <div className="pt">
              <div className="pt-tier">Enterprise</div>
              <div className="pt-price" style={{fontFamily:'Geist,sans-serif',fontSize:'28px',fontWeight:300,letterSpacing:'-.02em'}}>Cotiza</div>
              <div className="pt-range">56 o más paneles</div>
              <div className="pt-from">Desde <strong>$400 usd / mes</strong><br/>precio por volumen</div>
            </div>
          </div>
          <div className="price-anchor rv d2">
            <span>¿Cuánto cuesta <strong>no tener panel</strong>?</span>
            <span className="anchor-sep">→</span>
            <span>Zapier (~$50/mes) + tiempo de exportar Excels (~2h/semana) + leads perdidos. <strong>$10 por cliente activo al mes es menos que un café a la semana.</strong></span>
          </div>
          <div style={{textAlign:'center',marginTop:'32px'}} className="rv d3">
            <a
              href="https://wa.me/529844927769?text=Quiero%20cotizar%20el%20Panel%20de%20Leads"
              className="btn-primary"
              style={{fontSize:'14px'}}
              target="_blank" rel="noopener noreferrer"
            >
              Cotizar por WhatsApp
            </a>
            <p style={{marginTop:'13px',fontSize:'12px',color:'var(--t3)'}}>
              Sin contrato anual · Sin prueba gratis · Activo en 24 horas
            </p>
          </div>
        </div>
      </section>

      {/* ═══ DEMO ═══ */}
      <section id="pl-demo" className="sec-border">
        <div className="w">
          <div className="demo-layout">
            <div>
              <span className="sec-label rv">Demo</span>
              <h2 className="sec-h2 rv d1">Entra ahora.<br/>Sin registrarte.</h2>
              <p className="sec-sub rv d2">Panel de demostración con datos reales de prueba. Ve exactamente lo que vería uno de tus clientes.</p>
              <div className="demo-creds rv d2">
                <div className="cred"><div className="cred-k">Usuario</div><div className="cred-v">demo-agencia</div></div>
                <div className="cred"><div className="cred-k">Contraseña</div><div className="cred-v">demo2026</div></div>
              </div>
              <div className="demo-action rv d3">
                <a href="/agentia-panel?demo=1" className="btn-outline" target="_blank" rel="noopener noreferrer">
                  Abrir panel demo
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            </div>
            <div className="demo-screen rv d2">
              <div className="ds-top">
                <span>Resumen del día</span>
                <span className="chip chip-date">demo-agencia</span>
              </div>
              <div className="ds-stats">
                <div className="ds-s"><div className="ds-n">47</div><div className="ds-l">Leads hoy</div><div className="ds-chg">↑ +12 vs ayer</div></div>
                <div className="ds-s"><div className="ds-n">23%</div><div className="ds-l">Tasa contacto</div><div className="ds-chg">↑ vs 18%</div></div>
                <div className="ds-s"><div className="ds-n">4</div><div className="ds-l">Paneles activos</div><div className="ds-chg">↑ estable</div></div>
              </div>
              <div className="ds-body">
                {[
                  {dot:'dot-b',n:'María González',h:'09:41'},
                  {dot:'dot-g',n:'Carlos Mendoza', h:'09:35'},
                  {dot:'dot-a',n:'Ana Pérez',       h:'09:23'},
                  {dot:'dot-b',n:'Luis Ramírez',    h:'09:10'},
                ].map(r=>(
                  <div key={r.n} className="ds-row">
                    <span className={`ds-dot ${r.dot}`}/>
                    <span className="ds-nm">{r.n}</span>
                    <span className="ds-hr">{r.h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="pl-faq" className="sec-border">
        <div className="w">
          <div className="faq-layout">
            <div className="faq-left">
              <span className="sec-label rv">FAQ</span>
              <h2 className="sec-h2 rv d1">Preguntas<br/>frecuentes.</h2>
              <p className="sec-sub rv d2">Las que llegan antes de contratar.</p>
            </div>
            <div className="faq-items rv d1">
              {[
                {q:'¿Mis clientes saben que usan Agentia?',           a:'No. El panel lleva tu marca — tu logo, tu nombre. Para tu cliente, tú eres el proveedor. Agentia es la infraestructura invisible.'},
                {q:'¿Cómo conecta con Facebook Ads?',                 a:'Integración nativa con Meta Lead Ads. En menos de 5 minutos enlazas la página de Facebook del cliente. Sin Zapier, sin webhooks, sin código.'},
                {q:'¿Funciona en iPhone sin App Store?',              a:'Sí. Es una PWA. Se instala desde Safari o Chrome en dos taps. Aparece en la pantalla de inicio y recibe notificaciones push como una app nativa.'},
                {q:'¿Cuánto tarda el primer panel?',                  a:'Entre 24 y 48 horas desde que confirmas. Recibes el acceso al panel maestro y una guía paso a paso. No instalas nada.'},
                {q:'¿Qué pasa si un cliente cancela?',                a:'Solo pagas paneles activos ese mes. Sin penalizaciones, sin contratos anuales.'},
                {q:'¿Incluye soporte?',                               a:'Sí. Soporte directo por WhatsApp con el equipo de Agentia. No hay bot — hablas con la persona que configuró tu cuenta.'},
              ].map(item=>(
                <details key={item.q} className="fq">
                  <summary>
                    {item.q}
                    <svg className="fq-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  </summary>
                  <div className="fq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section id="pl-cta">
        <h2 className="cta-h2 rv">¿Lista tu agencia para<br/>dejar de mandar <em>Excels?</em></h2>
        <p className="sec-sub rv d1">Una demo en vivo con tus datos, no un genérico.</p>
        <a
          href="https://wa.me/529844927769?text=Quiero%20agendar%20demo%20del%20Panel%20de%20Leads"
          className="btn-primary rv d2"
          style={{fontSize:'15px',padding:'16px 36px'}}
          target="_blank" rel="noopener noreferrer"
        >
          <WaIcon size={14}/> Agendar demo por WhatsApp
        </a>
        <div className="cta-micro rv d3">
          <span className="cta-micro-item">Sin contrato anual</span>
          <span className="cta-micro-item">Activo en 24 horas</span>
          <span className="cta-micro-item">API oficial de WhatsApp Business</span>
          <span className="cta-micro-item">Tu marca, no la nuestra</span>
        </div>
        <p className="cta-note rv d4">+52 984 492 7769 · Respondemos en menos de 2 horas</p>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer id="pl-footer">
        <div className="foot-l">
          © 2026 <a href="https://agentia.software">Agentia Software</a> · <a href="/legal">Privacidad</a>
        </div>
        <div className="foot-r">
          <span>panel de leads facebook ads</span>
          <span>crm para agencias</span>
          <span>crm para traffickers</span>
        </div>
      </footer>

      {/* ═══ FLOAT WA ═══ */}
      <a
        href="https://wa.me/529844927769?text=Info%20Panel%20de%20Leads"
        className="wa-float"
        target="_blank" rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z"/></svg>
        WhatsApp
      </a>

      {/* ═══ SCRIPTS ═══ */}
      <script dangerouslySetInnerHTML={{ __html: `
        // ── Scroll reveal ──
        (function(){
          var o=new IntersectionObserver(function(e){
            e.forEach(function(i){
              if(i.isIntersecting){i.target.classList.add('in');o.unobserve(i.target)}
            })
          },{threshold:0.07,rootMargin:'0px 0px -20px 0px'});
          document.querySelectorAll('.rv').forEach(function(el){o.observe(el)});
        })();

        // ── Video ──
        (function(){
          var vid=document.getElementById('pl-vid');
          var wrap=document.getElementById('pl-vwrap');
          if(!vid)return;
          document.getElementById('pl-vplay').addEventListener('click',function(){
            vid.play();wrap.classList.add('playing');
          });
          vid.addEventListener('click',function(){
            if(vid.paused){vid.play();wrap.classList.add('playing')}
            else{vid.pause();wrap.classList.remove('playing')}
          });
          vid.addEventListener('ended',function(){wrap.classList.remove('playing')});
        })();

        // ── Live leads simulator ──
        (function(){
          var NAMES=['Roberto A.','Sofía L.','Miguel T.','Carmen V.','Diego F.','Valeria S.','Héctor R.','Laura M.','Fernanda Q.','Andrés B.'];
          var CAMPS=['Promo Verano','Remarketing','Video Ads','Nuevos clientes','Stories'];
          var BADGES=[['b-new','Nuevo'],['b-trk','Seguimiento'],['b-hot','Interesado']];
          function pad(n){return n<10?'0'+n:n}
          function addRow(){
            var tbody=document.getElementById('pl-leads-body');
            if(!tbody)return;
            var rows=tbody.querySelectorAll('tr');
            if(rows.length>=6){tbody.removeChild(rows[rows.length-1])}
            var n=NAMES[Math.floor(Math.random()*NAMES.length)];
            var c=CAMPS[Math.floor(Math.random()*CAMPS.length)];
            var b=BADGES[Math.floor(Math.random()*BADGES.length)];
            var now=new Date();
            var h=pad(now.getHours())+':'+pad(now.getMinutes());
            var tr=document.createElement('tr');
            tr.className='row-new';
            tr.innerHTML='<td><div class="lead-name">'+n+'</div><div class="lead-time">ahora</div></td>'
              +'<td><span class="lead-src">'+c+'</span></td>'
              +'<td class="lead-time">'+h+'</td>'
              +'<td><span class="badge '+b[0]+'">'+b[1]+'</span></td>'
              +'<td><span class="wa-btn">Llamar</span></td>';
            tbody.insertBefore(tr,tbody.firstChild);
          }
          setInterval(addRow,5400);
        })();
      `}} />
    </div>
  );
}
