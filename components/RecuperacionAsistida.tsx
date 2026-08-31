'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageCircle, X } from 'lucide-react';

export type PlantillaId = 'recordatorio' | 'incentivo' | 'directo';

type Plantilla = {
  id: PlantillaId;
  label: string;
  hint: string;
  build: (v: Vars) => string;
};

type Vars = {
  nombre: string;
  negocio: string;
  diasSinVisitar: number;
};

function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] || 'cliente';
}

function diasTexto(dias: number): string {
  if (!Number.isFinite(dias)) return 'varios';
  return String(Math.max(0, Math.round(dias)));
}

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'recordatorio',
    label: 'Recordatorio',
    hint: 'Suave, sin presión',
    build: ({ nombre, negocio }) =>
      `Hola ${primerNombre(nombre)} 👋 Ya te extrañamos por ${negocio}. ¿Todo bien? Aquí seguimos, esperándote cuando puedas darte una vuelta.`,
  },
  {
    id: 'incentivo',
    label: 'Con incentivo',
    hint: 'Ofrece algo para volver',
    build: ({ nombre, negocio, diasSinVisitar }) =>
      `Hola ${primerNombre(nombre)} 👋 Hace ${diasTexto(diasSinVisitar)} días que no te vemos por ${negocio}. Para tu próxima visita tenemos algo especial para ti — te esperamos 😊`,
  },
  {
    id: 'directo',
    label: 'Directo / personal',
    hint: 'Pregunta qué pasó',
    build: ({ nombre, negocio }) =>
      `Hola ${primerNombre(nombre)}, soy de ${negocio}. Vi que ya no has venido y quería preguntarte directo: ¿todo bien? Si hay algo que podamos mejorar, me encantaría escucharlo.`,
  },
];

export function waDigits(telefono: string): string {
  let digits = String(telefono ?? '').replace(/\D/g, '');
  if (digits.length === 10) digits = `52${digits}`;
  if (digits.startsWith('52') && digits.length > 12) digits = digits.slice(-12);
  return digits;
}

export type RecuperacionAsistidaProps = {
  nombre: string;
  telefono: string;
  negocio: string;
  diasSinVisitar: number;
  puntos: number;
  /** Base del API del tenant, p. ej. "/api/loyalty/carnitas_granada" o "/api/sabucan". */
  registroBase?: string;
  accent?: string;
};

export function RecuperacionAsistida({
  nombre,
  telefono,
  negocio,
  diasSinVisitar,
  puntos,
  registroBase,
  accent = '#25D366',
}: RecuperacionAsistidaProps) {
  const [open, setOpen] = useState(false);
  const [plantillaId, setPlantillaId] = useState<PlantillaId>('recordatorio');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);

  const vars: Vars = { nombre, negocio, diasSinVisitar };

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cerrar();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function abrir() {
    setPlantillaId('recordatorio');
    setMensaje(PLANTILLAS[0].build(vars));
    setErrorRegistro(null);
    setOpen(true);
  }

  function cerrar() {
    setOpen(false);
    setEnviando(false);
  }

  function elegirPlantilla(id: PlantillaId) {
    setPlantillaId(id);
    const plantilla = PLANTILLAS.find((p) => p.id === id);
    if (plantilla) setMensaje(plantilla.build(vars));
  }

  async function confirmar() {
    const texto = mensaje.trim();
    if (!texto) return;
    setEnviando(true);
    setErrorRegistro(null);

    // La ventana se abre siempre; el registro es best-effort y no debe bloquear el contacto.
    if (registroBase) {
      try {
        const res = await fetch(`${registroBase}/contacto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefono,
            plantilla: plantillaId,
            mensaje: texto,
            diasSinVisitar: Number.isFinite(diasSinVisitar) ? diasSinVisitar : null,
            puntos,
          }),
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          setErrorRegistro(json.error ?? 'No se pudo guardar el registro del contacto');
        }
      } catch {
        setErrorRegistro('No se pudo guardar el registro del contacto');
      }
    }

    window.open(
      `https://wa.me/${waDigits(telefono)}?text=${encodeURIComponent(texto)}`,
      '_blank',
      'noopener,noreferrer',
    );
    setEnviando(false);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-[#0a0a0a] transition-opacity hover:opacity-90"
      >
        <MessageCircle className="h-4 w-4" />
        Recuperar cliente
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Recuperación asistida de ${nombre}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrar();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#111] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: accent }}
                >
                  Recuperación asistida
                </p>
                <h2 className="mt-1 truncate font-[family-name:var(--font-space)] text-lg font-bold text-white">
                  {nombre}
                </h2>
                <p className="mt-0.5 text-xs text-white/45">
                  {telefono}
                  {Number.isFinite(diasSinVisitar)
                    ? ` · ${diasTexto(diasSinVisitar)} días sin visitar`
                    : ' · sin visitas registradas'}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {PLANTILLAS.map((p) => {
                const activa = p.id === plantillaId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => elegirPlantilla(p.id)}
                    aria-pressed={activa}
                    className={`rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                      activa
                        ? 'border-white/40 bg-white/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white/80'
                    }`}
                  >
                    <span className="block text-xs font-semibold">{p.label}</span>
                    <span className="mt-0.5 block text-[10px] opacity-60">{p.hint}</span>
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
              Mensaje que se enviará
            </label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={5}
              className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white outline-none focus:border-white/30"
            />
            <p className="mt-2 text-[11px] text-white/35">
              Puedes ajustarlo antes de enviarlo. Se abrirá WhatsApp con el texto listo.
            </p>

            {errorRegistro ? (
              <p className="mt-3 text-xs text-amber-400">{errorRegistro}</p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrar}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/70 hover:border-white/30 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmar()}
                disabled={enviando || !mensaje.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                Abrir en WhatsApp
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
