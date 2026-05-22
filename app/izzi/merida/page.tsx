'use client';

import { useEffect, useState } from 'react';

const BG = '#0a0a0a';
const ACCENT = '#00B140';
const WA_GREEN = '#25D366';
const WA_URL =
  'https://wa.me/529997642435?text=Hola!%20Vi%20la%20promo%20de%20%24100%20y%20quiero%20informes%20para%20M%C3%A9rida';

const STORAGE_KEY = 'izzi_merida_cupos_v1';
const CUPOS_START = 7;
const CUPOS_MIN = 2;

export default function IzziMeridaPage() {
  const [cupos, setCupos] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      let stored = raw !== null ? parseInt(raw, 10) : CUPOS_START;
      if (!Number.isFinite(stored)) stored = CUPOS_START;
      if (stored > CUPOS_START) stored = CUPOS_START;
      if (stored < CUPOS_MIN) stored = CUPOS_MIN;
      setCupos(stored);
      const next = Math.max(CUPOS_MIN, stored - 1);
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      setCupos(CUPOS_START);
    }
  }, []);

  const cuposDisplay = cupos ?? CUPOS_START;

  return (
    <div
      className="min-h-screen min-h-[100dvh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-white antialiased"
      style={{ backgroundColor: BG }}
    >
      <style jsx global>{`
        @keyframes izzi-pulse-badge {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 177, 64, 0.45);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 0 10px rgba(0, 177, 64, 0);
          }
        }
        .izzi-merida-pulse {
          animation: izzi-pulse-badge 2s ease-in-out infinite;
        }
      `}</style>

      {/* 1. HERO */}
      <header className="px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 text-center max-w-lg mx-auto">
        <div
          className="izzi-merida-pulse inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-6 border"
          style={{
            backgroundColor: 'rgba(0,177,64,0.12)',
            borderColor: 'rgba(0,177,64,0.45)',
            color: ACCENT,
          }}
        >
          🔴 Oferta activa
        </div>
        <h1
          className="text-[clamp(2rem,8vw,3.25rem)] font-bold leading-[1.08] tracking-tight"
          style={{ color: '#fafafa' }}
        >
          Internet en casa
          <br />
          <span style={{ color: ACCENT }}>desde $100</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-white/70 font-medium">
          Tu primer mes. Solo en Mérida.
        </p>
      </header>

      {/* 2. OFERTA CLARA */}
      <section className="px-4 max-w-lg mx-auto pb-8">
        <div
          className="rounded-2xl border p-5 sm:p-6 shadow-lg"
          style={{
            background: 'linear-gradient(165deg, rgba(0,177,64,0.14) 0%, rgba(255,255,255,0.04) 100%)',
            borderColor: 'rgba(0,177,64,0.35)',
          }}
        >
          <ul className="space-y-4 text-left">
            <li className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-white/10 pb-4">
              <span className="text-white/80 text-sm font-medium uppercase tracking-wide">Mes 1</span>
              <span className="text-xl sm:text-2xl font-bold" style={{ color: ACCENT }}>
                $100
                <span className="text-white/90 font-semibold text-base sm:text-lg ml-2">— 100 megas</span>
              </span>
            </li>
            <li className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-white/10 pb-4">
              <span className="text-white/80 text-sm font-medium uppercase tracking-wide">Mes 2 y 3</span>
              <span className="text-xl sm:text-2xl font-bold text-white">
                $349
                <span className="text-white/85 font-semibold text-base sm:text-lg ml-2">— 80 megas</span>
              </span>
            </li>
            <li className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <span className="text-white/80 text-sm font-medium uppercase tracking-wide">Mes 4 en adelante</span>
              <span className="text-xl sm:text-2xl font-bold text-white">
                $389
                <span className="text-white/85 font-semibold text-base sm:text-lg ml-2">— 80 megas</span>
              </span>
            </li>
          </ul>
          <p className="mt-5 text-center text-xs text-white/55">Instalación incluida</p>
        </div>
      </section>

      {/* 3. BENEFICIOS */}
      <section className="px-4 max-w-lg mx-auto pb-8">
        <ul className="grid gap-4 sm:gap-5">
          {[
            { icon: '📶', text: '100 megas el primer mes' },
            { icon: '🔧', text: 'Instalación sin costo adicional' },
            { icon: '⚡', text: 'Conexión estable para toda la familia' },
          ].map((item) => (
            <li
              key={item.text}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
            >
              <span className="text-2xl shrink-0" aria-hidden>
                {item.icon}
              </span>
              <span className="text-sm sm:text-base font-medium text-white/90 leading-snug">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. CONTADOR DE URGENCIA (antes del footer para scroll natural; botón sigue fijo abajo) */}
      <section className="px-4 max-w-lg mx-auto pb-28 text-center">
        <p className="text-sm sm:text-base text-white/75">
          Cupos disponibles esta semana:{' '}
          <span className="font-bold tabular-nums text-lg" style={{ color: ACCENT }}>
            {cuposDisplay}
          </span>
        </p>
      </section>

      {/* 6. FOOTER */}
      <footer className="px-4 pb-6 max-w-lg mx-auto text-center">
        <p className="text-xs text-white/45 leading-relaxed">
          Servicio disponible solo en zonas con cobertura Izzi en Mérida, Yucatán
        </p>
      </footer>

      {/* 4. BOTÓN WHATSAPP FIJO */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/10"
        style={{ backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(10px)' }}
      >
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full max-w-lg mx-auto items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 text-base font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
          style={{ backgroundColor: WA_GREEN }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Quiero el internet de $100
        </a>
      </div>
    </div>
  );
}
