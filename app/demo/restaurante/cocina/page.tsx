'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { itemsBar, itemsCocina } from '@/lib/mock-data-restaurante';
import type { Orden } from '@/lib/mock-data-restaurante';
import { useRestaurante } from '../restaurante-context';

function elapsedMin(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function formatTimer(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function CocinaPage() {
  const { ordenes, updateOrdenStatus } = useRestaurante();
  const [modo, setModo] = useState<'cocina' | 'bar'>('cocina');
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const prevNuevas = useRef(0);
  const skipToastOnce = useRef(true);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const filtradas = useMemo(() => {
    return ordenes.filter((o) => {
      if (o.status === 'entregada' || o.status === 'cancelada') return false;
      const ic = itemsCocina(o);
      const ib = itemsBar(o);
      if (modo === 'cocina') return ic.length > 0;
      return ib.length > 0;
    });
  }, [ordenes, modo]);

  const porColumna = (status: Orden['status']) => filtradas.filter((o) => o.status === status);

  useEffect(() => {
    const nuevas = ordenes.filter((o) => o.status === 'nueva').length;
    if (skipToastOnce.current) {
      skipToastOnce.current = false;
      prevNuevas.current = nuevas;
      return;
    }
    if (nuevas > prevNuevas.current) {
      const last = ordenes.find((o) => o.status === 'nueva');
      const label = last?.mesa ? `Mesa ${last.mesa}` : 'Delivery';
      setToast(`🔔 Nueva orden — ${label}`);
      setTimeout(() => setToast(null), 4000);
    }
    prevNuevas.current = nuevas;
  }, [ordenes]);

  const itemsFor = (o: Orden) => (modo === 'cocina' ? itemsCocina(o) : itemsBar(o));

  const nextStatus = (current: Orden['status']): Orden['status'] | null => {
    if (current === 'nueva') return 'en_preparacion';
    if (current === 'en_preparacion') return 'lista';
    if (current === 'lista') return 'entregada';
    return null;
  };

  const Ticket = ({ o }: { o: Orden }) => {
    const items = itemsFor(o);
    const min = elapsedMin(o.createdAt);
    const warn = min >= 15 && o.status === 'nueva';
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, x: 20 }}
        className={`rounded-xl border-2 p-3 mb-3 bg-black/40 ${
          warn ? 'border-red-500 animate-pulse' : 'border-white/20'
        }`}
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-xl font-black text-white">#{o.id.slice(-4)}</p>
            <p className="text-lg font-bold text-amber-300">
              {o.tipo === 'delivery' ? '🛵 Delivery' : `Mesa ${o.mesa}`}
            </p>
          </div>
          <span className="text-2xl font-mono tabular-nums text-red-400">⏱ {formatTimer(o.createdAt)}</span>
        </div>
        <ul className="mt-3 space-y-1 text-lg font-medium">
          {items.map((it) => (
            <li key={it.productoId + it.nombre}>
              {it.cantidad}x {it.nombre}
            </li>
          ))}
        </ul>
        {nextStatus(o.status) && (
          <button
            type="button"
            onClick={() => updateOrdenStatus(o.id, nextStatus(o.status)!)}
            className="mt-4 w-full py-4 rounded-xl text-xl font-bold bg-red-600 hover:bg-red-500 active:scale-[0.99]"
          >
            {o.status === 'nueva' && 'Preparando'}
            {o.status === 'en_preparacion' && 'Lista'}
            {o.status === 'lista' && 'Entregada'}
          </button>
        )}
      </motion.div>
    );
  };

  const Col = ({
    title,
    color,
    orders,
  }: {
    title: string;
    color: string;
    orders: Orden[];
  }) => (
    <div className="flex-1 min-w-[260px]">
      <div
        className="text-center text-2xl font-black py-3 rounded-t-xl border-b-4"
        style={{ borderColor: color, color }}
      >
        {title}
      </div>
      <div className="bg-black/30 min-h-[400px] p-2 rounded-b-xl border border-white/10">
        <AnimatePresence>
          {orders.map((o) => (
            <Ticket key={o.id} o={o} />
          ))}
        </AnimatePresence>
        {orders.length === 0 && <p className="text-center text-slate-500 p-8 text-lg">Sin tickets</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModo('cocina')}
          className={`px-6 py-3 rounded-xl text-xl font-bold ${
            modo === 'cocina' ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-400'
          }`}
        >
          🍳 COCINA
        </button>
        <button
          type="button"
          onClick={() => setModo('bar')}
          className={`px-6 py-3 rounded-xl text-xl font-bold ${
            modo === 'bar' ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-400'
          }`}
        >
          🍹 BAR
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <Col title="NUEVAS" color="#ef4444" orders={porColumna('nueva')} />
        <Col title="EN PREPARACIÓN" color="#f59e0b" orders={porColumna('en_preparacion')} />
        <Col title="LISTAS" color="#22c55e" orders={porColumna('lista')} />
      </div>

      <p className="text-center text-slate-500 text-sm py-6 border-t border-white/10">
        En producción las órdenes llegan en tiempo real. Esta pantalla se instala en una tablet en cocina y bar. Sin
        papel, sin gritos, sin errores.
      </p>

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl text-xl font-bold">
          {toast}
        </div>
      )}
    </div>
  );
}
