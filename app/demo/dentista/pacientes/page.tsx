'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ultimaConsulta } from '@/lib/mock-data-dentista';
import { useDentista } from '../dentista-context';

function deudaBadge(deuda: number) {
  if (deuda === 0) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (deuda > 2000) return 'bg-red-500/20 text-red-300 border-red-500/40';
  return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
}

export default function PacientesPage() {
  const { pacientes, consultas } = useDentista();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = pacientes;
    if (qq) {
      list = pacientes.filter(
        (p) =>
          p.nombre.toLowerCase().includes(qq) ||
          p.telefono.includes(qq) ||
          p.dentistaTratante.toLowerCase().includes(qq)
      );
    }
    return list;
  }, [q, pacientes]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, teléfono o dentista…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-500">
              <th className="p-3">Paciente</th>
              <th className="p-3">Edad</th>
              <th className="p-3">Dentista</th>
              <th className="p-3">Última visita</th>
              <th className="p-3">Deuda</th>
              <th className="p-3">Status</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const u = ultimaConsulta(consultas, p.id);
              return (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="p-3 font-medium">{p.nombre}</td>
                  <td className="p-3">{p.edad}</td>
                  <td className="p-3 text-slate-400">{p.dentistaTratante}</td>
                  <td className="p-3 text-slate-400">{u?.fecha ?? '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${deudaBadge(p.deuda)}`}>
                      ${p.deuda.toLocaleString('es-MX')}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-400">{p.nivel}</span>
                      {p.radiografias.length > 0 && (
                        <span title={`${p.radiografias.length} radiografía(s)`} className="text-xs cursor-default select-none">🩻</span>
                      )}
                      {p.fotosEvolucion.length > 0 && (
                        <span title={`${p.fotosEvolucion.length} foto(s) de evolución`} className="text-xs cursor-default select-none">📸</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/demo/dentista/expediente?paciente=${p.id}`}
                      className="text-sky-400 hover:underline text-xs"
                    >
                      Ver expediente
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
