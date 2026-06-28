'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogProduct } from '@/lib/biovela-catalog';

const BV = {
  cream: '#FAF7F2',
  warm: '#F0EAE0',
  gold: '#C17A2B',
  goldLight: '#E8A44A',
  dark: '#1C1612',
  muted: '#8A7968',
  border: '#E5DDD0',
  wa: '#25D366',
} as const;

const WA_PHONE = '525534489552';
const WA_CATALOG =
  'https://wa.me/525534489552?text=Hola!%20Vi%20su%20cat%C3%A1logo%20y%20me%20gustar%C3%ADa%20m%C3%A1s%20informaci%C3%B3n';

const FILTERS = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Aromas', label: 'Aromas' },
  { id: 'BioVela', label: 'BioVela' },
  { id: 'Ceras', label: 'Ceras' },
  { id: 'Colores', label: 'Colores' },
  { id: 'Parafinas', label: 'Parafinas' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const SERIF = 'Georgia, "Times New Roman", Times, serif';

const REVEAL_STYLES = `
@keyframes bv-fade-in-up {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bv-fade-in-left {
  from { opacity: 0; transform: translateX(-32px); }
  to { opacity: 1; transform: translateX(0); }
}
.bv-reveal { opacity: 0; }
.bv-reveal--fade-up.bv-reveal--visible {
  animation: bv-fade-in-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--bv-delay, 0ms);
}
.bv-reveal--fade-left.bv-reveal--visible {
  animation: bv-fade-in-left 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--bv-delay, 0ms);
}
@media (prefers-reduced-motion: reduce) {
  .bv-reveal { opacity: 1; }
  .bv-reveal--fade-up.bv-reveal--visible,
  .bv-reveal--fade-left.bv-reveal--visible {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
`;

function useInView(options?: IntersectionObserverInit) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node || visible) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setVisible(true);
            observer.unobserve(node);
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -32px 0px', ...options }
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [visible, options]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, visible };
}

function Reveal({
  children,
  animation,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  animation: 'fade-up' | 'fade-left';
  delay?: number;
  className?: string;
  as?: 'div' | 'article';
}) {
  const { ref, visible } = useInView();

  return (
    <Tag
      ref={ref}
      className={`bv-reveal bv-reveal--${animation}${visible ? ' bv-reveal--visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--bv-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

function productWhatsAppUrl(product: CatalogProduct): string {
  const text = `Hola! Me interesa ${product.name} ($${product.price} MXN), ¿tienen disponibilidad?`;
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function LogoMark({ variant = 'light' }: { variant?: 'light' | 'dark' | 'hero' }) {
  const [failed, setFailed] = useState(false);
  const borderColor =
    variant === 'hero'
      ? 'rgba(255,255,255,0.5)'
      : variant === 'dark'
        ? `${BV.gold}99`
        : `${BV.gold}40`;

  if (failed) {
    return (
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full text-2xl"
        style={{
          border: `1px solid ${borderColor}`,
          background: variant === 'dark' ? BV.dark : variant === 'hero' ? 'rgba(0,0,0,0.25)' : BV.cream,
          color: variant === 'hero' ? '#fff' : BV.gold,
        }}
        aria-hidden
      >
        RV
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logos/biovela.png"
      alt="La Rueda Veladoras"
      width={80}
      height={80}
      className="h-20 w-20 rounded-full object-cover"
      style={{ border: `1px solid ${borderColor}` }}
      onError={() => setFailed(true)}
    />
  );
}

function ProductCard({ product, index }: { product: CatalogProduct; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(product.imageUrl) && !imgFailed;

  return (
    <Reveal animation="fade-up" delay={index * 60} as="article" className="group flex flex-col bg-white">
      <div
        className="relative aspect-square w-full overflow-hidden transition-shadow duration-300 group-hover:shadow-[0_8px_32px_rgba(193,122,43,0.15)]"
        style={{ borderRadius: 4 }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl!}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-sm tracking-widest"
            style={{ background: BV.warm, color: BV.muted }}
          >
            Sin imagen
          </div>
        )}
        <a
          href={productWhatsAppUrl(product)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          style={{
            background: BV.gold,
            color: BV.dark,
            borderRadius: 2,
            padding: '10px 14px',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          Pedir ahora →
        </a>
      </div>
      <div className="flex flex-col gap-1 pt-4">
        <p
          className="line-clamp-2"
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: BV.dark,
            lineHeight: 1.5,
          }}
        >
          {product.name}
        </p>
        <p style={{ fontSize: 18, fontWeight: 400, color: BV.gold }}>
          ${product.price} MXN
        </p>
      </div>
    </Reveal>
  );
}

export function BiovelaCatalogLanding({ catalog }: { catalog: CatalogProduct[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterId>('Todos');
  const [search, setSearch] = useState('');
  const gridRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<FilterId, HTMLButtonElement>>>({});
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: catalog.length };
    for (const { id } of FILTERS) {
      if (id === 'Todos') continue;
      counts[id] = catalog.filter((p) => p.category === id).length;
    }
    return counts;
  }, [catalog]);

  const filtered = useMemo(() => {
    let items = activeFilter === 'Todos' ? catalog : catalog.filter((p) => p.category === activeFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter((p) => p.name.toLowerCase().includes(q));
    }
    return items;
  }, [catalog, activeFilter, search]);

  const activeFilterLabel = FILTERS.find((f) => f.id === activeFilter)?.label ?? 'Todos';
  const activeCount = categoryCounts[activeFilter] ?? 0;

  const updateUnderline = useCallback(() => {
    const btn = tabButtonRefs.current[activeFilter];
    const container = tabsRef.current;
    if (!btn || !container) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setUnderline({
      left: btnRect.left - containerRect.left + container.scrollLeft,
      width: btnRect.width,
    });
  }, [activeFilter]);

  useEffect(() => {
    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [updateUnderline]);

  const scrollToCatalog = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="min-h-screen"
      style={
        {
          '--bv-cream': BV.cream,
          '--bv-warm': BV.warm,
          '--bv-gold': BV.gold,
          '--bv-gold-light': BV.goldLight,
          '--bv-dark': BV.dark,
          '--bv-muted': BV.muted,
          '--bv-border': BV.border,
          background: BV.cream,
          color: BV.dark,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: REVEAL_STYLES }} />
      {/* Hero — imagen de fondo con overlay */}
      <header className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-8 text-center md:min-h-[100vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 100%), url('/logos/biovela-hero.jpg')",
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-6 text-white">
          <LogoMark variant="hero" />
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: '#fff',
            }}
          >
            La Rueda Veladoras
          </h1>
          <p
            style={{
              maxWidth: 400,
              fontSize: '1.1rem',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            Insumos artesanales para hacer velas · Iztacalco, CDMX
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToCatalog}
              className="px-8 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              style={{
                border: '1px solid #fff',
                background: 'transparent',
                borderRadius: 50,
                letterSpacing: '0.04em',
              }}
            >
              Ver catálogo
            </button>
            <a
              href={WA_CATALOG}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: BV.wa, borderRadius: 50 }}
            >
              <WhatsAppIcon className="h-4 w-4" />
              Escribir por WhatsApp
            </a>
          </div>
          <div
            className="mt-4 flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, letterSpacing: '0.5em' }}
            aria-hidden
          >
            <span>·</span>
            <span>·</span>
            <span>·</span>
          </div>
        </div>
      </header>

      {/* Sticky search + category tabs */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(250,247,242,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${BV.border}`,
        }}
      >
        <div className="mx-auto max-w-6xl px-8 py-5">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            aria-label="Buscar producto"
            className="w-full bg-transparent py-3 outline-none placeholder:opacity-60"
            style={{
              border: 'none',
              borderBottom: `1px solid ${BV.gold}`,
              borderRadius: 0,
              fontSize: 15,
              color: BV.dark,
            }}
          />

          <div className="mt-5 flex items-baseline justify-between gap-4">
            <div
              ref={tabsRef}
              className="relative flex flex-1 gap-6 overflow-x-auto scrollbar-none"
              role="tablist"
              aria-label="Categorías"
            >
              {FILTERS.map(({ id, label }) => {
                const active = activeFilter === id;
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      if (el) tabButtonRefs.current[id] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveFilter(id)}
                    className="shrink-0 whitespace-nowrap pb-3 text-sm transition-colors duration-200"
                    style={{
                      color: active ? BV.gold : BV.muted,
                      fontWeight: active ? 500 : 400,
                      background: 'none',
                      border: 'none',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              <span
                className="pointer-events-none absolute bottom-0 h-0.5 transition-all duration-300 ease-out"
                style={{
                  left: underline.left,
                  width: underline.width,
                  background: BV.gold,
                }}
                aria-hidden
              />
            </div>
            <p
              className="hidden shrink-0 text-xs sm:block"
              style={{ color: BV.muted, letterSpacing: '0.06em' }}
            >
              {activeFilterLabel} {activeCount}
            </p>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <main ref={gridRef} className="scroll-mt-28">
        <div className="mx-auto max-w-6xl px-8 py-14">
          <p className="mb-8 text-xs sm:hidden" style={{ color: BV.muted, letterSpacing: '0.06em' }}>
            {activeFilterLabel} {activeCount}
            {search.trim() ? ` · ${filtered.length} resultados` : ''}
          </p>
          {filtered.length === 0 ? (
            <p className="py-20 text-center" style={{ color: BV.muted }}>
              No hay productos que coincidan con tu búsqueda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Values */}
      <section style={{ background: BV.warm }}>
        <div className="mx-auto grid max-w-6xl gap-12 px-8 py-20 md:grid-cols-3">
          {[
            { n: '01', title: 'Aromas naturales' },
            { n: '02', title: 'Envíos a toda la República' },
            { n: '03', title: 'Atención por WhatsApp' },
          ].map(({ n, title }, index) => (
            <Reveal key={n} animation="fade-left" delay={index * 100} className="flex flex-col gap-4">
              <span
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 400,
                  color: BV.gold,
                  lineHeight: 1,
                }}
              >
                {n}
              </span>
              <div style={{ width: 32, height: 1, background: BV.gold }} aria-hidden />
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
                  fontWeight: 400,
                  color: BV.dark,
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: BV.dark, color: '#fff' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-8 py-16 text-center">
          <LogoMark variant="dark" />
          <p
            style={{
              fontFamily: SERIF,
              fontSize: '1.15rem',
              fontWeight: 400,
              color: BV.gold,
              maxWidth: 360,
              lineHeight: 1.6,
            }}
          >
            Iluminamos tu fe, acompañamos tu camino
          </p>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <li>
              <a
                href={`https://wa.me/${WA_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                WhatsApp · +52 55 3448 9552
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/laruedabiov"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                Instagram · @laruedabiov
              </a>
            </li>
            <li>Iztacalco, CDMX</li>
          </ul>
          <p className="pt-6 text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Powered by Agentia
          </p>
        </div>
      </footer>

      {/* Mobile FAB */}
      <a
        href={WA_CATALOG}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center text-white transition hover:scale-105 md:hidden"
        style={{
          background: BV.wa,
          borderRadius: '50%',
          boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
        }}
        aria-label="Escribir por WhatsApp"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}
