'use client';

const LEADS = [
  { nombre: 'Valentina R.', tel: '55 1234 5678', estado: 'Nuevo', notas: 'Campaña Meta — formulario vidrios' },
  { nombre: 'Martín L.', tel: '33 9876 5432', estado: 'Contactado', notas: 'Pidió precios por DM' },
  { nombre: 'Sofía M.', tel: '81 5555 1212', estado: 'Interesado', notas: 'Quiere demo del CRM' },
  { nombre: 'Diego P.', tel: '22 4444 9090', estado: 'Cerrado', notas: 'Contrato firmado · demo enviada' },
];

const ESTADO_COLOR: Record<string, string> = {
  Nuevo: '#00D4FF',
  Contactado: '#FFD700',
  Interesado: '#a78bfa',
  Cerrado: '#22c55e',
};

export function LucianoCrmMock() {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[#7B2FBE]/30 bg-[#0d0618] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-[#a78bfa]">
          Panel demo · datos ficticios
        </p>
        <span className="rounded-full bg-[#7B2FBE]/20 px-2 py-0.5 text-[10px] font-bold text-[#c4b5fd]">
          12 leads hoy
        </span>
      </div>
      <div className="space-y-2">
        {LEADS.map((l) => (
          <div
            key={l.nombre}
            className="rounded-lg border border-white/8 bg-black/30 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{l.nombre}</p>
                <p className="text-[10px] text-white/45">{l.tel}</p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{
                  background: `${ESTADO_COLOR[l.estado]}22`,
                  color: ESTADO_COLOR[l.estado],
                }}
              >
                {l.estado}
              </span>
            </div>
            <p className="mt-2 text-[10px] text-white/50">Notas: {l.notas}</p>
            <button
              type="button"
              className="mt-2 rounded-md border border-[#25D366]/40 px-2 py-1 text-[10px] font-semibold text-[#25D366]"
            >
              Contactar por WhatsApp
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
