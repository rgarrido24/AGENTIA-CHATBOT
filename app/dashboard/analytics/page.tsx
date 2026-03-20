'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type AnalyticsData = {
  citasRecuperadas: { total: number; estimatedRevenue: number; servicePrice: number };
  tasaRespuesta: { avgSeconds: number; maxSeconds: number; targetSeconds: number };
  prevencionAusentismo: { remindersSent: number; confirmedAfterReminder: number; tasaConfirmacion: number };
  cierresPorVendedor?: { vendedor: string; cierres: number }[];
};

function AnimatedNumber({ value, suffix = '', delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    setDisplay(0);
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      let v = 0;
      const steps = Math.max(20, Math.min(50, Math.ceil(value / 10)));
      const step = value / steps;
      intervalId = setInterval(() => {
        v += step;
        if (v >= value) {
          setDisplay(value);
          if (intervalId) clearInterval(intervalId);
        } else setDisplay(Math.round(v));
      }, 25);
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [value, delay]);
  return <span>{display.toLocaleString('es-MX')}{suffix}</span>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    const params = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    fetch(`/api/analytics${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-luxury">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Cargando analítica...</p>
          </div>
        </div>
      </main>
    );
  }

  const d = data ?? {
    citasRecuperadas: { total: 0, estimatedRevenue: 0, servicePrice: 500 },
    tasaRespuesta: { avgSeconds: 2.3, maxSeconds: 5, targetSeconds: 5 },
    prevencionAusentismo: { remindersSent: 0, confirmedAfterReminder: 0, tasaConfirmacion: 72 },
    cierresPorVendedor: [],
  };
  const cierres = d.cierresPorVendedor ?? [];

  const speedPercent = Math.min(100, ((d.tasaRespuesta.targetSeconds - d.tasaRespuesta.avgSeconds) / d.tasaRespuesta.targetSeconds) * 100 + 20);

  return (
    <main className="min-h-screen p-8 bg-luxury">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="text-slate-400 hover:text-emerald-400 mb-6 inline-block transition">
          ← Volver
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold title-tracking text-white font-heading">
            Analítica de Valor
          </h1>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-2 text-white"
          >
            <option value="">Todos los clientes</option>
            <option value="izzi">izzi</option>
            <option value="demo-inmobiliaria">Inmobiliaria</option>
            <option value="agentia">Agentia</option>
          </select>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* KPI 1: Citas Recuperadas (ROI) */}
          <div
            className="card-glass p-6 overflow-hidden"
            style={{
              animation: 'neonGlow 0.6s ease-out',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(16, 185, 129, 0.03)',
            }}
          >
            <h3 className="text-sm font-medium mb-4 text-slate-400 subtitle-tracking">
              Citas Recuperadas (ROI)
            </h3>
            <div className="mb-4">
              <p className="text-3xl font-bold text-emerald-400" style={{ textShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
                <AnimatedNumber value={d.citasRecuperadas.total} delay={200} />
              </p>
              <p className="text-xs text-slate-400 mt-1">citas agendadas (30 días)</p>
            </div>
            <div className="h-2 rounded-full bg-[rgba(16,185,129,0.1)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 origin-left"
                style={{
                  width: `${Math.min(100, (d.citasRecuperadas.total / 50) * 100)}%`,
                  animation: 'barGrow 1s ease-out 0.3s both',
                  boxShadow: '0 0 10px var(--brand-primary)',
                }}
              />
            </div>
            <p className="mt-4 text-lg font-semibold text-emerald-400">
              $<AnimatedNumber value={d.citasRecuperadas.estimatedRevenue} delay={600} />
            </p>
            <p className="text-xs text-slate-400">
              Est. {d.citasRecuperadas.total} × ${d.citasRecuperadas.servicePrice}/cita
            </p>
          </div>

          {/* KPI 2: Tasa de Respuesta */}
          <div
            className="card-glass p-6 overflow-hidden"
            style={{
              animation: 'neonGlow 0.6s ease-out 0.2s both',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
            }}
          >
            <h3 className="text-sm font-medium mb-4 text-slate-400 subtitle-tracking">
              Tasa de Respuesta
            </h3>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(16,185,129,0.15)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#speedGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (speedPercent / 100) * 283}
                  style={{
                    transition: 'stroke-dashoffset 1s ease-out',
                    filter: 'drop-shadow(0 0 6px var(--brand-primary))',
                  }}
                />
                <defs>
                  <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--brand-primary)" />
                    <stop offset="100%" stopColor="var(--brand-accent)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-emerald-400 font-heading">
                  {d.tasaRespuesta.avgSeconds}s
                </span>
                <span className="text-xs text-slate-400">promedio</span>
              </div>
            </div>
            <p className="text-center text-sm">
              <span className="text-emerald-400 font-medium">&lt; 5 segundos</span>
              <br />
              <span className="text-slate-400 text-xs">Lo que un humano no puede hacer</span>
            </p>
          </div>

          {/* KPI 3: Prevención de Ausentismo */}
          <div
            className="card-glass p-6 overflow-hidden"
            style={{
              animation: 'neonGlow 0.6s ease-out 0.4s both',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
            }}
          >
            <h3 className="text-sm font-medium mb-4 text-slate-400 subtitle-tracking">
              Prevención de Ausentismo
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  <AnimatedNumber value={d.prevencionAusentismo.remindersSent} delay={500} />
                </p>
                <p className="text-xs text-slate-400">Recordatorios enviados</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-emerald-400 font-heading">
                  <AnimatedNumber value={d.prevencionAusentismo.confirmedAfterReminder} delay={700} />
                </p>
                <p className="text-xs text-slate-400">Confirmaron asistencia</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 rounded-full bg-[rgba(16,185,129,0.2)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                    style={{
                      width: `${d.prevencionAusentismo.tasaConfirmacion}%`,
                      animation: 'barGrow 1s ease-out 0.6s both',
                      boxShadow: '0 0 8px var(--brand-accent)',
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-emerald-400 font-heading">
                  {d.prevencionAusentismo.tasaConfirmacion}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                gracias al mensaje automático
              </p>
            </div>
          </div>
        </div>

        {cierres.length > 0 && (
          <div className="mt-8 card-glass p-6">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400 font-heading">
              Cierres por vendedor
            </h3>
            <div className="space-y-3">
              {cierres.map((item, i) => (
                <div key={item.vendedor} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <span className="font-medium">{item.vendedor}</span>
                  <span className="text-xl font-bold text-emerald-400 font-heading">
                    <AnimatedNumber value={item.cierres} delay={100 * i} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
