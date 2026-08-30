'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { AlertTriangle, Boxes, Bell, Plus, Minus, ShoppingCart, MessageCircle } from 'lucide-react';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS } from '../giro-config';

const fmtMx = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function InventarioPage() {
  const { giro } = useBarber();
  const cfg = giro ? GIRO_CONFIGS[giro] : GIRO_CONFIGS.barberia;
  const isNail = giro === 'nail';
  const accent = cfg.acento;

  // Estado mutable de stock (demo): permitir +/- y simular descuento por servicio
  const [stockMap, setStockMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(cfg.inventario.map((i) => [i.nombre, i.stock]))
  );

  const items = cfg.inventario.map((i) => ({
    ...i,
    stockActual: stockMap[i.nombre] ?? i.stock,
  }));

  const lowStock = items.filter((i) => i.stockActual <= i.stockMinimo);
  const valorInventario = items.reduce((acc, i) => acc + i.stockActual * i.costoUnitario, 0);

  // Theme tokens
  const text = isNail ? 'text-zinc-900' : 'text-white';
  const textSubtle = isNail ? 'text-zinc-600' : 'text-slate-300';
  const textMuted = isNail ? 'text-zinc-500' : 'text-slate-400';
  const cardBorder = isNail ? 'border-pink-200' : 'border-white/10';
  const cardBg = isNail ? 'bg-white' : 'bg-white/[0.04]';
  const btnSubtle = isNail
    ? 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'
    : 'bg-white/[0.06] hover:bg-white/[0.10] text-white border-white/15';

  function adjust(name: string, delta: number) {
    setStockMap((prev) => ({ ...prev, [name]: Math.max(0, (prev[name] ?? 0) + delta) }));
  }

  function simularServicio(itemName: string, consumo: number) {
    setStockMap((prev) => {
      const cur = prev[itemName] ?? 0;
      const next = Math.max(0, +(cur - consumo).toFixed(2));
      return { ...prev, [itemName]: next };
    });
  }

  // Mensaje de WhatsApp para reordenar productos bajos
  const reorderMsg = useMemo(() => {
    if (lowStock.length === 0) return '';
    const lines = lowStock.map((i) => `- ${i.nombre} (quedan ${i.stockActual} ${i.unidad})`).join('\n');
    return `Hola! Necesito reabastecer:\n${lines}\n\nGracias.`;
  }, [lowStock]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${text}`}>Inventario y stock</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>
            Controla el stock, descuenta automáticamente al cerrar un {cfg.termServicio} y recibe alertas cuando un producto
            está por agotarse.
          </p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: cfg.acentoSoft, color: accent, border: `1px solid ${accent}55` }}
        >
          {items.length} productos · {lowStock.length} con alerta
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Productos totales', value: String(items.length), icon: Boxes },
          { label: 'Valor de inventario', value: fmtMx(valorInventario), icon: ShoppingCart },
          { label: 'Productos con alerta', value: String(lowStock.length), icon: AlertTriangle, danger: lowStock.length > 0 },
        ].map(({ label, value, icon: Icon, danger }) => (
          <div key={label} className={`rounded-2xl border p-4 flex items-center gap-3 ${cardBorder} ${cardBg}`}>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={
                danger
                  ? { background: 'rgba(239,68,68,0.18)', color: '#ef4444' }
                  : { background: cfg.acentoSoft, color: accent }
              }
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] uppercase tracking-wide font-bold ${textMuted}`}>{label}</p>
              <p className={`text-xl font-extrabold ${text}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {lowStock.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.35)' }}
        >
          <div className="flex items-start gap-3 flex-wrap">
            <Bell className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${text}`}>Stock bajo en {lowStock.length} productos</p>
              <p className={`text-xs mt-1 ${textSubtle}`}>
                {lowStock.map((i) => i.nombre).join(' · ')}
              </p>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(reorderMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Reordenar por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Tabla / Grid de productos */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((it) => {
          const isLow = it.stockActual <= it.stockMinimo;
          return (
            <div
              key={it.nombre}
              className={`rounded-2xl border overflow-hidden flex flex-col ${cardBorder} ${cardBg}`}
              style={isLow ? { borderColor: 'rgba(239,68,68,0.45)' } : undefined}
            >
              <div className="relative h-32 bg-gradient-to-br from-zinc-200 to-zinc-100">
                <Image
                  src={it.imageUrl}
                  alt={it.nombre}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  unoptimized
                />
                {isLow && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full bg-red-500 text-white shadow">
                    STOCK BAJO
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                  <h3 className={`font-bold ${text}`}>{it.nombre}</h3>
                  <p className={`text-xs ${textMuted}`}>
                    Costo: {fmtMx(it.costoUnitario)} / {it.unidad.replace(/s$/, '')}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>Stock actual</p>
                    <p className={`text-2xl font-extrabold ${isLow ? 'text-red-500' : text}`}>
                      {it.stockActual.toFixed(it.stockActual % 1 === 0 ? 0 : 2)}{' '}
                      <span className={`text-xs font-semibold ${textMuted}`}>{it.unidad}</span>
                    </p>
                    <p className={`text-[10px] ${textSubtle}`}>Mín: {it.stockMinimo}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjust(it.nombre, -1)}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center ${btnSubtle}`}
                      aria-label="Reducir stock"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjust(it.nombre, +1)}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center ${btnSubtle}`}
                      aria-label="Aumentar stock"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => simularServicio(it.nombre, it.consumoPorServicio)}
                  className="text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition text-white"
                  style={{ background: accent }}
                >
                  Simular {cfg.termServicio} (descontar {it.consumoPorServicio} {it.unidad})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`rounded-xl border p-4 ${cardBorder} ${cardBg}`}>
        <p className={`text-sm font-bold ${text}`}>¿Cómo funciona el descuento automático?</p>
        <p className={`text-xs mt-1 ${textSubtle}`}>
          Cuando un {cfg.termServicio} se marca como completado, el sistema resta automáticamente el consumo configurado del
          stock (cera, esmalte, lijas, etc.). En cuanto un producto cae por debajo del mínimo, se dispara una alerta a tu
          WhatsApp para reordenar.
        </p>
      </div>
    </div>
  );
}
