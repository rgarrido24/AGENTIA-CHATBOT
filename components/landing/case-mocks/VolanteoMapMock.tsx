'use client';

const TEAM = [
  { nombre: 'Ana Torres', estado: 'En ruta', color: '#00FF88' },
  { nombre: 'Luis Méndez', estado: 'Zona norte', color: '#00D4FF' },
  { nombre: 'Paola Ruiz', estado: 'Pausa', color: '#FFD700' },
  { nombre: 'Carlos Vega', estado: 'En ruta', color: '#FF6B35' },
];

export function VolanteoMapMock() {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_200px]">
      <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-[#00FF88]/25 bg-[#050a08]">
        <p className="absolute left-3 top-3 z-10 text-[10px] uppercase tracking-wider text-[#00FF88]/80">
          Mérida, Yucatán · simulación
        </p>
        <svg viewBox="0 0 400 240" className="h-full w-full opacity-90" aria-hidden>
          <defs>
            <radialGradient id="heat1" cx="30%" cy="40%" r="35%">
              <stop offset="0%" stopColor="#00FF88" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat2" cx="70%" cy="55%" r="30%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="240" fill="#0a1210" />
          <rect x="0" y="0" width="400" height="240" fill="url(#heat1)" />
          <rect x="0" y="0" width="400" height="240" fill="url(#heat2)" />
          {[...Array(12)].map((_, i) => (
            <line
              key={`g${i}`}
              x1={i * 36}
              y1="0"
              x2={i * 36}
              y2="240"
              stroke="#ffffff"
              strokeOpacity="0.04"
            />
          ))}
          <path
            d="M 40 180 Q 120 120 200 140 T 360 80"
            fill="none"
            stroke="#00FF88"
            strokeWidth="3"
            strokeOpacity="0.8"
          />
          <path
            d="M 60 200 L 140 160 L 220 190 L 300 120"
            fill="none"
            stroke="#00D4FF"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
          <path
            d="M 80 60 L 160 100 L 240 70 L 320 130"
            fill="none"
            stroke="#FF6B35"
            strokeWidth="2"
          />
          <path
            d="M 100 220 Q 180 180 260 200"
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
          />
          {[
            [40, 180],
            [200, 140],
            [140, 160],
            [300, 120],
            [240, 70],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="5" fill="#00FF88" stroke="#0a0a0a" strokeWidth="2" />
          ))}
        </svg>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-white/50">
          Equipo activo
        </p>
        <ul className="space-y-2">
          {TEAM.map((t) => (
            <li key={t.nombre} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
              <span className="flex-1 text-white/80">{t.nombre}</span>
              <span className="text-[10px] text-white/40">{t.estado}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
