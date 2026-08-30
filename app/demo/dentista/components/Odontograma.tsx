'use client';

import type { EstadoDiente, OdontogramaData } from '@/lib/mock-data-dentista';

const COLORS: Record<EstadoDiente, string> = {
  sano: '#ffffff',
  previo: '#facc15',
  requiere: '#ef4444',
  ausente: '#64748b',
  implante: '#0284c7',
};

const LABEL: Record<EstadoDiente, string> = {
  sano: 'Sano',
  previo: 'Tratamiento previo',
  requiere: 'Requiere tratamiento',
  ausente: 'Ausente / extraído',
  implante: 'Implante',
};

/** Fila superior: 18→11 y 21→28 */
const ROW_SUPERIOR = [...Array.from({ length: 8 }, (_, i) => 18 - i), ...Array.from({ length: 8 }, (_, i) => 21 + i)];
/** Fila inferior: 48→41 y 31→38 */
const ROW_INFERIOR = [...Array.from({ length: 8 }, (_, i) => 48 - i), ...Array.from({ length: 8 }, (_, i) => 31 + i)];

export default function Odontograma({ data }: { data: OdontogramaData }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 text-center">Representación FDI (32 dientes) — demo visual</p>
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center gap-1 max-w-2xl">
          {ROW_SUPERIOR.map((n) => (
            <Diente key={n} num={n} data={data} />
          ))}
        </div>
        <div className="h-px w-full max-w-2xl bg-white/10" />
        <div className="flex flex-wrap justify-center gap-1 max-w-2xl">
          {ROW_INFERIOR.map((n) => (
            <Diente key={n} num={n} data={data} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center text-[10px] text-slate-400 pt-2 border-t border-white/10">
        {(Object.keys(COLORS) as EstadoDiente[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm border border-white/20" style={{ background: COLORS[k] }} />
            {LABEL[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Diente({ num, data }: { num: number; data: OdontogramaData }) {
  const k = String(num);
  const est = data.estados[k] ?? 'sano';
  const tip = data.notas[k] ?? `${LABEL[est]} · Diente ${num}`;
  return (
    <div className="group relative">
      <div
        className="w-6 h-8 sm:w-7 sm:h-9 rounded-md border border-slate-600 shadow-inner flex items-center justify-center text-[9px] font-mono text-slate-700"
        style={{ background: COLORS[est] }}
        title={tip}
      >
        {num}
      </div>
      <div className="pointer-events-none absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-max max-w-[200px] rounded bg-slate-900 border border-white/15 px-2 py-1 text-[10px] text-slate-200 shadow-lg">
        {tip}
      </div>
    </div>
  );
}
