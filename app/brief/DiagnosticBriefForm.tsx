'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMERALD = '#50C878';

const MAIN_PROBLEMS = [
  'Pierdo clientes por no contestar rápido',
  'Mis procesos son manuales y lentos',
  'No tengo presencia profesional en internet',
  'Necesito un software específico para mi operación',
] as const;

const CHANNELS = ['WhatsApp', 'Instagram', 'Web', 'Local físico'] as const;

const SUPERPOWERS = [
  'Una IA que venda por mí 24/7',
  'Un sistema que gestione mis clientes y pagos',
  'Una web moderna que atraiga leads automáticamente',
] as const;

const INVESTMENT_RANGES = [
  'Menos de $10,000 MXN',
  '$10,000 – $50,000 MXN',
  '$50,000 – $200,000 MXN',
  'Más de $200,000 MXN',
] as const;

const TIMELINES = [
  'Urgente (menos de 2 semanas)',
  '1–4 semanas',
  '1–3 meses',
  'Solo estoy explorando',
] as const;

const STEPS = [
  { n: 1, title: 'Contexto', icon: '🏢' },
  { n: 2, title: 'Diagnóstico', icon: '🧠' },
  { n: 3, title: 'Alcance técnico', icon: '🛠️' },
  { n: 4, title: 'Compromiso', icon: '🚀' },
] as const;

type TeamSize = '1-5' | '6-20' | '21+';
type YesNo = 'yes' | 'no';

function glassCard(className = '') {
  return `rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_24px_80px_-40px_rgba(80,200,120,0.25)] ${className}`;
}

function btnPrimary(disabled?: boolean) {
  return `w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
    disabled ? '' : 'hover:brightness-110 active:scale-[0.98]'
  }`;
}

export function DiagnosticBriefForm() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'form' | 'loading' | 'done'>('form');
  const [error, setError] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [hasWebOrSystem, setHasWebOrSystem] = useState<YesNo | ''>('');
  const [teamSize, setTeamSize] = useState<TeamSize | ''>('');

  const [mainProblem, setMainProblem] = useState<string>('');
  const [mainChannel, setMainChannel] = useState<string>('');

  const [superpower, setSuperpower] = useState<string>('');
  const [integrations, setIntegrations] = useState('');

  const [investmentRange, setInvestmentRange] = useState('');
  const [timeline, setTimeline] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');

  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);

  function canNext(): boolean {
    if (step === 0) {
      return Boolean(
        businessName.trim() && industry.trim() && hasWebOrSystem && teamSize
      );
    }
    if (step === 1) return Boolean(mainProblem && mainChannel);
    if (step === 2) return Boolean(superpower);
    if (step === 3) {
      return Boolean(
        investmentRange &&
          timeline &&
          contactName.trim() &&
          contactWhatsapp.trim()
      );
    }
    return false;
  }

  async function submit() {
    setError('');
    setPhase('loading');
    try {
      const res = await fetch('/api/brief/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          step1: {
            businessName,
            industry,
            hasWebOrSystem,
            teamSize,
          },
          step2: { mainProblem, mainChannel },
          step3: { superpower, integrations },
          step4: {
            investmentRange,
            timeline,
            contactName,
            contactWhatsapp,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase('form');
        setError((data as { error?: string }).error || 'No se pudo guardar');
        return;
      }
      setRecommendation(String((data as { recommendation?: string }).recommendation || ''));
      setPhase('done');
    } catch {
      setPhase('form');
      setError('Error de conexión');
    }
  }

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(80,200,120,0.12), transparent 50%), #050508',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(80,200,120,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(80,200,120,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-lg px-4 py-10 sm:py-14">
        <header className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Agentia · Uso interno
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
            Cuestionario de diagnóstico tecnológico
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Cuatro pasos para perfilar la arquitectura ideal del cliente.
          </p>
        </header>

        {phase === 'form' && (
          <>
            <div className={`${glassCard('p-4 mb-6')}`}>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>
                  Paso {step + 1} de 4 · {STEPS[step].icon} {STEPS[step].title}
                </span>
                <span style={{ color: EMERALD }}>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: EMERALD }}
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            <div className={`${glassCard('p-6 sm:p-8')}`}>
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="s0"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <span>🏢</span> Contexto
                    </h2>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Nombre del negocio</label>
                      <input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#50C878]/50"
                        placeholder="Ej. Pastelería Luna"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Rubro</label>
                      <input
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#50C878]/50"
                        placeholder="Ej. Alimentos, servicios, retail…"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">
                        ¿Actualmente cuentan con página web o sistema de gestión?
                      </p>
                      <div className="flex gap-2">
                        {(['yes', 'no'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setHasWebOrSystem(v)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                              hasWebOrSystem === v
                                ? 'border-[#50C878] bg-[#50C878]/15 text-white'
                                : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            {v === 'yes' ? 'Sí' : 'No'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Tamaño del equipo</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(['1-5', '6-20', '21+'] as const).map((ts) => (
                          <button
                            key={ts}
                            type="button"
                            onClick={() => setTeamSize(ts)}
                            className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                              teamSize === ts
                                ? 'border-[#50C878] bg-[#50C878]/15 text-white'
                                : 'border-white/10 bg-black/20 text-slate-300'
                            }`}
                          >
                            {ts === '21+' ? '21+' : ts.replace('-', '–')} pers.
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <span>🧠</span> Diagnóstico de necesidades
                    </h2>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">¿Cuál es tu mayor problema hoy?</p>
                      <div className="space-y-2">
                        {MAIN_PROBLEMS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setMainProblem(p)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition ${
                              mainProblem === p
                                ? 'border-[#50C878] bg-[#50C878]/12 text-white'
                                : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/18'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">¿Qué canal usas más para vender?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {CHANNELS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setMainChannel(c)}
                            className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                              mainChannel === c
                                ? 'border-[#50C878] bg-[#50C878]/12 text-white'
                                : 'border-white/10 bg-black/20 text-slate-300'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <span>🛠️</span> Alcance técnico
                    </h2>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">
                        Si pudieras elegir una &quot;superpotencia&quot; para tu negocio hoy, ¿cuál sería?
                      </p>
                      <div className="space-y-2">
                        {SUPERPOWERS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSuperpower(s)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition ${
                              superpower === s
                                ? 'border-[#50C878] bg-[#50C878]/12 text-white'
                                : 'border-white/10 bg-black/20 text-slate-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">
                        ¿Requieres integración con otras herramientas? (opcional)
                      </label>
                      <textarea
                        value={integrations}
                        onChange={(e) => setIntegrations(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#50C878]/50 resize-none"
                        placeholder="Ej. Stripe, WhatsApp API, Google Calendar…"
                      />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="s3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <span>🚀</span> Compromiso
                    </h2>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Rango de inversión estimada (MXN)</p>
                      <div className="space-y-2">
                        {INVESTMENT_RANGES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setInvestmentRange(r)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition ${
                              investmentRange === r
                                ? 'border-[#50C878] bg-[#50C878]/12 text-white'
                                : 'border-white/10 bg-black/20 text-slate-300'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">¿Qué tan pronto necesitas la implementación?</p>
                      <div className="space-y-2">
                        {TIMELINES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTimeline(t)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition ${
                              timeline === t
                                ? 'border-[#50C878] bg-[#50C878]/12 text-white'
                                : 'border-white/10 bg-black/20 text-slate-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Nombre de contacto</label>
                      <input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#50C878]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">WhatsApp</label>
                      <input
                        value={contactWhatsapp}
                        onChange={(e) => setContactWhatsapp(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#50C878]/50"
                        placeholder="10 dígitos o con lada"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className={`${btnPrimary(step === 0)} border border-white/15 bg-white/5 text-slate-200`}
                >
                  Atrás
                </button>
                {step < 3 ? (
                  <button
                    type="button"
                    disabled={!canNext()}
                    onClick={() => setStep((s) => s + 1)}
                    className={btnPrimary(!canNext())}
                    style={{ background: EMERALD, color: '#042f2e' }}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canNext()}
                    onClick={() => void submit()}
                    className={btnPrimary(!canNext())}
                    style={{ background: EMERALD, color: '#042f2e' }}
                  >
                    Enviar diagnóstico
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {phase === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${glassCard('p-10 text-center')}`}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="mx-auto mb-6 h-12 w-12 rounded-full border-2 border-white/15 border-t-[#50C878]"
            />
            <p className="text-lg font-semibold text-white">
              Agentia IA está procesando tu arquitectura ideal...
            </p>
            <p className="mt-2 text-sm text-slate-400">Un momento por favor.</p>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${glassCard('p-8 text-center')}`}
          >
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-white mb-3">Diagnóstico enviado</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Basado en tus respuestas, te recomendamos una{' '}
              <span className="font-semibold" style={{ color: EMERALD }}>
                {recommendation || 'Automatización de IA + Landing page'}
              </span>
              . Rodolfo se contactará contigo en breve.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase('form');
                setStep(0);
                setRecommendation('');
              }}
              className="mt-8 px-6 py-3 rounded-xl text-sm font-semibold border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 transition"
            >
              Nuevo diagnóstico
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
