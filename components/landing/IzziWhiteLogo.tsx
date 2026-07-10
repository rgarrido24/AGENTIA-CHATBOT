export function IzziWhiteLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 32"
      className={className}
      aria-label="izzi"
      role="img"
    >
      <text
        x="0"
        y="26"
        fill="#FFFFFF"
        fontFamily="Arial Black, Helvetica, sans-serif"
        fontSize="28"
        fontWeight="900"
        letterSpacing="-1"
      >
        izzi
      </text>
    </svg>
  );
}
