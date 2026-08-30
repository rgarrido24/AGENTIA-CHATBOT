'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PLAN_DATA, type PlanKey } from '@/lib/stripe';

const ACCENT = '#22c55e';

export default function PreciosPage() {
  const [moneda, setMoneda] = useState<'mxn' | 'usd'>('mxn');

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* Nav */}
      <nav className="border-b px-4 py-3" style={{ borderColor: '#111' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo-agentia-2026.png" alt="Agentia" width={36} height={36} className="rounded-xl" />
          </Link>
          <Link href="/" className="text-xs" style={{ color: '#555' }}>← Volver al inicio</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white mb-2">Planes y Precios</h1>
          <p className="text-sm mb-6" style={{ color: '#666' }}>
            Sin permanencia · Sin sorpresas · Activa hoy mismo
          </p>

          {/* Currency toggle */}
          <div className="inline-flex rounded-xl overflow-hidden border" style={{ borderColor: '#222' }}>
            {(['mxn', 'usd'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMoneda(m)}
                className="px-5 py-2 text-sm font-semibold transition"
                style={moneda === m
                  ? { background: ACCENT, color: '#000' }
                  : { background: '#0d0d0d', color: '#555' }}
              >
                {m === 'mxn' ? '🇲🇽 MXN' : '🌎 USD'}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.entries(PLAN_DATA) as [PlanKey, typeof PLAN_DATA[PlanKey]][]).map(([key, plan]) => {
            const isPro = key === 'profesional';
            const isPremium = key === 'premium';
            const precio = moneda === 'mxn' ? plan.precioMXN : plan.precioUSD;
            const activacion = moneda === 'mxn' ? plan.activacionMXN : plan.activacionUSD;
            const simbolo = moneda === 'mxn' ? '$' : 'US$';
            const monedaLabel = moneda === 'mxn' ? 'MXN' : 'USD';
            const accentCard = isPro ? ACCENT : isPremium ? '#f59e0b' : '#e2e8f0';

            return (
              <div
                key={key}
                className="relative rounded-2xl border flex flex-col overflow-hidden"
                style={{
                  background: isPro ? `${ACCENT}08` : isPremium ? '#1a110000' : '#0d0d0d',
                  borderColor: isPro ? ACCENT : isPremium ? '#d97706' : '#1e1e1e',
                  borderWidth: isPro ? 2 : 1,
                }}
              >
                {plan.badge && (
                  <div
                    className="text-center py-1.5 text-[11px] font-bold tracking-wider text-black"
                    style={{ background: ACCENT }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1 gap-4">
                  <div>
                    <p className="text-base font-bold text-white">{plan.nombre}</p>
                    <div className="flex items-end gap-1 mt-1">
                      <span className="text-4xl font-extrabold tabular-nums" style={{ color: accentCard }}>
                        {simbolo}{precio.toLocaleString()}
                      </span>
                      <span className="text-sm mb-1" style={{ color: '#666' }}>{monedaLabel}/mes</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#555' }}>
                      + {simbolo}{activacion} {monedaLabel} activación única
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#888' }}>
                      <span style={{ color: ACCENT }}>💬</span> {plan.mensajes}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#888' }}>
                      <span style={{ color: '#38bdf8' }}>📋</span> {plan.registros}
                    </div>
                  </div>

                  <div className="border-t" style={{ borderColor: '#1e1e1e' }} />

                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#aaa' }}>
                        <span className="mt-0.5 font-bold" style={{ color: accentCard }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/onboarding?plan=${key}&moneda=${moneda}`}
                    className="block text-center py-3 rounded-xl text-sm font-bold transition"
                    style={isPro
                      ? { background: ACCENT, color: '#000' }
                      : isPremium
                        ? { background: '#d97706', color: '#000' }
                        : { background: '#111', color: '#fff', border: '1px solid #2a2a2a' }}
                  >
                    Contratar ahora
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-8" style={{ color: '#444' }}>
          Al contratar aceptás los{' '}
          <Link href="/legal/terminos" className="underline" style={{ color: '#555' }}>
            términos y condiciones
          </Link>
          . Los pagos se procesan de forma segura vía Stripe.
        </p>
      </main>
    </div>
  );
}
