'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GlowButton } from '@/components/landing/GlowButton';
import { agentiaWhatsAppUrl } from '@/lib/agentia-contact';

const CYAN = '#00D4FF';
const GOLD = '#FFD700';
const PLAN = 299;

const WA = agentiaWhatsAppUrl(
  'Hola Agentia, vi el simulador de /lealtad y quiero aumentar mis ventas con el sistema. ¿Me orientan?',
);

function formatMxn(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n);
}

export function RoiCalculator() {
  const reduceMotion = useReducedMotion();
  const [clientes, setClientes] = useState(280);
  const [ticket, setTicket] = useState(120);
  const [recompra, setRecompra] = useState(15);

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

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <div className="grid lg:grid-cols-2">
        <div className="space-y-8 border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
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
          <p className="text-xs leading-relaxed text-white/40">
            Estimación conservadora. No incluye referidos, ticket más alto por recompensas ni
            ahorro en publicidad.
          </p>
        </div>

        <div className="relative flex flex-col justify-center bg-gradient-to-br from-[#00D4FF]/8 via-transparent to-[#FFD700]/6 p-6 sm:p-8">
          <p className="font-[family-name:var(--font-space)] text-xs font-medium uppercase tracking-[0.14em] text-[#00D4FF]">
            Ingreso adicional estimado / mes
          </p>
          <motion.p
            key={ingresoExtra}
            initial={reduceMotion ? false : { opacity: 0.4, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 font-[family-name:var(--font-space)] text-4xl font-extrabold tracking-tight sm:text-5xl"
            style={{
              backgroundImage: `linear-gradient(90deg, ${CYAN}, ${GOLD})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {formatMxn(ingresoExtra)}
          </motion.p>

          <div className="mt-6 space-y-3 text-sm text-white/70">
            <p>
              Si solo regresan{' '}
              <strong className="text-white">{extraClientes} clientes más</strong> al mes con ticket
              de {formatMxn(ticket)}…
            </p>
            <p className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-3 text-[#9AE6B4]">
              {sePagaSolo
                ? `El plan de ${formatMxn(PLAN)} se paga solo ${vecesPlan >= 2 ? `casi ${Math.floor(vecesPlan)}×` : ''} — y el resto es ganancia.`
                : `Con un poco más de recompra, el plan de ${formatMxn(PLAN)} se paga solo.`}
            </p>
          </div>

          <div className="mt-8">
            <GlowButton href={WA} external>
              Quiero esos ingresos extra
            </GlowButton>
          </div>
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
        <span className="text-sm text-white/55">{label}</span>
        <span className="font-[family-name:var(--font-space)] text-lg font-bold text-white">
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
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#00D4FF] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00D4FF] [&::-webkit-slider-thumb]:shadow-[0_0_16px_rgba(0,212,255,0.55)]"
      />
    </label>
  );
}
