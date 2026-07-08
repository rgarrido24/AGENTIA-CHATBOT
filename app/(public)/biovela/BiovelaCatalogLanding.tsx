'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CatalogProduct } from '@/lib/biovela-catalog';

const WA_PHONE = '525534489552';
const WA_CATALOG =
  'https://wa.me/525534489552?text=Hola!%20Vi%20su%20cat%C3%A1logo%20y%20me%20gustar%C3%ADa%20m%C3%A1s%20informaci%C3%B3n';
const STORE_URL = 'https://biovela2.mitiendanube.com';
const COURSE_WA_URL =
  'https://wa.me/525534489552?text=Hola!%20Quiero%20informes%20sobre%20el%20curso%20de%20Jab%C3%B3n%20Artesanal%20y%20Velas%20de%20Soya';

const FILTERS = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Aromas', label: 'Aromas' },
  { id: 'BioVela', label: 'BioVela' },
  { id: 'Ceras', label: 'Ceras' },
  { id: 'Colores', label: 'Colores' },
  { id: 'Parafinas', label: 'Parafinas' },
  { id: 'Curso', label: 'Curso' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const BV_STYLES = `
:root {
  --bv-black: #0E0B07;
  --bv-surface: #1A1410;
  --bv-surface2: #241E18;
  --bv-amber: #E8962A;
  --bv-amber-dim: #A0621A;
  --bv-text: #F2EDE4;
  --bv-muted: #8A7660;
  --bv-border: #2E2520;
  --bv-green: #4CAF7D;
  --bv-footer: #080604;
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
}
@keyframes bv-flicker {
  0%, 100% { transform: scaleY(0.97) rotate(-2deg); filter: drop-shadow(0 0 16px #E8962A66); }
  50% { transform: scaleY(1.05) rotate(2deg); filter: drop-shadow(0 0 24px #E8962ACC); }
}
@keyframes bv-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes bv-fade-in-up {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bv-scroll-line {
  0%, 100% { transform: scaleY(0.35); opacity: 0.35; }
  50% { transform: scaleY(1); opacity: 1; }
}
.bv-flame { animation: bv-flicker 1.5s ease-in-out infinite; transform-origin: center bottom; }
.bv-hero-title { animation: bv-fade-in 0.8s ease 0.3s both; }
.bv-hero-sub { animation: bv-fade-in 0.8s ease 0.6s both; }
.bv-hero-actions { animation: bv-fade-in 0.8s ease 0.9s both; }
.bv-scroll-indicator span { animation: bv-scroll-line 2s ease-in-out infinite; transform-origin: top center; }
.bv-reveal { opacity: 0; }
.bv-reveal--visible { animation: bv-fade-in-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards; animation-delay: var(--bv-delay, 0ms); }
@media (prefers-reduced-motion: reduce) {
  .bv-flame { animation: none; }
  .bv-hero-title, .bv-hero-sub, .bv-hero-actions { animation: none; opacity: 1; }
  .bv-scroll-indicator span { animation: none; }
  .bv-reveal { opacity: 1; }
  .bv-reveal--visible { animation: none; opacity: 1; transform: none; }
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
        { threshold: 0.08, rootMargin: '0px 0px -24px 0px', ...options }
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
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'article';
}) {
  const { ref, visible } = useInView();

  return (
    <Tag
      ref={ref}
      className={`bv-reveal${visible ? ' bv-reveal--visible' : ''}${className ? ` ${className}` : ''}`}
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

function FlameIcon({ className, height = 80 }: { className?: string; height?: number }) {
  const gradId = useId().replace(/:/g, '');
  const width = Math.round(height * 0.55);
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 44 80"
      fill="none"
      aria-hidden
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="85%" r="75%">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#E8962A" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M22 4c0 0-14 22-14 42 0 11 6 20 14 30 8-10 14-19 14-30C36 26 22 4 22 4zm0 68c-5-4-9-11-9-18 0-7 4-16 9-25 5 9 9 18 9 25 0 7-4 14-9 18z"
      />
    </svg>
  );
}

function NavLogo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className="flex h-8 w-8 items-center justify-center text-[10px] tracking-widest"
        style={{ border: '1px solid var(--bv-amber-dim)', color: 'var(--bv-amber)' }}
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
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCard({ product, index }: { product: CatalogProduct; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(product.imageUrl) && !imgFailed;

  return (
    <Reveal delay={Math.min(index * 45, 400)} as="article" className="group flex flex-col bg-[var(--bv-surface)]">
      <div className="relative aspect-square w-full overflow-hidden">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl!}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'var(--bv-surface2)' }}
          >
            <FlameIcon height={36} className="bv-flame opacity-80" />
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: '#E8962A15' }}
        />
        <a
          href={productWhatsAppUrl(product)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 text-xs font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: 'var(--bv-amber)', color: 'var(--bv-black)' }}
        >
          Pedir →
        </a>
      </div>
      <div className="flex flex-col gap-1 px-3 py-3">
        <p
          className="line-clamp-2"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--bv-muted)',
            lineHeight: 1.45,
          }}
        >
          {product.name}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 400,
            color: 'var(--bv-amber)',
          }}
        >
          ${product.price} MXN
        </p>
        <a
          href={STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-[10px] transition hover:opacity-80"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--bv-muted)', letterSpacing: '0.06em' }}
        >
          Tienda online →
        </a>
      </div>
    </Reveal>
  );
}

function CourseImage() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex aspect-[4/3] w-full items-center justify-center md:aspect-auto md:min-h-[300px]"
        style={{ background: 'var(--bv-surface2)' }}
      >
        <FlameIcon height={48} className="bv-flame" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logos/biovela-curso.jpeg"
      alt="Curso de Jabón Artesanal y Velas de Soya para Masaje"
      className="aspect-[4/3] w-full object-cover md:aspect-auto md:min-h-[300px]"
      onError={() => setFailed(true)}
    />
  );
}

export function BiovelaCatalogLanding({ catalog }: { catalog: CatalogProduct[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterId>('Todos');
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const gridRef = useRef<HTMLElement>(null);
  const courseRef = useRef<HTMLElement>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: catalog.length };
    for (const { id } of FILTERS) {
      if (id === 'Todos' || id === 'Curso') continue;
      counts[id] = catalog.filter((p) => p.category === id).length;
    }
    return counts;
  }, [catalog]);

  const filtered = useMemo(() => {
    let items =
      activeFilter === 'Todos' || activeFilter === 'Curso'
        ? catalog
        : catalog.filter((p) => p.category === activeFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter((p) => p.name.toLowerCase().includes(q));
    }
    return items;
  }, [catalog, activeFilter, search]);

  const activeFilterLabel = FILTERS.find((f) => f.id === activeFilter)?.label ?? 'Todos';
  const activeCount = activeFilter === 'Curso' ? null : (categoryCounts[activeFilter] ?? 0);

  const scrollToCatalog = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToCourse = useCallback(() => {
    setActiveFilter('Curso');
    courseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setDrawerOpen(false);
  }, []);

  const handleFilterClick = (id: FilterId) => {
    if (id === 'Curso') {
      scrollToCourse();
      return;
    }
    setActiveFilter(id);
    setDrawerOpen(false);
  };

  const filterLinkStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    color: active ? 'var(--bv-amber)' : 'var(--bv-muted)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  });

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bv-black)',
        color: 'var(--bv-text)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: BV_STYLES }} />

      {/* Sticky navigation */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(14,11,7,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--bv-border)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 shrink-0 items-center gap-2.5">
            <NavLogo />
            <span
              className="hidden truncate sm:inline"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 400,
                letterSpacing: '0.08em',
                color: 'var(--bv-text)',
              }}
            >
              La Rueda Veladoras
            </span>
          </div>

          {/* Desktop filters */}
          <div className="hidden flex-1 items-center justify-center gap-0 md:flex">
            {FILTERS.map(({ id, label }, i) => (
              <span key={id} className="flex items-center">
                {i > 0 && (
                  <span className="mx-3 select-none" style={{ color: 'var(--bv-border)' }} aria-hidden>
                    |
                  </span>
                )}
                <button type="button" onClick={() => handleFilterClick(id)} style={filterLinkStyle(activeFilter === id)}>
                  {label}
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            className="ml-auto flex flex-col gap-1.5 p-2 md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú de categorías"
            style={{ color: 'var(--bv-text)' }}
          >
            <span className="block h-px w-5" style={{ background: 'currentColor' }} />
            <span className="block h-px w-5" style={{ background: 'currentColor' }} />
            <span className="block h-px w-5" style={{ background: 'currentColor' }} />
          </button>
        </div>

        {/* Search */}
        <div className="border-t px-4 py-3 md:px-6" style={{ borderColor: 'var(--bv-border)' }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto…"
              aria-label="Buscar producto"
              className="w-full max-w-md bg-transparent py-1 outline-none placeholder:opacity-60"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 300,
                color: 'var(--bv-text)',
                borderBottom: '1px solid var(--bv-border)',
              }}
            />
            <p
              className="hidden shrink-0 text-xs md:block"
              style={{ color: 'var(--bv-muted)', letterSpacing: '0.08em' }}
            >
              {activeFilterLabel}
              {activeCount != null ? ` · ${activeCount}` : ''}
            </p>
          </div>
        </div>
      </nav>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute right-0 top-0 flex h-full w-[min(100%,280px)] flex-col gap-1 p-6"
            style={{ background: 'var(--bv-surface)', borderLeft: '1px solid var(--bv-border)' }}
          >
            <button
              type="button"
              className="mb-4 self-end text-sm"
              style={{ color: 'var(--bv-muted)' }}
              onClick={() => setDrawerOpen(false)}
            >
              Cerrar
            </button>
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleFilterClick(id)}
                className="py-3 text-left"
                style={filterLinkStyle(activeFilter === id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <header
        className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 text-center md:min-h-screen"
        style={{ background: 'var(--bv-black)' }}
      >
        <FlameIcon height={50} className="bv-flame mb-8 md:hidden" />
        <FlameIcon height={80} className="bv-flame mb-8 hidden md:mb-10 md:block" />

        <h1
          className="bv-hero-title max-w-4xl"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 6vw, 5rem)',
            fontWeight: 300,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--bv-text)',
            lineHeight: 1.1,
          }}
        >
          La Rueda Veladoras
        </h1>

        <p
          className="bv-hero-sub mt-4 max-w-md"
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1.1rem',
            color: 'var(--bv-muted)',
            lineHeight: 1.6,
          }}
        >
          Iluminamos tu fe, acompañamos tu camino
        </p>

        <div className="bv-hero-actions mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={scrollToCatalog}
            className="px-6 py-3 text-sm font-medium transition-colors duration-200"
            style={{
              border: '1px solid var(--bv-amber)',
              color: 'var(--bv-amber)',
              background: 'transparent',
              borderRadius: 2,
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bv-amber)';
              e.currentTarget.style.color = 'var(--bv-black)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--bv-amber)';
            }}
          >
            Explorar catálogo
          </button>
          <a
            href={WA_CATALOG}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              background: 'var(--bv-amber)',
              color: 'var(--bv-black)',
              borderRadius: 2,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            Escribir al WhatsApp
          </a>
        </div>

        <div className="bv-scroll-indicator absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="block h-10 w-px" style={{ background: 'var(--bv-muted)' }} />
        </div>
      </header>

      {/* Product grid — mosaic */}
      <main ref={gridRef} className="scroll-mt-36">
        <div className="px-4 py-2 sm:hidden">
          <p className="text-xs" style={{ color: 'var(--bv-muted)', letterSpacing: '0.08em' }}>
            {activeFilterLabel}
            {activeCount != null ? ` · ${activeCount}` : ''}
            {search.trim() ? ` · ${filtered.length} resultados` : ''}
          </p>
        </div>
        {filtered.length === 0 ? (
          <p className="py-24 text-center" style={{ color: 'var(--bv-muted)', fontWeight: 300 }}>
            No hay productos que coincidan con tu búsqueda.
          </p>
        ) : (
          <div
            className="grid grid-cols-2 gap-px md:grid-cols-3 lg:grid-cols-4"
            style={{ background: 'var(--bv-black)' }}
          >
            {filtered.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </main>

      {/* Values */}
      <section style={{ background: 'var(--bv-black)' }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-3 md:gap-8">
          {[
            { n: '01', title: 'Aromas naturales de alta calidad' },
            { n: '02', title: 'Envíos a toda la República Mexicana' },
            { n: '03', title: 'Atención personalizada por WhatsApp' },
          ].map(({ n, title }, index) => (
            <Reveal key={n} delay={index * 80} className="relative">
              <span
                className="pointer-events-none absolute -left-1 -top-4 select-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(3.5rem, 8vw, 5rem)',
                  fontWeight: 300,
                  lineHeight: 1,
                  color: '#E8962A20',
                }}
                aria-hidden
              >
                {n}
              </span>
              <p
                className="relative pt-6"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  color: 'var(--bv-text)',
                  lineHeight: 1.6,
                }}
              >
                {title}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Course */}
      <section
        ref={courseRef}
        className="scroll-mt-36"
        style={{ background: 'var(--bv-surface)', borderTop: '1px solid var(--bv-amber)' }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-12 md:py-20">
          <Reveal>
            <CourseImage />
          </Reveal>
          <Reveal delay={100} className="flex flex-col gap-5">
            <span
              className="self-start uppercase"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                letterSpacing: '0.2em',
                fontWeight: 500,
                color: 'var(--bv-amber)',
              }}
            >
              Próximamente
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                color: 'var(--bv-text)',
                lineHeight: 1.25,
              }}
            >
              Curso de Jabón Artesanal y Velas de Soya para Masaje
            </h2>
            <p style={{ color: 'var(--bv-muted)', fontSize: '1rem', fontWeight: 300, lineHeight: 1.7 }}>
              Aprende, crea y transforma tu pasión en bienestar. Inversión $950 por alumno · cupo mínimo 5 alumnos ·
              incluye todo el material.
            </p>
            <a
              href={COURSE_WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-fit px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: 'var(--bv-amber)',
                color: 'var(--bv-black)',
                borderRadius: 2,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              Apartar mi lugar por WhatsApp
            </a>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bv-footer)', borderTop: '1px solid var(--bv-border)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-14 text-center">
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '1.1rem',
              color: 'var(--bv-muted)',
            }}
          >
            Iluminamos tu fe, acompañamos tu camino
          </p>
          <ul className="space-y-2 text-sm" style={{ fontWeight: 300, color: 'var(--bv-muted)' }}>
            <li>
              <a href={`https://wa.me/${WA_PHONE}`} target="_blank" rel="noopener noreferrer" className="transition hover:text-[var(--bv-text)]">
                WhatsApp · +52 55 3448 9552
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/laruedabiov"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-[var(--bv-text)]"
              >
                Instagram · @laruedabiov
              </a>
            </li>
            <li>Iztacalco, CDMX</li>
          </ul>
          <p style={{ fontSize: 10, fontWeight: 300, color: 'var(--bv-muted)', opacity: 0.45, letterSpacing: '0.12em' }}>
            Powered by Agentia
          </p>
        </div>
      </footer>

      {/* Mobile FAB */}
      <a
        href={WA_CATALOG}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 flex items-center justify-center text-white transition hover:scale-105 md:hidden"
        style={{
          width: 52,
          height: 52,
          background: '#25D366',
          borderRadius: '50%',
          boxShadow: '0 4px 16px rgba(37,211,102,0.4)',
        }}
        aria-label="Escribir por WhatsApp"
      >
        <WhatsAppIcon className="h-6 w-6" />
      </a>
    </div>
  );
}
