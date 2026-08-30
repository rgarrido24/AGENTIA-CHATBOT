'use client';

import { useMemo, useState } from 'react';
import { Car, AlertTriangle } from 'lucide-react';
import {
  MOCK_ORDENES,
  MOCK_VEHICULOS,
  getCliente,
  diasHasta,
} from '@/lib/mock-data-taller';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const INTERVALO_KM = 10000;

export default function VehiculosPage() {
  const [q, setQ] = useState('');

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return MOCK_VEHICULOS;
    return MOCK_VEHICULOS.filter((v) => {
      const c = getCliente(v.propietarioId);
      const blob = `${v.placa} ${v.marca} ${v.modelo} ${c?.nombre ?? ''}`.toLowerCase();
      return blob.includes(t);
    });
  }, [q]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <input
        type="search"
        placeholder="Buscar por placa, marca, modelo o cliente…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm placeholder:text-slate-500"
      />

      <div className="space-y-6">
        {filtrados.map((v) => {
          const c = getCliente(v.propietarioId);
          const historial = MOCK_ORDENES.filter((o) => o.vehiculoId === v.id).sort((a, b) =>
            b.fechaIngreso.localeCompare(a.fechaIngreso)
          );
          const kmRest = v.proximoServicioKm - v.kilometraje;
          const diasRest = diasHasta(v.proximoServicio);
          const alertaKm = v.kilometraje > v.proximoServicioKm;

          return (
            <div
              key={v.id}
              className={`rounded-xl border p-5 ${
                alertaKm ? 'border-red-500/80 bg-red-500/10' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(56,189,248,0.12)' }}>
                    <Car className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {v.marca} {v.modelo} {v.año}
                    </p>
                    <p className="text-slate-400 text-sm">Placa {v.placa} · {v.color} · {v.combustible}</p>
                    <p className="text-sm mt-1">Propietario: {c?.nombre ?? '—'}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>Km actual: {v.kilometraje.toLocaleString('es-MX')}</p>
                  <p className={`inline-flex items-center gap-1 ${alertaKm ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                    {alertaKm ? (
                      <><AlertTriangle className="w-3.5 h-3.5" /> Superó km de servicio programado</>
                    ) : (
                      `Próximo servicio ≈ ${kmRest.toLocaleString('es-MX')} km o en ${diasRest} día(s)`
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Historial</p>
                <ul className="space-y-3 border-l-2 border-slate-600 pl-4">
                  {historial.map((o) => (
                    <li key={o.id} className="relative">
                      <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-slate-500" />
                      <p className="text-sm font-medium">
                        {o.fechaIngreso} — {o.tipo} — {o.status.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-500">{o.descripcionProblema}</p>
                      <p className="text-xs text-emerald-400">{fmt(o.total)}</p>
                    </li>
                  ))}
                </ul>
                {historial.length === 0 && <p className="text-slate-500 text-sm">Sin órdenes aún.</p>}
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Mantenimiento recomendado cada ~{INTERVALO_KM.toLocaleString('es-MX')} km (demo).
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
