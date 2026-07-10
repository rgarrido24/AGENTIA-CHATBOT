'use client';

const LEADS = [
  { nombre: 'María González', estado: 'Preguntón', color: '#94a3b8' },
  { nombre: 'Carlos Ruiz', estado: 'Interesado', color: '#00D4FF' },
  { nombre: 'Ana Martínez', estado: 'Cotización enviada', color: '#FFD700' },
  { nombre: 'Pedro Sánchez', estado: 'Cerrado', color: '#22c55e' },
];

export function DecoHouseCrmMock() {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[#00B4D8]/25 bg-[#061018] p-4">
      <p className="mb-3 text-[10px] uppercase tracking-wider text-[#00B4D8]/80">
        Simulación CRM · datos ficticios
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {LEADS.map((l) => (
          <div
            key={l.nombre}
            className="rounded-lg border border-white/8 bg-white/[0.03] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{l.nombre}</p>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{ background: `${l.color}22`, color: l.color }}
              >
                {l.estado}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-white/40">Vidrio templado · Proyecto residencial</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-4 w-full rounded-lg py-2 text-xs font-bold text-[#0a0a0a] sm:w-auto sm:px-6"
        style={{ background: '#00B4D8' }}
      >
        Generar cotización PDF
      </button>
    </div>
  );
}
