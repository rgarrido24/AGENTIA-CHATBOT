'use client';

import { useMemo, useState } from 'react';
import type { CatalogProduct } from '@/lib/biovela-catalog';

const ACCENT = '#D4860A';
const BG = '#FAF9F7';
const ACCENT_PALE = '#FFF3E0';

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

function productWhatsAppUrl(product: CatalogProduct): string {
  const text = `Hola! Me interesa ${product.name} ($${product.price} MXN), ¿tienen disponibilidad?`;
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

function LogoMark() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl shadow-sm"
        style={{ background: ACCENT_PALE }}
        aria-hidden
      >
        🕯
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
      className="h-20 w-20 rounded-2xl object-contain shadow-sm"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(product.imageUrl) && !imgFailed;

  return (
    <a
      href={productWhatsAppUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8E4DE] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ background: hasImage ? '#fff' : ACCENT_PALE }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl!}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-5xl" aria-hidden>
            🕯
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#2C2416]">
          {product.name}
        </p>
        <p className="mt-auto text-base font-bold tabular-nums" style={{ color: ACCENT }}>
          ${product.price} MXN
        </p>
      </div>
    </a>
  );
}

export function BiovelaCatalogLanding({ catalog }: { catalog: CatalogProduct[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterId>('Todos');

  const filtered = useMemo(() => {
    if (activeFilter === 'Todos') return catalog;
    return catalog.filter((p) => p.category === activeFilter);
  }, [catalog, activeFilter]);

  return (
    <div className="min-h-screen" style={{ background: BG, color: '#2C2416' }}>
      {/* Hero */}
      <header
        className="relative overflow-hidden px-4 pb-10 pt-12 text-center sm:px-6 sm:pb-14 sm:pt-16"
        style={{
          backgroundColor: BG,
          backgroundImage: [
            'radial-gradient(ellipse 80% 60% at 15% 20%, rgba(212,134,10,0.10) 0%, transparent 55%)',
            'radial-gradient(ellipse 70% 50% at 85% 75%, rgba(212,134,10,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.9) 0%, transparent 45%)',
            'repeating-radial-gradient(circle at 30% 40%, rgba(212,134,10,0.04) 0 1px, transparent 1px 14px)',
            'repeating-radial-gradient(circle at 70% 60%, rgba(212,134,10,0.03) 0 1px, transparent 1px 18px)',
          ].join(', '),
        }}
      >
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-4">
          <LogoMark />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">La Rueda Veladoras</h1>
          <p className="max-w-md text-base text-[#5C5348] sm:text-lg">
            Insumos artesanales para hacer velas • Iztacalco, CDMX
          </p>
          <a
            href={WA_CATALOG}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            style={{ background: ACCENT }}
          >
            <span aria-hidden>💬</span>
            Escríbenos por WhatsApp
          </a>
        </div>
      </header>

      {/* Filters */}
      <div
        className="sticky top-0 z-20 border-b border-[#E8E4DE] px-4 py-3 sm:px-6"
        style={{ background: 'rgba(250,249,247,0.95)', backdropFilter: 'blur(8px)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2">
          {FILTERS.map(({ id, label }) => {
            const active = activeFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveFilter(id)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition"
                style={
                  active
                    ? { background: ACCENT, color: '#fff' }
                    : { background: '#fff', color: '#5C5348', border: '1px solid #E8E4DE' }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product grid */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-[#5C5348]">
            No hay productos en esta categoría por ahora.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Contact */}
      <footer
        className="border-t border-[#E8E4DE] px-4 py-12 text-center sm:px-6"
        style={{ background: '#fff' }}
      >
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Contáctanos</h2>
          <ul className="space-y-2 text-sm text-[#5C5348]">
            <li>
              WhatsApp:{' '}
              <a
                href={`https://wa.me/${WA_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: ACCENT }}
              >
                +52 55 3448 9552
              </a>
            </li>
            <li>
              Instagram:{' '}
              <a
                href="https://instagram.com/laruedabiov"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: ACCENT }}
              >
                @laruedabiov
              </a>
            </li>
            <li>Ubicación: Iztacalco, CDMX</li>
          </ul>
          <a
            href={WA_CATALOG}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-md transition hover:opacity-95 sm:w-auto"
            style={{ background: ACCENT }}
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
