'use client';

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const INK = '#14161A';
const WA = '#25D366';

type Status = 'activo' | 'riesgo' | 'inactivo';

type ClientCard = {
  id: string;
  name: string;
  phone: string;
  status: Status;
  lastVisit: string;
  points: string;
};

type Template = {
  id: 'recordatorio' | 'invitacion' | 'personalizado';
  label: string;
  preview: (name: string) => string;
};

const CLIENTS: ClientCard[] = [
  {
    id: 'ana',
    name: 'Ana López',
    phone: '5215550100101',
    status: 'activo',
    lastVisit: 'Hace 2 días',
    points: '8 sellos',
  },
  {
    id: 'luis',
    name: 'Luis Hernández',
    phone: '5215550100102',
    status: 'riesgo',
    lastVisit: 'Hace 18 días',
    points: '5 sellos',
  },
  {
    id: 'carla',
    name: 'Carla Méndez',
    phone: '5215550100103',
    status: 'inactivo',
    lastVisit: 'Hace 41 días',
    points: '3 sellos',
  },
];

const TEMPLATES: Template[] = [
  {
    id: 'recordatorio',
    label: 'Recordatorio',
    preview: (name) =>
      `Hola ${firstName(name)}, te extrañamos en Café Luna. Trae tu pase y te sumamos la visita. ¿Te vemos esta semana?`,
  },
  {
    id: 'invitacion',
    label: 'Invitación',
    preview: (name) =>
      `Hola ${firstName(name)}, tenemos una promo para ti esta semana. Trae tu tarjeta de lealtad y te la aplicamos. ¿Vienes?`,
  },
  {
    id: 'personalizado',
    label: 'Personalizado',
    preview: (name) =>
      `Hola ${firstName(name)}, ¿cómo estás? Guardé tu lugar de siempre. Cuando quieras te esperamos — tu pase sigue activo.`,
  },
];

const STATUS_UI: Record<
  Status,
  { label: string; dot: string; ring: string }
> = {
  activo: { label: 'Activo', dot: '#22C55E', ring: 'ring-[#22C55E]/25' },
  riesgo: { label: 'En riesgo', dot: '#EAB308', ring: 'ring-[#EAB308]/30' },
  inactivo: { label: 'Inactivo', dot: '#EF4444', ring: 'ring-[#EF4444]/30' },
};

function firstName(full: string) {
  return full.split(' ')[0] || full;
}

export function TrafficLightDemo() {
  const reduceMotion = useReducedMotion();
  const [picked, setPicked] = useState<ClientCard | null>(null);
  const [templateId, setTemplateId] = useState<Template['id']>('recordatorio');
  const [note, setNote] = useState<string | null>(null);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];

  useEffect(() => {
    if (!picked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPicked(null);
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => dialogRef.current?.focus(), 30);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [picked]);

  function onRecover(client: ClientCard) {
    setNote(null);
    if (client.status === 'activo') {
      setNote(`${firstName(client.name)} está activa. No hace falta escribirle hoy.`);
      return;
    }
    setTemplateId('recordatorio');
    setPicked(client);
  }

  function openWhatsApp() {
    if (!picked) return;
    const text = template.preview(picked.name);
    window.open(
      `https://wa.me/${picked.phone}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {CLIENTS.map((c) => {
          const ui = STATUS_UI[c.status];
          return (
            <article
              key={c.id}
              className={`flex flex-col rounded-[1.5rem] bg-white p-5 ring-1 ${ui.ring}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: INK }}>
                    {c.name}
                  </p>
                  <p className="mt-0.5 text-sm text-[#14161A]/50">{c.lastVisit}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F1EC] px-2.5 py-1 text-[11px] font-semibold">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: ui.dot }}
                    aria-hidden
                  />
                  {ui.label}
                </span>
              </div>
              <p className="mt-4 text-sm text-[#14161A]/45">{c.points}</p>
              <button
                type="button"
                onClick={() => onRecover(c)}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full py-2.5 text-sm font-semibold text-white transition-[transform] duration-150 hover:-translate-y-px active:scale-[0.97]"
                style={{ background: WA }}
              >
                Recuperar
              </button>
            </article>
          );
        })}
      </div>

      {note ? (
        <p className="mt-4 text-sm text-[#14161A]/55" role="status">
          {note}
        </p>
      ) : (
        <p className="mt-4 text-sm text-[#14161A]/45">
          Demo: toca Recuperar en la tarjeta roja. El mensaje no se manda solo — tú lo abres.
        </p>
      )}

      <AnimatePresence>
        {picked ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-[#14161A]/40 p-4 sm:items-center"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setPicked(null)}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md rounded-[1.75rem] bg-[#FAFAF8] p-6 shadow-[0_20px_50px_rgba(20,22,26,0.18)] outline-none sm:p-7"
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#14161A]/40">
                Recuperar a {picked.name}
              </p>
              <h3 id={titleId} className="mt-1 text-xl font-bold" style={{ color: INK }}>
                Elige el mensaje. Tú lo mandas.
              </h3>
              <p className="mt-2 text-sm text-[#14161A]/50">
                El sistema detectó que está {picked.status === 'riesgo' ? 'en riesgo' : 'inactiva'}. El toque lo das tú.
              </p>

              <fieldset className="mt-5 space-y-2">
                <legend className="sr-only">Plantilla de mensaje</legend>
                {TEMPLATES.map((t) => {
                  const selected = t.id === templateId;
                  return (
                    <label
                      key={t.id}
                      className={`block cursor-pointer rounded-2xl bg-white p-4 ring-1 ${
                        selected ? 'ring-[#B8935A]/50' : 'ring-[#14161A]/8'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="lealtad-tpl"
                          className="accent-[#B8935A]"
                          checked={selected}
                          onChange={() => setTemplateId(t.id)}
                        />
                        <span className="text-sm font-semibold" style={{ color: INK }}>
                          {t.label}
                        </span>
                      </span>
                      <span className="mt-2 block text-[13px] leading-relaxed text-[#14161A]/55">
                        {t.preview(picked.name)}
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition-[transform] duration-150 hover:-translate-y-px active:scale-[0.97]"
                  style={{ background: WA }}
                >
                  Abrir en WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold ring-1 ring-[#14161A]/15"
                  style={{ color: INK }}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
