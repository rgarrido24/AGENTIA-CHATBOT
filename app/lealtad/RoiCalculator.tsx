'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { agentiaWhatsAppUrl } from '@/lib/agentia-contact';
import { CountUp } from './CountUp';

const BRONZE = '#B8935A';
const INK = '#14161A';
const WA = '#25D366';
const PLAN = 399;

const GIROS = [
  'Cafeterías',
  'Barberías',
  'Restaurantes',
  'Estéticas',
  'Veterinarias',
  'Gimnasios',
  'Boutiques',
  'Farmacias',
  'Papelerías',
  'Abarrotes',
  'Tacos / comida rápida',
];

function formatMxn(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n);
}

export function RoiCalculator() {
  const [clientes, setClientes] = useState(280);
  const [ticket, setTicket] = useState(120);
  const [recompra, setRecompra] = useState(15);
  const [unlocked, setUnlocked] = useState(false);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [giro, setGiro] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { extraClientes, ingresoExtra, vecesPlan, sePagaSolo } = useMemo(() => {
    const extras = Math.round(clientes * (recompra / 100));
    const ingreso = extras * ticket;
    const veces = ingreso / PLAN;
    return {
      extraClientes: extras,
      ingresoExtra: ingreso,
      vecesPlan: veces,
      sePagaSolo: ingreso >= PLAN,
    };
  }, [clientes, ticket, recompra]);

  const waResult = agentiaWhatsAppUrl(
    `Hola Agentia, soy ${nombre.trim()}. Tengo un negocio de ${giro.toLowerCase()}. En el simulador me salió ${formatMxn(ingresoExtra)} extra al mes si vuelven un ${recompra}% más (${extraClientes} clientes, ticket ${formatMxn(ticket)}). Quiero ver cómo arrancar.`,
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/lealtad/calculadora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          whatsapp,
          giro,
          clientes,
          ticket,
          recompra,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'No se pudo guardar. Intenta de nuevo.');
        return;
      }
      setUnlocked(true);
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-[#14161A]/8">
      <div className="grid lg:grid-cols-2">
        <div className="space-y-8 border-b border-[#14161A]/8 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <SliderField
            label="Clientes al mes"
            value={clientes}
            min={40}
            max={1500}
            step={10}
            display={`${clientes}`}
            onChange={setClientes}
          />
          <SliderField
            label="Ticket promedio"
            value={ticket}
            min={40}
            max={800}
            step={10}
            display={formatMxn(ticket)}
            onChange={setTicket}
          />
          <SliderField
            label="% estimado de clientes que podrían volver más"
            value={recompra}
            min={5}
            max={40}
            step={1}
            display={`${recompra}%`}
            onChange={setRecompra}
          />
          <p className="text-xs leading-relaxed text-[#14161A]/45">
            Estimación. Mueve los números de tu negocio. El % es el que tú pones.
          </p>
        </div>

        <div className="relative flex flex-col justify-center bg-[#F3F1EC] p-6 sm:p-8">
          <p className="text-sm text-[#14161A]/70">
            Si vuelven {extraClientes} más al mes con ticket de {formatMxn(ticket)}…
          </p>

          {unlocked ? (
            <>
              <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-[#B8935A]">
                Ingreso adicional estimado / mes
              </p>
              <p
                className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
                style={{ color: BRONZE }}
              >
                <CountUp end={ingresoExtra} format={formatMxn} duration={900} />
              </p>
              <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-[#14161A] ring-1 ring-[#B8935A]/25">
                {sePagaSolo
                  ? `El plan de ${formatMxn(PLAN)} se paga ${vecesPlan >= 2 ? `casi ${Math.floor(vecesPlan)}×` : 'solo'}.`
                  : `Con un poco más de recompra, el plan de ${formatMxn(PLAN)} se cubre.`}
              </p>
              <div className="mt-8">
                <a
                  href={waResult}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-[transform] duration-150 hover:-translate-y-px active:scale-[0.97]"
                  style={{ background: WA }}
                >
                  Escríbenos
                </a>
              </div>
            </>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#B8935A]">
                Para ver el ingreso adicional
              </p>
              <label className="block">
                <span className="text-sm text-[#14161A]/55">Nombre</span>
                <input
                  type="text"
                  name="nombre"
                  autoComplete="name"
                  required
                  minLength={2}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1.5 w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#14161A]/10 focus:ring-[#B8935A]/40"
                />
              </label>
              <label className="block">
                <span className="text-sm text-[#14161A]/55">WhatsApp</span>
                <input
                  type="tel"
                  name="whatsapp"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="10 dígitos"
                  className="mt-1.5 w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#14161A]/10 focus:ring-[#B8935A]/40"
                />
              </label>
              <label className="block">
                <span className="text-sm text-[#14161A]/55">Giro de negocio</span>
                <select
                  name="giro"
                  required
                  value={giro}
                  onChange={(e) => setGiro(e.target.value)}
                  className="mt-1.5 w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#14161A]/10 focus:ring-[#B8935A]/40"
                >
                  <option value="">Elige uno</option>
                  {GIROS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden
              />
              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-[transform] duration-150 hover:-translate-y-px active:scale-[0.97] disabled:opacity-60"
                style={{ background: WA }}
              >
                {submitting ? 'Guardando…' : 'Ver mi resultado'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-3 flex items-end justify-between gap-3">
        <span className="text-sm text-[#14161A]/55">{label}</span>
        <span className="text-lg font-bold" style={{ color: INK }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#14161A]/10 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#B8935A]"
        style={{ accentColor: BRONZE }}
      />
    </label>
  );
}
