'use client';

/* ═══════════════════════════════════════════════════════════════
   PANEL DE LEADS — v4
   Mobile-first absoluto. Tipografía brutal. Sin grids en mobile.
   Desktop = 2 col. Mobile = 1 col siempre limpio.
   ═══════════════════════════════════════════════════════════════ */

const WaIcon = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z"/>
  </svg>
);

const LEADS = [
  { n:'María González', c:'Promo Verano',   b:'b-new', bl:'Nuevo' },
  { n:'Carlos Mendoza', c:'Remarketing',    b:'b-hot', bl:'Interesado' },
  { n:'Ana Pérez',      c:'Video Ads',      b:'b-won', bl:'Vendido' },
  { n:'Luis Ramírez',   c:'Promo Verano',   b:'b-trk', bl:'Seguimiento' },
];

export default function PanelLeadsContent() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
/* ══ IMPORT ══ */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

/* ══ RESET ══ */
#pl,#pl *,#pl *::before,#pl *::after{box-sizing:border-box;margin:0;padding:0}
#pl a{color:inherit;text-decoration:none}

/* ══ ROOT ══ */
#pl{
  --ink:#f3f3f5;
  --ink2:rgba(243,243,245,.52);
  --ink3:rgba(243,243,245,.26);
  --canvas:#06070a;
  --surface:#0e1014;
  --surface2:#151719;
  --surface3:#1c1e22;
  --edge:rgba(255,255,255,.06);
  --edge2:rgba(255,255,255,.11);
  --blue:#2563eb;
  --blue-hi:#3b82f6;
  --green:#22c55e;
  --amber:#f59e0b;
  --red:#ef4444;
  --pill:9999px;
  font-family:'Geist',system-ui,sans-serif;
  background:var(--canvas);
  color:var(--ink);
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  color-scheme:dark;
  min-height:100svh;
  line-height:1;
}

/* ══ WRAPPER ══ */
/* Padding horizontal: 20px mobile → 48px desktop */
.g{
  width:100%;
  max-width:1120px;
  margin-left:auto;
  margin-right:auto;
  padding-left:clamp(20px,5vw,48px);
  padding-right:clamp(20px,5vw,48px);
}

/* ══ ANIMACIONES ══ */
@keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{to{transform:translateX(-50%)}}
@keyframes rowpop{from{opacity:0;background:rgba(37,99,235,.08)}to{opacity:1;background:transparent}}

/* Scroll reveal */
.rv{opacity:0;transform:translateY(16px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)}
.rv.in{opacity:1;transform:none}
.d1{transition-delay:.07s}.d2{transition-delay:.14s}.d3{transition-delay:.21s}.d4{transition-delay:.28s}

/* ══ NAV ══ */
#pl nav{
  position:fixed;inset:0 0 auto;
  height:52px;z-index:900;
  background:rgba(6,7,10,.88);
  border-bottom:1px solid var(--edge);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
}
.nav-row{
  height:52px;
  display:flex;align-items:center;justify-content:space-between;
}
.nav-brand{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;letter-spacing:-.01em}
.nav-pulse{
  width:6px;height:6px;border-radius:50%;
  background:var(--green);box-shadow:0 0 8px var(--green);
  animation:glow 2s infinite;
}
.nav-right{display:flex;align-items:center;gap:4px}
.nl{padding:6px 13px;border-radius:var(--pill);font-size:13px;color:var(--ink2);transition:color .15s,background .15s}
.nl:hover{color:var(--ink);background:rgba(255,255,255,.05)}
.na{
  padding:7px 18px;border-radius:var(--pill);
  background:var(--ink);color:var(--canvas);
  font-size:13px;font-weight:600;letter-spacing:-.01em;
  transition:opacity .12s;
}
.na:hover{opacity:.85}

/* ══ HERO ══ */
#pl-hero{
  padding-top:52px; /* nav */
  position:relative;overflow:hidden;
}
/* Gradiente fondo hero */
#pl-hero::after{
  content:'';position:absolute;pointer-events:none;
  inset:0;z-index:0;
  background:
    radial-gradient(ellipse 55% 45% at 100% -10%,rgba(37,99,235,.09) 0%,transparent 55%),
    radial-gradient(ellipse 35% 25% at 0% 100%,rgba(22,197,94,.05) 0%,transparent 50%);
}

/* Hero: 2 col en desktop, 1 col en mobile */
.hero-grid{
  position:relative;z-index:1;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:0;
  align-items:start;
}
.hero-copy{
  padding-top:72px;
  padding-bottom:72px;
  padding-right:48px;
  display:flex;flex-direction:column;
}
.hero-tag{
  display:inline-flex;align-items:center;gap:7px;
  margin-bottom:28px;
  animation:up .5s cubic-bezier(.16,1,.3,1) both;
}
.hero-tag-dot{
  width:5px;height:5px;border-radius:50%;
  background:var(--green);box-shadow:0 0 7px var(--green);
  animation:glow 1.8s infinite;
}
.hero-tag span{font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink3)}

/* ═══ HEADLINE MASIVA ═══ */
.hero-h1{
  font-family:'Instrument Serif',Georgia,serif;
  font-size:clamp(52px,6.8vw,96px);
  font-weight:400;
  line-height:.96;
  letter-spacing:-.035em;
  animation:up .6s .04s cubic-bezier(.16,1,.3,1) both;
}
.hero-h1 em{font-style:italic;color:var(--ink2)}

.hero-p{
  margin-top:22px;
  font-size:clamp(15px,1.5vw,17px);
  line-height:1.7;
  color:var(--ink2);
  max-width:420px;
  animation:up .6s .08s cubic-bezier(.16,1,.3,1) both;
}

/* Stats */
.hero-stats{
  display:flex;align-items:stretch;gap:0;
  margin-top:36px;
  animation:up .6s .12s cubic-bezier(.16,1,.3,1) both;
}
.hs{padding:0 24px 0 0}
.hs:first-child{padding-left:0}
.hs+.hs{padding-left:24px;border-left:1px solid var(--edge2)}
.hs-n{
  font-family:'Instrument Serif',serif;
  font-size:clamp(32px,3.5vw,46px);
  font-weight:400;letter-spacing:-.04em;line-height:1;
}
.hs-l{
  font-size:10px;font-weight:600;letter-spacing:.08em;
  text-transform:uppercase;color:var(--ink3);
  margin-top:5px;line-height:1.3;
}

/* CTAs */
.hero-ctas{
  display:flex;gap:12px;
  margin-top:36px;flex-wrap:wrap;
  animation:up .6s .16s cubic-bezier(.16,1,.3,1) both;
}
.btn-p{
  display:inline-flex;align-items:center;gap:9px;
  padding:16px 30px;border-radius:var(--pill);
  background:var(--ink);color:var(--canvas);
  font-size:15px;font-weight:600;letter-spacing:-.01em;
  transition:transform .12s cubic-bezier(.16,1,.3,1),box-shadow .15s;
  white-space:nowrap;
}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,0,0,.5)}
.btn-p:active{transform:scale(.96)}
.btn-g{
  display:inline-flex;align-items:center;gap:8px;
  padding:16px 26px;border-radius:var(--pill);
  border:1px solid var(--edge2);
  font-size:15px;font-weight:400;color:var(--ink2);
  transition:border-color .15s,color .15s;
  white-space:nowrap;
}
.btn-g:hover{border-color:rgba(255,255,255,.22);color:var(--ink)}

/* Agencias */
.hero-agencies{
  display:flex;align-items:center;gap:7px;flex-wrap:wrap;
  margin-top:28px;
  animation:up .6s .2s cubic-bezier(.16,1,.3,1) both;
}
.ag-pill{
  height:26px;padding:0 12px;border-radius:var(--pill);
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  font-size:11.5px;color:rgba(255,255,255,.4);
  display:inline-flex;align-items:center;
}
.ag-more{font-size:11.5px;color:var(--ink3)}

/* Panel derecho (desktop) */
.hero-panel{
  padding-top:56px;
  overflow:hidden;
}
.browser{
  background:var(--surface);
  border:1px solid var(--edge2);
  border-bottom:none;
  border-radius:14px 14px 0 0;
  box-shadow:
    0 -24px 80px rgba(37,99,235,.07),
    0 -8px 40px rgba(0,0,0,.3);
  animation:up .9s .2s cubic-bezier(.16,1,.3,1) both;
  overflow:hidden;
}
.browser-bar{
  display:flex;align-items:center;gap:12px;
  padding:10px 14px;
  background:var(--surface2);
  border-bottom:1px solid var(--edge);
}
.b-dots{display:flex;gap:5px}
.b-dot{width:9px;height:9px;border-radius:50%}
.bd-r{background:#ff5f57}.bd-y{background:#febc2e}.bd-g{background:#28c840}
.b-url{
  flex:1;text-align:center;
  font-family:'Geist Mono',monospace;font-size:11px;color:var(--ink3);
  background:rgba(255,255,255,.034);border:1px solid var(--edge);
  border-radius:6px;padding:4px 10px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
/* Panel interior: sidebar + main */
.panel-body{
  display:grid;
  grid-template-columns:160px 1fr;
  min-height:400px;
}
.p-side{
  background:rgba(255,255,255,.013);
  border-right:1px solid var(--edge);
  padding:12px 8px;
}
.p-sec-label{
  font-size:8.5px;font-weight:700;letter-spacing:.10em;
  text-transform:uppercase;color:var(--ink3);
  padding:10px 10px 6px;display:block;
}
.p-item{
  display:flex;align-items:center;gap:8px;
  padding:7px 10px;border-radius:8px;
  font-size:11px;color:var(--ink2);cursor:default;
}
.p-item.on{background:rgba(37,99,235,.09);color:var(--ink)}
.p-dot{width:4px;height:4px;border-radius:50%;background:var(--edge2);flex-shrink:0}
.p-item.on .p-dot{background:var(--blue-hi)}
.p-main{padding:16px 18px}
.p-top{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:14px;flex-wrap:wrap;gap:8px;
}
.p-title{font-size:12.5px;font-weight:600;letter-spacing:-.01em}
.p-chips{display:flex;gap:6px}
.chip{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 9px;border-radius:var(--pill);
  font-size:9.5px;font-weight:600;
}
.chip-live{
  background:rgba(34,197,94,.07);color:var(--green);
  border:1px solid rgba(34,197,94,.14);
}
.chip-live::before{
  content:'';width:4px;height:4px;border-radius:50%;
  background:var(--green);animation:glow 1.5s infinite;
}
.chip-date{
  background:rgba(37,99,235,.07);color:#93c5fd;
  border:1px solid rgba(37,99,235,.12);
}
/* Tabla leads */
.lt{width:100%;border-collapse:collapse;font-size:11px}
.lt thead th{
  padding:0 8px 8px;text-align:left;
  font-size:8.5px;font-weight:700;letter-spacing:.09em;
  text-transform:uppercase;color:var(--ink3);
  border-bottom:1px solid var(--edge);
}
.lt tbody tr:hover td{background:rgba(255,255,255,.016)}
.lt td{
  padding:9px 8px;
  border-bottom:1px solid rgba(255,255,255,.025);
  vertical-align:middle;
}
.ld-name{font-size:11.5px;font-weight:500;line-height:1.2}
.ld-time{font-size:9px;color:var(--ink3);margin-top:2px}
.badge{
  display:inline-flex;padding:3px 7px;border-radius:var(--pill);
  font-size:8.5px;font-weight:600;letter-spacing:.03em;white-space:nowrap;
}
.b-new{background:rgba(37,99,235,.10);color:#93c5fd;border:1px solid rgba(37,99,235,.14)}
.b-hot{background:rgba(245,158,11,.08);color:#fcd34d;border:1px solid rgba(245,158,11,.12)}
.b-won{background:rgba(34,197,94,.08);color:#86efac;border:1px solid rgba(34,197,94,.12)}
.b-trk{background:rgba(168,85,247,.08);color:#d8b4fe;border:1px solid rgba(168,85,247,.12)}
.wa-call{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 9px;border-radius:8px;
  background:rgba(37,211,102,.06);border:1px solid rgba(37,211,102,.14);
  color:#4ade80;font-size:9.5px;font-weight:500;cursor:pointer;
  transition:background .12s;
}
.wa-call:hover{background:rgba(37,211,102,.12)}
@keyframes rowpop{from{opacity:0;background:rgba(37,99,235,.07)}to{opacity:1}}
.row-new td{animation:rowpop .4s cubic-bezier(.16,1,.3,1) both}

/* ══ TICKER ══ */
.ticker{
  position:relative;z-index:1;
  background:rgba(255,255,255,.01);
  border-top:1px solid var(--edge);
  border-bottom:1px solid var(--edge);
  overflow:hidden;padding:11px 0;
  -webkit-mask:linear-gradient(to right,transparent 0,#000 8%,#000 92%,transparent 100%);
  mask:linear-gradient(to right,transparent 0,#000 8%,#000 92%,transparent 100%);
}
.ticker-track{
  display:flex;gap:36px;
  width:max-content;
  animation:spin 32s linear infinite;
}
.ti{
  display:flex;align-items:center;gap:8px;
  white-space:nowrap;font-size:11px;color:var(--ink3);
}
.ti b{color:var(--ink2);font-weight:500}
.ti-dot{width:3px;height:3px;border-radius:50%;background:var(--edge2)}

/* ══ SECCIONES COMUNES ══ */
.section{padding:96px 0;border-top:1px solid var(--edge)}
.sec-tag{
  display:block;margin-bottom:12px;
  font-size:10px;font-weight:700;letter-spacing:.10em;
  text-transform:uppercase;color:var(--ink3);
}
.sec-h2{
  font-family:'Instrument Serif',serif;
  font-size:clamp(36px,5vw,64px);
  font-weight:400;line-height:1.02;letter-spacing:-.03em;
  text-wrap:balance;
}
.sec-p{
  margin-top:16px;
  font-size:clamp(14px,1.5vw,16px);line-height:1.72;
  color:var(--ink2);text-wrap:balance;
}

/* ══ NÚMEROS ══ */
#pl-nums{
  padding:72px 0;
  border-top:1px solid var(--edge);
  background:linear-gradient(180deg,rgba(37,99,235,.028) 0%,transparent 100%);
}
.nums-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:var(--edge);
  border:1px solid var(--edge2);border-radius:16px;overflow:hidden;
}
.num-card{
  background:var(--surface);
  padding:40px 32px;
  position:relative;overflow:hidden;
}
.num-card::before{
  content:'';position:absolute;
  width:140px;height:140px;top:-40px;right:-40px;border-radius:50%;
  background:radial-gradient(ellipse,rgba(37,99,235,.10) 0%,transparent 70%);
  pointer-events:none;
}
.num-big{
  font-family:'Instrument Serif',serif;
  font-size:clamp(48px,5.5vw,72px);
  font-weight:400;letter-spacing:-.04em;line-height:1;
}
.num-label{
  margin-top:6px;
  font-size:10.5px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:var(--ink3);
}
.num-delta{font-size:12px;color:var(--green);font-weight:500;margin-top:4px}

/* ══ PROBLEMA ══ */
#pl-prob .inner{
  display:grid;grid-template-columns:1fr 1fr;
  gap:80px;align-items:start;margin-top:60px;
}
.pains{display:flex;flex-direction:column;margin-top:48px}
.pain{
  display:grid;grid-template-columns:28px 1fr;gap:16px;
  padding:22px 0;border-bottom:1px solid var(--edge);
}
.pain:first-child{border-top:1px solid var(--edge)}
.pain-n{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:14px;color:var(--ink3);text-align:right;padding-top:2px;
}
.pain h3{font-size:14px;font-weight:500;margin-bottom:5px;line-height:1.3}
.pain p{font-size:13px;line-height:1.65;color:var(--ink2)}
/* comparador sticky */
.cmp-box{
  position:sticky;top:60px;
  background:var(--surface);border:1px solid var(--edge2);
  border-radius:16px;overflow:hidden;
}
.cmp-tabs{display:flex;border-bottom:1px solid var(--edge)}
.ctab{
  flex:1;padding:12px;text-align:center;
  font-size:12px;font-weight:500;color:var(--ink3);
  cursor:pointer;border-right:1px solid var(--edge);
  transition:color .15s,background .15s;
}
.ctab:last-child{border:none}
.ctab.on{color:var(--ink);background:rgba(255,255,255,.025)}
.cpane{padding:20px;display:none}
.cpane.on{display:block}
.xr{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.034);font-size:11px}
.xc{flex:1;color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xh .xc{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink3)}
.xwarn{
  margin-top:12px;padding:10px 12px;border-radius:8px;
  background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.12);
  font-size:11px;color:#fca5a5;line-height:1.5;
  display:flex;gap:8px;align-items:flex-start;
}
.notif{
  display:flex;gap:11px;padding:11px 13px;border-radius:12px;
  background:var(--surface2);border:1px solid var(--edge2);
  margin-bottom:8px;
}
.ni{
  width:32px;height:32px;border-radius:9px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:14px;
}
.ni-b{background:rgba(37,99,235,.10);border:1px solid rgba(37,99,235,.18)}
.ni-g{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.15)}
.nt-title{font-size:12px;font-weight:500;margin-bottom:3px}
.nt-body{font-size:11px;color:var(--ink2);line-height:1.5}
.nt-time{font-size:9.5px;color:var(--ink3);margin-top:2px}
.nt-wa{
  margin-top:8px;display:inline-flex;align-items:center;gap:5px;
  padding:4px 11px;border-radius:var(--pill);
  background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.14);
  font-size:10.5px;font-weight:500;color:#4ade80;
}

/* ══ VIDEO ══ */
#pl-video .inner{
  display:grid;grid-template-columns:1fr 340px;
  gap:72px;align-items:center;margin-top:0;
}
.vwrap{
  position:relative;border-radius:16px;overflow:hidden;
  border:1px solid var(--edge2);background:var(--surface2);
  aspect-ratio:9/16;width:100%;max-width:340px;margin:0 auto;
  cursor:pointer;
  box-shadow:0 0 60px rgba(37,99,235,.08),0 20px 50px rgba(0,0,0,.35);
}
.vwrap video{width:100%;height:100%;object-fit:cover;display:block}
.v-ov{
  position:absolute;inset:0;
  background:rgba(6,7,10,.4);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  transition:opacity .2s;
}
.v-btn{
  width:60px;height:60px;border-radius:50%;background:var(--ink);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 40px rgba(0,0,0,.5);
  transition:transform .15s;
}
.v-btn:hover{transform:scale(1.08)}
.v-txt{font-size:11px;color:rgba(255,255,255,.6);font-weight:500}
.vwrap.on .v-ov{opacity:0;pointer-events:none}

/* ══ CÓMO FUNCIONA ══ */
#pl-como .inner{
  display:grid;grid-template-columns:1fr 1fr;
  gap:80px;align-items:start;margin-top:56px;
}
.steps{display:flex;flex-direction:column}
.step{
  display:grid;grid-template-columns:28px 1fr;gap:16px;
  padding:22px 0;border-bottom:1px solid var(--edge);
}
.step:first-child{border-top:1px solid var(--edge)}
.sn{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:20px;color:var(--ink3);text-align:right;padding-top:2px;flex-shrink:0;
}
.step h3{font-size:14px;font-weight:500;margin-bottom:5px;line-height:1.3}
.step p{font-size:13px;line-height:1.65;color:var(--ink2)}
.step-time{
  display:inline-flex;align-items:center;gap:4px;
  margin-top:9px;font-size:9.5px;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;color:var(--green);
}
.mp{
  position:sticky;top:60px;
  background:var(--surface);border:1px solid var(--edge2);border-radius:16px;overflow:hidden;
}
.mp-top{
  padding:13px 16px;border-bottom:1px solid var(--edge);
  display:flex;align-items:center;justify-content:space-between;
  font-size:11.5px;font-weight:500;color:var(--ink2);
}
.mp-body{padding:14px 16px}
.mp-row{
  display:flex;align-items:center;gap:9px;
  padding:9px 11px;border-radius:8px;
  background:var(--surface2);border:1px solid var(--edge);
  margin-bottom:7px;
}
.mp-av{
  width:28px;height:28px;border-radius:50%;flex-shrink:0;
  font-size:10px;color:#fff;font-weight:700;
  display:flex;align-items:center;justify-content:center;
}
.mp-name{font-size:12px;font-weight:500}
.mp-sub{font-size:9.5px;color:var(--ink3);margin-top:1px}
.mp-code{
  margin-top:11px;padding:11px 13px;border-radius:8px;
  background:rgba(0,0,0,.35);border:1px solid var(--edge);
  font-family:'Geist Mono',monospace;font-size:9.5px;color:#86efac;line-height:1.65;
}

/* ══ FEATURES BENTO ══ */
#pl-feat .bento{
  display:grid;
  grid-template-columns:repeat(12,1fr);
  gap:1px;background:var(--edge);
  border:1px solid var(--edge2);border-radius:16px;
  overflow:hidden;margin-top:48px;
}
.bc{
  background:var(--surface);padding:28px 26px;
  position:relative;overflow:hidden;transition:background .2s;
}
.bc:hover{background:var(--surface2)}
.bc1{grid-column:1/8}
.bc2{grid-column:8/13}
.bc3{grid-column:1/5}
.bc4{grid-column:5/9}
.bc5{grid-column:9/13;grid-row:2/4;display:flex;flex-direction:column}
.bc6{grid-column:1/5;grid-row:3}
.bc7{grid-column:5/9;grid-row:3}
.bc-tag{
  display:block;margin-bottom:14px;
  font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:var(--ink3);
}
.bc h3{font-size:15px;font-weight:500;letter-spacing:-.01em;margin-bottom:8px}
.bc p{font-size:13px;line-height:1.65;color:var(--ink2)}
.bc-pill{
  display:inline-flex;margin-top:14px;
  padding:4px 10px;border-radius:var(--pill);
  font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  background:rgba(245,158,11,.07);color:var(--amber);
  border:1px solid rgba(245,158,11,.12);
}
.mbars{margin-top:auto;padding-top:24px;display:flex;flex-direction:column;gap:9px}
.mbar{display:flex;align-items:center;gap:9px;font-size:11px}
.mbar-l{color:var(--ink3);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mbar-w{flex:2;height:3px;background:var(--edge2);border-radius:2px;overflow:hidden}
.mbar-f{height:100%;border-radius:2px;background:var(--blue-hi)}
.mbar-v{font-family:'Geist Mono',monospace;font-size:9.5px;font-weight:500;color:var(--ink2);min-width:20px;text-align:right}

/* ══ PRECIOS ══ */
#pl-precios .price-grid{
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:1px;background:var(--edge);
  border:1px solid var(--edge2);border-radius:16px;
  overflow:hidden;max-width:900px;margin:0 auto;
}
.pt{background:var(--surface);padding:32px 22px;position:relative;transition:background .2s}
.pt:hover{background:var(--surface2)}
.pt.feat{background:linear-gradient(160deg,rgba(37,99,235,.07) 0%,var(--surface) 50%)}
.pt-pop{
  display:inline-flex;padding:4px 10px;border-radius:var(--pill);
  margin-bottom:14px;font-size:9px;font-weight:700;letter-spacing:.07em;
  text-transform:uppercase;background:var(--blue);color:#fff;
}
.pt-tier{
  font-size:10px;font-weight:700;letter-spacing:.09em;
  text-transform:uppercase;color:var(--ink3);margin-bottom:14px;
}
.pt-price{
  font-family:'Instrument Serif',serif;
  font-size:clamp(40px,4.5vw,54px);font-weight:400;
  letter-spacing:-.04em;line-height:1;
}
.pt-price sup{font-size:18px;vertical-align:super;margin-right:1px;font-family:'Geist',sans-serif;font-weight:300}
.pt-price sub{font-size:12px;font-family:'Geist',sans-serif;font-weight:300;color:var(--ink3);vertical-align:bottom}
.pt-range{margin-top:10px;font-size:12px;color:var(--ink2);line-height:1.5}
.pt-from{
  margin-top:14px;padding-top:14px;border-top:1px solid var(--edge);
  font-size:11px;color:var(--ink3);line-height:1.6;
}
.pt-from strong{color:var(--ink2);font-weight:500}
.price-note{
  max-width:900px;margin:16px auto 0;padding:16px 20px;
  border-radius:12px;background:var(--surface);border:1px solid var(--edge2);
  font-size:13px;color:var(--ink2);line-height:1.65;
  display:flex;align-items:center;gap:12px;flex-wrap:wrap;
}
.price-note strong{color:var(--ink);font-weight:500}

/* ══ DEMO ══ */
#pl-demo .inner{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:start}
.creds{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:36px}
.cred{
  background:var(--surface);border:1px solid var(--edge2);border-radius:12px;padding:14px 16px;
}
.cred-k{
  font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:var(--ink3);margin-bottom:7px;
}
.cred-v{font-family:'Geist Mono',monospace;font-size:14.5px;font-weight:500}
.btn-o{
  display:inline-flex;align-items:center;gap:8px;
  padding:11px 22px;border-radius:var(--pill);
  border:1px solid var(--edge2);font-size:13px;color:var(--ink2);
  transition:border-color .15s,color .15s;margin-top:20px;
}
.btn-o:hover{border-color:rgba(255,255,255,.22);color:var(--ink)}
/* Demo screen */
.ds{background:var(--surface);border:1px solid var(--edge2);border-radius:16px;overflow:hidden}
.ds-top{
  padding:12px 16px;border-bottom:1px solid var(--edge);
  display:flex;align-items:center;justify-content:space-between;
  font-size:11.5px;font-weight:500;color:var(--ink2);
}
.ds-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--edge);border-bottom:1px solid var(--edge)}
.ds-s{background:var(--surface);padding:14px}
.ds-n{font-family:'Instrument Serif',serif;font-size:28px;font-weight:400;letter-spacing:-.035em;line-height:1}
.ds-l{font-size:9px;color:var(--ink3);margin-top:3px;letter-spacing:.05em;text-transform:uppercase}
.ds-d{font-size:11px;color:var(--green);margin-top:2px}
.ds-body{padding:12px 14px}
.ds-row{
  display:flex;align-items:center;gap:9px;padding:7px 0;
  border-bottom:1px solid var(--edge);
}
.ds-row:last-child{border:none}
.ds-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.dot-b{background:var(--blue-hi);box-shadow:0 0 5px var(--blue-hi)}
.dot-g{background:var(--green);box-shadow:0 0 4px var(--green)}
.dot-a{background:var(--amber)}
.ds-nm{font-size:12px;font-weight:500;flex:1}
.ds-hr{font-size:10px;color:var(--ink3)}

/* ══ FAQ ══ */
#pl-faq .inner{
  display:grid;grid-template-columns:280px 1fr;
  gap:80px;align-items:start;
}
.faq-l{position:sticky;top:60px}
.faq-items{display:flex;flex-direction:column}
details.fq{border-bottom:1px solid var(--edge)}
details.fq:first-child{border-top:1px solid var(--edge)}
.fq summary{
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:19px 0;cursor:pointer;list-style:none;
  font-size:14px;font-weight:400;line-height:1.4;user-select:none;
}
.fq summary::-webkit-details-marker{display:none}
.fq-arr{
  width:15px;height:15px;flex-shrink:0;color:var(--ink3);
  transition:transform .2s cubic-bezier(.16,1,.3,1),color .15s;
}
details[open] .fq-arr{transform:rotate(45deg);color:var(--ink2)}
.fq-a{
  padding:0 0 18px;font-size:13.5px;line-height:1.72;color:var(--ink2);
  animation:up .2s cubic-bezier(.16,1,.3,1) both;
}

/* ══ CTA FINAL ══ */
#pl-cta{
  padding:120px clamp(20px,5vw,48px);
  text-align:center;position:relative;overflow:hidden;
  border-top:1px solid var(--edge);
}
#pl-cta::before{
  content:'';position:absolute;pointer-events:none;
  width:700px;height:400px;border-radius:50%;
  background:radial-gradient(ellipse,rgba(37,99,235,.07) 0%,transparent 65%);
  top:50%;left:50%;transform:translate(-50%,-50%);
}
.cta-h{
  font-family:'Instrument Serif',serif;
  font-size:clamp(44px,7vw,88px);
  font-weight:400;line-height:.97;letter-spacing:-.04em;
  max-width:820px;margin:0 auto 20px;text-wrap:balance;
}
.cta-h em{font-style:italic;color:var(--ink2)}
.cta-sub{
  font-size:clamp(15px,1.5vw,17px);line-height:1.7;
  color:var(--ink2);max-width:420px;margin:0 auto 44px;
}
.cta-micro{
  display:flex;align-items:center;justify-content:center;
  gap:20px;flex-wrap:wrap;margin-top:28px;
}
.cta-mi{font-size:12px;color:var(--ink3);display:flex;align-items:center;gap:5px}
.cta-mi::before{content:'✓';color:var(--green);font-size:11px}
.cta-tel{margin-top:14px;font-size:12px;color:var(--ink3)}

/* ══ FOOTER ══ */
#pl-foot{
  padding:24px clamp(20px,5vw,48px);
  border-top:1px solid var(--edge);
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;
}
.foot-l{font-size:12px;color:var(--ink3)}
.foot-l a:hover{color:var(--ink2)}
.foot-r{font-size:11px;color:var(--ink3);display:flex;gap:14px;flex-wrap:wrap}

/* ══ FLOAT WA ══ */
.wa-f{
  position:fixed;bottom:20px;right:20px;z-index:800;
  display:flex;align-items:center;gap:8px;
  padding:11px 20px;border-radius:var(--pill);
  background:#25D366;color:#fff;
  font-size:13px;font-weight:600;
  box-shadow:0 4px 24px rgba(37,211,102,.3);
  transition:transform .12s,box-shadow .15s;
  animation:up .6s 1.6s cubic-bezier(.16,1,.3,1) both;
}
.wa-f:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(37,211,102,.4)}
.wa-f:active{transform:scale(.96)}

/* ══════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════ */

/* ── 960px: colapsa grids 2-col ── */
@media(max-width:960px){
  .hero-grid{grid-template-columns:1fr;gap:0}
  .hero-copy{padding-top:52px;padding-bottom:40px;padding-right:0}
  .hero-panel{display:none} /* panel demo solo desktop */

  #pl-prob .inner{grid-template-columns:1fr;gap:48px}
  .cmp-box{position:static}
  #pl-video .inner{grid-template-columns:1fr;gap:36px}
  #pl-como .inner{grid-template-columns:1fr;gap:36px}
  .mp{position:static;display:none}
  #pl-demo .inner{grid-template-columns:1fr;gap:36px}
  #pl-faq .inner{grid-template-columns:1fr;gap:36px}
  .faq-l{position:static}

  #pl-feat .bento{grid-template-columns:1fr 1fr}
  .bc1,.bc2,.bc3,.bc4,.bc5,.bc6,.bc7{grid-column:auto;grid-row:auto}
  .bc1{grid-column:1/-1}

  #pl-precios .price-grid{grid-template-columns:1fr 1fr}
  .nums-grid{grid-template-columns:repeat(3,1fr)}
  .section{padding:72px 0}
}

/* ── 600px: mobile puro ── */
@media(max-width:600px){
  /* Nav: solo logo + CTA */
  .nl{display:none}

  /* Hero: solo copy, sin panel */
  .hero-copy{padding-top:40px;padding-bottom:48px}
  .hero-h1{font-size:clamp(48px,13vw,66px);letter-spacing:-.03em;line-height:.97}
  .hero-p{font-size:15px;margin-top:18px}
  .hero-stats{margin-top:28px;gap:0}
  .hs{padding:0 18px 0 0}
  .hs+.hs{padding-left:18px}
  .hs-n{font-size:clamp(28px,9vw,40px)}
  .hs-l{font-size:9px}
  .hero-ctas{flex-direction:column;gap:11px;margin-top:28px}
  .btn-p{width:100%;justify-content:center;padding:17px 24px;font-size:15px}
  .btn-g{width:100%;justify-content:center;padding:15px 24px;font-size:14px}
  .hero-agencies{margin-top:22px}

  /* Secciones */
  .section{padding:64px 0}
  .sec-h2{font-size:clamp(30px,9vw,44px)}
  .sec-p{font-size:14px}

  /* Números 1-col */
  .nums-grid{grid-template-columns:1fr}
  .num-card{padding:28px 22px}
  .num-big{font-size:clamp(52px,15vw,72px)}

  /* Bento 1-col */
  #pl-feat .bento{grid-template-columns:1fr}
  .bc1{grid-column:1}

  /* Pricing 1-col */
  #pl-precios .price-grid{grid-template-columns:1fr;max-width:340px}
  .price-note{flex-direction:column;gap:6px}

  /* Demo creds 1-col */
  .creds{grid-template-columns:1fr}
  .ds-stats{grid-template-columns:1fr 1fr}
  .ds-s:last-child{grid-column:1/-1}

  /* FAQ */
  .fq summary{font-size:13.5px;padding:16px 0}

  /* CTA */
  .cta-h{font-size:clamp(38px,11vw,54px)}
  .cta-sub{font-size:15px}
  .cta-micro{gap:14px}

  /* Float WA */
  .wa-f{bottom:16px;right:16px;padding:10px 16px;font-size:12px}
}

/* ── 380px: muy pequeño ── */
@media(max-width:380px){
  .hero-h1{font-size:clamp(42px,12.5vw,52px)}
  .hs{padding:0 14px 0 0}
  .hs+.hs{padding-left:14px}
}
      `}} />

      <div id="pl">

        {/* ═══ NAV ═══ */}
        <nav>
          <div className="g nav-row">
            <a href="/" className="nav-brand">
              <span className="nav-pulse" />
              Agentia
            </a>
            <div className="nav-right">
              <a href="#pl-nums"    className="nl">Resultados</a>
              <a href="#pl-precios" className="nl">Precios</a>
              <a href="#pl-demo"    className="nl">Demo</a>
              <a
                href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads"
                className="na" target="_blank" rel="noopener noreferrer"
              >
                Agendar demo
              </a>
            </div>
          </div>
        </nav>

        {/* ═══ HERO ═══ */}
        <section id="pl-hero">
          <div className="g hero-grid">

            {/* Copy */}
            <div className="hero-copy">
              <div className="hero-tag">
                <span className="hero-tag-dot" />
                <span>Panel de leads · marca blanca para agencias</span>
              </div>

              <h1 className="hero-h1">
                Tus clientes<br />
                ven sus leads.<br />
                <em>Al instante.</em>
              </h1>

              <p className="hero-p">
                Panel con tu marca para agencias de Facebook Ads. Cada lead llega al celular de tu cliente en segundos — con nombre, número y un tap para contactar.
              </p>

              <div className="hero-stats">
                <div className="hs">
                  <div className="hs-n">+15k</div>
                  <div className="hs-l">Leads gestionados</div>
                </div>
                <div className="hs">
                  <div className="hs-n">+3,700</div>
                  <div className="hs-l">Último mes</div>
                </div>
                <div className="hs">
                  <div className="hs-n">24 h</div>
                  <div className="hs-l">Primer panel</div>
                </div>
              </div>

              <div className="hero-ctas">
                <a
                  href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads"
                  className="btn-p" target="_blank" rel="noopener noreferrer"
                >
                  <WaIcon s={13} /> Agendar demo
                </a>
                <a href="#pl-demo" className="btn-g">Ver panel demo →</a>
              </div>

              <div className="hero-agencies">
                <span className="ag-pill">Puntillo Agency</span>
                <span className="ag-pill">Nexo Digital</span>
                <span className="ag-pill">Rojo Tráfico</span>
                <span className="ag-more">+49 agencias más</span>
              </div>
            </div>

            {/* Panel demo — solo desktop */}
            <div className="hero-panel">
              <div className="browser">
                <div className="browser-bar">
                  <div className="b-dots">
                    <span className="b-dot bd-r"/><span className="b-dot bd-y"/><span className="b-dot bd-g"/>
                  </div>
                  <span className="b-url">agentia.software / panel · demo-agencia</span>
                </div>
                <div className="panel-body">
                  <nav className="p-side">
                    <span className="p-sec-label">Panel</span>
                    <div className="p-item on"><span className="p-dot"/>Leads</div>
                    <div className="p-item"><span className="p-dot"/>Clientes</div>
                    <div className="p-item"><span className="p-dot"/>WhatsApp</div>
                    <span className="p-sec-label">Reportes</span>
                    <div className="p-item"><span className="p-dot"/>Campañas</div>
                    <div className="p-item"><span className="p-dot"/>Resultados</div>
                  </nav>
                  <div className="p-main">
                    <div className="p-top">
                      <span className="p-title">Leads — hoy</span>
                      <div className="p-chips">
                        <span className="chip chip-live">En vivo</span>
                        <span className="chip chip-date">Nov 2026</span>
                      </div>
                    </div>
                    <table className="lt">
                      <thead>
                        <tr><th>Nombre</th><th>Campaña</th><th>Hora</th><th>Estado</th><th/></tr>
                      </thead>
                      <tbody id="pl-leads-body">
                        {LEADS.map(r => (
                          <tr key={r.n}>
                            <td><div className="ld-name">{r.n}</div><div className="ld-time">ahora</div></td>
                            <td style={{fontSize:'10px',color:'var(--ink2)'}}>{r.c}</td>
                            <td style={{fontSize:'10px',color:'var(--ink3)'}}>09:41</td>
                            <td><span className={`badge ${r.b}`}>{r.bl}</span></td>
                            <td><span className="wa-call"><WaIcon s={9}/>Llamar</span></td>
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
              {['Restaurante El Fogón · ahora','Clínica DentalPro · 1 min','Gym PowerFit · 2 min','Academia de Inglés · 4 min','Inmobiliaria Sur · 6 min','Autoservicio Mérida · 8 min'].flatMap((t,i)=>[
                <span key={`a${i}`} className="ti"><b>Lead nuevo</b> · {t}<span className="ti-dot"/></span>,
                <span key={`b${i}`} className="ti"><b>Contactado</b> · {t}<span className="ti-dot"/></span>,
              ])}
            </div>
          </div>
        </section>

        {/* ═══ NÚMEROS ═══ */}
        <section id="pl-nums">
          <div className="g">
            <span className="sec-tag rv">Producto en uso real</span>
            <div className="nums-grid" style={{marginTop:'24px'}}>
              {[
                {n:'+15,000',l:'Leads procesados',    d:'↑ en curso'},
                {n:'+3,700', l:'Últimos 30 días',     d:'↑ mes activo'},
                {n:'52',     l:'Negocios activos hoy',d:'↑ este mes'},
              ].map((s,i) => (
                <div key={s.l} className={`num-card rv${i?' d'+i:''}`}>
                  <div className="num-big">{s.n}</div>
                  <div className="num-label">{s.l}</div>
                  <div className="num-delta">{s.d}</div>
                </div>
              ))}
            </div>
            <p className="sec-p rv d2" style={{maxWidth:'600px',marginTop:'24px'}}>
              Restaurantes, clínicas, gimnasios y escuelas en México que usan el panel para dar seguimiento a sus prospectos de Facebook Ads — sin depender de un Excel ni de su agencia para ver qué llegó.
            </p>
          </div>
        </section>

        {/* ═══ PROBLEMA ═══ */}
        <section id="pl-prob" className="section">
          <div className="g">
            <span className="sec-tag rv">El problema</span>
            <h2 className="sec-h2 rv d1">Tu agencia trabaja bien.<br/>Los leads llegan mal.</h2>
            <div className="inner">
              <div>
                <p className="sec-p rv d2">El trafficker optimiza. Las campañas convierten. Y después de todo eso, el lead le llega al cliente una semana después en un Excel.</p>
                <div className="pains">
                  {[
                    {n:'01',t:'Excel desactualizado',         p:'Exportas leads a mano. El cliente pregunta cuántos llegaron ayer y tú buscas el archivo.'},
                    {n:'02',t:'Screenshots por WhatsApp',     p:'Mandas capturas del Ads Manager. El cliente no sabe qué significa CTR ni le importa.'},
                    {n:'03',t:'Lead frío al día siguiente',   p:'Llegó a las 3pm. Tu cliente lo vio el lunes. Para entonces ya compró con la competencia.'},
                    {n:'04',t:'Automatizaciones que se rompen',p:'Zapier caído, leads perdidos. Y cuando falla, la culpa la carga la agencia.'},
                  ].map((item,i) => (
                    <div key={item.n} className={`pain rv${i?' d'+i:''}`}>
                      <span className="pain-n">{item.n}</span>
                      <div>
                        <h3>{item.t}</h3>
                        <p>{item.p}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rv d2">
                <div className="cmp-box">
                  <div className="cmp-tabs">
                    <div className="ctab on" id="ct0" onClick={()=>{['ct0','ct1'].forEach(id=>document.getElementById(id)?.classList.remove('on'));['cp0','cp1'].forEach(id=>document.getElementById(id)?.classList.remove('on'));document.getElementById('ct0')?.classList.add('on');document.getElementById('cp0')?.classList.add('on')}}>Sin panel</div>
                    <div className="ctab"    id="ct1" onClick={()=>{['ct0','ct1'].forEach(id=>document.getElementById(id)?.classList.remove('on'));['cp0','cp1'].forEach(id=>document.getElementById(id)?.classList.remove('on'));document.getElementById('ct1')?.classList.add('on');document.getElementById('cp1')?.classList.add('on')}}>Con panel</div>
                  </div>
                  <div className="cpane on" id="cp0">
                    <div className="xr xh"><span className="xc">Nombre</span><span className="xc">Tel</span><span className="xc">Fecha</span><span className="xc">Status</span></div>
                    {['María G.','Carlos M.','Ana P.'].map(n=>(
                      <div key={n} className="xr">
                        <span className="xc">{n}</span>
                        <span className="xc" style={{color:'var(--ink3)'}}>—</span>
                        <span className="xc" style={{color:'var(--ink3)'}}>28/oct</span>
                        <span className="xc" style={{color:'var(--ink3)'}}>pendiente</span>
                      </div>
                    ))}
                    <div className="xwarn">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:'1px'}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      8 días sin contactar. El cliente no sabe que llegaron.
                    </div>
                  </div>
                  <div className="cpane" id="cp1">
                    <div className="notif">
                      <div className="ni ni-b">🔔</div>
                      <div>
                        <div className="nt-title">Lead nuevo — María González</div>
                        <div className="nt-body">Promo Verano · +52 999 123 4567</div>
                        <div className="nt-time">hace 4 segundos</div>
                        <div className="nt-wa"><WaIcon s={10}/>Llamar ahora</div>
                      </div>
                    </div>
                    <div className="notif">
                      <div className="ni ni-g">✓</div>
                      <div>
                        <div className="nt-title">Carlos Mendoza — Contactado</div>
                        <div className="nt-body">respondido en 3 min</div>
                        <div className="nt-time">hace 11 minutos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ VIDEO ═══ */}
        <section id="pl-video" className="section">
          <div className="g">
            <div className="inner" style={{marginTop:'0',gap:'72px',alignItems:'center'}}>
              <div>
                <span className="sec-tag rv">En acción</span>
                <h2 className="sec-h2 rv d1">Míralo en<br/>60 segundos.</h2>
                <p className="sec-p rv d2" style={{maxWidth:'380px'}}>El panel funcionando. Sin demo fabricada — el mismo que usan las 52 agencias activas hoy.</p>
                <div style={{marginTop:'32px'}} className="rv d3">
                  <a href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads" className="btn-p" target="_blank" rel="noopener noreferrer" style={{fontSize:'14px'}}>
                    <WaIcon s={13}/> Agendar demo
                  </a>
                </div>
              </div>
              <div className="vwrap rv d2" id="pl-vw">
                <video id="pl-vid" src="/anuncio-agentia-MX-subtitulado.mp4" preload="metadata" playsInline />
                <div className="v-ov" id="pl-vov">
                  <div className="v-btn" id="pl-vbtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--canvas)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <span className="v-txt">Ver video · 60 seg</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CÓMO FUNCIONA ═══ */}
        <section id="pl-como" className="section">
          <div className="g">
            <span className="sec-tag rv">Cómo funciona</span>
            <h2 className="sec-h2 rv d1">Tres pasos.<br/>Listo en 24 horas.</h2>
            <div className="inner">
              <div className="steps">
                {[
                  {n:'1',t:'Conectas la campaña',       p:'Enlazas el formulario de Facebook Ads. Menos de 5 minutos.',time:'⏱ 5 min'},
                  {n:'2',t:'Tu cliente recibe su acceso',p:'Le mandas un link. Entra al panel con tu logo. No ve nada de Agentia.',time:'⏱ 24 h después del alta'},
                  {n:'3',t:'Leads en tiempo real',       p:'Cada lead dispara una notificación push. Un tap abre WhatsApp con el número del prospecto.',time:'⏱ segundos por lead'},
                ].map((s,i)=>(
                  <div key={s.n} className={`step rv${i?' d'+i:''}`}>
                    <span className="sn">{s.n}</span>
                    <div>
                      <h3>{s.t}</h3>
                      <p>{s.p}</p>
                      <span className="step-time">{s.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mp rv d2">
                <div className="mp-top">
                  <span>Panel maestro — clientes activos</span>
                  <span className="chip chip-live">En vivo</span>
                </div>
                <div className="mp-body">
                  {[
                    {av:'RF',n:'Restaurante El Fogón',s:'14 leads · hoy',bg:'linear-gradient(135deg,#2563eb,#60a5fa)',b:'b-new',bl:'Activo'},
                    {av:'DP',n:'Clínica DentalPro',   s:'8 leads · hoy', bg:'linear-gradient(135deg,#16a34a,#4ade80)',b:'b-won',bl:'Activo'},
                    {av:'GP',n:'Gym PowerFit',         s:'22 leads · hoy',bg:'linear-gradient(135deg,#d97706,#fbbf24)',b:'b-hot',bl:'Activo'},
                  ].map(r=>(
                    <div key={r.av} className="mp-row">
                      <div className="mp-av" style={{background:r.bg}}>{r.av}</div>
                      <div><div className="mp-name">{r.n}</div><div className="mp-sub">{r.s}</div></div>
                      <span className={`badge ${r.b}`} style={{marginLeft:'auto',fontSize:'8.5px'}}>{r.bl}</span>
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
        <section id="pl-feat" className="section">
          <div className="g">
            <span className="sec-tag rv">Funciones</span>
            <h2 className="sec-h2 rv d1">Todo lo que necesita<br/>tu agencia para escalar.</h2>
            <div className="bento rv d2">
              <div className="bc bc1">
                <span className="bc-tag">Marca blanca</span>
                <h3>Tu marca, no la nuestra</h3>
                <p>El panel lleva tu logo y el nombre de tu agencia. El cliente nunca ve "Agentia". Tú eres el proveedor de tecnología.</p>
              </div>
              <div className="bc bc2">
                <span className="bc-tag">Notificaciones</span>
                <h3>Push al celular</h3>
                <p>Vibra en el momento exacto que llega el lead. Sin abrir apps, sin esperar reportes semanales.</p>
              </div>
              <div className="bc bc3">
                <span className="bc-tag">Pipeline</span>
                <h3>Seguimiento de ventas</h3>
                <p>Nuevo → Seguimiento → Interesado → Vendido. El cliente actualiza el estatus y tú ves qué campañas convierten.</p>
              </div>
              <div className="bc bc4">
                <span className="bc-tag">PWA · Sin App Store</span>
                <h3>Se instala desde el navegador</h3>
                <p>Android e iPhone, 2 taps. Funciona como app nativa sin descargas.</p>
              </div>
              <div className="bc bc5">
                <span className="bc-tag">Panel maestro</span>
                <h3>Todos tus clientes, una vista</h3>
                <p>Ves qué paneles están activos, cuántos leads llegaron hoy y qué cuentas necesitan atención.</p>
                <div className="mbars">
                  {[{l:'El Fogón',w:'78%',v:'14'},{l:'DentalPro',w:'52%',v:'8'},{l:'PowerFit',w:'95%',v:'22'},{l:'Inglés Pro',w:'36%',v:'6'}].map(b=>(
                    <div key={b.l} className="mbar">
                      <span className="mbar-l">{b.l}</span>
                      <div className="mbar-w"><div className="mbar-f" style={{width:b.w}}/></div>
                      <span className="mbar-v">{b.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bc bc6">
                <span className="bc-tag">API oficial · WhatsApp Business</span>
                <h3>Bandeja de WhatsApp</h3>
                <p>Integración con la API oficial de WhatsApp Business. Responde conversaciones desde el mismo panel.</p>
                <span className="bc-pill">Add-on disponible</span>
              </div>
              <div className="bc bc7">
                <span className="bc-tag">Soporte</span>
                <h3>Humano, por WhatsApp</h3>
                <p>No hay bot — hablas con la persona que configuró tu cuenta.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PRECIOS ═══ */}
        <section id="pl-precios" className="section">
          <div className="g">
            <div style={{textAlign:'center',marginBottom:'48px'}}>
              <span className="sec-tag rv">Precios</span>
              <h2 className="sec-h2 rv d1">Paga por paneles activos.<br/>Escala sin límite.</h2>
              <p className="sec-p rv d2" style={{margin:'16px auto 0',textAlign:'center',maxWidth:'400px'}}>Por panel al mes. Entre más clientes, menos pagas por cada uno.</p>
            </div>
            <div className="price-grid rv d2">
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
                <div className="pt-price"><sup>$</sup>8<span style={{fontSize:'.55em',fontWeight:300,fontFamily:'Geist,sans-serif'}}>.50</span><sub> usd</sub></div>
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
            <div className="price-note rv d3">
              <span>¿Cuánto cuesta <strong>no tener panel</strong>? Zapier (~$50/mes) + tiempo de exportar Excels + leads perdidos.</span>
              <span style={{color:'var(--ink)',fontWeight:500}}>$10 por cliente activo al mes es menos que un café a la semana.</span>
            </div>
            <div style={{textAlign:'center',marginTop:'28px'}} className="rv d4">
              <a href="https://wa.me/529844927769?text=Quiero%20cotizar%20el%20Panel%20de%20Leads" className="btn-p" style={{fontSize:'14px',display:'inline-flex'}} target="_blank" rel="noopener noreferrer">
                Cotizar por WhatsApp
              </a>
              <p style={{marginTop:'11px',fontSize:'12px',color:'var(--ink3)'}}>Sin contrato anual · Sin prueba gratis · Activo en 24 horas</p>
            </div>
          </div>
        </section>

        {/* ═══ DEMO ═══ */}
        <section id="pl-demo" className="section">
          <div className="g">
            <div className="inner">
              <div>
                <span className="sec-tag rv">Demo</span>
                <h2 className="sec-h2 rv d1">Entra ahora.<br/>Sin registrarte.</h2>
                <p className="sec-p rv d2">Panel de demostración con datos reales de prueba.</p>
                <div className="creds rv d2">
                  <div className="cred"><div className="cred-k">Usuario</div><div className="cred-v">demo-agencia</div></div>
                  <div className="cred"><div className="cred-k">Contraseña</div><div className="cred-v">demo2026</div></div>
                </div>
                <a href="/agentia-panel?demo=1" className="btn-o rv d3" target="_blank" rel="noopener noreferrer">
                  Abrir panel demo
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
              <div className="ds rv d2">
                <div className="ds-top">
                  <span>Resumen del día</span>
                  <span className="chip chip-date">demo-agencia</span>
                </div>
                <div className="ds-stats">
                  <div className="ds-s"><div className="ds-n">47</div><div className="ds-l">Leads hoy</div><div className="ds-d">↑ +12</div></div>
                  <div className="ds-s"><div className="ds-n">23%</div><div className="ds-l">Contacto</div><div className="ds-d">↑ vs 18%</div></div>
                  <div className="ds-s"><div className="ds-n">4</div><div className="ds-l">Paneles</div><div className="ds-d">estable</div></div>
                </div>
                <div className="ds-body">
                  {[{dot:'dot-b',n:'María González',h:'09:41'},{dot:'dot-g',n:'Carlos Mendoza',h:'09:35'},{dot:'dot-a',n:'Ana Pérez',h:'09:23'},{dot:'dot-b',n:'Luis Ramírez',h:'09:10'}].map(r=>(
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
        <section id="pl-faq" className="section">
          <div className="g">
            <div className="inner">
              <div className="faq-l">
                <span className="sec-tag rv">FAQ</span>
                <h2 className="sec-h2 rv d1">Preguntas<br/>frecuentes.</h2>
                <p className="sec-p rv d2">Las que llegan antes de contratar.</p>
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
                      <svg className="fq-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    </summary>
                    <div className="fq-a">{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section id="pl-cta">
          <h2 className="cta-h rv">¿Lista tu agencia para<br/>dejar de mandar <em>Excels?</em></h2>
          <p className="cta-sub rv d1">Una demo en vivo con tus datos, no un genérico.</p>
          <a
            href="https://wa.me/529844927769?text=Quiero%20agendar%20demo%20del%20Panel%20de%20Leads"
            className="btn-p rv d2"
            style={{fontSize:'15px',padding:'17px 38px',display:'inline-flex'}}
            target="_blank" rel="noopener noreferrer"
          >
            <WaIcon s={14}/> Agendar demo por WhatsApp
          </a>
          <div className="cta-micro rv d3">
            <span className="cta-mi">Sin contrato anual</span>
            <span className="cta-mi">Activo en 24 horas</span>
            <span className="cta-mi">API oficial WhatsApp Business</span>
            <span className="cta-mi">Tu marca, no la nuestra</span>
          </div>
          <p className="cta-tel rv d4">+52 984 492 7769 · Respondemos en menos de 2 horas</p>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer id="pl-foot">
          <div className="foot-l">© 2026 <a href="https://agentia.software">Agentia Software</a> · <a href="/legal">Privacidad</a></div>
          <div className="foot-r"><span>panel de leads facebook ads</span><span>crm para agencias</span></div>
        </footer>

        {/* ═══ FLOAT WA ═══ */}
        <a href="https://wa.me/529844927769?text=Info%20Panel%20de%20Leads" className="wa-f" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z"/></svg>
          WhatsApp
        </a>

        {/* ═══ SCRIPTS ═══ */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Scroll reveal
          (function(){
            var o=new IntersectionObserver(function(entries){
              entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');o.unobserve(e.target)}});
            },{threshold:0.07,rootMargin:'0px 0px -20px 0px'});
            document.querySelectorAll('.rv').forEach(function(el){o.observe(el)});
          })();

          // Video
          (function(){
            var vid=document.getElementById('pl-vid');
            var wrap=document.getElementById('pl-vw');
            if(!vid)return;
            document.getElementById('pl-vbtn').onclick=function(){vid.play();wrap.classList.add('on')};
            vid.onclick=function(){if(vid.paused){vid.play();wrap.classList.add('on')}else{vid.pause();wrap.classList.remove('on')}};
            vid.onended=function(){wrap.classList.remove('on')};
          })();

          // Live leads simulator
          (function(){
            var NAMES=['Roberto A.','Sofía L.','Miguel T.','Carmen V.','Diego F.','Valeria S.','Héctor R.','Laura M.'];
            var CAMPS=['Promo Verano','Remarketing','Video Ads','Nuevos clientes'];
            var BADGES=[['b-new','Nuevo'],['b-trk','Seguimiento'],['b-hot','Interesado']];
            function pad(n){return n<10?'0'+n:n}
            function run(){
              var tbody=document.getElementById('pl-leads-body');
              if(!tbody)return;
              var rows=tbody.querySelectorAll('tr');
              if(rows.length>=5)tbody.removeChild(rows[rows.length-1]);
              var n=NAMES[Math.floor(Math.random()*NAMES.length)];
              var c=CAMPS[Math.floor(Math.random()*CAMPS.length)];
              var b=BADGES[Math.floor(Math.random()*BADGES.length)];
              var now=new Date();
              var h=pad(now.getHours())+':'+pad(now.getMinutes());
              var tr=document.createElement('tr');
              tr.className='row-new';
              tr.innerHTML='<td><div class="ld-name">'+n+'</div><div class="ld-time">ahora</div></td>'
                +'<td style="font-size:10px;color:var(--ink2)">'+c+'</td>'
                +'<td style="font-size:10px;color:var(--ink3)">'+h+'</td>'
                +'<td><span class="badge '+b[0]+'">'+b[1]+'</span></td>'
                +'<td><span class="wa-call">Llamar</span></td>';
              tbody.insertBefore(tr,tbody.firstChild);
            }
            setInterval(run,5200);
          })();
        `}} />

      </div>
    </>
  );
}
