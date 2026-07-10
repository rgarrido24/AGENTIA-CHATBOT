/** Logo izzi: letras blancas, puntos en colores de marca (sin filter en la imagen completa). */
export function IzziLogo({ className = 'h-11 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 44"
      className={className}
      aria-label="izzi"
      role="img"
    >
      {/* Puntos de marca — colores originales */}
      <rect x="18" y="4" width="7" height="7" rx="1.5" fill="#fb923c" />
      <rect x="10" y="14" width="7" height="7" rx="1.5" fill="#22d3ee" />
      <rect x="88" y="3" width="7" height="7" rx="1.5" fill="#f472b6" />
      <rect x="98" y="13" width="7" height="7" rx="1.5" fill="#facc15" />
      <text
        x="60"
        y="36"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Arial Black, Helvetica Neue, sans-serif"
        fontSize="28"
        fontWeight="900"
        letterSpacing="-0.5"
      >
        izzi
      </text>
    </svg>
  );
}
