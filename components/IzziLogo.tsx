import { IZZI_LOGO_URL } from '@/lib/izzi-brand';

export function IzziLogo({ className = 'h-11 w-auto max-w-[140px]' }: { className?: string }) {
  return (
    <img
      src={IZZI_LOGO_URL}
      alt="izzi"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}
