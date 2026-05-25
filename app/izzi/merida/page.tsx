'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'izzi_merida_cupos_v2';
const CUPOS_START = 7;
const CUPOS_MIN = 2;
const ACCENT = '#00B140';
const PINK = '#f472b6';
const WA_GREEN = '#25D366';
const WA_HREF =
  'https://wa.me/529997642435?text=Hola!%20Vi%20la%20promo%20de%20izzi%20100%20megas%20y%20quiero%20contratar%20en%20M%C3%A9rida';

type CuposState = { n: number; nextAt: number };

function randomIntervalMs(): number {
  const minutes = 8 + Math.floor(Math.random() * 5);
  return minutes * 60 * 1000;
}

function clampCount(n: number): number {
  if (!Number.isFinite(n)) return CUPOS_START;
  return Math.min(CUPOS_START, Math.max(CUPOS_MIN, Math.round(n)));
}

function reconcileAndPersist(): CuposState {
  const now = Date.now();
  let n = CUPOS_START;
  let nextAt = now + randomIntervalMs();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<CuposState>;
      if (typeof p.n === 'number' && typeof p.nextAt === 'number' && Number.isFinite(p.nextAt)) {
        n = clampCount(p.n);
        nextAt = p.nextAt;
        while (now >= nextAt && n > CUPOS_MIN) {
          n -= 1;
          nextAt = nextAt + randomIntervalMs();
        }
        n = clampCount(n);
      }
    }
  } catch {
    /* ignore */
  }

  const out: CuposState = { n, nextAt };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* ignore */
  }
  return out;
}

const FLOAT_BOXES: Array<{
  top: string;
  left: string;
  w: number;
  h: number;
  bg: string;
  dur: string;
  delay: string;
}> = [
  { top: '6%', left: '4%', w: 68, h: 68, bg: 'rgba(244,114,182,0.38)', dur: '13s', delay: '0s' },
  { top: '18%', left: '78%', w: 52, h: 92, bg: 'rgba(250,204,21,0.32)', dur: '15s', delay: '1.2s' },
  { top: '42%', left: '8%', w: 84, h: 56, bg: 'rgba(34,211,238,0.28)', dur: '17s', delay: '0.4s' },
  { top: '58%', left: '82%', w: 72, h: 72, bg: 'rgba(251,146,60,0.34)', dur: '14s', delay: '2s' },
  { top: '72%', left: '12%', w: 56, h: 56, bg: 'rgba(244,114,182,0.25)', dur: '16s', delay: '0.8s' },
  { top: '12%', left: '42%', w: 44, h: 100, bg: 'rgba(250,204,21,0.22)', dur: '18s', delay: '1.5s' },
  { top: '88%', left: '55%', w: 90, h: 48, bg: 'rgba(34,211,238,0.26)', dur: '12s', delay: '0.2s' },
];

export default function IzziMeridaPage() {
  const [cupos, setCupos] = useState<number | null>(null);

  useEffect(() => {
    let timeoutId: number | null = null;

    const sync = () => {
      const s = reconcileAndPersist();
      setCupos(s.n);
      return s;
    };

    const s0 = sync();
    const intervalId = window.setInterval(() => sync(), 30_000);

    const scheduleNext = (s: CuposState) => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (s.n <= CUPOS_MIN) return;
      const delay = Math.max(1000, s.nextAt - Date.now());
      timeoutId = window.setTimeout(() => {
        const s1 = sync();
        scheduleNext(s1);
      }, delay);
    };
    scheduleNext(s0);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const cuposDisplay = cupos ?? CUPOS_START;
  const cuposColor = cuposDisplay <= 3 ? PINK : ACCENT;

  return (
    <div
      className="relative min-h-[100dvh] min-h-screen overflow-hidden antialiased"
      style={{ backgroundColor: '#000', color: '#fafafa' }}
    >
      <style jsx global>{`
        @keyframes izzi-merida-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          33% {
            transform: translate3d(10px, -22px, 0) rotate(6deg);
          }
          66% {
            transform: translate3d(-12px, 14px, 0) rotate(-5deg);
          }
        }
        @keyframes izzi-merida-dot-blink {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.35;
            transform: scale(0.92);
          }
        }
        .izzi-merida-float-box {
          position: absolute;
          border-radius: 14px;
          pointer-events: none;
          z-index: 0;
          will-change: transform;
        }
        .izzi-merida-dot-pink {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #f472b6;
          box-shadow: 0 0 12px #f472b6;
          animation: izzi-merida-dot-blink 1.4s ease-in-out infinite;
        }
      `}</style>

      {FLOAT_BOXES.map((b, i) => (
        <div
          key={i}
          className="izzi-merida-float-box"
          style={{
            top: b.top,
            left: b.left,
            width: b.w,
            height: b.h,
            background: b.bg,
            animation: `izzi-merida-float ${b.dur} ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}

      <div className="relative z-10 flex min-h-[100dvh] min-h-screen items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-[380px] overflow-hidden rounded-[22px] shadow-2xl"
          style={{
            backgroundColor: '#0c0c0c',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
          }}
        >
          <div
            style={{
              height: 4,
              background: 'linear-gradient(90deg, #f472b6, #facc15, #22d3ee, #fb923c)',
            }}
          />

          <div style={{ padding: '28px 22px 24px' }}>
            <img
              src="/izzi-logo.png"
              height={44}
              alt="izzi"
              style={{ display: 'block', margin: '0 auto 28px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span className="izzi-merida-dot-pink shrink-0" aria-hidden />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.72)',
                  }}
                >
                  Solo Mérida · Cupos limitados
                </span>
              </div>
            </div>

            <p
              style={{
                textAlign: 'center',
                margin: '0 0 6px',
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Internet en casa desde
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: 2,
                marginBottom: 16,
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(2.5rem, 12vw, 3.75rem)',
                  fontWeight: 800,
                  color: PINK,
                  fontFamily: 'inherit',
                }}
              >
                $
              </span>
              <span
                style={{
                  fontSize: 'clamp(3.75rem, 18vw, 5.5rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.04em',
                }}
              >
                100
              </span>
            </div>

            <p
              style={{
                textAlign: 'center',
                margin: '0 0 22px',
                fontSize: 13,
                lineHeight: 1.45,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.62)',
              }}
            >
              Primer mes completo · 100 megas / Instalación incluida sin costo
            </p>

            <div
              style={{
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.88)',
              }}
            >
              <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.45)', marginRight: 8 }}>
                $480/mes
              </span>
              <span style={{ color: 'rgba(255,255,255,0.35)', marginRight: 8 }}>→</span>
              <span style={{ color: ACCENT }}>$429/mes</span>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                meses 2 al 6
              </div>
            </div>

            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                padding: '14px 16px',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 800,
                color: '#fff',
                textDecoration: 'none',
                backgroundColor: WA_GREEN,
                boxShadow: '0 8px 28px rgba(37,211,102,0.35)',
                marginBottom: 12,
              }}
            >
              💬 Quiero contratar ahora
            </a>

            <p
              style={{
                textAlign: 'center',
                margin: '0 0 22px',
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.48)',
              }}
            >
              Escríbenos · Te respondemos al instante
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px 14px',
                paddingTop: 4,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>✓ 100 Megas</span>
              <span style={{ opacity: 0.35 }}>|</span>
              <span style={{ whiteSpace: 'nowrap' }}>✓ Instalación 24h</span>
              <span style={{ opacity: 0.35 }}>|</span>
              <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Cupos{' '}
                <span style={{ color: cuposColor, fontSize: 13, fontVariantNumeric: 'tabular-nums' }} aria-live="polite">
                  {cuposDisplay}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
