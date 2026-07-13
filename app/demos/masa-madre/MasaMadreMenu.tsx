'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Cormorant_Garamond, Lato } from 'next/font/google';
import {
  CART_STORAGE_KEY,
  COVER_IMAGE,
  MENU_CATEGORIES,
  RESTAURANT,
  type MenuItem,
} from '@/lib/masa-madre-menu';
import { useAnalytics } from '@/src/lib/analytics-client';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-masa-display',
});

const body = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-masa-body',
});

const COLORS = {
  cream: '#faf7f2',
  dark: '#2C1810',
  gold: '#C9A84C',
};

type Cart = Record<string, number>;

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const ALL_ITEMS = MENU_CATEGORIES.flatMap((c) => c.items);

function loadCart(): Cart {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Cart) : {};
  } catch {
    return {};
  }
}

function buildWhatsAppMessage(cart: Cart): string {
  const lines = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = ALL_ITEMS.find((i) => i.id === id);
      if (!item) return null;
      return `- ${item.name} x${qty} = ${fmt(item.price * qty)}`;
    })
    .filter(Boolean);

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = ALL_ITEMS.find((i) => i.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  return `Hola! Mi pedido de Masa Madre:\n${lines.join('\n')}\nTotal: ${fmt(total)}\nGracias!`;
}

function DishCard({
  item,
  image,
  quantity,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  image: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <article
      className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ borderColor: `${COLORS.gold}33` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={item.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 320px"
        />
        {quantity > 0 && (
          <span
            className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold text-white"
            style={{ background: COLORS.dark }}
          >
            {quantity}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3
          className={`${display.className} text-lg font-semibold leading-snug`}
          style={{ color: COLORS.dark }}
        >
          {item.name}
        </h3>
        <p className={`${body.className} mt-1.5 text-sm leading-relaxed text-[#5c4a3d]`}>
          {item.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className={`${display.className} text-xl font-bold`} style={{ color: COLORS.gold }}>
            {fmt(item.price)}
          </span>
          <div className="flex items-center gap-2">
            {quantity > 0 && (
              <button
                type="button"
                onClick={onRemove}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-lg font-bold transition hover:bg-black/5"
                style={{ borderColor: `${COLORS.dark}33`, color: COLORS.dark }}
                aria-label={`Quitar ${item.name}`}
              >
                −
              </button>
            )}
            <button
              type="button"
              onClick={onAdd}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm transition hover:brightness-110"
              style={{ background: COLORS.gold }}
              aria-label={`Agregar ${item.name}`}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MasaMadreMenu() {
  useAnalytics('masa-madre');
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0]!.id);
  const [cart, setCart] = useState<Cart>({});
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCart(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const itemCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart],
  );

  const total = useMemo(
    () =>
      Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = ALL_ITEMS.find((i) => i.id === id);
        return sum + (item ? item.price * qty : 0);
      }, 0),
    [cart],
  );

  const category = MENU_CATEGORIES.find((c) => c.id === activeCategory) ?? MENU_CATEGORIES[0]!;

  const addItem = useCallback((id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[id] ?? 0) - 1;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  const whatsappOrderUrl = `https://wa.me/${RESTAURANT.whatsapp}?text=${encodeURIComponent(buildWhatsAppMessage(cart))}`;
  const whatsappGeneralUrl = `https://wa.me/${RESTAURANT.whatsapp}`;

  const scrollTabIntoView = (id: string) => {
    const el = tabsRef.current?.querySelector(`[data-tab="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen`}
      style={{ background: COLORS.cream, color: COLORS.dark }}
    >
      <header className="relative">
        <div className="relative h-56 sm:h-72">
          <Image
            src={COVER_IMAGE}
            alt="Panadería artesanal Masa Madre"
            fill
            priority
            unoptimized
            className="object-cover"
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(44,24,16,0.85) 0%, rgba(44,24,16,0.25) 55%, transparent 100%)' }}
          />
          <div className="absolute inset-x-0 bottom-0 p-6 pb-8">
            <p className={`${body.className} text-xs font-bold uppercase tracking-[0.25em] text-white/70`}>
              {RESTAURANT.subtitle}
            </p>
            <h1 className={`${display.className} text-4xl font-bold tracking-wide text-white sm:text-5xl`}>
              {RESTAURANT.name}
            </h1>
            <p className={`${body.className} mt-2 text-sm text-white/75`}>{RESTAURANT.address}</p>
          </div>
        </div>

        <div className={`${body.className} border-b px-4 py-4 sm:px-6`} style={{ borderColor: `${COLORS.gold}44` }}>
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <a href={`tel:${RESTAURANT.phone}`} className="hover:underline" style={{ color: COLORS.dark }}>
              📞 {RESTAURANT.phone}
            </a>
            <a
              href={`https://instagram.com/${RESTAURANT.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: COLORS.dark }}
            >
              {RESTAURANT.instagram}
            </a>
            <span className="text-[#8a7568]">{RESTAURANT.facebook}</span>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ background: `${COLORS.cream}ee`, borderColor: `${COLORS.gold}33` }}>
        <div
          ref={tabsRef}
          className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {MENU_CATEGORIES.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                data-tab={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  scrollTabIntoView(cat.id);
                }}
                className={`${body.className} shrink-0 rounded-full px-4 py-2 text-sm font-bold transition`}
                style={{
                  background: active ? COLORS.dark : 'transparent',
                  color: active ? COLORS.cream : COLORS.dark,
                  border: active ? 'none' : `1px solid ${COLORS.gold}55`,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-36">
        <div className="mb-6">
          <h2 className={`${display.className} text-3xl font-semibold`} style={{ color: COLORS.dark }}>
            {category.label}
          </h2>
          {category.id === 'cafes' && (
            <p className={`${body.className} mt-1 text-sm text-[#7a6558]`}>
              Hazlo frío por +$15
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {category.items.map((item) => (
            <DishCard
              key={item.id}
              item={item}
              image={category.image}
              quantity={cart[item.id] ?? 0}
              onAdd={() => addItem(item.id)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      </main>

      {itemCount > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 shadow-2xl"
          style={{ background: COLORS.dark, borderColor: `${COLORS.gold}44` }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button
              type="button"
              onClick={() => setCartOpen((o) => !o)}
              className={`${body.className} flex flex-1 items-center gap-3 text-left`}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: COLORS.gold, color: COLORS.dark }}
              >
                {itemCount}
              </span>
              <span className="text-white">
                <span className="block text-xs text-white/60">Tu pedido</span>
                <span className={`${display.className} text-xl font-bold`} style={{ color: COLORS.gold }}>
                  {fmt(total)}
                </span>
              </span>
            </button>
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${body.className} shrink-0 rounded-full px-5 py-3 text-sm font-bold transition hover:brightness-110`}
              style={{ background: '#25D366', color: 'white' }}
            >
              Pedir por WhatsApp
            </a>
          </div>
        </div>
      )}

      {cartOpen && itemCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setCartOpen(false)}>
          <div
            className="w-full max-w-lg rounded-t-3xl p-6 shadow-2xl"
            style={{ background: COLORS.cream }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`${display.className} mb-4 text-2xl font-semibold`}>Tu pedido</h3>
            <ul className={`${body.className} max-h-64 space-y-3 overflow-y-auto`}>
              {Object.entries(cart)
                .filter(([, qty]) => qty > 0)
                .map(([id, qty]) => {
                  const item = ALL_ITEMS.find((i) => i.id === id);
                  if (!item) return null;
                  return (
                    <li key={id} className="flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: `${COLORS.gold}33` }}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-[#7a6558]">{fmt(item.price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeItem(id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border text-sm"
                          style={{ borderColor: `${COLORS.dark}33` }}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => addItem(id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ background: COLORS.gold }}
                        >
                          +
                        </button>
                      </div>
                      <span className={`${display.className} w-16 text-right font-bold`} style={{ color: COLORS.gold }}>
                        {fmt(item.price * qty)}
                      </span>
                    </li>
                  );
                })}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: `${COLORS.gold}44` }}>
              <span className={`${body.className} font-bold`}>Total</span>
              <span className={`${display.className} text-2xl font-bold`} style={{ color: COLORS.gold }}>
                {fmt(total)}
              </span>
            </div>
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${body.className} mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:brightness-110`}
              style={{ background: '#25D366' }}
            >
              Pedir por WhatsApp
            </a>
          </div>
        </div>
      )}

      <a
        href={whatsappGeneralUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105 sm:bottom-6"
        style={{ background: '#25D366' }}
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.88 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <footer className={`${body.className} border-t px-4 py-6 text-center text-xs text-[#8a7568]`} style={{ borderColor: `${COLORS.gold}33` }}>
        Demo por{' '}
        <a href="https://agentia.software" className="font-bold hover:underline" style={{ color: COLORS.gold }}>
          Agentia
        </a>
      </footer>
    </div>
  );
}
