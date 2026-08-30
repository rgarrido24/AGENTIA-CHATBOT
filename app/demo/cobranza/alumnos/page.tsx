'use client';

import { useMemo, useState } from 'react';
import { MOCK_ALUMNOS } from '@/lib/mock-data-cobranza';

export default function AlumnosPage() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    if (!q.trim()) return MOCK_ALUMNOS;
    const t = q.toLowerCase();
    return MOCK_ALUMNOS.filter(
      (a) =>
        a.nombre.toLowerCase().includes(t) ||
        a.tutor.toLowerCase().includes(t) ||
        a.email.toLowerCase().includes(t) ||
        a.id.toLowerCase().includes(t)
    );
  }, [q]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <p className="text-slate-400 text-sm">Directorio de alumnos — Instituto Meridian (demo)</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, tutor, email o folio..."
        className="w-full max-w-md bg-slate-900 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white"
      />
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10 bg-white/[0.03]">
                <th className="px-3 py-3 font-medium">Folio</th>
                <th className="px-3 py-3 font-medium">Alumno</th>
                <th className="px-3 py-3 font-medium">Tutor</th>
                <th className="px-3 py-3 font-medium">Carrera</th>
                <th className="px-3 py-3 font-medium">Ciclo</th>
                <th className="px-3 py-3 font-medium">Asesor</th>
                <th className="px-3 py-3 font-medium">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">{a.id}</td>
                  <td className="px-3 py-2.5 text-white font-medium">{a.nombre}</td>
                  <td className="px-3 py-2.5 text-slate-400">{a.tutor}</td>
                  <td className="px-3 py-2.5 text-slate-300">{a.carrera}</td>
                  <td className="px-3 py-2.5 text-slate-300">{a.ciclo}</td>
                  <td className="px-3 py-2.5 text-slate-400">{a.asesor}</td>
                  <td className="px-3 py-2.5 text-slate-400">{a.telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
