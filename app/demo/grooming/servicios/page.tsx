'use client';

import { useMemo, useState } from 'react';
import { MOCK_SERVICIOS, RAZA_TAMAÑO_SUGERIDO, type TamañoMascota } from '@/lib/mock-data-grooming';
import { useGrooming } from '../grooming-context';

const TAMS: TamañoMascota[] = ['Pequeño', 'Mediano', 'Grande', 'Extra Grande'];

export default function GroomingServiciosPage() {
  const { serviciosOn, toggleServicio } = useGrooming();
  const [raza, setRaza] = useState('Golden Retriever');

  const sugerido = RAZA_TAMAÑO_SUGERIDO[raza] ?? ('Mediano' as TamañoMascota);
  const servEjemplo = MOCK_SERVICIOS[0]!;

  const precioEjemplo = useMemo(() => {
    const k =
      sugerido === 'Pequeño'
        ? 'pequeño'
        : sugerido === 'Mediano'
          ? 'mediano'
          : sugerido === 'Grande'
            ? 'grande'
            : 'extraGrande';
    return servEjemplo.precioBase[k];
  }, [sugerido]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <p className="text-slate-500 text-sm">Precios en MXN según tamaño. Activa o desactiva servicios para la agenda.</p>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold mb-4">Calculadora rápida</h2>
        <label className="text-xs text-slate-400">Raza (sugerimos tamaño)</label>
        <select
          value={raza}
          onChange={(e) => setRaza(e.target.value)}
          className="mt-1 w-full max-w-md rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
        >
          {Object.keys(RAZA_TAMAÑO_SUGERIDO).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm text-orange-200">
          Tamaño sugerido: <strong>{sugerido}</strong> — Baño básico desde <strong>${precioEjemplo}</strong>
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04] text-left text-slate-400">
              <th className="p-3">Servicio</th>
              <th className="p-3">Pequeño</th>
              <th className="p-3">Mediano</th>
              <th className="p-3">Grande</th>
              <th className="p-3">Extra grande</th>
              <th className="p-3">On/Off</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SERVICIOS.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3">
                  <span className="mr-2">{s.emoji}</span>
                  <span className="font-medium text-white">{s.nombre}</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">{s.categoria}</span>
                </td>
                {TAMS.map((t) => {
                  const k =
                    t === 'Pequeño'
                      ? 'pequeño'
                      : t === 'Mediano'
                        ? 'mediano'
                        : t === 'Grande'
                          ? 'grande'
                          : 'extraGrande';
                  return (
                    <td key={t} className="p-3 tabular-nums">
                      ${s.precioBase[k]}
                      <span className="block text-[10px] text-slate-500">{s.duracion[k]} min</span>
                    </td>
                  );
                })}
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => toggleServicio(s.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      serviciosOn[s.id] ? 'bg-emerald-600/30 text-emerald-200' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {serviciosOn[s.id] ? 'Disponible' : 'Off'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
