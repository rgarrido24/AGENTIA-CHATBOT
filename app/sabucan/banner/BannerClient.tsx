'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { SABUCAN_ORANGE, SABUCAN_NAVY, SABUCAN_LOGO_URL } from '@/lib/sabucan-brand';

/* ─── tipos ─── */
interface Config {
  nombre: string;
  slogan: string;
  url: string;
  precio: string;
  mostrarPrecio: boolean;
}

declare global {
  interface Window {
    QRCode: new (
      el: HTMLElement,
      opts: { text: string; width: number; height: number; colorDark: string; colorLight: string; correctLevel: number }
    ) => void;
  }
}

const DEFAULT_CONFIG: Config = {
  nombre: 'SABUCAN',
  slogan: '¡El Más Bara..!',
  url: 'https://agentia.software/sabucan',
  precio: '99',
  mostrarPrecio: false,
};

export function BannerClient() {
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [draft, setDraft] = useState<Config>(DEFAULT_CONFIG);
  const [qrReady, setQrReady] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // genera / regenera QR
  useEffect(() => {
    if (!qrReady || !qrRef.current || typeof window.QRCode === 'undefined') return;
    qrRef.current.innerHTML = '';
    new window.QRCode(qrRef.current, {
      text: cfg.url || 'https://agentia.software/sabucan',
      width: 124,
      height: 124,
      colorDark: SABUCAN_NAVY,
      colorLight: '#FFFFFF',
      correctLevel: 1, // M
    });
  }, [cfg.url, qrReady]);

  function apply() {
    setCfg({ ...draft });
  }

  const orange = SABUCAN_ORANGE;
  const navy = SABUCAN_NAVY;

  return (
    <>
      {/* QRCode.js */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
        onLoad={() => setQrReady(true)}
      />

      <div className="flex flex-col gap-8">
        {/* ── título de sección ── */}
        <div>
          <h1 className="text-xl font-bold tracking-wide" style={{ color: orange }}>
            Banner de lealtad
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Configura y descarga el cartel para pegar en tu tienda
          </p>
        </div>

        {/* ── BANNER (vista previa) ── */}
        <div
          id="sabucan-print-banner"
          className="relative overflow-hidden rounded-2xl border w-full"
          style={{
            backgroundColor: navy,
            borderColor: 'rgba(255,255,255,0.1)',
            background: `radial-gradient(ellipse 60% 50% at 110% 50%, rgba(242,105,31,0.18) 0%, transparent 70%),
                         radial-gradient(ellipse 40% 60% at -10% 30%, rgba(242,105,31,0.10) 0%, transparent 70%),
                         ${navy}`,
          }}
        >
          {/* contenido */}
          <div className="relative flex flex-col sm:flex-row gap-8 items-center sm:items-start p-8 sm:p-10">
            {/* izquierda */}
            <div className="flex-1 min-w-0 flex flex-col gap-0">
              {/* logo row */}
              <div className="flex items-center gap-3 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SABUCAN_LOGO_URL}
                  alt="Sabucan"
                  className="w-14 h-14 object-contain flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <div className="font-black text-2xl tracking-tight text-white leading-none">
                    {cfg.nombre}
                  </div>
                  <div
                    className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
                    style={{ color: orange }}
                  >
                    {cfg.slogan}
                  </div>
                </div>
              </div>

              <h2
                className="font-black leading-tight mb-3"
                style={{ fontSize: 'clamp(24px,4vw,38px)', color: 'white', textWrap: 'balance' } as React.CSSProperties}
              >
                Acumula puntos<br />
                en cada{' '}
                <span style={{ color: orange }}>compra</span>
              </h2>

              <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Únete al programa de lealtad y gana puntos con cada visita. Canjéalos por descuentos o productos gratis.
              </p>

              {/* beneficios */}
              <div className="flex flex-col gap-2.5 mb-6">
                {[
                  ['🛒', '$1 en puntos por cada $100 de compra'],
                  ['🎁', 'Canjea tus puntos en tu próxima compra'],
                  ['📱', 'Tarjeta digital en tu celular'],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm font-medium text-white">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ background: 'rgba(242,105,31,0.18)', border: '1px solid rgba(242,105,31,0.3)' }}
                    >
                      {icon}
                    </div>
                    {text}
                  </div>
                ))}
              </div>

              {/* precio (condicional) */}
              {cfg.mostrarPrecio && cfg.precio && (
                <div
                  className="flex items-baseline gap-1.5 px-4 py-3 rounded-xl mb-6 w-fit"
                  style={{ background: 'rgba(242,105,31,0.12)', border: '1px solid rgba(242,105,31,0.28)' }}
                >
                  <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Membresía anual
                  </div>
                  <div className="font-black text-3xl leading-none" style={{ color: orange }}>
                    ${cfg.precio}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>MXN / año</div>
                </div>
              )}

              {/* url pill */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold w-fit"
                style={{ background: orange, color: navy }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                {cfg.url.replace(/^https?:\/\//, '')}
              </div>
            </div>

            {/* derecha: QR */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <div className="bg-white rounded-2xl p-3 w-[148px] h-[148px] flex items-center justify-center">
                <div ref={qrRef} />
              </div>
              <div className="text-lg animate-bounce">↓</div>
              <div
                className="text-[11px] font-semibold tracking-widest uppercase text-center"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                Escanea para<br />registrarte
              </div>
            </div>
          </div>

          {/* franja inferior */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 px-8 py-3.5 text-xs"
            style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
          >
            {['Programa de lealtad digital', 'Tu tarjeta siempre en el celular', 'Sin papeles, sin plásticos'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: orange }} />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* ── PANEL DE CONFIGURACIÓN ── */}
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <h2 className="font-bold text-base mb-5 flex items-center gap-2 text-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 1 21 12a10 10 0 0 1-1.93 5.93M4.93 4.93A10 10 0 0 0 3 12a10 10 0 0 0 1.93 5.93"/>
            </svg>
            Personalizar banner
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre del negocio">
              <input
                type="text"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                placeholder="Nombre"
              />
            </Field>
            <Field label="Eslogan">
              <input
                type="text"
                value={draft.slogan}
                onChange={(e) => setDraft((d) => ({ ...d, slogan: e.target.value }))}
                placeholder="Eslogan"
              />
            </Field>
            <Field label="URL de registro" className="sm:col-span-2">
              <input
                type="text"
                value={draft.url}
                onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
                placeholder="https://..."
              />
            </Field>

            {/* toggle precio */}
            <div
              className="sm:col-span-2 flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer select-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setDraft((d) => ({ ...d, mostrarPrecio: !d.mostrarPrecio }))}
            >
              <span className="text-sm font-medium text-white">Mostrar costo de membresía</span>
              <Toggle on={draft.mostrarPrecio} />
            </div>

            {draft.mostrarPrecio && (
              <Field label="Precio de membresía (MXN/año)" className="sm:col-span-2">
                <input
                  type="number"
                  value={draft.precio}
                  min={0}
                  onChange={(e) => setDraft((d) => ({ ...d, precio: e.target.value }))}
                  placeholder="ej. 99"
                />
              </Field>
            )}
          </div>

          <button
            onClick={apply}
            className="w-full mt-5 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
            style={{ background: orange, color: navy }}
          >
            Actualizar banner
          </button>

          <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Para imprimir: usa <strong className="text-white/60">Ctrl+P → Guardar como PDF</strong> en Chrome
          </p>
        </div>
      </div>
    </>
  );
}

/* ── helpers ── */
function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </label>
      <div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:text-white [&_input]:outline-none [&_input]:transition-colors [&_input]:[background:rgba(255,255,255,0.06)] [&_input]:[border-color:rgba(255,255,255,0.14)] [&_input]:placeholder-white/25 focus-within:[&_input]:[border-color:rgba(242,105,31,0.5)]">
        {children}
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{
        background: on ? SABUCAN_ORANGE : 'rgba(255,255,255,0.12)',
        border: `1px solid ${on ? SABUCAN_ORANGE : 'rgba(255,255,255,0.14)'}`,
      }}
    >
      <div
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ left: 3, transform: on ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </div>
  );
}
