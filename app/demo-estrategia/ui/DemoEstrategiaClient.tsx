'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

type Objetivo = 'Ventas' | 'Leads' | 'Seguidores';
type Genero = 'Femenino' | 'Masculino' | 'Mixto' | 'No definido';
type Canal = 'Meta Ads' | 'Google Ads' | 'TikTok Ads';

type Brief = {
  negocioNombre: string;
  rubro: string;
  producto: string;
  redes: string;
  objetivos: Objetivo[];
  publicoEdad: string;
  publicoGenero: Genero;
  publicoIntereses: string;
  metaPixel: boolean | null;
  gtm: boolean | null;
  audiencias: boolean | null;
  presupuestoMensual: number;
  canales: Canal[];
};

const BG = '#F9FAFB';
const ACCENT = '#1D4ED8';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreIA(brief: Brief): number {
  let score = 40;
  if (brief.presupuestoMensual >= 25000) score += 30;
  else if (brief.presupuestoMensual >= 12000) score += 18;
  else if (brief.presupuestoMensual >= 6000) score += 10;
  else score += 4;

  if (brief.objetivos.includes('Ventas')) score += 12;
  if (brief.objetivos.includes('Leads')) score += 10;
  if (brief.objetivos.includes('Seguidores')) score += 6;

  const techMissing = [brief.metaPixel, brief.gtm].filter((v) => v === false).length;
  const techUnknown = [brief.metaPixel, brief.gtm].filter((v) => v === null).length;
  score -= techMissing * 4;
  score -= techUnknown * 2;

  if (brief.canales.length >= 2) score += 6;
  if (brief.canales.length === 0) score -= 8;

  return clamp(score, 0, 100);
}

function prioridadLabel(score: number) {
  if (score >= 80) return { label: 'Alta', color: '#0f766e', bg: 'rgba(13,148,136,0.10)', border: 'rgba(13,148,136,0.20)' };
  if (score >= 55) return { label: 'Media', color: '#a16207', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.20)' };
  return { label: 'Baja', color: '#b91c1c', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.20)' };
}

function buildWhatsAppUrl(digits: string, text: string) {
  const d = digits.replace(/\D/g, '');
  if (d.length < 10) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

function StepPill({ i, active, done, label }: { i: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: done ? 'rgba(29,78,216,0.14)' : active ? 'rgba(29,78,216,0.10)' : 'rgba(15,23,42,0.06)',
          color: done || active ? ACCENT : '#64748b',
          border: `1px solid ${done || active ? 'rgba(29,78,216,0.25)' : 'rgba(15,23,42,0.08)'}`,
        }}
      >
        {done ? <CheckCircle2 size={16} /> : i}
      </div>
      <p className="text-[12px] font-semibold truncate" style={{ color: active ? '#0f172a' : '#64748b' }}>
        {label}
      </p>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border shadow-[0_18px_60px_-32px_rgba(15,23,42,0.25)]"
      style={{
        background: 'rgba(255,255,255,0.78)',
        borderColor: 'rgba(15,23,42,0.08)',
        backdropFilter: 'blur(14px)',
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#334155' }}>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition ${props.className || ''}`}
      style={{
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.10)',
        color: '#0f172a',
        boxShadow: '0 1px 0 rgba(15,23,42,0.04)',
      }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition ${props.className || ''}`}
      style={{
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.10)',
        color: '#0f172a',
        boxShadow: '0 1px 0 rgba(15,23,42,0.04)',
      }}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition ${props.className || ''}`}
      style={{
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.10)',
        color: '#0f172a',
        boxShadow: '0 1px 0 rgba(15,23,42,0.04)',
        minHeight: 96,
      }}
    />
  );
}

function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-xl text-sm font-semibold border transition"
      style={{
        background: active ? 'rgba(29,78,216,0.10)' : 'rgba(255,255,255,0.7)',
        borderColor: active ? 'rgba(29,78,216,0.25)' : 'rgba(15,23,42,0.10)',
        color: active ? ACCENT : '#334155',
      }}
    >
      {children}
    </button>
  );
}

function YesNo({
  value,
  onChange,
  label,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const yes = value === true;
  const no = value === false;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: 'rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.7)' }}>
      <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{label}</p>
      <div className="flex items-center gap-2">
        <TogglePill active={yes} onClick={() => onChange(true)}>Sí</TogglePill>
        <TogglePill active={no} onClick={() => onChange(false)}>No</TogglePill>
      </div>
    </div>
  );
}

export default function DemoEstrategiaClient({ whatsappDigits }: { whatsappDigits: string }) {
  const [step, setStep] = useState(1);
  const [brief, setBrief] = useState<Brief>({
    negocioNombre: '',
    rubro: '',
    producto: '',
    redes: '',
    objetivos: [],
    publicoEdad: '',
    publicoGenero: 'No definido',
    publicoIntereses: '',
    metaPixel: null,
    gtm: null,
    audiencias: null,
    presupuestoMensual: 12000,
    canales: [],
  });

  const iaScore = useMemo(() => scoreIA(brief), [brief]);
  const prioridad = useMemo(() => prioridadLabel(iaScore), [iaScore]);

  const waPrefill = useMemo(() => {
    const objetivos = brief.objetivos.length ? brief.objetivos.join(', ') : 'Sin definir';
    const canales = brief.canales.length ? brief.canales.join(', ') : 'Sin definir';
    const px = brief.metaPixel === null ? 'No sé' : brief.metaPixel ? 'Sí' : 'No';
    const gtm = brief.gtm === null ? 'No sé' : brief.gtm ? 'Sí' : 'No';
    return [
      'Hola María Sol, vengo de la ruta /demo-estrategia.',
      '',
      `Negocio: ${brief.negocioNombre || '—'}`,
      `Rubro: ${brief.rubro || '—'}`,
      `Producto: ${brief.producto || '—'}`,
      `Redes: ${brief.redes || '—'}`,
      `Objetivos: ${objetivos}`,
      `Audiencia: ${brief.publicoEdad || '—'} · ${brief.publicoGenero} · Intereses: ${brief.publicoIntereses || '—'}`,
      `Técnico: Pixel Meta=${px}, GTM=${gtm}, Audiencias=${brief.audiencias === null ? 'No sé' : brief.audiencias ? 'Sí' : 'No'}`,
      `Presupuesto mensual: $${brief.presupuestoMensual.toLocaleString('es-MX')}`,
      `Canales: ${canales}`,
      '',
      `IA Score: ${iaScore}/100 (Prioridad ${prioridad.label})`,
    ].join('\n');
  }, [brief, iaScore, prioridad.label]);

  const waUrl = useMemo(() => buildWhatsAppUrl(whatsappDigits, waPrefill), [whatsappDigits, waPrefill]);

  const steps = [
    { n: 1, label: 'Perfil de Negocio' },
    { n: 2, label: 'Objetivos y Audiencia' },
    { n: 3, label: 'Datos Técnicos' },
    { n: 4, label: 'Inversión y Plazos' },
  ] as const;

  const isDone = (n: number) => n < step;

  function next() {
    setStep((s) => clamp(s + 1, 1, 4));
  }
  function prev() {
    setStep((s) => clamp(s - 1, 1, 4));
  }

  const adminRows = useMemo(() => {
    const cliente = brief.negocioNombre?.trim() || 'Inmobiliaria X';
    const rubro = brief.rubro?.trim() || 'Inmobiliaria';
    const presupuesto = brief.presupuestoMensual || 12000;
    const score = iaScore;
    const prio = prioridadLabel(score).label;
    return [
      { cliente, rubro, presupuesto, score, prio },
      { cliente: 'Clínica Nova', rubro: 'Salud', presupuesto: 9000, score: 62, prio: 'Media' },
      { cliente: 'Restaurante Origen', rubro: 'Gastronomía', presupuesto: 6500, score: 54, prio: 'Baja' },
    ];
  }, [brief.negocioNombre, brief.presupuestoMensual, brief.rubro, iaScore]);

  const reco = useMemo(() => {
    const cliente = brief.negocioNombre?.trim() || 'Inmobiliaria X';
    const pxMissing = brief.metaPixel === false || brief.metaPixel === null;
    const highBudget = brief.presupuestoMensual >= 20000;
    const prio = highBudget ? 'alta' : iaScore >= 65 ? 'media' : 'alta';
    return `Recomendación de Agentia IA para María Sol: El cliente ${cliente} ${
      highBudget ? 'tiene un presupuesto alto' : 'tiene potencial'
    }${pxMissing ? ' pero no tiene Pixel' : ''}; prioridad ${prio} para implementación técnica.`;
  }, [brief.metaPixel, brief.negocioNombre, brief.presupuestoMensual, iaScore]);

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-md" style={{ background: 'rgba(249,250,251,0.80)', borderColor: 'rgba(15,23,42,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: ACCENT }}>
              Agentia x María Sol Gómez
            </p>
            <p className="text-sm font-bold truncate" style={{ color: '#0f172a' }}>
              Brief de Estrategia — Captación (Demo)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-2 rounded-xl border transition hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(15,23,42,0.10)', color: '#334155' }}
            >
              Volver a Agentia
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
              Tu brief, en 2–3 minutos.
            </h1>
            <p className="mt-2 text-sm md:text-base" style={{ color: '#475569' }}>
              Responde el formulario por pasos y verás cómo le llegaría el lead a tu estratega, con una recomendación inicial basada en IA.
            </p>

            {/* Stepper */}
            <div className="mt-6">
              <div className="flex flex-wrap gap-3">
                {steps.map((s) => (
                  <StepPill key={s.n} i={s.n} active={s.n === step} done={isDone(s.n)} label={s.label} />
                ))}
              </div>
            </div>
          </div>

          {/* Score card */}
          <GlassCard>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#64748b' }}>Prioridad (IA Score)</p>
                  <p className="text-2xl font-extrabold mt-1" style={{ color: '#0f172a' }}>
                    {iaScore}/100
                  </p>
                </div>
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold border"
                  style={{ color: prioridad.color, background: prioridad.bg, borderColor: prioridad.border }}
                >
                  {prioridad.label}
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,0.06)' }}>
                  <div className="h-full" style={{ width: `${iaScore}%`, background: ACCENT }} />
                </div>
                <p className="text-xs mt-3" style={{ color: '#64748b' }}>
                  El score sube con claridad en objetivos, presupuesto y readiness técnico (Pixel/GTM).
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Form + Admin */}
        <div className="mt-8 grid lg:grid-cols-[1fr_0.9fr] gap-6 items-start">
          <GlassCard>
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0f172a' }}>Formulario inteligente (Brief)</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    Estética clean & corporate. Fondo gris suave, tarjetas glass, acento azul.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full border" style={{ borderColor: 'rgba(29,78,216,0.20)', background: 'rgba(29,78,216,0.08)', color: ACCENT }}>
                    Paso {step}/4
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Nombre del negocio</FieldLabel>
                        <Input value={brief.negocioNombre} onChange={(e) => setBrief((b) => ({ ...b, negocioNombre: e.target.value }))} placeholder="Ej: Inmobiliaria Horizonte" />
                      </div>
                      <div>
                        <FieldLabel>Rubro</FieldLabel>
                        <Input value={brief.rubro} onChange={(e) => setBrief((b) => ({ ...b, rubro: e.target.value }))} placeholder="Ej: Inmobiliaria, Salud, Retail…" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Producto / Servicio principal</FieldLabel>
                      <Input value={brief.producto} onChange={(e) => setBrief((b) => ({ ...b, producto: e.target.value }))} placeholder="Ej: Venta de departamentos, consultas, delivery…" />
                    </div>
                    <div>
                      <FieldLabel>Redes sociales (links)</FieldLabel>
                      <Textarea value={brief.redes} onChange={(e) => setBrief((b) => ({ ...b, redes: e.target.value }))} placeholder="Instagram, Facebook, TikTok, sitio web…" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <FieldLabel>Objetivos (selección múltiple)</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {(['Ventas', 'Leads', 'Seguidores'] as Objetivo[]).map((o) => {
                          const active = brief.objetivos.includes(o);
                          return (
                            <TogglePill
                              key={o}
                              active={active}
                              onClick={() =>
                                setBrief((b) => ({
                                  ...b,
                                  objetivos: active ? b.objetivos.filter((x) => x !== o) : [...b.objetivos, o],
                                }))
                              }
                            >
                              {o}
                            </TogglePill>
                          );
                        })}
                      </div>
                      <p className="text-[11px] mt-2" style={{ color: '#64748b' }}>
                        Tip: si eliges “Ventas”, el setup técnico (Pixel/GTM) se vuelve crítico.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <FieldLabel>Edad (rango)</FieldLabel>
                        <Input value={brief.publicoEdad} onChange={(e) => setBrief((b) => ({ ...b, publicoEdad: e.target.value }))} placeholder="Ej: 25–45" />
                      </div>
                      <div className="md:col-span-1">
                        <FieldLabel>Género</FieldLabel>
                        <Select value={brief.publicoGenero} onChange={(e) => setBrief((b) => ({ ...b, publicoGenero: e.target.value as Genero }))}>
                          {(['No definido', 'Mixto', 'Femenino', 'Masculino'] as Genero[]).map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="md:col-span-1">
                        <FieldLabel>Intereses</FieldLabel>
                        <Input value={brief.publicoIntereses} onChange={(e) => setBrief((b) => ({ ...b, publicoIntereses: e.target.value }))} placeholder="Ej: inversión, hogar, lujo…" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <YesNo
                      label="¿Tienes Pixel de Meta instalado?"
                      value={brief.metaPixel}
                      onChange={(v) => setBrief((b) => ({ ...b, metaPixel: v }))}
                    />
                    <YesNo
                      label="¿Tienes Google Tag Manager (GTM)?"
                      value={brief.gtm}
                      onChange={(v) => setBrief((b) => ({ ...b, gtm: v }))}
                    />
                    <YesNo
                      label="¿Cuentas con Audiencias Personalizadas?"
                      value={brief.audiencias}
                      onChange={(v) => setBrief((b) => ({ ...b, audiencias: v }))}
                    />
                    <div className="rounded-xl border px-4 py-3 mt-2" style={{ borderColor: 'rgba(29,78,216,0.15)', background: 'rgba(29,78,216,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} color={ACCENT} />
                        <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>
                          Nota: si no tienes Pixel/GTM, lo priorizamos en onboarding.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.7)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: '#64748b' }}>Presupuesto mensual</p>
                          <p className="text-xl font-extrabold mt-1" style={{ color: '#0f172a' }}>
                            ${brief.presupuestoMensual.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full border" style={{ borderColor: 'rgba(15,23,42,0.10)', background: 'rgba(255,255,255,0.7)', color: '#334155' }}>
                          MXN/mes
                        </div>
                      </div>
                      <input
                        type="range"
                        min={3000}
                        max={60000}
                        step={500}
                        value={brief.presupuestoMensual}
                        onChange={(e) => setBrief((b) => ({ ...b, presupuestoMensual: Number(e.target.value) }))}
                        className="w-full mt-4"
                        style={{ accentColor: ACCENT }}
                      />
                      <div className="flex justify-between text-[11px] mt-2" style={{ color: '#94a3b8' }}>
                        <span>$3,000</span>
                        <span>$60,000</span>
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Canales</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {(['Meta Ads', 'Google Ads', 'TikTok Ads'] as Canal[]).map((c) => {
                          const active = brief.canales.includes(c);
                          return (
                            <TogglePill
                              key={c}
                              active={active}
                              onClick={() =>
                                setBrief((b) => ({
                                  ...b,
                                  canales: active ? b.canales.filter((x) => x !== c) : [...b.canales, c],
                                }))
                              }
                            >
                              {c}
                            </TogglePill>
                          );
                        })}
                      </div>
                      <p className="text-[11px] mt-2" style={{ color: '#64748b' }}>
                        Recomendado: iniciar con 1–2 canales y escalar a performance.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer controls */}
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={prev}
                  disabled={step === 1}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(15,23,42,0.10)', color: '#334155' }}
                >
                  <ChevronLeft size={16} />
                  Atrás
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={next}
                    disabled={step === 4}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition disabled:opacity-40"
                    style={{ background: 'rgba(29,78,216,0.10)', borderColor: 'rgba(29,78,216,0.25)', color: ACCENT }}
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-6">
            {/* Admin table */}
            <GlassCard>
              <div className="p-6">
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>
                  Panel de gestión (María Sol) — Simulación
                </p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  Así llegarían los leads, con prioridad sugerida por IA.
                </p>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px]" style={{ color: '#64748b' }}>
                        <th className="py-2 pr-3 font-semibold">Cliente</th>
                        <th className="py-2 pr-3 font-semibold">Rubro</th>
                        <th className="py-2 pr-3 font-semibold">Presupuesto</th>
                        <th className="py-2 font-semibold">Prioridad (IA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminRows.map((r) => {
                        const meta = prioridadLabel(r.score);
                        return (
                          <tr key={`${r.cliente}-${r.rubro}`} className="border-t" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                            <td className="py-3 pr-3">
                              <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{r.cliente}</p>
                            </td>
                            <td className="py-3 pr-3">
                              <p className="text-sm" style={{ color: '#334155' }}>{r.rubro}</p>
                            </td>
                            <td className="py-3 pr-3">
                              <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                                ${r.presupuesto.toLocaleString('es-MX')}
                              </p>
                              <p className="text-[11px]" style={{ color: '#94a3b8' }}>MXN/mes</p>
                            </td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[11px] font-bold border"
                                style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}>
                                {meta.label} · {r.score}/100
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>

            {/* Recommendation */}
            <GlassCard>
              <div className="p-6">
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>
                  Recomendación IA
                </p>
                <div className="mt-3 rounded-xl border p-4" style={{ borderColor: 'rgba(29,78,216,0.15)', background: 'rgba(29,78,216,0.06)' }}>
                  <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{reco}</p>
                  <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                    Siguiente acción sugerida: checklist de tracking + estructura de campañas + propuesta de medición.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-xs" style={{ color: '#64748b' }}>
                    Tip: usa el botón de WhatsApp para enviar el brief completo en 1 mensaje.
                  </div>
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold px-3 py-2 rounded-xl border transition hover:opacity-90"
                      style={{ background: 'rgba(29,78,216,0.10)', borderColor: 'rgba(29,78,216,0.25)', color: ACCENT }}
                    >
                      Enviar brief por WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: '#94a3b8' }}>
                      Configura `NEXT_PUBLIC_MARIA_SOL_WHATSAPP_DIGITS` para activar WhatsApp.
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* Floating WhatsApp */}
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-30 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg border"
          style={{
            background: 'rgba(255,255,255,0.88)',
            borderColor: 'rgba(15,23,42,0.10)',
            backdropFilter: 'blur(14px)',
          }}
          aria-label="Contactar a mi Estratega"
        >
          <span
            className="h-9 w-9 rounded-xl flex items-center justify-center border"
            style={{ background: 'rgba(29,78,216,0.10)', borderColor: 'rgba(29,78,216,0.20)' }}
          >
            {/* lucide no trae WhatsAppIcon, dejamos fallback con MessageCircle-like */}
            <span className="text-sm font-black" style={{ color: ACCENT }}>WA</span>
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold" style={{ color: '#64748b' }}>WhatsApp</p>
            <p className="text-sm font-extrabold" style={{ color: '#0f172a' }}>
              Contactar a mi Estratega
            </p>
          </div>
        </a>
      )}
    </div>
  );
}

