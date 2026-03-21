'use client';

/** Placeholder ECG normal (simplificado) */
export default function EcgSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="400" height="120" fill="#0c1220" rx="8" />
      <text x="12" y="22" fill="#94a3b8" fontSize="11" fontFamily="system-ui">
        Electrocardiograma (12 derivaciones simuladas)
      </text>
      <path
        d="M 10 70 L 30 70 L 35 50 L 40 90 L 45 55 L 50 70 L 80 70 L 85 40 L 90 85 L 95 60 L 100 70 L 130 70 L 135 48 L 140 92 L 145 58 L 150 70 L 180 70 L 185 42 L 190 88 L 195 62 L 200 70 L 230 70 L 235 50 L 240 88 L 245 56 L 250 70 L 280 70 L 285 45 L 290 90 L 295 60 L 300 70 L 330 70 L 335 52 L 340 86 L 345 58 L 350 70 L 390 70"
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M 10 95 L 390 95"
        stroke="#334155"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="12" y="112" fill="#64748b" fontSize="9">
        Ritmo sinusal · Frecuencia ~72 lpm (demo)
      </text>
    </svg>
  );
}
