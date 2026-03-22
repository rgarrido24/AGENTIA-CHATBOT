'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const RAW = [
  { nombre: 'Carlos Mendoza', tel: '+52 55 1001 0001', ultimo: 'Corte clásico', proxima: 'Hoy 4:00 pm', visitas: 12, gasto: 4280 },
  { nombre: 'Juan García', tel: '+52 55 1002 0002', ultimo: 'Fade', proxima: 'Mañana 11:00 am', visitas: 4, gasto: 1520 },
  { nombre: 'Roberto López', tel: '+52 55 1003 0003', ultimo: 'Corte + Barba', proxima: '—', visitas: 8, gasto: 2890 },
  { nombre: 'Miguel Torres', tel: '+52 55 1004 0004', ultimo: 'Arreglo de barba', proxima: 'Vie 3:30 pm', visitas: 2, gasto: 480 },
  { nombre: 'Andrés Hernández', tel: '+52 55 1005 0005', ultimo: 'Tinte', proxima: '—', visitas: 15, gasto: 6200 },
  { nombre: 'Diego Martínez', tel: '+52 55 1006 0006', ultimo: 'Corte clásico', proxima: 'Hoy 6:00 pm', visitas: 6, gasto: 2100 },
  { nombre: 'Luis Ramírez', tel: '+52 55 1007 0007', ultimo: 'Fade', proxima: 'Mar 10:00 am', visitas: 3, gasto: 980 },
  { nombre: 'Fernando Castro', tel: '+52 55 1008 0008', ultimo: 'Afeitado', proxima: '—', visitas: 1, gasto: 150 },
  { nombre: 'Pablo Jiménez', tel: '+52 55 1009 0009', ultimo: 'Corte + Barba', proxima: 'Jue 5:00 pm', visitas: 11, gasto: 4100 },
  { nombre: 'Alejandro Morales', tel: '+52 55 1010 0010', ultimo: 'Tratamiento capilar', proxima: '—', visitas: 5, gasto: 1750 },
  { nombre: 'Eduardo Vargas', tel: '+52 55 1011 0011', ultimo: 'Corte clásico', proxima: 'Mañana 9:30 am', visitas: 7, gasto: 2340 },
  { nombre: 'Ricardo Díaz', tel: '+52 55 1012 0012', ultimo: 'Barba', proxima: '—', visitas: 9, gasto: 2680 },
  { nombre: 'Sergio Reyes', tel: '+52 55 1013 0013', ultimo: 'Fade', proxima: 'Sáb 12:00 pm', visitas: 4, gasto: 1200 },
  { nombre: 'Antonio Flores', tel: '+52 55 1014 0014', ultimo: 'Corte niño', proxima: '—', visitas: 2, gasto: 360 },
  { nombre: 'Javier González', tel: '+52 55 1015 0015', ultimo: 'Corte + Barba', proxima: 'Mié 4:00 pm', visitas: 13, gasto: 5020 },
];

export default function BarberClientesPage() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return RAW;
    return RAW.filter((r) => r.nombre.toLowerCase().includes(t));
  }, [q]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-slate-500 text-sm">Base de clientes — demo con datos de ejemplo.</p>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/[0.04] text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Último servicio</th>
                <th className="px-4 py-3">Próxima cita</th>
                <th className="px-4 py-3">Visitas</th>
                <th className="px-4 py-3">Gasto acum.</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.nombre} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white flex items-center gap-2 flex-wrap">
                    {r.nombre}
                    {r.visitas > 10 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        VIP
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{r.tel}</td>
                  <td className="px-4 py-3 text-slate-300">{r.ultimo}</td>
                  <td className="px-4 py-3 text-teal-300/90">{r.proxima}</td>
                  <td className="px-4 py-3 tabular-nums">{r.visitas}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-300">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(
                      r.gasto
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href="/demo/barber"
                      className="inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600/30 text-teal-200 border border-teal-500/40 hover:bg-teal-600/50 transition"
                    >
                      Agendar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
