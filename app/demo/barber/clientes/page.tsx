'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS } from '../giro-config';

export default function BarberClientesPage() {
  const { giro } = useBarber();
  const cfg = giro ? GIRO_CONFIGS[giro] : GIRO_CONFIGS.barberia;
  const isNail = giro === 'nail';
  const accent = cfg.acento;

  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return cfg.clientes;
    return cfg.clientes.filter((r) => r.nombre.toLowerCase().includes(t));
  }, [q, cfg.clientes]);

  const basePath = isNail ? '/demo/nailstudio' : '/demo/barber';

  // Theme tokens (light for nail, dark for barber)
  const text = isNail ? 'text-zinc-900' : 'text-white';
  const textMuted = isNail ? 'text-zinc-600' : 'text-slate-300';
  const textSubtle = isNail ? 'text-zinc-500' : 'text-slate-400';
  const tableHeadBg = isNail ? 'bg-pink-50' : 'bg-white/[0.04]';
  const tableHeadText = isNail ? 'text-pink-700' : 'text-slate-300';
  const containerBorder = isNail ? 'border-pink-200' : 'border-white/10';
  const containerBg = isNail ? 'bg-white' : 'bg-transparent';
  const rowHover = isNail ? 'hover:bg-pink-50/60' : 'hover:bg-white/[0.04]';
  const rowDivider = isNail ? 'divide-pink-100' : 'divide-white/5';
  const inputBg = isNail
    ? 'bg-white border-pink-200 text-zinc-900 placeholder-zinc-400 focus:ring-pink-400/40'
    : 'bg-white/[0.05] border-white/10 text-white placeholder-slate-500 focus:ring-teal-500/40';

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className={`text-sm ${textSubtle}`}>
          Base de {isNail ? 'clientas' : 'clientes'} — demo con datos de ejemplo.
        </p>
        <div className="relative max-w-md w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSubtle}`} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Buscar ${isNail ? 'clienta' : 'cliente'}…`}
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:ring-2 ${inputBg}`}
          />
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${containerBorder} ${containerBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase tracking-wide ${tableHeadBg} ${tableHeadText}`}>
              <tr>
                <th className="px-4 py-3 font-semibold">{isNail ? 'Clienta' : 'Cliente'}</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Último servicio</th>
                <th className="px-4 py-3 font-semibold">Próxima cita</th>
                <th className="px-4 py-3 font-semibold">Visitas</th>
                <th className="px-4 py-3 font-semibold">Gasto acum.</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className={`divide-y ${rowDivider}`}>
              {rows.map((r) => (
                <tr key={r.nombre} className={rowHover}>
                  <td className={`px-4 py-3 font-semibold ${text} flex items-center gap-2 flex-wrap`}>
                    {r.nombre}
                    {r.visitas > 10 && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                        style={{
                          background: isNail ? 'rgba(236,72,153,0.12)' : 'rgba(245,158,11,0.18)',
                          color: isNail ? '#be185d' : '#fcd34d',
                          borderColor: isNail ? 'rgba(236,72,153,0.4)' : 'rgba(245,158,11,0.45)',
                        }}
                      >
                        VIP
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 font-mono text-xs ${textSubtle}`}>{r.tel}</td>
                  <td className={`px-4 py-3 ${textMuted}`}>{r.ultimo}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: accent }}>
                    {r.proxima}
                  </td>
                  <td className={`px-4 py-3 tabular-nums font-semibold ${text}`}>{r.visitas}</td>
                  <td className={`px-4 py-3 tabular-nums ${textMuted}`}>
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                      maximumFractionDigits: 0,
                    }).format(r.gasto)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={basePath}
                      className="inline-flex text-xs font-bold px-3 py-1.5 rounded-lg border transition"
                      style={{
                        background: isNail ? 'rgba(236,72,153,0.12)' : 'rgba(13,148,136,0.18)',
                        color: accent,
                        borderColor: `${accent}66`,
                      }}
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
