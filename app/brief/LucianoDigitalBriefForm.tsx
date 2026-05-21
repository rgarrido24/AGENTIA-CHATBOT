'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ACCENT = '#CCFF00';
const BG = '#f4f6f8';
const CARD = '#ffffff';
const TEXT = '#0f172a';
const MUTED = '#64748b';

const INVESTMENT_PILLS = [
  'Hasta 500 USD / mes',
  '500 – 2.000 USD / mes',
  '2.000 – 5.000 USD / mes',
  'Más de 5.000 USD / mes',
] as const;

const STEPS = [
  { n: 1, title: 'Identidad del negocio' },
  { n: 2, title: 'Mercado y competencia' },
  { n: 3, title: 'Inversión y experiencia' },
  { n: 4, title: 'Accesos y archivos' },
] as const;

const LUC_WHATSAPP = '5493515920758';

function buildClientWhatsappUrl(summary: string): string {
  const text =
    `Hola Luciano, completé el Brief Digital.\n\n` +
    `${summary}\n\n` +
    `Quedo atento/a a los próximos pasos.`;
  return `https://wa.me/${LUC_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

type SubmitResponse = { ok?: boolean; score?: number; token?: string; error?: string };

export function LucianoDigitalBriefForm({ clientSlug }: { clientSlug: string }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'form' | 'loading' | 'done'>('form');
  const [error, setError] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [waSummary, setWaSummary] = useState('');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cuit, setCuit] = useState('');
  const [descripcionNegocio, setDescripcionNegocio] = useState('');
  const [productos, setProductos] = useState('');

  const [competidores, setCompetidores] = useState('');
  const [target, setTarget] = useState('');
  const [orientacionGeo, setOrientacionGeo] = useState('');

  const [inversionMensual, setInversionMensual] = useState<(typeof INVESTMENT_PILLS)[number] | ''>('');
  const [experienciaPrevia, setExperienciaPrevia] = useState('');

  const [igUser, setIgUser] = useState('');
  const [igPass, setIgPass] = useState('');
  const [fbUser, setFbUser] = useState('');
  const [fbPass, setFbPass] = useState('');
  const [archivosLink, setArchivosLink] = useState('');

  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);

  function canNext(): boolean {
    if (step === 0) {
      return Boolean(
        nombre.trim() &&
          email.trim() &&
          cuit.replace(/\D/g, '').length >= 9 &&
          descripcionNegocio.trim().length >= 10 &&
          productos.trim().length >= 3
      );
    }
    if (step === 1) {
      return Boolean(
        competidores.trim().length >= 3 && target.trim().length >= 5 && orientacionGeo.trim().length >= 2
      );
    }
    if (step === 2) {
      return Boolean(inversionMensual && experienciaPrevia.trim().length >= 3);
    }
    if (step === 3) {
      return Boolean(igUser.trim() && igPass.trim() && fbUser.trim() && fbPass.trim());
    }
    return false;
  }

  async function submit() {
    setError('');
    setPhase('loading');
    try {
      const res = await fetch('/api/portal/luciano/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: '',
          clientSlug,
          nombre,
          email,
          cuit,
          descripcionNegocio,
          productos,
          competidores,
          target,
          orientacionGeo,
          inversionMensual,
          experienciaPrevia,
          instagramUser: igUser,
          instagramPassword: igPass,
          facebookUser: fbUser,
          facebookPassword: fbPass,
          archivosLink,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as SubmitResponse;
      if (!res.ok) {
        setPhase('form');
        setError(data.error || 'No se pudo guardar el brief');
        return;
      }
      const sc = typeof data.score === 'number' ? data.score : 0;
      setScore(sc);
      const sum = [
        `Cliente: ${clientSlug}`,
        `Contacto: ${nombre.trim()}`,
        `Email: ${email.trim()}`,
        `CUIT: ${cuit.trim()}`,
        `Inversión mensual: ${inversionMensual}`,
        `Score brief: ${sc}/100`,
        archivosLink.trim() ? `Archivos: ${archivosLink.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      setWaSummary(sum);
      setPhase('done');
    } catch {
      setPhase('form');
      setError('Error de conexión');
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT }}>
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <header className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
            Brief digital · Luciano
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: TEXT }}>
            Contanos tu operación
          </h1>
          <p className="mt-2 text-sm" style={{ color: MUTED }}>
            Cliente: <span className="font-semibold" style={{ color: TEXT }}>{clientSlug}</span> · 4 pasos
          </p>
        </header>

        {phase === 'form' && (
          <>
            <div
              className="mb-5 rounded-2xl border p-5 shadow-sm"
              style={{ background: CARD, borderColor: 'rgba(15,23,42,0.08)' }}
            >
              <p className="text-xs font-semibold" style={{ color: MUTED }}>
                Paso {step + 1} de 4
              </p>
              <p className="mt-1 text-lg font-bold">{STEPS[step].title}</p>
              <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: ACCENT }}
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                />
              </div>
            </div>

            <div
              className="rounded-2xl border p-6 sm:p-8 shadow-sm"
              style={{ background: CARD, borderColor: 'rgba(15,23,42,0.08)' }}
            >
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="s0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <Field label="Nombre completo" value={nombre} onChange={setNombre} placeholder="Nombre y apellido" />
                    <Field label="Email" value={email} onChange={setEmail} placeholder="tu@email.com" type="email" />
                    <Field label="CUIT" value={cuit} onChange={setCuit} placeholder="XX-XXXXXXXX-X" />
                    <Area
                      label="Descripción del negocio"
                      value={descripcionNegocio}
                      onChange={setDescripcionNegocio}
                      placeholder="Qué hacés, cómo vendés, propuesta de valor…"
                    />
                    <Area label="Productos / servicios" value={productos} onChange={setProductos} placeholder="Lista principal" />
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <Area label="Competidores" value={competidores} onChange={setCompetidores} placeholder="Marcas o negocios similares" />
                    <Area label="Target / público objetivo" value={target} onChange={setTarget} placeholder="Edad, intereses, problema que resolvés…" />
                    <Area
                      label="Orientación geográfica"
                      value={orientacionGeo}
                      onChange={setOrientacionGeo}
                      placeholder="Ciudad, provincia, país o zonas de interés"
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>
                        Inversión mensual en pauta (estimado)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {INVESTMENT_PILLS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setInversionMensual(p)}
                            className="rounded-full border px-3 py-2 text-xs font-bold transition"
                            style={{
                              background: inversionMensual === p ? ACCENT : '#fff',
                              color: '#000',
                              borderColor: 'rgba(15,23,42,0.12)',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Area
                      label="Experiencia previa con Meta / pauta"
                      value={experienciaPrevia}
                      onChange={setExperienciaPrevia}
                      placeholder="Nunca invertí, probé boosts, tengo cuenta Business Manager…"
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="s3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <p className="text-xs" style={{ color: MUTED }}>
                      Los accesos se guardan de forma confidencial para configuración. En WhatsApp no se reenvían contraseñas.
                    </p>
                    <Field label="Usuario Instagram" value={igUser} onChange={setIgUser} placeholder="@usuario o email" />
                    <Field label="Contraseña Instagram" value={igPass} onChange={setIgPass} placeholder="••••••••" type="password" />
                    <Field label="Usuario Facebook" value={fbUser} onChange={setFbUser} placeholder="Email o usuario" />
                    <Field label="Contraseña Facebook" value={fbPass} onChange={setFbPass} placeholder="••••••••" type="password" />
                    <Field
                      label="Link a archivos (Drive, Dropbox…)"
                      value={archivosLink}
                      onChange={setArchivosLink}
                      placeholder="https://…"
                      type="url"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                  style={{ background: '#fff', borderColor: 'rgba(15,23,42,0.12)', color: TEXT }}
                >
                  Atrás
                </button>
                {step < 3 ? (
                  <button
                    type="button"
                    disabled={!canNext()}
                    onClick={() => setStep((s) => s + 1)}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                    style={{ background: ACCENT, color: '#000' }}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canNext()}
                    onClick={() => void submit()}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                    style={{ background: ACCENT, color: '#000' }}
                  >
                    Enviar brief
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {phase === 'loading' && (
          <div
            className="rounded-2xl border p-10 text-center shadow-sm"
            style={{ background: CARD, borderColor: 'rgba(15,23,42,0.08)' }}
          >
            <div
              className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-slate-200 border-t-transparent animate-spin"
              style={{ borderTopColor: ACCENT }}
            />
            <p className="text-base font-semibold">Guardando y calculando score…</p>
          </div>
        )}

        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border p-8 text-center shadow-sm space-y-4"
            style={{ background: CARD, borderColor: 'rgba(15,23,42,0.08)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
              Brief recibido
            </p>
            <p className="text-4xl font-black" style={{ color: TEXT }}>
              {score ?? 0}
              <span className="text-lg font-bold" style={{ color: MUTED }}>
                /100
              </span>
            </p>
            <p className="text-sm" style={{ color: MUTED }}>
              Gracias. Luciano ya recibió una alerta. Podés reenviar el resumen por WhatsApp con un toque.
            </p>
            <a
              href={buildClientWhatsappUrl(waSummary)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full justify-center rounded-xl px-6 py-3 text-sm font-extrabold"
              style={{ background: ACCENT, color: '#000' }}
            >
              Enviar resumen por WhatsApp a Luciano
            </a>
            <button
              type="button"
              onClick={() => {
                setPhase('form');
                setStep(0);
                setScore(null);
                setWaSummary('');
              }}
              className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold"
              style={{ background: '#fff', borderColor: 'rgba(15,23,42,0.12)', color: TEXT }}
            >
              Nuevo envío
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: MUTED }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
        style={{ borderColor: 'rgba(15,23,42,0.12)', color: TEXT, background: '#fff' }}
      />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: MUTED }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full min-h-[96px] rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#CCFF00]/50 resize-y"
        style={{ borderColor: 'rgba(15,23,42,0.12)', color: TEXT, background: '#fff' }}
      />
    </div>
  );
}
