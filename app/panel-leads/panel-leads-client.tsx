'use client';

/* ═══════════════════════════════════════════════
   AGENTIA · PANEL DE LEADS · v5
   Estilo: figmaformotion — imagen full-bleed hero,
   tipografía centrada gigante, botones grandes,
   tarjetas con imagen real, animaciones CSS.
   ═══════════════════════════════════════════════ */

const WaIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z"/>
  </svg>
);

export default function PanelLeadsContent() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Inter:wght@300;400;500;600&display=swap');

/* ── reset ── */
#pl,#pl *,#pl *::before,#pl *::after{box-sizing:border-box;margin:0;padding:0}
#pl a{color:inherit;text-decoration:none}

/* ── tokens ── */
#pl{
  --lime:#aaff00;
  --lime2:#c8ff47;
  --blue:#00c8ff;
  --neon:#00ffb3;
  --bg:#04050a;
  --card:#0c0e14;
  --edge:rgba(255,255,255,.07);
  --edge2:rgba(170,255,0,.18);
  --ink:#ffffff;
  --ink2:rgba(255,255,255,.60);
  --ink3:rgba(255,255,255,.32);
  --r:16px;
  font-family:'Inter',system-ui,sans-serif;
  background:var(--bg);
  color:var(--ink);
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}

/* ── animaciones ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes ticker{to{transform:translateX(-50%)}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes pulse-ring{0%{transform:scale(.9);opacity:.6}100%{transform:scale(1.6);opacity:0}}
@keyframes spin-slow{to{transform:rotate(360deg)}}
@keyframes count-up{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}

.a1{animation:fadeUp .7s .05s cubic-bezier(.16,1,.3,1) both}
.a2{animation:fadeUp .7s .15s cubic-bezier(.16,1,.3,1) both}
.a3{animation:fadeUp .7s .25s cubic-bezier(.16,1,.3,1) both}
.a4{animation:fadeUp .7s .35s cubic-bezier(.16,1,.3,1) both}
.a5{animation:fadeUp .7s .45s cubic-bezier(.16,1,.3,1) both}

/* ── NAV ── */
#pl nav{
  position:fixed;inset:0 0 auto;z-index:900;
  height:56px;
  display:flex;align-items:center;
  padding:0 24px;
  background:rgba(4,5,10,.75);
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
  border-bottom:1px solid var(--edge);
}
.nav-in{width:100%;max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.nav-logo{
  font-family:'Unbounded',sans-serif;font-size:14px;font-weight:700;
  display:flex;align-items:center;gap:8px;
}
.nav-dot{width:7px;height:7px;border-radius:50%;background:var(--lime);box-shadow:0 0 10px var(--lime);animation:glow 2s infinite}
.nav-links{display:flex;align-items:center;gap:4px}
.nl{padding:7px 14px;border-radius:999px;font-size:13px;color:var(--ink2);transition:color .15s,background .15s}
.nl:hover{color:var(--ink);background:rgba(255,255,255,.06)}
.nav-cta{
  padding:9px 20px;border-radius:999px;
  background:var(--lime);color:#04050a;
  font-size:13px;font-weight:700;
  font-family:'Unbounded',sans-serif;
  letter-spacing:-.01em;
  transition:transform .12s,box-shadow .15s;
}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(170,255,0,.3)}

/* ── HERO ── */
#pl-hero{
  position:relative;
  min-height:100svh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;
  overflow:hidden;
  padding:80px 24px 60px;
}
/* imagen de fondo */
.hero-bg{
  position:absolute;inset:0;z-index:0;
  background:url('/hero-tech.jpg') center center/cover no-repeat;
  opacity:.18;
}
.hero-bg::after{
  content:'';position:absolute;inset:0;
  background:
    linear-gradient(to bottom, var(--bg) 0%, transparent 25%, transparent 70%, var(--bg) 100%),
    linear-gradient(to right, var(--bg) 0%, transparent 20%, transparent 80%, var(--bg) 100%);
}
/* partículas neon decorativas */
.hero-orb{
  position:absolute;border-radius:50%;pointer-events:none;
  animation:glow 3s infinite;
}
.orb1{width:300px;height:300px;top:10%;left:-80px;background:radial-gradient(circle,rgba(0,200,255,.12) 0%,transparent 65%)}
.orb2{width:400px;height:400px;bottom:0%;right:-100px;background:radial-gradient(circle,rgba(170,255,0,.09) 0%,transparent 65%)}

.hero-inner{position:relative;z-index:1;max-width:860px;width:100%}

/* tag */
.hero-tag{
  display:inline-flex;align-items:center;gap:8px;
  padding:6px 16px;border-radius:999px;
  background:rgba(170,255,0,.08);border:1px solid rgba(170,255,0,.22);
  font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  color:var(--lime2);margin-bottom:28px;
}
.htag-dot{width:5px;height:5px;border-radius:50%;background:var(--lime);box-shadow:0 0 8px var(--lime);animation:glow 1.6s infinite}

/* headline GIGANTE centrado */
.hero-h1{
  font-family:'Unbounded',sans-serif;
  font-size:clamp(44px,10vw,112px);
  font-weight:900;
  line-height:.93;
  letter-spacing:-.04em;
  text-transform:uppercase;
  margin-bottom:28px;
}
/* efecto shimmer en la palabra clave */
.hero-shine{
  background:linear-gradient(90deg,var(--ink) 20%,var(--lime) 50%,var(--blue) 65%,var(--ink) 80%);
  background-size:200% auto;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:shimmer 4s linear infinite;
}

.hero-p{
  font-size:clamp(15px,2vw,19px);
  line-height:1.65;color:var(--ink2);
  max-width:520px;margin:0 auto 40px;
}

/* BOTONES estilo figmaformotion — anchos, con ícono */
.hero-btns{
  display:flex;flex-direction:column;gap:14px;
  align-items:center;width:100%;max-width:400px;margin:0 auto 48px;
}
.btn-main{
  display:flex;align-items:center;gap:14px;
  width:100%;padding:18px 28px;border-radius:999px;
  background:var(--lime);color:#04050a;
  font-family:'Unbounded',sans-serif;font-size:15px;font-weight:700;
  letter-spacing:-.01em;
  transition:transform .12s cubic-bezier(.16,1,.3,1),box-shadow .15s;
}
.btn-main:hover{transform:translateY(-2px) scale(1.01);box-shadow:0 12px 40px rgba(170,255,0,.35)}
.btn-main:active{transform:scale(.97)}
.btn-icon{
  width:38px;height:38px;border-radius:50%;
  background:#04050a;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
}
.btn-label{flex:1;text-align:left}

.btn-sec{
  display:flex;align-items:center;gap:14px;
  width:100%;padding:18px 28px;border-radius:999px;
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.12);
  font-size:15px;font-weight:500;color:var(--ink2);
  transition:border-color .15s,color .15s,background .15s;
}
.btn-sec:hover{border-color:rgba(255,255,255,.25);color:var(--ink);background:rgba(255,255,255,.08)}
.btn-sec-icon{
  width:38px;height:38px;border-radius:50%;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.12);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;font-size:16px;
}

/* stats hero */
.hero-stats{
  display:flex;justify-content:center;gap:0;flex-wrap:wrap;
}
.hs{padding:0 28px}
.hs+.hs{border-left:1px solid var(--edge)}
.hs-n{
  font-family:'Unbounded',sans-serif;
  font-size:clamp(28px,5vw,46px);
  font-weight:900;line-height:1;
  color:var(--lime2);
  animation:count-up .6s cubic-bezier(.16,1,.3,1) both;
}
.hs-l{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3);margin-top:5px}

/* ── TICKER ── */
.ticker{
  background:rgba(170,255,0,.04);
  border-top:1px solid rgba(170,255,0,.1);
  border-bottom:1px solid rgba(170,255,0,.1);
  padding:12px 0;overflow:hidden;
  -webkit-mask:linear-gradient(to right,transparent,#000 10%,#000 90%,transparent);
  mask:linear-gradient(to right,transparent,#000 10%,#000 90%,transparent);
}
.ticker-track{display:flex;gap:40px;width:max-content;animation:ticker 30s linear infinite}
.ti{display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:11px;color:var(--ink3)}
.ti b{color:var(--lime2);font-weight:600}
.ti-sep{color:rgba(170,255,0,.3)}

/* ── SECCIÓN BASE ── */
.sec{padding:96px 24px;text-align:center}
.sec-inner{max-width:1080px;margin:0 auto}
.sec-tag{
  display:inline-block;margin-bottom:16px;
  font-size:10px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;
  color:var(--lime2);
}
.sec-h2{
  font-family:'Unbounded',sans-serif;
  font-size:clamp(32px,6vw,72px);
  font-weight:900;line-height:.95;letter-spacing:-.035em;text-transform:uppercase;
  margin-bottom:20px;text-wrap:balance;
}
.sec-p{
  font-size:clamp(15px,1.6vw,18px);line-height:1.7;
  color:var(--ink2);max-width:520px;margin:0 auto;text-wrap:balance;
}

/* ── CARDS GRID ── */
.cards{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:16px;margin-top:52px;text-align:left;
}
.card{
  background:var(--card);
  border:1px solid var(--edge);
  border-radius:var(--r);
  overflow:hidden;
  transition:transform .2s cubic-bezier(.16,1,.3,1),border-color .2s;
  position:relative;
}
.card:hover{transform:translateY(-4px);border-color:rgba(170,255,0,.2)}
.card-img{
  width:100%;aspect-ratio:16/9;
  object-fit:cover;display:block;
}
.card-img-ph{
  width:100%;aspect-ratio:16/9;
  background:linear-gradient(135deg,rgba(0,200,255,.08) 0%,rgba(170,255,0,.06) 100%);
  display:flex;align-items:center;justify-content:center;
  font-size:36px;
}
.card-body{padding:22px 20px}
.card-tag{
  display:inline-flex;padding:3px 10px;border-radius:999px;margin-bottom:12px;
  font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
}
.ct-lime{background:rgba(170,255,0,.08);color:var(--lime2);border:1px solid rgba(170,255,0,.14)}
.ct-blue{background:rgba(0,200,255,.08);color:var(--blue);border:1px solid rgba(0,200,255,.14)}
.ct-neon{background:rgba(0,255,179,.08);color:var(--neon);border:1px solid rgba(0,255,179,.14)}
.card h3{font-family:'Unbounded',sans-serif;font-size:14px;font-weight:700;line-height:1.3;margin-bottom:8px;letter-spacing:-.01em}
.card p{font-size:13px;line-height:1.65;color:var(--ink2)}

/* card grande hero lateral */
.card-feat{
  grid-column:1/3;
  display:grid;grid-template-columns:1fr 1fr;
}
.card-feat .card-img-ph{
  aspect-ratio:auto;height:100%;min-height:200px;
  background:linear-gradient(135deg,rgba(0,200,255,.12) 0%,rgba(170,255,0,.08) 100%);
}

/* ── IMAGEN FLOTANTE ── */
.phone-wrap{
  position:relative;display:inline-block;
  animation:float 4s ease-in-out infinite;
  margin:48px auto 0;
}
.phone-wrap img{
  width:100%;max-width:280px;
  border-radius:24px;
  box-shadow:0 0 60px rgba(0,200,255,.2),0 0 120px rgba(170,255,0,.1);
}
/* anillo pulsante */
.phone-ring{
  position:absolute;
  width:110%;height:110%;
  border-radius:50%;
  border:1px solid rgba(0,200,255,.25);
  top:-5%;left:-5%;
  animation:pulse-ring 2.5s ease-out infinite;
}
.phone-ring2{animation-delay:1.2s}

/* ── STEPS ── */
.steps-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:16px;margin-top:52px;
}
.step-card{
  background:var(--card);border:1px solid var(--edge);border-radius:var(--r);
  padding:32px 24px;text-align:left;position:relative;overflow:hidden;
  transition:border-color .2s;
}
.step-card:hover{border-color:rgba(170,255,0,.2)}
.step-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(to right,var(--lime),var(--blue));
  opacity:0;transition:opacity .2s;
}
.step-card:hover::before{opacity:1}
.sn{
  font-family:'Unbounded',sans-serif;font-size:48px;font-weight:900;
  color:rgba(170,255,0,.12);line-height:1;margin-bottom:16px;letter-spacing:-.04em;
}
.step-card h3{font-family:'Unbounded',sans-serif;font-size:14px;font-weight:700;margin-bottom:10px;line-height:1.3}
.step-card p{font-size:13px;color:var(--ink2);line-height:1.65}
.step-time{
  display:inline-flex;align-items:center;gap:5px;
  margin-top:14px;padding:4px 11px;border-radius:999px;
  background:rgba(0,255,179,.06);border:1px solid rgba(0,255,179,.14);
  font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--neon);
}

/* ── NÚMEROS ── */
.nums-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:var(--edge);
  border:1px solid rgba(170,255,0,.1);border-radius:var(--r);
  overflow:hidden;margin-top:52px;
}
.num-card{
  background:var(--card);padding:48px 32px;position:relative;overflow:hidden;
  transition:background .2s;
}
.num-card:hover{background:#111318}
.num-card::after{
  content:'';position:absolute;top:-30px;right:-30px;
  width:120px;height:120px;border-radius:50%;
  background:radial-gradient(circle,rgba(170,255,0,.07),transparent 60%);
  pointer-events:none;
}
.num-big{
  font-family:'Unbounded',sans-serif;
  font-size:clamp(44px,6vw,72px);
  font-weight:900;letter-spacing:-.04em;line-height:1;
  background:linear-gradient(135deg,var(--ink) 40%,var(--lime2) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.num-label{margin-top:8px;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--ink3)}
.num-delta{margin-top:4px;font-size:12px;color:var(--lime2);font-weight:600}

/* ── PRECIOS ── */
.price-grid{
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:12px;margin-top:52px;text-align:left;
}
.pt{
  background:var(--card);border:1px solid var(--edge);border-radius:var(--r);
  padding:28px 20px;position:relative;overflow:hidden;
  transition:border-color .2s,transform .2s;
}
.pt:hover{border-color:rgba(170,255,0,.2);transform:translateY(-3px)}
.pt.feat{
  border-color:rgba(170,255,0,.25);
  background:linear-gradient(160deg,rgba(170,255,0,.05) 0%,var(--card) 60%);
}
.pt-pop{
  display:inline-flex;padding:4px 12px;border-radius:999px;margin-bottom:14px;
  font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
  background:var(--lime);color:#04050a;
  font-family:'Unbounded',sans-serif;
}
.pt-tier{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:var(--ink3);margin-bottom:14px}
.pt-price{
  font-family:'Unbounded',sans-serif;
  font-size:clamp(36px,4vw,52px);font-weight:900;letter-spacing:-.04em;line-height:1;
}
.pt-price sup{font-size:16px;vertical-align:super;font-weight:400;font-family:'Inter',sans-serif}
.pt-price sub{font-size:11px;font-weight:300;font-family:'Inter',sans-serif;color:var(--ink3);vertical-align:bottom}
.pt-range{margin-top:10px;font-size:12px;color:var(--ink2);line-height:1.6}
.pt-from{margin-top:14px;padding-top:14px;border-top:1px solid var(--edge);font-size:11px;color:var(--ink3);line-height:1.6}
.pt-from strong{color:var(--ink2);font-weight:500}

/* ── FAQ ── */
.faq-list{max-width:680px;margin:48px auto 0;text-align:left}
details.fq{border-bottom:1px solid var(--edge)}
details.fq:first-child{border-top:1px solid var(--edge)}
.fq summary{
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:20px 0;cursor:pointer;list-style:none;
  font-size:15px;font-weight:400;line-height:1.4;user-select:none;
}
.fq summary::-webkit-details-marker{display:none}
.fq-ico{
  width:22px;height:22px;border-radius:50%;flex-shrink:0;
  background:rgba(170,255,0,.08);border:1px solid rgba(170,255,0,.18);
  display:flex;align-items:center;justify-content:center;
  color:var(--lime2);font-size:14px;
  transition:transform .2s,background .15s;
}
details[open] .fq-ico{transform:rotate(45deg);background:rgba(170,255,0,.14)}
.fq-a{padding:0 0 20px;font-size:14px;line-height:1.75;color:var(--ink2)}

/* ── CTA FINAL ── */
#pl-cta{
  padding:120px 24px;text-align:center;
  position:relative;overflow:hidden;
  background:linear-gradient(180deg,var(--bg) 0%,rgba(170,255,0,.03) 50%,var(--bg) 100%);
}
#pl-cta::before{
  content:'';position:absolute;pointer-events:none;
  width:600px;height:600px;border-radius:50%;
  background:radial-gradient(circle,rgba(170,255,0,.05) 0%,transparent 65%);
  top:50%;left:50%;transform:translate(-50%,-50%);
}
.cta-h{
  font-family:'Unbounded',sans-serif;
  font-size:clamp(38px,8vw,96px);
  font-weight:900;line-height:.93;letter-spacing:-.04em;text-transform:uppercase;
  max-width:900px;margin:0 auto 24px;text-wrap:balance;
}
.cta-sub{font-size:clamp(15px,1.6vw,18px);line-height:1.7;color:var(--ink2);max-width:420px;margin:0 auto 48px}
.cta-micro{display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;margin-top:28px}
.cta-mi{font-size:12px;color:var(--ink3);display:flex;align-items:center;gap:5px}
.cta-mi::before{content:'✓';color:var(--lime2)}

/* ── FOOTER ── */
#pl-foot{
  padding:24px;
  border-top:1px solid var(--edge);
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;
  max-width:1100px;margin:0 auto;
}
.foot-l{font-size:12px;color:var(--ink3)}
.foot-r{font-size:11px;color:var(--ink3);display:flex;gap:16px;flex-wrap:wrap}

/* ── FLOAT WA ── */
.wa-f{
  position:fixed;bottom:20px;right:20px;z-index:800;
  display:flex;align-items:center;gap:9px;
  padding:13px 22px;border-radius:999px;
  background:#25D366;color:#fff;
  font-size:14px;font-weight:700;
  font-family:'Unbounded',sans-serif;letter-spacing:-.01em;
  box-shadow:0 4px 24px rgba(37,211,102,.4);
  transition:transform .12s,box-shadow .15s;
  animation:fadeUp .7s 1.4s cubic-bezier(.16,1,.3,1) both;
}
.wa-f:hover{transform:translateY(-2px);box-shadow:0 8px 36px rgba(37,211,102,.5)}

/* ══ RESPONSIVE ══ */
@media(max-width:900px){
  .cards{grid-template-columns:1fr 1fr}
  .card-feat{grid-column:auto;grid-template-columns:1fr}
  .card-feat .card-img-ph{min-height:160px}
  .steps-grid{grid-template-columns:1fr 1fr}
  .nums-grid{grid-template-columns:1fr}
  .price-grid{grid-template-columns:1fr 1fr}
  .nl{display:none}
}
@media(max-width:600px){
  .cards{grid-template-columns:1fr}
  .steps-grid{grid-template-columns:1fr}
  .price-grid{grid-template-columns:1fr;max-width:340px;margin-left:auto;margin-right:auto}
  .hero-h1{font-size:clamp(42px,13vw,66px)}
  .hs{padding:0 16px}
  .cta-h{font-size:clamp(34px,11vw,56px)}
  #pl-cta{padding:80px 24px}
  .sec{padding:72px 24px}
  .wa-f{padding:12px 18px;font-size:13px}
}
      `}} />

      <div id="pl">

        {/* ── NAV ── */}
        <nav>
          <div className="nav-in">
            <div className="nav-logo">
              <span className="nav-dot"/>
              Agentia
            </div>
            <div className="nav-links">
              <a href="#pl-como" className="nl">Cómo funciona</a>
              <a href="#pl-precios" className="nl">Precios</a>
              <a href="#pl-demo" className="nl">Demo</a>
              <a href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads" className="nav-cta" target="_blank" rel="noopener noreferrer">
                Demo →
              </a>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section id="pl-hero">
          <div className="hero-bg"/>
          <div className="orb hero-orb orb1"/>
          <div className="orb hero-orb orb2"/>

          <div className="hero-inner">
            <div className="hero-tag a1">
              <span className="htag-dot"/>
              Panel de leads · marca blanca para agencias
            </div>

            <h1 className="hero-h1 a2">
              TUS LEADS,<br/>
              <span className="hero-shine">AL INSTANTE.</span>
            </h1>

            <p className="hero-p a3">
              Panel con tu marca para agencias de Facebook Ads. Cada lead llega al celular de tu cliente en segundos — con nombre, número y un tap para contactar.
            </p>

            <div className="hero-btns a4">
              <a href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads" className="btn-main" target="_blank" rel="noopener noreferrer">
                <span className="btn-icon"><WaIcon s={18}/></span>
                <span className="btn-label">Agendar demo por WhatsApp</span>
              </a>
              <a href="#pl-demo" className="btn-sec">
                <span className="btn-sec-icon">▶</span>
                <span>Ver panel demo en vivo</span>
              </a>
            </div>

            <div className="hero-stats a5">
              <div className="hs"><div className="hs-n">+15k</div><div className="hs-l">Leads gestionados</div></div>
              <div className="hs"><div className="hs-n">+3,700</div><div className="hs-l">Último mes</div></div>
              <div className="hs"><div className="hs-n">52</div><div className="hs-l">Negocios activos</div></div>
            </div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="ticker">
          <div className="ticker-track">
            {['Restaurante El Fogón','Clínica DentalPro','Gym PowerFit','Academia de Inglés','Inmobiliaria Sur','Autoservicio Mérida','Rojo Tráfico','Nexo Digital'].flatMap((n,i)=>[
              <span key={`a${i}`} className="ti"><b>Lead nuevo</b> · {n} · ahora<span className="ti-sep"> ✦ </span></span>,
              <span key={`b${i}`} className="ti"><b>Contactado</b> · {n} · 2 min<span className="ti-sep"> ✦ </span></span>,
            ])}
          </div>
        </div>

        {/* ── QUÉ ES ── */}
        <section className="sec" id="pl-que">
          <div className="sec-inner">
            <span className="sec-tag">El producto</span>
            <h2 className="sec-h2">TU MARCA.<br/>SU PANEL.</h2>
            <p className="sec-p">El cliente ve sus leads en tiempo real. Tú cobras el panel. Agentia es la infraestructura invisible.</p>

            <div className="cards">
              <div className="card card-feat">
                <div className="card-img-ph" style={{backgroundImage:"url('/hero-tech.jpg')",backgroundSize:'cover',backgroundPosition:'center',opacity:.8}}/>
                <div className="card-body">
                  <span className="card-tag ct-lime">Marca blanca</span>
                  <h3>Tu logo. Tu nombre.<br/>Tu tecnología.</h3>
                  <p>El panel lleva tu identidad. El cliente nunca ve "Agentia" — tú eres el proveedor de tecnología.</p>
                </div>
              </div>
              <div className="card">
                <div className="card-img-ph">🔔</div>
                <div className="card-body">
                  <span className="card-tag ct-blue">Push en tiempo real</span>
                  <h3>Lead nuevo = notificación en 3 seg</h3>
                  <p>No hay reporte semanal. El celular vibra en el momento que llega el prospecto.</p>
                </div>
              </div>
              <div className="card">
                <div className="card-img-ph">📱</div>
                <div className="card-body">
                  <span className="card-tag ct-neon">PWA · Sin App Store</span>
                  <h3>Se instala desde el navegador</h3>
                  <p>Android e iPhone. Dos taps. Funciona como app nativa sin pasar por App Store.</p>
                </div>
              </div>
              <div className="card">
                <div className="card-img-ph">⚡</div>
                <div className="card-body">
                  <span className="card-tag ct-lime">Pipeline</span>
                  <h3>Seguimiento visual</h3>
                  <p>Nuevo → Seguimiento → Interesado → Vendido. El cliente actualiza el estatus y tú ves qué convierte.</p>
                </div>
              </div>
              <div className="card">
                <div className="card-img-ph">🎛️</div>
                <div className="card-body">
                  <span className="card-tag ct-blue">Panel maestro</span>
                  <h3>Todos tus clientes, una vista</h3>
                  <p>Ves qué paneles están activos, cuántos leads llegaron hoy y qué cuentas necesitan atención.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── NÚMEROS ── */}
        <section className="sec" id="pl-nums" style={{paddingTop:0}}>
          <div className="sec-inner">
            <span className="sec-tag">Producto en uso real</span>
            <h2 className="sec-h2">NÚMEROS<br/>REALES.</h2>
            <div className="nums-grid">
              {[
                {n:'+15,000',l:'Leads procesados',    d:'↑ en curso'},
                {n:'+3,700', l:'Solo el último mes',  d:'↑ mes activo'},
                {n:'52',     l:'Negocios activos hoy',d:'↑ este mes'},
              ].map(s=>(
                <div key={s.l} className="num-card">
                  <div className="num-big">{s.n}</div>
                  <div className="num-label">{s.l}</div>
                  <div className="num-delta">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className="sec" id="pl-como">
          <div className="sec-inner">
            <span className="sec-tag">Proceso</span>
            <h2 className="sec-h2">3 PASOS.<br/>24 HORAS.</h2>
            <p className="sec-p">Sin código. Sin Zapier. Sin Excel. Del alta al primer lead en 24 horas.</p>
            <div className="steps-grid">
              {[
                {n:'01',t:'Conectas la campaña',       p:'Enlazas el formulario de Facebook Ads. Menos de 5 minutos.',time:'⏱ 5 min'},
                {n:'02',t:'Tu cliente recibe acceso',  p:'Le mandas un link. Entra al panel con tu logo. No ve nada de Agentia.',time:'⏱ 24 h'},
                {n:'03',t:'Leads en tiempo real',       p:'Cada lead dispara notificación push. Un tap abre WhatsApp con el número del prospecto.',time:'⏱ segundos'},
              ].map(s=>(
                <div key={s.n} className="step-card">
                  <div className="sn">{s.n}</div>
                  <h3>{s.t}</h3>
                  <p>{s.p}</p>
                  <span className="step-time">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VIDEO ── */}
        <section className="sec" id="pl-video" style={{paddingTop:0}}>
          <div className="sec-inner">
            <span className="sec-tag">En acción</span>
            <h2 className="sec-h2">MÍRALO EN<br/>60 SEGUNDOS.</h2>
            <div className="phone-wrap">
              <div className="phone-ring"/>
              <div className="phone-ring phone-ring2"/>
              <img src="/hero-phone.jpg" alt="Panel de leads en celular" style={{maxWidth:'260px',borderRadius:'24px'}}/>
            </div>
            <div style={{marginTop:'40px'}}>
              <a href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads" className="btn-main" style={{display:'inline-flex',width:'auto',padding:'18px 36px'}} target="_blank" rel="noopener noreferrer">
                <span className="btn-icon"><WaIcon s={18}/></span>
                <span>Agendar demo gratis</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── PRECIOS ── */}
        <section className="sec" id="pl-precios">
          <div className="sec-inner">
            <span className="sec-tag">Precios</span>
            <h2 className="sec-h2">PAGA POR<br/>PANELES ACTIVOS.</h2>
            <p className="sec-p">Entre más clientes, menos pagas por cada uno. Sin contrato anual.</p>
            <div className="price-grid">
              <div className="pt">
                <div className="pt-tier">Starter</div>
                <div className="pt-price"><sup>$</sup>12<sub> usd</sub></div>
                <div className="pt-range">por panel / mes<br/>mínimo 5 paneles</div>
                <div className="pt-from">Desde <strong>$60/mes</strong><br/>1–9 clientes</div>
              </div>
              <div className="pt feat">
                <div className="pt-pop">Popular</div>
                <div className="pt-tier">Growth</div>
                <div className="pt-price"><sup>$</sup>10<sub> usd</sub></div>
                <div className="pt-range">por panel / mes</div>
                <div className="pt-from">Desde <strong>$100/mes</strong><br/>10–29 clientes</div>
              </div>
              <div className="pt">
                <div className="pt-tier">Scale</div>
                <div className="pt-price"><sup>$</sup>8<span style={{fontSize:'.55em',fontWeight:300}}>.50</span><sub> usd</sub></div>
                <div className="pt-range">por panel / mes</div>
                <div className="pt-from">Desde <strong>$255/mes</strong><br/>30–55 clientes</div>
              </div>
              <div className="pt">
                <div className="pt-tier">Enterprise</div>
                <div className="pt-price" style={{fontFamily:'Inter,sans-serif',fontSize:'28px',fontWeight:300}}>Cotiza</div>
                <div className="pt-range">56+ paneles</div>
                <div className="pt-from">Precio por<br/>volumen</div>
              </div>
            </div>
            <div style={{marginTop:'36px'}}>
              <a href="https://wa.me/529844927769?text=Quiero%20cotizar%20el%20Panel%20de%20Leads" className="btn-main" style={{display:'inline-flex',width:'auto',padding:'18px 36px'}} target="_blank" rel="noopener noreferrer">
                <span className="btn-icon"><WaIcon s={18}/></span>
                <span>Cotizar por WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── DEMO ── */}
        <section className="sec" id="pl-demo">
          <div className="sec-inner">
            <span className="sec-tag">Demo en vivo</span>
            <h2 className="sec-h2">ENTRA AHORA.<br/>SIN REGISTRO.</h2>
            <p className="sec-p">Panel de demostración con datos reales de prueba. Usuario: <strong style={{color:'var(--lime2)'}}>demo-agencia</strong> · Contraseña: <strong style={{color:'var(--lime2)'}}>demo2026</strong></p>
            <div style={{marginTop:'36px',display:'flex',justifyContent:'center',gap:'14px',flexWrap:'wrap'}}>
              <a href="/agentia-panel?demo=1" className="btn-main" style={{display:'inline-flex',width:'auto',padding:'18px 36px'}} target="_blank" rel="noopener noreferrer">
                <span className="btn-icon" style={{fontSize:'18px'}}>↗</span>
                <span>Abrir panel demo</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="sec" id="pl-faq">
          <div className="sec-inner">
            <span className="sec-tag">FAQ</span>
            <h2 className="sec-h2">PREGUNTAS<br/>FRECUENTES.</h2>
            <div className="faq-list">
              {[
                {q:'¿Mis clientes saben que usan Agentia?',           a:'No. El panel lleva tu logo y tu nombre. Para tu cliente, tú eres el proveedor de tecnología. Agentia es la infraestructura invisible.'},
                {q:'¿Cómo conecta con Facebook Ads?',                 a:'Integración nativa con Meta Lead Ads. En menos de 5 minutos enlazas la página de Facebook del cliente. Sin Zapier, sin webhooks, sin código.'},
                {q:'¿Funciona en iPhone sin App Store?',              a:'Sí. Es una PWA. Se instala desde Safari o Chrome en dos taps y aparece en la pantalla de inicio con notificaciones push como app nativa.'},
                {q:'¿Cuánto tarda el primer panel?',                  a:'Entre 24 y 48 horas desde que confirmas. Recibes el acceso al panel maestro y una guía paso a paso.'},
                {q:'¿Qué pasa si un cliente cancela?',                a:'Solo pagas paneles activos ese mes. Sin penalizaciones, sin contratos anuales.'},
              ].map(item=>(
                <details key={item.q} className="fq">
                  <summary>{item.q}<span className="fq-ico">+</span></summary>
                  <div className="fq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="pl-cta">
          <h2 className="cta-h">¿LISTA TU<br/>AGENCIA?</h2>
          <p className="cta-sub">Una demo en vivo con tus datos, no un genérico.</p>
          <a href="https://wa.me/529844927769?text=Quiero%20demo%20del%20Panel%20de%20Leads" className="btn-main" style={{display:'inline-flex',width:'auto',padding:'20px 44px',fontSize:'16px'}} target="_blank" rel="noopener noreferrer">
            <span className="btn-icon"><WaIcon s={20}/></span>
            <span>Agendar demo por WhatsApp</span>
          </a>
          <div className="cta-micro">
            <span className="cta-mi">Sin contrato anual</span>
            <span className="cta-mi">Activo en 24 horas</span>
            <span className="cta-mi">API oficial WhatsApp Business</span>
            <span className="cta-mi">Tu marca, no la nuestra</span>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{borderTop:'1px solid var(--edge)',padding:'24px'}}>
          <div id="pl-foot">
            <span className="foot-l">© 2026 <a href="https://agentia.software">Agentia Software</a> · <a href="/legal">Privacidad</a></span>
            <span className="foot-r"><span>panel leads facebook ads</span><span>crm para agencias</span></span>
          </div>
        </footer>

        {/* ── FLOAT WA ── */}
        <a href="https://wa.me/529844927769" className="wa-f" target="_blank" rel="noopener noreferrer">
          <WaIcon s={16}/>
          WhatsApp
        </a>

      </div>
    </>
  );
}
