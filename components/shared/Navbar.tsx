'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { agentiaWhatsAppUrl } from '@/lib/agentia-contact';
import { PRODUCT_NAV } from '@/components/shared/product-nav';

type PageLink = { href: string; label: string };

type NavbarProps = {
  theme?: 'light' | 'dark';
  pageLinks?: PageLink[];
  ctaHref?: string;
  ctaLabel?: string;
  ctaExternal?: boolean;
};

export default function Navbar({
  theme = 'light',
  pageLinks,
  ctaHref,
  ctaLabel = 'WhatsApp',
  ctaExternal = true,
}: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const light = theme === 'light';

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const cta = ctaHref ?? agentiaWhatsAppUrl('Hola Agentia, quiero información de sus sistemas.');

  const bar = light
    ? {
        background: 'rgba(250,250,248,0.82)',
        border: '1px solid rgba(20,22,26,0.08)',
      }
    : {
        background: 'rgba(10,10,10,0.62)',
        border: '1px solid rgba(255,255,255,0.10)',
      };

  const linkIdle = light
    ? 'text-[#14161A]/55 hover:bg-[#14161A]/[0.05] hover:text-[#14161A]'
    : 'text-white/55 hover:bg-white/[0.06] hover:text-white';
  const linkActive = light ? 'bg-[#14161A]/[0.07] text-[#B8935A]' : 'bg-white/10 text-[#00D4FF]';
  const ctaClass = light
    ? 'hidden rounded-full bg-[#14161A] px-4 py-2 text-[13px] font-bold text-[#FAFAF8] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px active:scale-[0.97] sm:inline-flex'
    : 'hidden rounded-full bg-[#00D4FF] px-4 py-2 text-[13px] font-bold text-[#0a0a0a] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px active:scale-[0.97] sm:inline-flex';
  const burgerBorder = light ? 'border-[#14161A]/10' : 'border-white/10';
  const burgerLine = light ? 'bg-[#14161A]' : 'bg-white';
  const overlayBg = light ? 'rgba(250,250,248,0.96)' : 'rgba(8,8,10,0.88)';
  const overlayLink = light ? 'text-[#14161A]' : 'text-white';
  const overlayActive = light ? 'text-[#B8935A]' : 'text-[#00D4FF]';
  const overlaySub = light ? 'text-[#14161A]/55' : 'text-white/60';
  const overlayCta = light
    ? 'mt-auto inline-flex items-center justify-center rounded-full bg-[#14161A] px-6 py-3.5 text-sm font-bold text-[#FAFAF8] active:scale-[0.97]'
    : 'mt-auto inline-flex items-center justify-center rounded-full bg-[#00D4FF] px-6 py-3.5 text-sm font-bold text-[#0a0a0a] active:scale-[0.97]';

  const CtaTag = (className: string, extra?: { onClick?: () => void }) =>
    ctaExternal ? (
      <a href={cta} target="_blank" rel="noopener noreferrer" className={className}>
        {ctaLabel}
      </a>
    ) : (
      <a href={cta} className={className} onClick={extra?.onClick}>
        {ctaLabel}
      </a>
    );

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-4">
      <div
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full px-3 pr-2 shadow-[0_8px_30px_rgba(20,22,26,0.06)] sm:h-16 sm:px-4"
        style={{
          ...bar,
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        }}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/logo-agentia-2026.png"
            alt="Agentia"
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span
            className={
              'hidden text-[15px] font-bold sm:block ' +
              (light ? 'text-[#14161A]' : 'font-[family-name:var(--font-space)]')
            }
          >
            Agentia
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Productos">
          {PRODUCT_NAV.map((p) => {
            const active = pathname === p.href || pathname?.startsWith(`${p.href}/`);
            return (
              <Link
                key={p.href}
                href={p.href}
                className={
                  'rounded-full px-3 py-1.5 text-[13px] transition-[color,background-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] ' +
                  (active ? linkActive : linkIdle)
                }
              >
                {p.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {CtaTag(ctaClass)}
          <button
            type="button"
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border lg:hidden ${burgerBorder}`}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span
              className={
                `absolute h-[1.5px] w-4 ${burgerLine} transition-transform duration-[200ms] ease-[cubic-bezier(0.32,0.72,0,1)] ` +
                (open ? 'translate-y-0 rotate-45' : '-translate-y-[3.5px]')
              }
            />
            <span
              className={
                `absolute h-[1.5px] w-4 ${burgerLine} transition-transform duration-[200ms] ease-[cubic-bezier(0.32,0.72,0,1)] ` +
                (open ? 'translate-y-0 -rotate-45' : 'translate-y-[3.5px]')
              }
            />
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{
            background: overlayBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex h-full flex-col px-6 pb-10 pt-24">
            <nav className="flex flex-col gap-1">
              {PRODUCT_NAV.map((p, i) => {
                const active = pathname === p.href || pathname?.startsWith(`${p.href}/`);
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    className={
                      'translate-y-3 rounded-2xl px-4 py-3 text-2xl font-bold opacity-0 ' +
                      (active ? overlayActive : overlayLink)
                    }
                    style={{
                      animation: 'ag-nav-in 420ms cubic-bezier(0.23,1,0.32,1) forwards',
                      animationDelay: `${80 + i * 45}ms`,
                    }}
                  >
                    {p.label}
                  </Link>
                );
              })}
              {pageLinks?.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`translate-y-3 rounded-2xl px-4 py-3 text-lg opacity-0 ${overlaySub}`}
                  style={{
                    animation: 'ag-nav-in 420ms cubic-bezier(0.23,1,0.32,1) forwards',
                    animationDelay: `${80 + (PRODUCT_NAV.length + i) * 45}ms`,
                  }}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            {CtaTag(overlayCta, { onClick: () => setOpen(false) })}
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes ag-nav-in {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes ag-nav-in {
            to { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </header>
  );
}
