export function IzziWhiteLogo({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <img
      src="/izzi-logo.png"
      alt="izzi"
      className={className}
      style={{ filter: 'brightness(0) invert(1)' }}
    />
  );
}
