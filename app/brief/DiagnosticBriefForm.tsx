'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, MessagesSquare, PhoneCall, TrendingDown } from 'lucide-react';

const EMERALD = '#50C878';

const LOST_SALES = ['1-10', '10-30', '+30'] as const;
const MESSAGE_HANDLING = ['Yo solo', 'Un empleado', 'CRM básico', 'No alcanzo a contestar'] as const;

const STEPS = [
  { n: 1, title: 'Identidad', kicker: 'Tu negocio', Icon: Fingerprint },
  { n: 2, title: 'Diagnóstico de fugas', kicker: 'Ventas/citas perdidas', Icon: TrendingDown },
  { n: 3, title: 'Infraestructura actual', kicker: 'Cómo operas hoy', Icon: MessagesSquare },
  { n: 4, title: 'Contacto', kicker: 'Cierre', Icon: PhoneCall },
] as const;

function glassCard(className = '') {
  return `rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_24px_80px_-40px_rgba(80,200,120,0.25)] ${className}`;
}

function btnPrimary(disabled?: boolean) {
  return `w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
    disabled ? '' : 'hover:brightness-110 active:scale-[0.98]'
  }`;
}

function normalizeWhatsappDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`; // MX default
  return digits;
}

function buildWhatsappUrl(toDigits: string, businessName: string): string {
  const to = normalizeWhatsappDigits(toDigits);
  const text = `Hola Rodolfo, acabo de terminar mi Diagnóstico de Automatización para ${businessName || '(Nombre del Negocio)'}. Me interesa la recomendación de la IA. ¿Podemos hablar?`;
  return `https://wa.me/${encodeURIComponent(to)}?text=${encodeURIComponent(text)}`;
}

export function DiagnosticBriefForm({ salesWhatsapp }: { salesWhatsapp: string | null }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'form' | 'loading' | 'done'>('form');
  const [error, setError] = useState('');
  const [impact, setImpact] = useState<{ potentialPct: number; hoursWeekly: number } | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');

  const [lostSales, setLostSales] = useState<(typeof LOST_SALES)[number] | ''>('');

  const [messageHandling, setMessageHandling] = useState<(typeof MESSAGE_HANDLING)[number] | ''>('');
  const [webOrSocial, setWebOrSocial] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');

  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);

  function canNext(): boolean {
    if (step === 0) {
      return Boolean(businessName.trim() && industry.trim());
    }
    if (step === 1) return Boolean(lostSales);
    if (step === 2) return Boolean(messageHandling);
    if (step === 3) return Boolean(contactName.trim() && contactWhatsapp.trim());
    return false;
  }

  async function submit() {
    setError('');
    setPhase('loading');
    try {
      const startedAt = Date.now();
      const res = await fetch('/api/brief/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: '',
          step1: { businessName, industry },
          step2: { lostSales },
          step4: {
            contactName,
            contactWhatsapp,
          },
          step3: {
            messageHandling,
            webOrSocial: webOrSocial.trim() ? webOrSocial.trim() : undefined,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase('form');
        setError((data as { error?: string }).error || 'No se pudo guardar');
        return;
      }
      const nextImpact = (data as { impact?: { potentialPct?: number; hoursWeekly?: number } }).impact;
      const potentialPct = Number(nextImpact?.potentialPct ?? 0);
      const hoursWeekly = Number(nextImpact?.hoursWeekly ?? 0);
      setImpact({
        potentialPct: Number.isFinite(potentialPct) ? potentialPct : 0,
        hoursWeekly: Number.isFinite(hoursWeekly) ? hoursWeekly : 0,
      });

      // Fuerza 3s de "análisis" (impacto visual)
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 3000 - elapsed);
      if (remaining) await new Promise((r) => setTimeout(r, remaining));
      setPhase('done');
    } catch {
      setPhase('form');
      setError('Error de conexión');
    }
  }

  const activeStep = STEPS[step];

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(80,200,120,0.12), transparent 50%), #050508',
      }}
    >
      {/* Dynamic gradient mesh */}
      <motion.div
        className="pointer-events-none absolute -inset-[40%] opacity-[0.28]"
        style={{
          background:
            'radial-gradient(700px 400px at 18% 22%, rgba(80,200,120,0.16), transparent 60%), radial-gradient(600px 380px at 82% 30%, rgba(120,119,198,0.12), transparent 62%), radial-gradient(700px 420px at 55% 80%, rgba(80,200,120,0.10), transparent 60%)',
          filter: 'blur(30px)',
        }}
        animate={{ x: [0, 24, 0], y: [0, -18, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
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
            Agentia
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
            Diagnóstico de Automatización (2 min)
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Responde 4 pasos y te digo qué arquitectura te conviene.
          </p>
        </header>

        {phase === 'form' && (
          <>
            {/* Step artwork */}
            <div className="mb-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`art_${step}`}
                  initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -6, filter: 'blur(14px)' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`${glassCard('p-5 overflow-hidden relative')}`}
                >
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{
                      background:
                        step === 0
                          ? 'radial-gradient(600px 240px at 20% 30%, rgba(80,200,120,0.18), transparent 60%), radial-gradient(520px 240px at 90% 80%, rgba(255,255,255,0.06), transparent 62%)'
                          : step === 1
                            ? 'radial-gradient(620px 260px at 25% 25%, rgba(80,200,120,0.12), transparent 62%), radial-gradient(520px 260px at 80% 70%, rgba(239,68,68,0.10), transparent 62%)'
                            : step === 2
                              ? 'radial-gradient(620px 260px at 15% 50%, rgba(80,200,120,0.14), transparent 62%), radial-gradient(540px 260px at 85% 40%, rgba(59,130,246,0.10), transparent 62%)'
                              : 'radial-gradient(620px 260px at 18% 30%, rgba(80,200,120,0.16), transparent 62%), radial-gradient(520px 260px at 85% 70%, rgba(168,85,247,0.10), transparent 62%)',
                    }}
                  />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{activeStep.kicker}</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        Paso {step + 1}: {activeStep.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-300/70">
                        Completa este bloque para que podamos recomendar una arquitectura realista.
                      </p>
                    </div>
                    <div
                      className="h-12 w-12 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center"
                      style={{
                        boxShadow: `0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 34px ${EMERALD}26`,
                      }}
                    >
                      <activeStep.Icon className="h-6 w-6" style={{ color: EMERALD }} strokeWidth={1.25} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={`${glassCard('p-4 mb-6')}`}>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {STEPS.map((s, idx) => {
                  const active = idx === step;
                  const reached = idx <= step;
                  const Icon = s.Icon;
                  return (
                    <div
                      key={s.title}
                      className="rounded-2xl border px-3 py-2 flex items-center gap-2"
                      style={{
                        borderColor: active ? 'rgba(80,200,120,0.45)' : 'rgba(255,255,255,0.10)',
                        background: active ? 'rgba(80,200,120,0.10)' : 'rgba(0,0,0,0.20)',
                        boxShadow: active ? `0 0 0 1px rgba(80,200,120,0.10) inset, 0 0 40px ${EMERALD}1f` : undefined,
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        strokeWidth={1.25}
                        style={{
                          color: active ? EMERALD : reached ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.35)',
                          filter: active ? `drop-shadow(0 0 10px ${EMERALD}66)` : undefined,
                        }}
                      />
                      <span className="text-[11px] font-semibold text-white/70 truncate">{s.title}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>
                  Paso {step + 1} de 4 · {STEPS[step].title}
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
                    initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(14px)' }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{STEPS[0].kicker}</p>
                      <h2 className="text-lg font-bold">{STEPS[0].title}</h2>
                    </div>
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
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(14px)' }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{STEPS[1].kicker}</p>
                      <h2 className="text-lg font-bold">{STEPS[1].title}</h2>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">
                        ¿Cuántas ventas o citas crees que se pierden al mes por falta de respuesta inmediata?
                      </p>
                      <div className="space-y-2">
                        {LOST_SALES.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setLostSales(p)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition ${
                              lostSales === p
                                ? 'border-[#50C878] bg-[#50C878]/12 text-white'
                                : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/18'
                            }`}
                          >
                            {p === '+30' ? '+30' : p.replace('-', '–')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(14px)' }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{STEPS[2].kicker}</p>
                      <h2 className="text-lg font-bold">{STEPS[2].title}</h2>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">
                        ¿Cómo manejas tus mensajes hoy?
                      </p>
                      <div className="space-y-2">
                        {MESSAGE_HANDLING.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setMessageHandling(s)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition ${
                              messageHandling === s
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
                        Sitio Web o Redes Sociales (opcional)
                      </label>
                      <input
                        value={webOrSocial}
                        onChange={(e) => setWebOrSocial(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#50C878]/50"
                        placeholder="Ej. https://tu-sitio.com o @tuinstagram"
                      />
                      <p className="mt-2 text-[12px] text-white/45">
                        Si no tienes, no te preocupes, analizaremos tu nicho de mercado.
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="s3"
                    initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(14px)' }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{STEPS[3].kicker}</p>
                      <h2 className="text-lg font-bold">{STEPS[3].title}</h2>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Nombre</label>
                      <input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#50C878]/50"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">WhatsApp</label>
                      <input
                        value={contactWhatsapp}
                        onChange={(e) => setContactWhatsapp(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#50C878]/50"
                        placeholder="10 dígitos o con lada"
                        inputMode="tel"
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
                    Ver mi resultado
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
              IA de Agentia analizando tu perfil operativo...
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
            <h2 className="text-xl font-bold text-white mb-3">Resultado</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold" style={{ color: EMERALD }}>
                Tu negocio tiene un potencial de automatización del {impact?.potentialPct ?? 0}%.
              </span>
              {' '}Podrías recuperar hasta <span className="font-semibold text-white">{impact?.hoursWeekly ?? 0}</span> horas semanales.
            </p>
            {salesWhatsapp ? (
              <a
                href={buildWhatsappUrl(salesWhatsapp, businessName)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full sm:w-auto justify-center px-7 py-3.5 rounded-xl text-sm font-extrabold transition hover:brightness-110 active:scale-[0.98]"
                style={{ background: EMERALD, color: '#042f2e' }}
              >
                Hablar con un Consultor de Soluciones
              </a>
            ) : (
              <p className="mt-6 text-xs text-white/40">WhatsApp de ventas no configurado.</p>
            )}
            <button
              type="button"
              onClick={() => {
                setPhase('form');
                setStep(0);
                setImpact(null);
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
