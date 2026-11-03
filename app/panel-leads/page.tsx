import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Leads para Agencias | Agentia',
  description:
    'El CRM para traffickers y agencias de Facebook Ads. Entrega leads en tiempo real a tus clientes con su propia marca. Sin Excel, sin capturas, sin Zapier.',
  keywords: [
    'panel de leads Facebook Ads',
    'CRM para agencias de marketing',
    'enviar leads a clientes',
    'notificaciones de leads por WhatsApp',
    'CRM para traffickers',
    'leads Facebook Ads México',
  ],
  openGraph: {
    title: 'Panel de Leads para Agencias | Agentia',
    description:
      'Entrega leads de Facebook Ads a tus clientes en tiempo real. Panel con marca blanca, notificaciones push y seguimiento de ventas.',
    images: [{ url: '/og-agentia.jpg', width: 1200, height: 630 }],
    type: 'website',
    url: 'https://agentia.software/panel-leads',
  },
  alternates: {
    canonical: 'https://agentia.software/panel-leads',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Panel de Leads Agentia',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description:
        'CRM de leads para agencias y traffickers de Facebook Ads. Panel con marca blanca, notificaciones push, seguimiento de ventas y bandeja de WhatsApp.',
      offers: { '@type': 'Offer', price: '12', priceCurrency: 'USD' },
      url: 'https://agentia.software/panel-leads',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Mis clientes saben que usan Agentia?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. El panel lleva tu marca — tu logo, tu nombre, tu dominio si quieres. Agentia trabaja en el fondo como la tecnología que tú ofreces.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo conecta los leads de Facebook Ads?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A través de la integración nativa con Meta Lead Ads. En menos de 5 minutos enlazas la página de Facebook del cliente y los leads llegan directo al panel.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuánto tarda en estar listo el primer panel?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Entre 24 y 48 horas desde que confirmas. No necesitas instalar nada.',
          },
        },
      ],
    },
  ],
};

export default function PanelLeadsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PanelLeadsContent />
    </>
  );
}

// ── ESTILOS INLINE (evita conflictos con globals.css del panel) ────────────
const css = `
  #pl-root *, #pl-root *::before, #pl-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  #pl-root {
    --bg: #080B10; --bg2: #0D1117; --bg3: #161B22;
    --border: rgba(255,255,255,0.08); --border2: rgba(255,255,255,0.14);
    --fg: #F0F6FF; --fg2: rgba(240,246,255,0.60); --fg3: rgba(240,246,255,0.35);
    --accent: #3B82F6; --accent2: #60A5FA; --accent-glow: rgba(59,130,246,0.25);
    --green: #10B981; --orange: #F59E0B;
    --r: 16px; --rsm: 10px;
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg); color: var(--fg); line-height: 1.6;
    overflow-x: hidden; min-height: 100vh;
  }
  #pl-root a { color: inherit; text-decoration: none; }
  #pl-root img { max-width: 100%; }

  /* grid de fondo */
  #pl-root::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(rgba(59,130,246,.03) 1px,transparent 1px),
      linear-gradient(90deg,rgba(59,130,246,.03) 1px,transparent 1px);
    background-size:60px 60px;
  }

  /* NAV */
  #pl-nav {
    position:fixed; top:0; left:0; right:0; z-index:100;
    padding:0 max(20px,env(safe-area-inset-left,0px));
    border-bottom:1px solid var(--border);
    backdrop-filter:blur(20px);
    background:rgba(8,11,16,.8);
  }
  .pl-nav-inner {
    max-width:1100px; margin:0 auto; height:60px;
    display:flex; align-items:center; justify-content:space-between; gap:16px;
  }
  .pl-logo { display:flex; align-items:center; gap:10px; }
  .pl-logo img { height:28px; width:28px; object-fit:contain; border-radius:7px; }
  .pl-logo-text { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:15px; color:var(--fg); letter-spacing:.01em; }
  .pl-nav-cta {
    display:inline-flex; align-items:center; gap:8px;
    padding:8px 18px; border-radius:999px;
    background:var(--accent); color:#fff;
    font-size:13px; font-weight:600;
    transition:transform .15s,box-shadow .15s; white-space:nowrap;
  }
  .pl-nav-cta:hover { transform:translateY(-1px); box-shadow:0 4px 20px var(--accent-glow); }

  /* SECCIONES */
  #pl-root section { position:relative; z-index:1; }
  .pl-c { max-width:1100px; margin:0 auto; padding:0 max(20px,env(safe-area-inset-left,0px)); }

  /* HERO */
  #pl-hero {
    min-height:100svh; display:flex; flex-direction:column; align-items:center; justify-content:center;
    text-align:center; padding:100px max(20px,env(safe-area-inset-left,0px)) 0;
    position:relative; overflow:hidden;
  }
  #pl-hero::after {
    content:''; position:absolute; width:800px; height:800px; border-radius:50%;
    background:radial-gradient(circle,rgba(59,130,246,.12) 0%,transparent 70%);
    top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none;
  }
  .pl-badge {
    display:inline-flex; align-items:center; gap:8px;
    padding:6px 16px; border-radius:999px;
    border:1px solid rgba(59,130,246,.3); background:rgba(59,130,246,.08);
    font-size:12px; font-weight:600; color:var(--accent2);
    letter-spacing:.06em; text-transform:uppercase; margin-bottom:28px;
    animation:plFadeUp .6s ease both;
  }
  .pl-bdot { width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); animation:plPulse 2s infinite; }
  @keyframes plPulse { 0%,100%{opacity:1}50%{opacity:.4} }
  @keyframes plFadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
  @keyframes plSlideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
  @keyframes plTicker { from{transform:translateX(0)}to{transform:translateX(-50%)} }

  .pl-h1 {
    font-family:'Space Grotesk',sans-serif;
    font-size:clamp(36px,7vw,76px); font-weight:800; line-height:1.05;
    letter-spacing:-.03em; text-wrap:balance; max-width:900px;
    animation:plFadeUp .6s .1s ease both;
  }
  .pl-grad {
    background:linear-gradient(135deg,#60A5FA 0%,#3B82F6 40%,#818CF8 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .pl-sub {
    margin-top:20px; font-size:clamp(16px,2.2vw,20px); color:var(--fg2);
    max-width:600px; text-wrap:balance; animation:plFadeUp .6s .2s ease both;
  }
  .pl-hero-btns {
    display:flex; flex-wrap:wrap; gap:14px; justify-content:center;
    margin-top:40px; animation:plFadeUp .6s .3s ease both;
  }
  .pl-btn-primary {
    display:inline-flex; align-items:center; gap:10px;
    padding:16px 32px; border-radius:999px;
    background:var(--accent); color:#fff; font-size:16px; font-weight:700;
    box-shadow:0 0 40px rgba(59,130,246,.3);
    transition:transform .15s,box-shadow .15s;
  }
  .pl-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 40px rgba(59,130,246,.5); }
  .pl-btn-secondary {
    display:inline-flex; align-items:center; gap:10px;
    padding:16px 32px; border-radius:999px;
    border:1px solid var(--border2); color:var(--fg); font-size:16px; font-weight:600;
    background:rgba(255,255,255,.04); transition:background .15s,border-color .15s;
  }
  .pl-btn-secondary:hover { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.25); }

  /* PANEL MOCKUP */
  .pl-visual { margin-top:64px; width:100%; max-width:900px; animation:plFadeUp .8s .4s ease both; }
  .pl-mock {
    background:var(--bg2); border:1px solid var(--border2); border-radius:var(--r);
    overflow:hidden; box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06);
  }
  .pl-topbar {
    display:flex; align-items:center; gap:10px; padding:14px 18px;
    background:var(--bg3); border-bottom:1px solid var(--border);
  }
  .pl-dot { width:10px; height:10px; border-radius:50%; }
  .pl-dot-r{background:#FF5F57} .pl-dot-y{background:#FFBD2E} .pl-dot-g{background:#28CA41}
  .pl-topbar-ttl { flex:1; text-align:center; font-size:12px; color:var(--fg3); font-weight:500; }
  .pl-body { display:grid; grid-template-columns:200px 1fr; min-height:320px; }
  @media(max-width:600px){.pl-body{grid-template-columns:1fr}}
  .pl-sidebar {
    background:rgba(255,255,255,.02); border-right:1px solid var(--border);
    padding:16px 12px; display:flex; flex-direction:column; gap:4px;
  }
  @media(max-width:600px){.pl-sidebar{display:none}}
  .pl-si {
    display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px;
    font-size:13px; font-weight:500; color:var(--fg2); cursor:pointer; transition:background .15s;
  }
  .pl-si.active { background:rgba(59,130,246,.12); color:var(--accent2); }
  .pl-content { padding:20px; }
  .pl-hrow { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
  .pl-htitle { font-size:14px; font-weight:700; color:var(--fg); }
  .pl-live {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 10px; border-radius:999px;
    background:rgba(16,185,129,.12); border:1px solid rgba(16,185,129,.25);
    font-size:11px; font-weight:600; color:var(--green);
  }
  .pl-live::before { content:''; width:5px; height:5px; border-radius:50%; background:var(--green); animation:plPulse 2s infinite; }
  .pl-table { width:100%; border-collapse:collapse; }
  .pl-table th { font-size:10px; font-weight:600; color:var(--fg3); text-transform:uppercase; letter-spacing:.08em; padding:6px 10px; text-align:left; border-bottom:1px solid var(--border); }
  .pl-table td { font-size:12px; padding:10px; border-bottom:1px solid rgba(255,255,255,.04); color:var(--fg2); vertical-align:middle; }
  .pl-lname { font-weight:600; color:var(--fg); font-size:13px; }
  .pl-ltime { font-size:11px; color:var(--fg3); }
  .pl-sbadge { display:inline-flex; padding:3px 10px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:.04em; white-space:nowrap; }
  .pl-s-new{background:rgba(59,130,246,.15);color:#93C5FD}
  .pl-s-seg{background:rgba(245,158,11,.15);color:#FCD34D}
  .pl-s-int{background:rgba(16,185,129,.15);color:#6EE7B7}
  .pl-s-cer{background:rgba(129,140,248,.15);color:#C4B5FD}
  .pl-wa {
    display:inline-flex; align-items:center; gap:4px; padding:4px 10px;
    border-radius:6px; background:rgba(37,211,102,.1); border:1px solid rgba(37,211,102,.2);
    color:#25D366; font-size:11px; font-weight:600; cursor:pointer; transition:background .15s; white-space:nowrap;
  }
  .pl-wa:hover { background:rgba(37,211,102,.2); }
  .pl-newrow td { animation:plFadeUp .5s ease both; }

  /* TICKER */
  .pl-ticker-wrap {
    overflow:hidden; border-top:1px solid var(--border); border-bottom:1px solid var(--border);
    background:rgba(255,255,255,.02); padding:14px 0; margin-top:60px;
  }
  .pl-ticker { display:flex; gap:48px; width:max-content; animation:plTicker 22s linear infinite; }
  .pl-ti { display:flex; align-items:center; gap:10px; font-size:13px; font-weight:600; color:var(--fg3); white-space:nowrap; }
  .pl-ti span { color:var(--accent2); }

  /* SECCIÓN GENÉRICA */
  .pl-slabel { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--accent2); margin-bottom:14px; }
  .pl-stitle { font-family:'Space Grotesk',sans-serif; font-size:clamp(28px,4vw,44px); font-weight:700; line-height:1.15; letter-spacing:-.02em; text-wrap:balance; margin-bottom:16px; }
  .pl-ssub { font-size:17px; color:var(--fg2); max-width:560px; text-wrap:balance; }

  /* PROBLEMA */
  #pl-prob { padding:100px 0; }
  .pl-pain-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px; margin-top:56px; }
  .pl-pain {
    background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:28px;
    transition:border-color .2s,transform .2s; position:relative; overflow:hidden;
  }
  .pl-pain::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(239,68,68,.04) 0%,transparent 60%); }
  .pl-pain:hover { border-color:var(--border2); transform:translateY(-3px); }
  .pl-picon { width:44px; height:44px; border-radius:12px; background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2); display:flex; align-items:center; justify-content:center; margin-bottom:18px; font-size:20px; }
  .pl-pain h3 { font-size:16px; font-weight:700; margin-bottom:8px; }
  .pl-pain p { font-size:14px; color:var(--fg2); line-height:1.6; }

  /* CÓMO */
  #pl-como { padding:100px 0; background:linear-gradient(180deg,transparent,rgba(59,130,246,.03),transparent); }
  .pl-steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:2px; margin-top:56px; background:var(--border); border-radius:var(--r); overflow:hidden; border:1px solid var(--border); }
  .pl-step { background:var(--bg2); padding:40px 32px; transition:background .2s; }
  .pl-step:hover { background:var(--bg3); }
  .pl-stepn { font-family:'Space Grotesk',sans-serif; font-size:48px; font-weight:800; color:rgba(59,130,246,.15); line-height:1; margin-bottom:20px; letter-spacing:-.04em; }
  .pl-step h3 { font-size:18px; font-weight:700; margin-bottom:10px; }
  .pl-step p { font-size:14px; color:var(--fg2); line-height:1.65; }

  /* FEATURES */
  #pl-feat { padding:100px 0; }
  .pl-feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:16px; }
  .pl-fc {
    background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:28px;
    transition:border-color .2s,transform .2s; position:relative; overflow:hidden;
  }
  .pl-fc:hover { border-color:rgba(59,130,246,.3); transform:translateY(-3px); }
  .pl-fc.hl { border-color:rgba(59,130,246,.25); background:linear-gradient(135deg,rgba(59,130,246,.06) 0%,var(--bg2) 60%); }
  .pl-ficon { width:44px; height:44px; border-radius:12px; background:rgba(59,130,246,.1); border:1px solid rgba(59,130,246,.2); display:flex; align-items:center; justify-content:center; margin-bottom:18px; font-size:20px; }
  .pl-fc h3 { font-size:15px; font-weight:700; margin-bottom:8px; }
  .pl-fc p { font-size:13px; color:var(--fg2); line-height:1.65; }
  .pl-ftag { display:inline-block; margin-top:14px; padding:3px 10px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:.06em; background:rgba(245,158,11,.1); color:var(--orange); border:1px solid rgba(245,158,11,.2); }

  /* VIDEO */
  #pl-video { padding:100px 0; text-align:center; }
  .pl-vwrap {
    margin:48px auto 0; position:relative; border-radius:var(--r); overflow:hidden;
    border:1px solid var(--border2); box-shadow:0 40px 100px rgba(0,0,0,.5);
    max-width:800px; aspect-ratio:16/9; background:var(--bg3);
    display:flex; align-items:center; justify-content:center; cursor:pointer;
  }
  .pl-vwrap video { width:100%; height:100%; object-fit:cover; display:block; }
  .pl-voverlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(8,11,16,.6); transition:opacity .3s; }
  .pl-play { width:72px; height:72px; border-radius:50%; background:var(--accent); display:flex; align-items:center; justify-content:center; box-shadow:0 0 40px rgba(59,130,246,.4); transition:transform .15s; }
  .pl-play:hover { transform:scale(1.08); }
  .pl-plabel { margin-top:16px; font-size:14px; font-weight:600; color:var(--fg2); }
  .pl-vwrap.playing .pl-voverlay { opacity:0; pointer-events:none; }

  /* DEMO */
  #pl-demo { padding:100px 0; background:linear-gradient(180deg,transparent,rgba(16,185,129,.03),transparent); }
  .pl-dcard {
    max-width:640px; margin:48px auto 0; background:var(--bg2);
    border:1px solid rgba(16,185,129,.2); border-radius:var(--r); padding:40px;
    text-align:center; box-shadow:0 0 60px rgba(16,185,129,.05);
  }
  .pl-creds { display:inline-flex; gap:16px; flex-wrap:wrap; justify-content:center; margin-bottom:28px; }
  .pl-cbox { background:var(--bg3); border:1px solid var(--border2); border-radius:10px; padding:14px 20px; font-size:13px; }
  .pl-clabel { font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--fg3); margin-bottom:4px; }
  .pl-cval { font-family:monospace; font-size:15px; font-weight:700; color:var(--green); }
  .pl-btn-demo {
    display:inline-flex; align-items:center; gap:10px; padding:14px 28px; border-radius:999px;
    background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.3);
    color:var(--green); font-size:15px; font-weight:700;
    transition:background .15s,transform .15s;
  }
  .pl-btn-demo:hover { background:rgba(16,185,129,.18); transform:translateY(-1px); }

  /* PRECIOS */
  #pl-prices { padding:100px 0; }
  .pl-pgrid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; max-width:900px; margin:0 auto; }
  .pl-pcard {
    background:var(--bg2); border:1px solid var(--border); border-radius:var(--r);
    padding:32px 24px; text-align:center; transition:border-color .2s,transform .2s; position:relative; overflow:hidden;
  }
  .pl-pcard:hover { border-color:var(--border2); transform:translateY(-4px); }
  .pl-pcard.pop { border-color:rgba(59,130,246,.4); background:linear-gradient(160deg,rgba(59,130,246,.08) 0%,var(--bg2) 50%); }
  .pl-pbadge { position:absolute; top:0; left:50%; transform:translateX(-50%); padding:4px 16px; border-radius:0 0 10px 10px; background:var(--accent); font-size:10px; font-weight:700; letter-spacing:.06em; color:#fff; text-transform:uppercase; }
  .pl-ptier { font-size:12px; font-weight:600; color:var(--fg3); letter-spacing:.08em; text-transform:uppercase; margin-bottom:14px; }
  .pl-pamt { font-family:'Space Grotesk',sans-serif; font-size:44px; font-weight:800; letter-spacing:-.04em; line-height:1; }
  .pl-pamt sup { font-size:22px; vertical-align:top; margin-top:6px; font-weight:600; }
  .pl-pamt span { font-size:14px; font-weight:500; color:var(--fg3); }
  .pl-prange { font-size:13px; color:var(--fg2); margin-top:8px; }
  .pl-ptotal { margin-top:16px; padding-top:16px; border-top:1px solid var(--border); font-size:12px; color:var(--fg3); }
  .pl-ptotal strong { color:var(--fg2); }

  /* FAQ */
  #pl-faq { padding:100px 0; }
  .pl-faqlist { max-width:700px; margin:0 auto; display:flex; flex-direction:column; gap:4px; }
  .pl-faqitem { background:var(--bg2); border:1px solid var(--border); border-radius:var(--rsm); overflow:hidden; }
  .pl-faqitem[open] { border-color:rgba(59,130,246,.2); }
  .pl-fq {
    display:flex; align-items:center; justify-content:space-between; gap:16px;
    padding:20px 24px; cursor:pointer; font-size:15px; font-weight:600;
    transition:color .15s; list-style:none; user-select:none;
  }
  .pl-fq::-webkit-details-marker { display:none; }
  .pl-fq::after {
    content:''; width:18px; height:18px; flex-shrink:0;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(240,246,255,0.4)' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-size:contain; background-repeat:no-repeat; transition:transform .25s;
  }
  .pl-faqitem[open] .pl-fq::after { transform:rotate(180deg); }
  .pl-fa { padding:0 24px 20px; font-size:14px; color:var(--fg2); line-height:1.7; animation:plFadeUp .2s ease; }

  /* CTA FINAL */
  #pl-cta { padding:120px max(20px,env(safe-area-inset-left,0px)); text-align:center; position:relative; overflow:hidden; }
  #pl-cta::before {
    content:''; position:absolute; width:600px; height:600px; border-radius:50%;
    background:radial-gradient(circle,rgba(59,130,246,.1) 0%,transparent 70%);
    top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none;
  }
  #pl-cta h2 { font-family:'Space Grotesk',sans-serif; font-size:clamp(32px,5vw,56px); font-weight:800; letter-spacing:-.03em; line-height:1.1; text-wrap:balance; margin-bottom:20px; }
  #pl-cta p { font-size:18px; color:var(--fg2); margin-bottom:40px; text-wrap:balance; }

  /* FOOTER */
  #pl-footer { padding:40px max(20px,env(safe-area-inset-left,0px)); border-top:1px solid var(--border); text-align:center; font-size:13px; color:var(--fg3); }
  #pl-footer a { color:var(--fg3); }
  #pl-footer a:hover { color:var(--fg2); }

  /* WA FLOTANTE */
  .pl-wafloat {
    position:fixed; bottom:24px; right:24px; z-index:200;
    display:flex; align-items:center; gap:12px;
    background:#25D366; color:#fff; font-size:14px; font-weight:700;
    padding:14px 22px; border-radius:999px;
    text-decoration:none;
    box-shadow:0 8px 30px rgba(37,211,102,.35);
    transition:transform .15s,box-shadow .15s;
    animation:plSlideUp .8s 1s ease both;
  }
  .pl-wafloat:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(37,211,102,.5); }

  /* REVEAL */
  .pl-rv { opacity:0; transform:translateY(24px); transition:opacity .6s ease,transform .6s ease; }
  .pl-rv.visible { opacity:1; transform:translateY(0); }
`;

function PanelLeadsContent() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div id="pl-root">
        {/* NAV */}
        <nav id="pl-nav">
          <div className="pl-nav-inner">
            <a href="/" className="pl-logo">
              <img src="/logo-agentia-2026.png" alt="Agentia" />
              <span className="pl-logo-text">Agentia</span>
            </a>
            <a
              href="https://wa.me/529844927769?text=Hola%2C%20quiero%20una%20demo%20del%20Panel%20de%20Leads"
              className="pl-nav-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WaIcon size={14} />
              Pedir demo
            </a>
          </div>
        </nav>

        {/* HERO */}
        <section id="pl-hero">
          <span className="pl-badge">
            <span className="pl-bdot" />
            Panel activo · Agencias en México y LATAM
          </span>
          <h1 className="pl-h1">
            Tu agencia entrega leads.<br />
            <span className="pl-grad">Tus clientes los cierran.</span>
          </h1>
          <p className="pl-sub">
            Panel de seguimiento de leads con marca blanca. Notificaciones en tiempo real,
            estatus de venta y acceso WhatsApp — sin Excel, sin capturas, sin Zapier.
          </p>
          <div className="pl-hero-btns">
            <a
              href="https://wa.me/529844927769?text=Hola%2C%20quiero%20una%20demo%20del%20Panel%20de%20Leads"
              className="pl-btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WaIcon size={18} />
              Quiero una demo
            </a>
            <a href="#pl-demo" className="pl-btn-secondary">
              <DocIcon />
              Ver acceso demo
            </a>
          </div>

          {/* Panel mockup */}
          <div className="pl-visual">
            <div className="pl-mock">
              <div className="pl-topbar">
                <span className="pl-dot pl-dot-r" />
                <span className="pl-dot pl-dot-y" />
                <span className="pl-dot pl-dot-g" />
                <span className="pl-topbar-ttl">panel-leads · demo-agencia</span>
              </div>
              <div className="pl-body">
                <aside className="pl-sidebar">
                  {[
                    ['Leads', '⏱'], ['Clientes', '👥'], ['WhatsApp', '💬'], ['Reportes', '📊'],
                  ].map(([label, ic], i) => (
                    <div key={label} className={`pl-si${i === 0 ? ' active' : ''}`}>
                      <span>{ic}</span>{label}
                    </div>
                  ))}
                </aside>
                <div className="pl-content">
                  <div className="pl-hrow">
                    <span className="pl-htitle">Leads — Hoy</span>
                    <span className="pl-live">En vivo</span>
                  </div>
                  <table className="pl-table" id="pl-leads-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Campaña</th>
                        <th>Estatus</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody id="pl-leads-body">
                      {[
                        ['María G.', 'hace 2 min', 'Verano Promo', 'pl-s-new', 'Nuevo'],
                        ['Carlos M.', 'hace 8 min', 'Remarketing', 'pl-s-int', 'Interesado'],
                        ['Ana P.', 'hace 15 min', 'Prospección', 'pl-s-cer', 'Cerrado ✓'],
                        ['Luis R.', 'hace 22 min', 'Verano Promo', 'pl-s-seg', 'Seguimiento'],
                      ].map(([name, time, camp, cls, status]) => (
                        <tr key={name as string}>
                          <td>
                            <div className="pl-lname">{name}</div>
                            <div className="pl-ltime">{time}</div>
                          </td>
                          <td>{camp}</td>
                          <td><span className={`pl-sbadge ${cls}`}>{status}</span></td>
                          <td><span className="pl-wa">📱 WA</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Ticker */}
          <div className="pl-ticker-wrap">
            <div className="pl-ticker">
              {[
                ['📲 Lead nuevo —', 'Restaurante El Fogón'],
                ['✅ Cerrado —', 'Clínica DentalPro'],
                ['🔔 Notificación —', 'Agencia MX Traffic'],
                ['📲 Lead nuevo —', 'Gym PowerFit'],
                ['✅ Cerrado —', 'Academia de Inglés'],
                ['📲 Lead nuevo —', 'Inmobiliaria Sur'],
                ['📲 Lead nuevo —', 'Restaurante El Fogón'],
                ['✅ Cerrado —', 'Clínica DentalPro'],
                ['🔔 Notificación —', 'Agencia MX Traffic'],
                ['📲 Lead nuevo —', 'Gym PowerFit'],
                ['✅ Cerrado —', 'Academia de Inglés'],
                ['📲 Lead nuevo —', 'Inmobiliaria Sur'],
              ].map(([label, name], i) => (
                <span key={i} className="pl-ti">{label} <span>{name}</span></span>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLEMA */}
        <section id="pl-prob">
          <div className="pl-c">
            <div className="pl-rv">
              <span className="pl-slabel">El problema</span>
              <h2 className="pl-stitle">Tus clientes reciben leads<br />en capturas de pantalla</h2>
              <p className="pl-ssub">El trafficker hace bien su trabajo. El problema está en cómo llegan los leads al cliente — y eso destruye la percepción de valor de tu agencia.</p>
            </div>
            <div className="pl-pain-grid">
              {[
                ['📊', 'Excel interminable', 'Exportas leads a mano cada semana. El cliente te pregunta cuántos llegaron y tú andas buscando el archivo.'],
                ['📸', 'Capturas por WhatsApp', 'Mandas screenshots del Ads Manager. El cliente no entiende los números y pierde confianza en la campaña.'],
                ['⚡', 'Leads fríos', 'El lead llegó a las 3pm. El cliente lo vio al día siguiente. Para entonces ya compró con la competencia.'],
                ['🔄', 'Zapier que falla', 'Automatizaciones rotas, webhooks caídos, leads perdidos. Y cuando falla, la culpa la carga la agencia.'],
              ].map(([icon, title, desc]) => (
                <div key={title as string} className="pl-pain pl-rv">
                  <div className="pl-picon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="pl-como">
          <div className="pl-c">
            <div className="pl-rv" style={{ textAlign: 'center' }}>
              <span className="pl-slabel">Cómo funciona</span>
              <h2 className="pl-stitle">Tres pasos y tu cliente<br />ya tiene su panel</h2>
            </div>
            <div className="pl-steps pl-rv">
              {[
                ['01', 'Conectas la campaña', 'Enlazas el formulario de Facebook Ads de tu cliente. Tarda menos de 5 minutos con la guía de Agentia.'],
                ['02', 'Tu cliente recibe su acceso', 'Le mandas un link con su contraseña. Entra al panel con su logo, sus colores — no ve nada de Agentia.'],
                ['03', 'Leads en tiempo real', 'Cada lead nuevo dispara una notificación push. Un tap abre WhatsApp para llamarle de inmediato.'],
              ].map(([n, title, desc]) => (
                <div key={n} className="pl-step">
                  <div className="pl-stepn">{n}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="pl-feat">
          <div className="pl-c">
            <div className="pl-rv" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="pl-slabel">Funciones</span>
              <h2 className="pl-stitle">Todo lo que necesita<br />tu agencia para escalar</h2>
            </div>
            <div className="pl-feat-grid">
              {[
                ['🏷️', 'Marca blanca total', 'El panel lleva el nombre y logo de tu agencia (o del cliente). Nadie sabe que detrás está Agentia. Tú eres el proveedor.', true, null],
                ['🔔', 'Notificaciones push', 'El celular del cliente vibra cuando llega un lead. Sin abrir ninguna app, sin esperar el reporte semanal.', false, null],
                ['📋', 'Estatus de seguimiento', 'Nuevo → Seguimiento → Interesado → Cerrado. El cliente actualiza y tú ves qué campañas realmente convierten.', false, null],
                ['📱', 'App instalable (PWA)', 'El cliente la instala desde Chrome o Safari como app nativa. Sin tiendas, sin aprobaciones.', false, null],
                ['💬', 'Botón WhatsApp directo', 'Un tap abre WhatsApp con el número y el nombre prellenado. El cliente llama en segundos.', false, null],
                ['🏢', 'Panel maestro de agencia', 'Ves todos tus clientes desde un solo acceso. Cuántos leads llegaron hoy y qué paneles están activos.', false, null],
                ['📨', 'Bandeja de WhatsApp', 'Envío de mensajes, seguimiento y conversaciones desde el panel.', false, 'Add-on'],
                ['📤', 'Envíos masivos desde Excel', 'Sube un Excel y lanza campañas de WhatsApp desde el panel. Sin copiar y pegar.', false, 'Add-on'],
              ].map(([icon, title, desc, hl, tag]) => (
                <div key={title as string} className={`pl-fc pl-rv${hl ? ' hl' : ''}`}>
                  <div className="pl-ficon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{desc}{tag && <><br /><span className="pl-ftag">{tag}</span></>}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VIDEO */}
        <section id="pl-video">
          <div className="pl-c">
            <div className="pl-rv">
              <span className="pl-slabel">El producto en acción</span>
              <h2 className="pl-stitle">Míralo funcionar<br />en 60 segundos</h2>
            </div>
            <div className="pl-vwrap pl-rv" id="pl-vwrap">
              <video id="pl-video-el" src="/anuncio-agentia-MX-subtitulado.mp4" preload="metadata" playsInline />
              <div className="pl-voverlay" id="pl-voverlay">
                <div className="pl-play" id="pl-playbtn">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </div>
                <span className="pl-plabel">Ver video del producto</span>
              </div>
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section id="pl-demo">
          <div className="pl-c">
            <div style={{ textAlign: 'center' }} className="pl-rv">
              <span className="pl-slabel">Acceso demo</span>
              <h2 className="pl-stitle">Entra y explora<br />el panel ahora mismo</h2>
              <p className="pl-ssub" style={{ margin: '16px auto 0' }}>Panel de demostración con datos de prueba. No necesitas registrarte.</p>
            </div>
            <div className="pl-dcard pl-rv">
              <div className="pl-creds">
                <div className="pl-cbox">
                  <div className="pl-clabel">Usuario</div>
                  <div className="pl-cval">demo-agencia</div>
                </div>
                <div className="pl-cbox">
                  <div className="pl-clabel">Contraseña</div>
                  <div className="pl-cval">demo2026</div>
                </div>
              </div>
              <a href="/agentia-panel?demo=1" className="pl-btn-demo" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                Abrir panel demo
              </a>
            </div>
          </div>
        </section>

        {/* PRECIOS */}
        <section id="pl-prices">
          <div className="pl-c">
            <div className="pl-rv" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="pl-slabel">Precios</span>
              <h2 className="pl-stitle">Paga por lo que usas.<br />Escala sin límite.</h2>
              <p className="pl-ssub" style={{ margin: '16px auto 0', textAlign: 'center' }}>
                Por panel activo al mes. Entre más clientes, menos pagas por cada uno.
              </p>
            </div>
            <div className="pl-pgrid pl-rv">
              <div className="pl-pcard">
                <div className="pl-ptier">Starter</div>
                <div className="pl-pamt"><sup>$</sup>12<span> USD</span></div>
                <div className="pl-prange">por panel / mes<br />(mínimo 5 paneles)</div>
                <div className="pl-ptotal">Desde <strong>$60 USD/mes</strong><br />1 a 9 clientes</div>
              </div>
              <div className="pl-pcard pop">
                <div className="pl-pbadge">Más popular</div>
                <div className="pl-ptier" style={{ marginTop: 16 }}>Growth</div>
                <div className="pl-pamt"><sup>$</sup>10<span> USD</span></div>
                <div className="pl-prange">por panel / mes</div>
                <div className="pl-ptotal">Desde <strong>$100 USD/mes</strong><br />10 a 29 clientes</div>
              </div>
              <div className="pl-pcard">
                <div className="pl-ptier">Scale</div>
                <div className="pl-pamt"><sup>$</sup>8.50<span> USD</span></div>
                <div className="pl-prange">por panel / mes</div>
                <div className="pl-ptotal">Desde <strong>$255 USD/mes</strong><br />30 a 55 clientes</div>
              </div>
              <div className="pl-pcard">
                <div className="pl-ptier">Enterprise</div>
                <div className="pl-pamt" style={{ fontSize: 32, letterSpacing: '-.02em' }}>Cotiza</div>
                <div className="pl-prange">56 o más paneles</div>
                <div className="pl-ptotal">Desde <strong>$400 USD/mes</strong><br />precio por volumen</div>
              </div>
            </div>
            <div className="pl-rv" style={{ textAlign: 'center', marginTop: 32 }}>
              <a
                href="https://wa.me/529844927769?text=Hola%2C%20quiero%20cotizar%20el%20Panel%20de%20Leads%20para%20mi%20agencia"
                className="pl-btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cotizar por WhatsApp
              </a>
              <p style={{ marginTop: 14, fontSize: 13, color: 'var(--fg3)' }}>
                Sin prueba gratis · Sin contrato anual · Activo en 24h
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="pl-faq">
          <div className="pl-c">
            <div className="pl-rv" style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="pl-slabel">Preguntas frecuentes</span>
              <h2 className="pl-stitle">Lo que nos preguntan<br />antes de contratar</h2>
            </div>
            <div className="pl-faqlist pl-rv">
              {[
                ['¿Mis clientes saben que usan Agentia?', 'No. El panel lleva tu marca — tu logo, tu nombre, tu dominio si quieres. Agentia trabaja en el fondo como la tecnología que tú ofreces. Para tu cliente, tú eres el proveedor.'],
                ['¿Cómo conecta los leads de Facebook Ads?', 'A través de la integración nativa con Meta Lead Ads. En menos de 5 minutos enlazas la página de Facebook de tu cliente y los leads llegan directo al panel sin pasar por Zapier ni webhooks manuales.'],
                ['¿Funciona sin app? ¿En iPhone también?', 'Sí. Es una PWA (Progressive Web App). En Android e iPhone se instala desde el navegador en 2 taps, sin ir a la App Store. Funciona igual de rápido que una app nativa.'],
                ['¿Cuánto tarda en estar listo el primer panel?', 'Entre 24 y 48 horas desde que confirmas. Te mandamos el acceso al panel maestro de tu agencia y la guía de configuración. No necesitas instalar nada.'],
                ['¿Qué pasa si un cliente cancela?', 'Solo pagas los paneles activos ese mes. Si un cliente cancela, el siguiente mes ya no te cobramos ese panel. Sin penalizaciones ni contratos mínimos (excepto el mínimo de 5 paneles en Starter).'],
                ['¿Incluye soporte?', 'Sí. Soporte directo por WhatsApp con el equipo de Agentia. No hay bot, no hay ticket — hablas con la persona que configuró tu cuenta.'],
              ].map(([q, a]) => (
                <details key={q as string} className="pl-faqitem">
                  <summary className="pl-fq">{q}</summary>
                  <div className="pl-fa">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section id="pl-cta">
          <h2>¿Lista tu agencia para<br /><span className="pl-grad">dejar de mandar Excels?</span></h2>
          <p>Agenda una demo en vivo. Te mostramos el panel con los datos de tu agencia, no un genérico.</p>
          <a
            href="https://wa.me/529844927769?text=Hola%2C%20quiero%20agendar%20una%20demo%20del%20Panel%20de%20Leads%20para%20agencias"
            className="pl-btn-primary"
            style={{ fontSize: 18, padding: '18px 40px' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WaIcon size={22} />
            Agendar demo por WhatsApp
          </a>
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--fg3)' }}>
            +52 984 492 7769 · Respondemos en menos de 2 horas
          </p>
        </section>

        {/* FOOTER */}
        <footer id="pl-footer">
          <p>© 2026 <a href="https://agentia.software">Agentia Software</a> · Panel de Leads para Agencias · <a href="/legal">Privacidad</a></p>
          <p style={{ marginTop: 8 }}>
            SEO: panel de leads Facebook Ads · CRM para traffickers · CRM para agencias de marketing · leads Facebook Ads México
          </p>
        </footer>

        {/* WA FLOTANTE */}
        <a
          href="https://wa.me/529844927769?text=Hola%2C%20quiero%20info%20del%20Panel%20de%20Leads"
          className="pl-wafloat"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
        >
          <WaIcon size={22} />
          Hablar por WhatsApp
        </a>
      </div>

      {/* JS interactividad */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          // Scroll reveal
          var obs = new IntersectionObserver(function(entries){
            entries.forEach(function(e){
              if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); }
            });
          }, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });
          document.querySelectorAll('#pl-root .pl-rv').forEach(function(el){ obs.observe(el); });

          // Video
          var video = document.getElementById('pl-video-el');
          var overlay = document.getElementById('pl-voverlay');
          var wrap = document.getElementById('pl-vwrap');
          if(video && overlay && wrap){
            overlay.addEventListener('click', function(){ video.play(); wrap.classList.add('playing'); });
            video.addEventListener('click', function(){ video.paused ? (video.play(), wrap.classList.add('playing')) : (video.pause(), wrap.classList.remove('playing')); });
          }

          // Live leads simulator
          var names = ['Roberto A.','Sofía L.','Miguel T.','Carmen V.','Diego F.','Laura M.','Andrés K.','Patricia N.'];
          var camps = ['Branding Q4','Remarketing','Nuevos clientes','Video Ads','Stories'];
          var statuses = [['pl-s-new','Nuevo'],['pl-s-seg','Seguimiento'],['pl-s-int','Interesado']];
          function addLead(){
            var tbody = document.getElementById('pl-leads-body');
            if(!tbody) return;
            var n = names[Math.floor(Math.random()*names.length)];
            var c = camps[Math.floor(Math.random()*camps.length)];
            var s = statuses[Math.floor(Math.random()*statuses.length)];
            var tr = document.createElement('tr');
            tr.className='pl-newrow';
            tr.innerHTML='<td><div class="pl-lname">'+n+'</div><div class="pl-ltime">ahora</div></td><td>'+c+'</td><td><span class="pl-sbadge '+s[0]+'">'+s[1]+'</span></td><td><span class="pl-wa">📱 WA</span></td>';
            tbody.insertBefore(tr, tbody.firstChild);
            if(tbody.rows.length > 6) tbody.deleteRow(tbody.rows.length-1);
          }
          setInterval(addLead, 4500);

          // Smooth scroll
          document.querySelectorAll('#pl-root a[href^="#"]').forEach(function(a){
            a.addEventListener('click', function(e){
              var t = document.querySelector(a.getAttribute('href'));
              if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'}); }
            });
          });
        })();
      `}} />
    </>
  );
}

// ── Micro-iconos inline ──────────────────────────────────────────────────
function WaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.858L.057 23.986l6.294-1.648A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.733.978 1.001-3.64-.234-.374A9.818 9.818 0 0112 2.182c5.426 0 9.818 4.392 9.818 9.818 0 5.427-4.392 9.818-9.818 9.818z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 9h6M9 12h6M9 15h4" />
    </svg>
  );
}
