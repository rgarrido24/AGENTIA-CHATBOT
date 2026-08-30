'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const CATEGORIES = ['Entradas', 'Platos', 'Postres', 'Bebidas'] as const;

const MENU: Record<(typeof CATEGORIES)[number], { name: string; price: number; img: string }[]> = {
  Entradas: [
    {
      name: 'Tostadas de atún',
      price: 145,
      img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=140&fit=crop&q=80',
    },
    {
      name: 'Guacamole artesanal',
      price: 120,
      img: 'https://images.unsplash.com/photo-1529042410759-befb1204b516?w=200&h=140&fit=crop&q=80',
    },
  ],
  Platos: [
    {
      name: 'Risotto de hongos',
      price: 265,
      img: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=200&h=140&fit=crop&q=80',
    },
    {
      name: 'Salmón a la plancha',
      price: 310,
      img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=140&fit=crop&q=80',
    },
    {
      name: 'Pasta al pesto',
      price: 220,
      img: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=140&fit=crop&q=80',
    },
  ],
  Postres: [
    {
      name: 'Cheesecake de frutos rojos',
      price: 115,
      img: 'https://images.unsplash.com/photo-1524351199428-f03fa2bc1b20?w=200&h=140&fit=crop&q=80',
    },
  ],
  Bebidas: [
    {
      name: 'Cold brew',
      price: 75,
      img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=140&fit=crop&q=80',
    },
    {
      name: 'Limonada fresca',
      price: 65,
      img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&h=140&fit=crop&q=80',
    },
  ],
};

export function RestaurantMenuMock() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('Platos');
  const [cart, setCart] = useState(0);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#111318]">
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#FF9F1C]/15 to-transparent px-4 py-3">
        <div>
          <p className="text-sm font-bold text-white">Casa Nola · Menú digital</p>
          <p className="text-[10px] text-white/45">Pedido por WhatsApp · demo interactiva</p>
        </div>
        <motion.span
          key={cart}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-[#FF9F1C] px-3 py-1 text-xs font-bold text-black"
        >
          {cart} en pedido
        </motion.span>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              cat === c
                ? 'bg-[#FF9F1C] text-black'
                : 'border border-white/10 text-white/60 hover:border-[#FF9F1C]/40'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
        {MENU[cat].map((item) => (
          <motion.div
            key={item.name}
            layout
            className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-[#FF9F1C]/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.img} alt={item.name} className="h-28 w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-3">
              <div>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-[#FF9F1C]">${item.price} MXN</p>
              </div>
              <button
                type="button"
                onClick={() => setCart((n) => n + 1)}
                className="rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[10px] font-bold text-white transition group-hover:scale-105"
              >
                + WhatsApp
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
