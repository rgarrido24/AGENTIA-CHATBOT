'use client';

import { useState } from 'react';

const JORNADAS = [
  {
    id: 'j1',
    userName: 'Ana Torres',
    startTime: '2026-07-09T08:00:00',
    status: 'activa',
    color: '#2563eb',
    durationMinutes: 187,
    distanceKm: '12.4',
  },
  {
    id: 'j2',
    userName: 'Luis Méndez',
    startTime: '2026-07-09T08:15:00',
    status: 'activa',
    color: '#dc2626',
    durationMinutes: 164,
    distanceKm: '9.8',
  },
  {
    id: 'j3',
    userName: 'Paola Ruiz',
    startTime: '2026-07-09T09:00:00',
    status: 'pausa',
    color: '#ca8a04',
    durationMinutes: 92,
    distanceKm: '6.1',
  },
  {
    id: 'j4',
    userName: 'Carlos Vega',
    startTime: '2026-07-09T07:45:00',
    status: 'activa',
    color: '#16a34a',
    durationMinutes: 201,
    distanceKm: '14.2',
  },
] as const;

const ROUTES: Record<string, string> = {
  j1: 'M 45 195 Q 95 140 155 155 T 285 95',
  j2: 'M 55 210 L 125 175 L 195 188 L 265 130',
  j3: 'M 70 55 L 145 88 L 218 62 L 295 118',
  j4: 'M 90 225 Q 165 185 235 205 T 355 145',
};

const STREETS = [
  { streetName: 'Calle 60', entryTime: '09:12', exitTime: '09:28', durationMinutes: 16 },
  { streetName: 'Av. Colón', entryTime: '09:35', exitTime: '09:52', durationMinutes: 17 },
  { streetName: 'Paseo de Montejo', entryTime: '10:05', exitTime: '10:41', durationMinutes: 36 },
  { streetName: 'Calle 21', entryTime: '11:02', exitTime: '11:18', durationMinutes: 16 },
];

function formatJornadaLabel(j: (typeof JORNADAS)[number]) {
  const fecha = new Date(j.startTime).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${j.userName} - ${fecha} (${j.status})`;
}

export function VolanteoMapMock() {
  const [jornadaId, setJornadaId] = useState<string>('j1');
  const selected = JORNADAS.find((j) => j.id === jornadaId);
  const visibleRoutes = jornadaId === 'all' ? [...JORNADAS] : selected ? [selected] : [];

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-700 bg-[#111827] p-4 text-gray-200">
      <p className="mb-3 text-[10px] uppercase tracking-wider text-gray-500">
        Volanteo Tracker · Mérida, Yucatán · simulación
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={jornadaId}
          onChange={(e) => setJornadaId(e.target.value)}
          className="min-w-[280px] rounded border border-gray-600 bg-gray-900 p-2 text-sm text-gray-100"
        >
          <option value="all">Todas las rutas del equipo</option>
          {JORNADAS.map((j) => (
            <option key={j.id} value={j.id}>
              {formatJornadaLabel(j)}
            </option>
          ))}
        </select>
      </div>

      <div className="relative h-[280px] w-full overflow-hidden rounded border border-gray-700 bg-[#e8e4d9] sm:h-[360px]">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.15), transparent 40%), repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(0,0,0,0.04) 31px, rgba(0,0,0,0.04) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(0,0,0,0.04) 31px, rgba(0,0,0,0.04) 32px)',
          }}
        />
        <svg viewBox="0 0 400 240" className="absolute inset-0 h-full w-full" aria-hidden>
          {visibleRoutes.map((j) => (
            <path
              key={j.id}
              d={ROUTES[j.id]}
              fill="none"
              stroke={j.color}
              strokeWidth={jornadaId === 'all' ? 3 : 4}
              strokeOpacity={jornadaId === 'all' ? 0.85 : 1}
              strokeLinecap="round"
            />
          ))}
          {visibleRoutes.map((j) => {
            const pts = ROUTES[j.id].match(/[\d.]+/g)?.map(Number) ?? [];
            const cx = pts[0] ?? 40;
            const cy = pts[1] ?? 180;
            return (
              <g key={`m-${j.id}`}>
                <circle cx={cx} cy={cy} r="6" fill={j.color} stroke="#fff" strokeWidth="2" />
                <circle
                  cx={pts[pts.length - 2] ?? 300}
                  cy={pts[pts.length - 1] ?? 100}
                  r="5"
                  fill="#fff"
                  stroke={j.color}
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-700 shadow">
          Centro: Mérida · zoom 15
        </div>
        {jornadaId === 'all' && (
          <div className="absolute right-2 top-2 space-y-1 rounded bg-white/95 p-2 text-[10px] text-gray-700 shadow">
            {JORNADAS.map((j) => (
              <div key={j.id} className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-sm" style={{ background: j.color }} />
                {j.userName}
              </div>
            ))}
          </div>
        )}
      </div>

      {jornadaId !== 'all' && selected && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <p>
              <span className="font-medium">Duración total:</span> {selected.durationMinutes} min
            </p>
            <p>
              <span className="font-medium">Distancia recorrida:</span> {selected.distanceKm} km
            </p>
          </div>

          <div className="overflow-x-auto rounded border border-gray-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="border-b border-gray-700 px-4 py-2">Calle</th>
                  <th className="border-b border-gray-700 px-4 py-2">Hora entrada</th>
                  <th className="border-b border-gray-700 px-4 py-2">Hora salida</th>
                  <th className="border-b border-gray-700 px-4 py-2">Duración (min)</th>
                </tr>
              </thead>
              <tbody>
                {STREETS.map((seg, idx) => (
                  <tr key={`${seg.streetName}-${idx}`} className="border-b border-gray-800">
                    <td className="px-4 py-2">{seg.streetName}</td>
                    <td className="px-4 py-2">{seg.entryTime}</td>
                    <td className="px-4 py-2">{seg.exitTime}</td>
                    <td className="px-4 py-2">{seg.durationMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
