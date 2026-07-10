'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  computeResults,
  formatMxn,
  getSlidersForIndustry,
  INDUSTRIES,
  type IndustryId,
  type SimulatorResults,
} from '@/lib/simulator-engine';

const CYAN = '#00D4FF';

type Phase = 'industry' | 'sliders' | 'results' | 'lead' | 'confirmed';

function AnimatedNumber({ value, className = '' }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const steps = 24;
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      const next = Math.round(start + (diff * frame) / steps);
      setDisplay(next);
      if (frame >= steps) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduceMotion]);

  return <span className={className}>{formatMxn(display)}</span>;
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-bold" style={{ color }}>
          {score}/100
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function AutomationSimulator({ id = 'simulador' }: { id?: string }) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('industry');
  const [industry, setIndustry] = useState<IndustryId | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [results, setResults] = useState<SimulatorResults | null>(null);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sliders = useMemo(
    () => (industry ? getSlidersForIndustry(industry) : []),
    [industry],
  );

  const liveLoss = useMemo(() => {
    if (!industry) return 0;
    return computeResults(industry, values).monthlyLoss;
  }, [industry, values]);

  function selectIndustry(id: IndustryId) {
    setIndustry(id);
    const defs = getSlidersForIndustry(id);
    const init: Record<string, number> = {};
    for (const s of defs) init[s.id] = s.default;
    setValues(init);
    setPhase('sliders');
  }

  function goResults() {
    if (!industry) return;
    setResults(computeResults(industry, values));
    setPhase('results');
  }

  async function submitLead() {
    if (!industry || !results) return;
    setError('');
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email corporativo son obligatorios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email inválido');
      return;
    }

    const industryLabel = INDUSTRIES.find((i) => i.id === industry)?.label ?? industry;
    const descripcion = JSON.stringify(
      {
        fuente: 'simulador_home',
        industria: industryLabel,
        sliders: values,
        resultados: results,
      },
      null,
      2,
    );

    setSubmitting(true);
    try {
      const res = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: '',
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp.trim(),
          tipo_negocio: industryLabel,
          descripcion,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'No se pudo enviar');
        return;
      }
      setPhase('confirmed');
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  const calendlyUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AGENTIA_BOOK_URL?.trim()) || '';

  return (
    <section id={id} className="scroll-mt-24 py-20">
      <div className="mb-10 text-center">
        <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold text-white sm:text-4xl">
          Simulador de fuga de ingresos
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/55">
          Ajusta los números de tu operación y mira cuánto podrías recuperar con automatización.
        </p>
      </div>

      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <AnimatePresence mode="wait">
          {phase === 'industry' && (
            <motion.div
              key="industry"
              initial={reduceMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="min-h-[420px] p-6 sm:p-10"
            >
              <p className="text-sm font-semibold text-[#00D4FF]">Paso 1 de 4</p>
              <h3 className="mt-2 text-xl font-bold text-white">¿En qué industria operas?</h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {INDUSTRIES.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectIndustry(opt.id)}
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-left transition hover:border-[#00D4FF]/50 hover:bg-[#00D4FF]/5"
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <p className="mt-2 text-sm font-semibold text-white">{opt.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'sliders' && industry && (
            <motion.div
              key="sliders"
              initial={reduceMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="min-h-[480px] p-6 sm:p-10"
            >
              <p className="text-sm font-semibold text-[#00D4FF]">Paso 2 de 4</p>
              <h3 className="mt-2 text-xl font-bold text-white">Calibramos tu operación actual</h3>

              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wider text-red-300/80">Pérdida estimada</p>
                <p className="text-2xl font-extrabold tabular-nums text-[#FF3B3B] sm:text-3xl">
                  <AnimatedNumber value={liveLoss} /> / mes
                </p>
              </div>

              <div className="mt-8 space-y-7">
                {sliders.map((s) => (
                  <div key={s.id}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-white/75">{s.label}</span>
                      <span className="font-mono font-semibold text-white">
                        {s.prefix ?? ''}
                        {values[s.id] ?? s.default}
                        {s.unit ? ` ${s.unit}` : ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={values[s.id] ?? s.default}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                      }
                      className="w-full accent-[#00D4FF]"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPhase('industry')}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm text-white/80"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={goResults}
                  className="rounded-xl px-6 py-3 text-sm font-bold text-[#0a0a0a]"
                  style={{ background: `linear-gradient(90deg, ${CYAN}, ${CYAN}cc)` }}
                >
                  Ver mi diagnóstico
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'results' && results && (
            <motion.div
              key="results"
              initial={reduceMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="min-h-[520px] p-6 sm:p-10"
            >
              <p className="text-sm font-semibold text-[#00D4FF]">Paso 3 de 4</p>
              <h3 className="mt-2 text-xl font-bold text-white">Tu Blueprint preliminar</h3>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <ScoreBar label="Score Automatización" score={results.automationScore} color={CYAN} />
                <ScoreBar label="Score IA" score={results.aiScore} color="#FFD700" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs text-white/50">Oportunidad mensual</p>
                  <p className="mt-1 text-xl font-bold text-[#FFD700]">
                    <AnimatedNumber value={results.opportunity} />
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs text-white/50">ROI estimado (90 días)</p>
                  <p className="mt-1 text-xl font-bold text-[#00D4FF]">{results.roi90}%</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-white">Top 3 automatizaciones</p>
                  <ul className="space-y-2 text-sm text-white/60">
                    {results.topAutomations.map((t) => (
                      <li key={t} className="flex gap-2">
                        <span className="text-[#00D4FF]">→</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-white">Riesgos si NO automatizas</p>
                  <ul className="space-y-2 text-sm text-white/60">
                    {results.risks.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="text-red-400">!</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPhase('lead')}
                className="mt-8 w-full rounded-xl py-3.5 text-sm font-bold text-[#0a0a0a] sm:w-auto sm:px-8"
                style={{ background: `linear-gradient(90deg, #FFD700, #00D4FF)` }}
              >
                Desbloquear mi Blueprint completo
              </button>
            </motion.div>
          )}

          {phase === 'lead' && (
            <motion.div
              key="lead"
              initial={reduceMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="min-h-[420px] p-6 sm:p-10"
            >
              <p className="text-sm font-semibold text-[#00D4FF]">Paso 4 de 4</p>
              <h3 className="mt-2 text-xl font-bold text-white">
                Tu Blueprint de Automatización está listo.
              </h3>
              <p className="mt-2 text-white/55">¿A dónde te lo enviamos?</p>

              <div className="mt-6 space-y-4">
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email corporativo"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                />
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="WhatsApp (opcional)"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                />
              </div>

              {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitLead()}
                className="mt-6 w-full rounded-xl py-3.5 text-sm font-bold text-[#0a0a0a] disabled:opacity-50"
                style={{ background: CYAN }}
              >
                {submitting ? 'Enviando...' : 'Desbloquear mi Blueprint →'}
              </button>
            </motion.div>
          )}

          {phase === 'confirmed' && (
            <motion.div
              key="confirmed"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-h-[480px] p-6 sm:p-10"
            >
              <h3 className="text-xl font-bold text-white">Diagnóstico enviado</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                Tu diagnóstico ha sido enviado. Tu volumen califica para una Sesión Estratégica gratuita de
                15 minutos con nuestro equipo fundador.
              </p>

              {calendlyUrl ? (
                <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white">
                  <iframe
                    src={calendlyUrl}
                    title="Agendar sesión estratégica"
                    className="h-[520px] w-full"
                    loading="lazy"
                  />
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">
                  Configura <code className="text-[#00D4FF]">NEXT_PUBLIC_AGENTIA_BOOK_URL</code> con tu enlace
                  de Calendly para mostrar el widget aquí.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
