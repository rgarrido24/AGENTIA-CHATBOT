'use client';

import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { extraDomicilio, getDueño, getGroomer, getMascota, type KanbanDomicilioStatus } from '@/lib/mock-data-grooming';
import { useGrooming } from '../grooming-context';

const ACCENT = '#f97316';

const COLS: { status: KanbanDomicilioStatus; title: string }[] = [
  { status: 'confirmado', title: 'Confirmado' },
  { status: 'en_camino', title: 'En camino' },
  { status: 'atendiendo', title: 'Atendiendo' },
  { status: 'completado', title: 'Completado' },
];

export default function DomicilioPage() {
  const { ordenes, updateOrden } = useGrooming();

  const byCol = useMemo(() => {
    const m: Record<KanbanDomicilioStatus, typeof ordenes> = {
      confirmado: [],
      en_camino: [],
      atendiendo: [],
      completado: [],
    };
    for (const o of ordenes) m[o.status].push(o);
    return m;
  }, [ordenes]);

  const nextStatus = (s: KanbanDomicilioStatus): KanbanDomicilioStatus | null => {
    const order: KanbanDomicilioStatus[] = ['confirmado', 'en_camino', 'atendiendo', 'completado'];
    const i = order.indexOf(s);
    return i >= 0 && i < order.length - 1 ? order[i + 1]! : null;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <p className="text-slate-500 text-sm">
        Costo adicional por domicilio: +$80 pequeño · +$100 mediano · +$150 grande · +$170 extra grande.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {COLS.map(({ status, title }) => (
          <div key={status} className="rounded-xl border border-white/10 bg-white/[0.02] min-h-[320px]">
            <div className="px-3 py-2 border-b border-white/10 font-medium text-sm" style={{ color: ACCENT }}>
              {title}
            </div>
            <div className="p-2 space-y-2">
              {byCol[status].map((o) => {
                const m = getMascota(o.mascotaId);
                const d = getDueño(o.dueñoId);
                const g = getGroomer(o.groomerId);
                const extra = m ? extraDomicilio(m.tamaño) : 0;
                const ns = nextStatus(status);
                return (
                  <div key={o.id} className="rounded-lg border border-white/10 bg-[#0a0f1a] p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{m?.foto}</span>
                      <div>
                        <p className="font-medium">{m?.nombre}</p>
                        <p className="text-xs text-slate-500">{d?.nombre}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      {o.direccion}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Groomer: {g?.nombre} · ETA {o.eta} · +${extra} envío
                    </p>
                    {ns && (
                      <button
                        type="button"
                        onClick={() => updateOrden(o.id, ns)}
                        className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: ACCENT }}
                      >
                        Avanzar → {COLS.find((c) => c.status === ns)?.title}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border border-dashed border-white/20 bg-slate-800/50 flex items-center justify-center min-h-[200px] text-slate-500 text-sm text-center px-4"
      >
        Mapa en tiempo real — integración Google Maps
      </div>
    </div>
  );
}
