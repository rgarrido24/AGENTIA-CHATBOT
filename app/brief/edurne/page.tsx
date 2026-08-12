'use client';

import { useMemo, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2 } from 'lucide-react';

const ACCENT = '#00D4FF';
const TOTAL_STEPS = 14;

const OBJECTIVES = [
  { id: 'vender', label: 'Vender online' },
  { id: 'whatsapp', label: 'Generar chats de WhatsApp' },
  { id: 'leads', label: 'Captar leads / formularios' },
  { id: 'citas', label: 'Agendar citas' },
  { id: 'dar_a_conocer', label: 'Dar a conocer la marca' },
] as const;

const MATERIALS = [
  { id: 'logo', label: 'Logo' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'videos', label: 'Videos' },
  { id: 'textos', label: 'Textos / copy' },
] as const;

const STRUCTURE = [
  { id: 'hero', label: 'Hero / portada' },
  { id: 'beneficios', label: 'Beneficios' },
  { id: 'servicios', label: 'Servicios / productos' },
  { id: 'precios', label: 'Precios o paquetes' },
  { id: 'testimonios', label: 'Testimonios' },
  { id: 'galeria', label: 'Galería' },
  { id: 'faq', label: 'Preguntas frecuentes' },
  { id: 'contacto', label: 'Contacto' },
  { id: 'mapa', label: 'Mapa / ubicación' },
  { id: 'whatsapp_flotante', label: 'Botón WhatsApp flotante' },
] as const;

const STYLES = [
  { id: 'elegante', label: 'Elegante', hint: 'Sofisticada, tipografía cuidada' },
  { id: 'minimalista', label: 'Minimalista', hint: 'Limpia, mucho aire' },
  { id: 'premium', label: 'Premium', hint: 'Alta gama, contraste fuerte' },
  { id: 'calida', label: 'Cálida', hint: 'Cercana, humana, acogedora' },
] as const;

type FormData = {
  nombre: string;
  telefono: string;
  email: string;
  redes: string;
  objetivos: string[];
  publicoEdad: string;
  publicoSexo: string;
  publicoUbicacion: string;
  publicoNecesidades: string;
  productoQueEs: string;
  productoPrecio: string;
  productoIncluye: string;
  diferenciador: string;
  testimonios: string;
  material: string[];
  estructura: string[];
  cta: string;
  estiloVisual: string;
  colores: string;
  referenciasVisuales: string;
  competencia: string;
  paginasGusto: string;
  dominio: string;
  hosting: string;
  integraciones: string;
  objetivoFinal: string;
  website: string;
};

const INITIAL: FormData = {
  nombre: '',
  telefono: '',
  email: '',
  redes: '',
  objetivos: [],
  publicoEdad: '',
  publicoSexo: '',
  publicoUbicacion: '',
  publicoNecesidades: '',
  productoQueEs: '',
  productoPrecio: '',
  productoIncluye: '',
  diferenciador: '',
  testimonios: '',
  material: [],
  estructura: [],
  cta: '',
  estiloVisual: '',
  colores: '',
  referenciasVisuales: '',
  competencia: '',
  paginasGusto: '',
  dominio: '',
  hosting: '',
  integraciones: '',
  objetivoFinal: '',
  website: '',
};

const STEP_META: { title: string; subtitle: string }[] = [
  { title: 'Empecemos por ti', subtitle: 'Nombre, teléfono, email y redes' },
  { title: '¿Cuáles son los objetivos?', subtitle: 'Elige hasta 3 prioridades' },
  { title: 'Tu público objetivo', subtitle: 'A quién le hablamos' },
  { title: 'Producto o servicio', subtitle: 'Qué ofreces y a qué precio' },
  { title: 'Lo que te hace única', subtitle: 'Diferenciador y testimonios' },
  { title: 'Material disponible', subtitle: 'Qué ya tienes listo para usar' },
  { title: 'Estructura deseada', subtitle: 'Secciones que quieres en la página' },
  { title: 'Llamada a la acción', subtitle: 'Qué debe hacer el visitante' },
  { title: 'Estilo visual', subtitle: 'Elige la sensación de la marca' },
  { title: 'Colores y referencias', subtitle: 'Paleta e inspiración visual' },
  { title: 'Competencia', subtitle: 'Con quién te comparan' },
  { title: 'Páginas que te gustan', subtitle: 'Referencias de sitios que admiras' },
  { title: 'Info técnica', subtitle: 'Dominio, hosting e integraciones' },
  { title: 'Objetivo en una frase', subtitle: 'El resultado ideal del proyecto' },
];

function labelObjetivo(id: string) {
  return OBJECTIVES.find((o) => o.id === id)?.label ?? id;
}

function labelEstilo(id: string) {
  return STYLES.find((s) => s.id === id)?.label ?? id;
}

function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-white/70">{children}</label>;
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-base text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 ${props.className ?? ''}`}
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-base text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 ${props.className ?? ''}`}
    />
  );
}

function ChoiceButton({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-4 text-left transition active:scale-[0.98] ${
        active
          ? 'border-cyan-400/60 bg-cyan-400/15 text-white'
          : 'border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.07]'
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span>
          <span className="block text-[15px] font-semibold">{label}</span>
          {hint ? <span className="mt-0.5 block text-xs text-white/45">{hint}</span> : null}
        </span>
        {active ? <Check className="h-5 w-5 shrink-0 text-cyan-300" /> : null}
      </span>
    </button>
  );
}

function CheckPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-sm font-medium transition active:scale-[0.98] ${
        active
          ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100'
          : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.07]'
      }`}
    >
      {active ? '✓ ' : ''}
      {label}
    </button>
  );
}

export default function EdurneBriefPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [phase, setPhase] = useState<'form' | 'loading' | 'done'>('form');
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState('');

  const progress = useMemo(() => ((step + 1) / TOTAL_STEPS) * 100, [step]);
  const meta = STEP_META[step];

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  function canNext(): boolean {
    switch (step) {
      case 0:
        return (
          data.nombre.trim().length >= 2 &&
          data.telefono.replace(/\D/g, '').length >= 10 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        );
      case 1:
        return data.objetivos.length >= 1 && data.objetivos.length <= 3;
      case 2:
        return Boolean(
          data.publicoEdad.trim() && data.publicoSexo.trim() && data.publicoUbicacion.trim()
        );
      case 3:
        return data.productoQueEs.trim().length >= 5;
      case 4:
        return data.diferenciador.trim().length >= 3;
      case 5:
        return true;
      case 6:
        return data.estructura.length > 0;
      case 7:
        return data.cta.trim().length >= 3;
      case 8:
        return Boolean(data.estiloVisual);
      case 9:
        return data.colores.trim().length >= 2;
      case 10:
        return true;
      case 11:
        return true;
      case 12:
        return true;
      case 13:
        return data.objetivoFinal.trim().length >= 5;
      default:
        return false;
    }
  }

  async function submit() {
    setError('');
    setPhase('loading');
    try {
      const res = await fetch('/api/brief/edurne', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase('form');
        setError((json as { error?: string }).error || 'No se pudo guardar el brief');
        return;
      }
      setSavedId(String((json as { id?: string }).id || ''));
      setPhase('done');
    } catch {
      setPhase('form');
      setError('Error de conexión. Intenta de nuevo.');
    }
  }

  function goNext() {
    if (!canNext()) return;
    if (step >= TOTAL_STEPS - 1) {
      void submit();
      return;
    }
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step <= 0) return;
    setError('');
    setStep((s) => s - 1);
  }

  return (
    <div
      className="min-h-[100dvh] text-white relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,212,255,0.12), transparent 50%), #050508',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-[40%] opacity-25"
        style={{
          background:
            'radial-gradient(700px 400px at 20% 20%, rgba(0,212,255,0.18), transparent 60%), radial-gradient(600px 380px at 80% 35%, rgba(255,215,0,0.08), transparent 62%)',
          filter: 'blur(28px)',
        }}
        animate={{ x: [0, 20, 0], y: [0, -14, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 py-8 sm:py-12">
        <header className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Agentia × Edurne
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Brief de landing page
          </h1>
          <p className="mt-2 text-sm text-white/50">
            14 pasos · unas cuantas respuestas y listo
          </p>
        </header>

        {phase === 'form' || phase === 'loading' ? (
          <>
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                <span>
                  Paso {step + 1} de {TOTAL_STEPS}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${ACCENT}, #50C878)` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_80px_-40px_rgba(0,212,255,0.25)] backdrop-blur-xl sm:p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
                    {meta.title}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{meta.subtitle}</h2>

                  <div className="mt-5 space-y-4">
                    {step === 0 && (
                      <>
                        <div>
                          <FieldLabel>Nombre</FieldLabel>
                          <TextInput
                            value={data.nombre}
                            onChange={(e) => set('nombre', e.target.value)}
                            placeholder="Tu nombre o el de tu marca"
                            autoComplete="name"
                          />
                        </div>
                        <div>
                          <FieldLabel>Teléfono / WhatsApp</FieldLabel>
                          <TextInput
                            value={data.telefono}
                            onChange={(e) => set('telefono', e.target.value)}
                            placeholder="55 1234 5678"
                            inputMode="tel"
                            autoComplete="tel"
                          />
                        </div>
                        <div>
                          <FieldLabel>Email</FieldLabel>
                          <TextInput
                            value={data.email}
                            onChange={(e) => set('email', e.target.value)}
                            placeholder="hola@tuempresa.com"
                            type="email"
                            autoComplete="email"
                          />
                        </div>
                        <div>
                          <FieldLabel>Redes sociales (opcional)</FieldLabel>
                          <TextInput
                            value={data.redes}
                            onChange={(e) => set('redes', e.target.value)}
                            placeholder="@instagram · facebook.com/..."
                          />
                        </div>
                        {/* honeypot */}
                        <input
                          tabIndex={-1}
                          autoComplete="off"
                          value={data.website}
                          onChange={(e) => set('website', e.target.value)}
                          className="hidden"
                          aria-hidden
                        />
                      </>
                    )}

                    {step === 1 && (
                      <div className="space-y-2.5">
                        <p className="text-xs text-white/45">
                          Seleccionados: {data.objetivos.length}/3
                          {data.objetivos.length >= 3
                            ? ' · Máximo alcanzado (quita uno para cambiar)'
                            : ''}
                        </p>
                        {OBJECTIVES.map((o) => {
                          const active = data.objetivos.includes(o.id);
                          return (
                            <ChoiceButton
                              key={o.id}
                              active={active}
                              label={o.label}
                              onClick={() => {
                                if (active) {
                                  set(
                                    'objetivos',
                                    data.objetivos.filter((id) => id !== o.id)
                                  );
                                  return;
                                }
                                if (data.objetivos.length >= 3) return;
                                set('objetivos', [...data.objetivos, o.id]);
                              }}
                            />
                          );
                        })}
                      </div>
                    )}

                    {step === 2 && (
                      <>
                        <div>
                          <FieldLabel>Edad aproximada</FieldLabel>
                          <TextInput
                            value={data.publicoEdad}
                            onChange={(e) => set('publicoEdad', e.target.value)}
                            placeholder="Ej. 25–45 años"
                          />
                        </div>
                        <div>
                          <FieldLabel>Sexo / género</FieldLabel>
                          <TextInput
                            value={data.publicoSexo}
                            onChange={(e) => set('publicoSexo', e.target.value)}
                            placeholder="Ej. Mujeres, mixto, hombres..."
                          />
                        </div>
                        <div>
                          <FieldLabel>Ubicación</FieldLabel>
                          <TextInput
                            value={data.publicoUbicacion}
                            onChange={(e) => set('publicoUbicacion', e.target.value)}
                            placeholder="Ciudad, zona o país"
                          />
                        </div>
                        <div>
                          <FieldLabel>Necesidades o dolores (opcional)</FieldLabel>
                          <TextArea
                            rows={3}
                            value={data.publicoNecesidades}
                            onChange={(e) => set('publicoNecesidades', e.target.value)}
                            placeholder="Qué buscan, qué les frustra..."
                          />
                        </div>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <div>
                          <FieldLabel>¿Qué es el producto o servicio?</FieldLabel>
                          <TextArea
                            rows={3}
                            value={data.productoQueEs}
                            onChange={(e) => set('productoQueEs', e.target.value)}
                            placeholder="Descríbelo en pocas líneas"
                          />
                        </div>
                        <div>
                          <FieldLabel>Precio o rango (opcional)</FieldLabel>
                          <TextInput
                            value={data.productoPrecio}
                            onChange={(e) => set('productoPrecio', e.target.value)}
                            placeholder="Ej. desde $1,500 MXN"
                          />
                        </div>
                        <div>
                          <FieldLabel>¿Qué incluye? (opcional)</FieldLabel>
                          <TextArea
                            rows={3}
                            value={data.productoIncluye}
                            onChange={(e) => set('productoIncluye', e.target.value)}
                            placeholder="Entregables, sesiones, bonos..."
                          />
                        </div>
                      </>
                    )}

                    {step === 4 && (
                      <>
                        <div>
                          <FieldLabel>¿Qué te diferencia de la competencia?</FieldLabel>
                          <TextArea
                            rows={4}
                            value={data.diferenciador}
                            onChange={(e) => set('diferenciador', e.target.value)}
                            placeholder="Tu ventaja única"
                          />
                        </div>
                        <div>
                          <FieldLabel>Testimonios o casos de éxito (opcional)</FieldLabel>
                          <TextArea
                            rows={3}
                            value={data.testimonios}
                            onChange={(e) => set('testimonios', e.target.value)}
                            placeholder="Frases de clientes, resultados..."
                          />
                        </div>
                      </>
                    )}

                    {step === 5 && (
                      <div className="flex flex-wrap gap-2">
                        {MATERIALS.map((m) => (
                          <CheckPill
                            key={m.id}
                            active={data.material.includes(m.id)}
                            label={m.label}
                            onClick={() => set('material', toggleInList(data.material, m.id))}
                          />
                        ))}
                        <p className="mt-2 w-full text-xs text-white/40">
                          Puedes continuar aunque aún no tengas material.
                        </p>
                      </div>
                    )}

                    {step === 6 && (
                      <div className="flex flex-wrap gap-2">
                        {STRUCTURE.map((s) => (
                          <CheckPill
                            key={s.id}
                            active={data.estructura.includes(s.id)}
                            label={s.label}
                            onClick={() => set('estructura', toggleInList(data.estructura, s.id))}
                          />
                        ))}
                      </div>
                    )}

                    {step === 7 && (
                      <div>
                        <FieldLabel>¿Cuál es la llamada a la acción principal?</FieldLabel>
                        <TextArea
                          rows={3}
                          value={data.cta}
                          onChange={(e) => set('cta', e.target.value)}
                          placeholder="Ej. Agendar cita por WhatsApp, pedir cotización..."
                        />
                      </div>
                    )}

                    {step === 8 && (
                      <div className="space-y-2.5">
                        {STYLES.map((s) => (
                          <ChoiceButton
                            key={s.id}
                            active={data.estiloVisual === s.id}
                            label={s.label}
                            hint={s.hint}
                            onClick={() => set('estiloVisual', s.id)}
                          />
                        ))}
                      </div>
                    )}

                    {step === 9 && (
                      <>
                        <div>
                          <FieldLabel>Colores de marca</FieldLabel>
                          <TextArea
                            rows={2}
                            value={data.colores}
                            onChange={(e) => set('colores', e.target.value)}
                            placeholder="Ej. negro, dorado, blanco · o códigos #..."
                          />
                        </div>
                        <div>
                          <FieldLabel>Referencias visuales (opcional)</FieldLabel>
                          <TextArea
                            rows={3}
                            value={data.referenciasVisuales}
                            onChange={(e) => set('referenciasVisuales', e.target.value)}
                            placeholder="Links de Pinterest, moodboard, marcas..."
                          />
                        </div>
                      </>
                    )}

                    {step === 10 && (
                      <div>
                        <FieldLabel>Competidores y URLs (opcional)</FieldLabel>
                        <TextArea
                          rows={4}
                          value={data.competencia}
                          onChange={(e) => set('competencia', e.target.value)}
                          placeholder="Nombre + link de cada competidor"
                        />
                      </div>
                    )}

                    {step === 11 && (
                      <div>
                        <FieldLabel>Páginas que te gustan (opcional)</FieldLabel>
                        <TextArea
                          rows={4}
                          value={data.paginasGusto}
                          onChange={(e) => set('paginasGusto', e.target.value)}
                          placeholder="URLs y qué te gusta de cada una"
                        />
                      </div>
                    )}

                    {step === 12 && (
                      <>
                        <div>
                          <FieldLabel>Dominio (opcional)</FieldLabel>
                          <TextInput
                            value={data.dominio}
                            onChange={(e) => set('dominio', e.target.value)}
                            placeholder="tumarca.com · o 'aún no tengo'"
                          />
                        </div>
                        <div>
                          <FieldLabel>Hosting (opcional)</FieldLabel>
                          <TextInput
                            value={data.hosting}
                            onChange={(e) => set('hosting', e.target.value)}
                            placeholder="¿Ya tienes hosting o lo necesitamos?"
                          />
                        </div>
                        <div>
                          <FieldLabel>Integraciones (opcional)</FieldLabel>
                          <TextArea
                            rows={3}
                            value={data.integraciones}
                            onChange={(e) => set('integraciones', e.target.value)}
                            placeholder="WhatsApp, CRM, pagos, calendario..."
                          />
                        </div>
                      </>
                    )}

                    {step === 13 && (
                      <div>
                        <FieldLabel>En una frase, ¿cuál es el objetivo final?</FieldLabel>
                        <TextArea
                          rows={4}
                          value={data.objetivoFinal}
                          onChange={(e) => set('objetivoFinal', e.target.value)}
                          placeholder="Ej. Quiero una landing que convierta visitas de Instagram en citas por WhatsApp."
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {error ? (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0 || phase === 'loading'}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white/80 transition enabled:hover:bg-white/[0.08] disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext() || phase === 'loading'}
                className="inline-flex min-h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-[#050508] transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #50C878)` }}
              >
                {phase === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : step >= TOTAL_STEPS - 1 ? (
                  <>
                    Enviar brief
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">¡Brief recibido!</h2>
                <p className="text-sm text-white/50">
                  Gracias, {data.nombre.split(' ')[0]}. Ya lo tenemos.
                </p>
              </div>
            </div>
            <p className="mb-5 text-sm text-white/65">
              Edurne y el equipo de Agentia recibieron tu brief por WhatsApp. Te contactaremos
              pronto para dar el siguiente paso.
            </p>

            <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
                Resumen completo
              </p>
              <SummaryRow label="Contacto" value={`${data.nombre} · ${data.telefono} · ${data.email}`} />
              {data.redes ? <SummaryRow label="Redes" value={data.redes} /> : null}
              <SummaryRow
                label="Objetivos"
                value={data.objetivos.map(labelObjetivo).join(' · ')}
              />
              <SummaryRow
                label="Público"
                value={`${data.publicoEdad} · ${data.publicoSexo} · ${data.publicoUbicacion}`}
              />
              {data.publicoNecesidades ? (
                <SummaryRow label="Necesidades" value={data.publicoNecesidades} />
              ) : null}
              <SummaryRow label="Producto" value={data.productoQueEs} />
              {data.productoPrecio ? <SummaryRow label="Precio" value={data.productoPrecio} /> : null}
              {data.productoIncluye ? (
                <SummaryRow label="Incluye" value={data.productoIncluye} />
              ) : null}
              <SummaryRow label="Diferenciador" value={data.diferenciador} />
              {data.testimonios ? <SummaryRow label="Testimonios" value={data.testimonios} /> : null}
              <SummaryRow
                label="Material"
                value={
                  data.material.length
                    ? data.material
                        .map((id) => MATERIALS.find((m) => m.id === id)?.label ?? id)
                        .join(', ')
                    : 'Ninguno indicado'
                }
              />
              <SummaryRow
                label="Estructura"
                value={data.estructura
                  .map((id) => STRUCTURE.find((s) => s.id === id)?.label ?? id)
                  .join(', ')}
              />
              <SummaryRow label="CTA" value={data.cta} />
              <SummaryRow label="Estilo" value={labelEstilo(data.estiloVisual)} />
              <SummaryRow label="Colores" value={data.colores} />
              {data.referenciasVisuales ? (
                <SummaryRow label="Refs visuales" value={data.referenciasVisuales} />
              ) : null}
              {data.competencia ? <SummaryRow label="Competencia" value={data.competencia} /> : null}
              {data.paginasGusto ? (
                <SummaryRow label="Páginas que gustan" value={data.paginasGusto} />
              ) : null}
              {(data.dominio || data.hosting || data.integraciones) && (
                <SummaryRow
                  label="Técnico"
                  value={[
                    data.dominio && `Dominio: ${data.dominio}`,
                    data.hosting && `Hosting: ${data.hosting}`,
                    data.integraciones && `Integraciones: ${data.integraciones}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
              )}
              <SummaryRow label="Objetivo final" value={data.objetivoFinal} />
              {savedId ? (
                <p className="pt-2 text-[11px] text-white/30">Ref: {savedId}</p>
              ) : null}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <p className="text-[11px] uppercase tracking-wide text-white/35">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap break-words text-white/85">{value}</p>
    </div>
  );
}
