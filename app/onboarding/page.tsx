'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PLAN_DATA, type PlanKey, type Moneda } from '@/lib/stripe';

const GIROS = [
  'Barbería / Estética',
  'Restaurante / Comida',
  'Spa / Masajes',
  'Clínica / Médico',
  'Odontología',
  'Nutrición',
  'Taller Automotriz',
  'Servicios Financieros',
  'Cobranza',
  'Otro',
];

const inputStyle: React.CSSProperties = {
  background: '#111', border: '1px solid #2a2a2a', color: '#fff',
  borderRadius: 10, padding: '11px 14px', fontSize: 14, width: '100%', outline: 'none',
};
const labelStyle: React.CSSProperties = { color: '#666', fontSize: 12, display: 'block', marginBottom: 6 };

function OnboardingInner() {
  const params  = useSearchParams();
  const router  = useRouter();
  const plan    = (params.get('plan') ?? 'starter') as PlanKey;
  const moneda  = (params.get('moneda') ?? 'mxn') as Moneda;
  const planInfo = PLAN_DATA[plan in PLAN_DATA ? plan : 'starter'];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nombre,   setNombre]   = useState('');
  const [negocio,  setNegocio]  = useState('');
  const [giro,     setGiro]     = useState('');
  const [pais,     setPais]     = useState('México');
  const [telefono, setTelefono] = useState('');
  const [email,    setEmail]    = useState('');
  const [terms,    setTerms]    = useState(false);

  const precio     = moneda === 'mxn' ? planInfo.precioMXN     : planInfo.precioUSD;
  const activacion = moneda === 'mxn' ? planInfo.activacionMXN : planInfo.activacionUSD;
  const simbolo    = moneda === 'mxn' ? '$' : 'US$';
  const currency   = moneda === 'mxn' ? 'MXN' : 'USD';

  async function handlePago() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, moneda, nombre, negocio, giro, pais, telefono, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) { setError(data.error ?? 'Error al iniciar el pago'); return; }
      router.push(data.url);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
      {/* Nav */}
      <nav className="border-b px-4 py-3" style={{ borderColor: '#111' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo-agentia-2026.png" alt="Agentia" width={32} height={32} className="rounded-xl" />
          </Link>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={step >= s
                    ? { background: '#22c55e', color: '#000' }
                    : { background: '#111', color: '#444', border: '1px solid #222' }}
                >
                  {s}
                </div>
                {s < 3 && <div className="w-6 h-px" style={{ background: step > s ? '#22c55e' : '#222' }} />}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* ── PASO 1: Datos del negocio ── */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Datos de tu negocio</h1>
              <p className="text-xs mb-6" style={{ color: '#555' }}>
                Plan seleccionado:{' '}
                <span style={{ color: '#22c55e' }}>
                  {planInfo.nombre} — {simbolo}{precio} {currency}/mes
                </span>
              </p>

              <div
                className="rounded-2xl border p-6 space-y-4"
                style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Nombre completo *</label>
                    <input style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Nombre del negocio *</label>
                  <input style={inputStyle} value={negocio} onChange={e => setNegocio(e.target.value)} required placeholder="Ej: Barbería El Clásico" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Giro *</label>
                    <select style={inputStyle} value={giro} onChange={e => setGiro(e.target.value)} required>
                      <option value="">Selecciona...</option>
                      {GIROS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>País *</label>
                    <select style={inputStyle} value={pais} onChange={e => setPais(e.target.value)}>
                      <option>México</option>
                      <option>Argentina</option>
                      <option>Chile</option>
                      <option>Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>WhatsApp del negocio *</label>
                  <input
                    style={inputStyle} value={telefono} onChange={e => setTelefono(e.target.value)}
                    required placeholder="Ej: 5215512345678 (con código de país, sin +)"
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!nombre || !email || !negocio || !giro || !telefono}
                  className="w-full py-3 rounded-xl text-sm font-bold transition disabled:opacity-40"
                  style={{ background: '#22c55e', color: '#000' }}
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 2: Resumen + términos ── */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Resumen de tu plan</h1>
              <p className="text-xs mb-6" style={{ color: '#555' }}>Revisa los detalles antes de proceder al pago</p>

              <div className="rounded-2xl border p-6 space-y-4" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
                {/* Plan summary */}
                <div className="rounded-xl p-4 border" style={{ background: '#111', borderColor: '#22c55e33' }}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">Plan {planInfo.nombre}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#0d2200', color: '#22c55e' }}>
                      {currency}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#888' }}>Suscripción mensual</span>
                      <span className="font-semibold text-white">{simbolo}{precio}/mes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#888' }}>Activación única (hoy)</span>
                      <span className="font-semibold text-white">{simbolo}{activacion}</span>
                    </div>
                    <div className="border-t mt-2 pt-2" style={{ borderColor: '#222' }}>
                      <div className="flex justify-between text-sm font-bold">
                        <span style={{ color: '#aaa' }}>Total primer cobro</span>
                        <span style={{ color: '#22c55e' }}>{simbolo}{precio + activacion}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Datos */}
                <div className="text-xs space-y-1" style={{ color: '#666' }}>
                  <p><span style={{ color: '#444' }}>Negocio:</span> {negocio}</p>
                  <p><span style={{ color: '#444' }}>Giro:</span> {giro} · {pais}</p>
                  <p><span style={{ color: '#444' }}>Contacto:</span> {nombre} · {email}</p>
                  <p><span style={{ color: '#444' }}>WhatsApp:</span> {telefono}</p>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={e => setTerms(e.target.checked)}
                    className="mt-0.5 accent-green-500"
                  />
                  <span className="text-xs" style={{ color: '#777' }}>
                    Acepto los{' '}
                    <Link href="/legal/terminos" target="_blank" className="underline" style={{ color: '#22c55e' }}>
                      términos y condiciones
                    </Link>{' '}
                    y el{' '}
                    <Link href="/legal/privacidad" target="_blank" className="underline" style={{ color: '#22c55e' }}>
                      aviso de privacidad
                    </Link>
                    . Entiendo que se realizará un cobro mensual automático.
                  </span>
                </label>

                {error && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#1a0000', color: '#ef4444' }}>{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl text-sm transition"
                    style={{ background: '#111', color: '#555', border: '1px solid #222' }}
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={handlePago}
                    disabled={!terms || loading}
                    className="flex-1 py-3 rounded-xl text-sm font-bold transition disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: '#22c55e', color: '#000' }}
                  >
                    {loading ? 'Redirigiendo…' : '🔒 Proceder al pago'}
                  </button>
                </div>

                <p className="text-center text-[11px]" style={{ color: '#333' }}>
                  Pago seguro procesado por Stripe
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#000' }} />}>
      <OnboardingInner />
    </Suspense>
  );
}
