'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  external?: boolean;
  className?: string;
  onClick?: () => void;
};

export function GlowButton({
  href,
  children,
  variant = 'primary',
  external,
  className = '',
  onClick,
}: Props) {
  const base =
    'relative inline-flex items-center justify-center overflow-hidden rounded-xl px-6 py-3.5 text-sm font-bold transition-[transform,box-shadow,border-color,background-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] hover:-translate-y-px';

  const styles =
    variant === 'primary'
      ? 'text-[#0a0a0a] shadow-[0_0_32px_rgba(0,212,255,0.35)] hover:shadow-[0_0_48px_rgba(0,212,255,0.55)]'
      : 'text-white border border-white/20 bg-white/5 hover:border-[#00D4FF]/50 hover:bg-white/8';

  const inner =
    variant === 'primary' ? (
      <>
        <span
          className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] via-[#00b8e6] to-[#FFD700] opacity-100"
          aria-hidden
        />
        <span
          className="absolute -inset-1 rounded-xl bg-[#00D4FF]/30 blur-xl transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:bg-[#00D4FF]/45 group-hover:scale-105"
          aria-hidden
        />
      </>
    ) : null;

  const content = (
    <span className={`group ${base} ${styles} ${className}`}>
      {inner}
      <span className="relative z-10">{children}</span>
    </span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick}>
      {content}
    </Link>
  );
}
