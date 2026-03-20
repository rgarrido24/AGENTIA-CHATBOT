'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BRAND, MOCK_CLIENTES_DELIVERY, MOCK_PRODUCTOS, type Producto } from '@/lib/mock-data-restaurante';
import type { Orden } from '@/lib/mock-data-restaurante';
import { useRestaurante } from '../restaurante-context';

type Cat = 'Todos' | Producto['categoria'];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function newId() {
  return `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export default function MenuOrdenPage() {
  const { addOrden } = useRestaurante();
  const [vista, setVista] = useState<'mesero' | 'cliente'>('mesero');
  const [mesaSel, setMesaSel] = useState<number | 'delivery'>(1);
  const [cat, setCat] = useState<Cat>('Todos');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    colonia: '',
  });
  const [mesaClienteQR, setMesaClienteQR] = useState(3);
  const [modalCart, setModalCart] = useState(false);

  const productos = useMemo(() => {
    if (cat === 'Todos') return MOCK_PRODUCTOS;
    return MOCK_PRODUCTOS.filter((p) => p.categoria === cat);
  }, [cat]);

  const subtotal = useMemo(() => {
    return Object.entries(cart).reduce((s, [id, q]) => {
      const p = MOCK_PRODUCTOS.find((x) => x.id === id);
      return s + (p ? p.precio * q : 0);
    }, 0);
  }, [cart]);

  const add = (id: string, d = 1) => {
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));
  };

  const buildItems = () =>
    Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, cantidad]) => {
        const p = MOCK_PRODUCTOS.find((x) => x.id === id)!;
        return {
          productoId: id,
          nombre: p.nombre,
          cantidad,
          precio: p.precio,
        };
      });

  const enviar = async (target: 'cocina' | 'bar' | 'ambas') => {
    const items = buildItems();
    if (items.length === 0) {
      setToast('Agrega productos a la orden');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (mesaSel === 'delivery') {
      if (!clienteForm.nombre.trim() || !clienteForm.telefono.trim() || !clienteForm.direccion.trim()) {
        setToast('Completa datos de delivery');
        setTimeout(() => setToast(null), 2500);
        return;
      }
    }
    setEnviando(true);
    await new Promise((r) => setTimeout(r, 800));
    const id = newId();
    const area: Orden['area'] = target === 'cocina' ? 'cocina' : target === 'bar' ? 'bar' : 'ambas';
    const orden: Orden = {
      id,
      tipo: mesaSel === 'delivery' ? 'delivery' : 'mesa',
      mesa: mesaSel === 'delivery' ? undefined : mesaSel,
      cliente:
        mesaSel === 'delivery'
          ? {
              nombre: clienteForm.nombre,
              telefono: clienteForm.telefono,
              direccion: clienteForm.direccion,
              colonia: clienteForm.colonia,
            }
          : undefined,
      items: notas ? items.map((it, i) => (i === 0 ? { ...it, notas } : it)) : items,
      subtotal,
      total: subtotal,
      status: 'nueva',
      area,
      createdAt: new Date().toISOString(),
      tiempoEstimado: 25,
    };
    addOrden(orden, mesaSel !== 'delivery' ? { mesaId: mesaSel as number, consumo: subtotal } : undefined);
    setEnviando(false);
    setCart({});
    setNotas('');
    const label =
      target === 'cocina' ? 'cocina' : target === 'bar' ? 'bar' : 'cocina y bar';
    setToast(`✅ Orden enviada a ${label}`);
    setTimeout(() => setToast(null), 3000);
  };

  const confirmarCliente = async () => {
    if (Object.keys(cart).length === 0) return;
    setEnviando(true);
    await new Promise((r) => setTimeout(r, 800));
    const id = newId();
    const orden: Orden = {
      id,
      tipo: 'mesa',
      mesa: mesaClienteQR,
      items: buildItems(),
      subtotal,
      total: subtotal,
      status: 'nueva',
      area: 'ambas',
      createdAt: new Date().toISOString(),
      tiempoEstimado: 25,
    };
    addOrden(orden, { mesaId: mesaClienteQR, consumo: subtotal });
    setEnviando(false);
    setCart({});
    setModalCart(false);
    setToast('¡Orden enviada! Tu mesero la recibirá en instantes 🎉');
    setTimeout(() => setToast(null), 4000);
  };

  const countItems = Object.values(cart).reduce((a, b) => a + b, 0);

  if (vista === 'cliente') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0f1a] text-white flex flex-col">
        <header className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setVista('mesero')} className="text-sm text-red-400 shrink-0">
            ← Salir
          </button>
          <div className="text-center flex-1">
            <p className="text-2xl">🍻</p>
            <p className="font-bold">
              {BRAND.corto} — Mesa {mesaClienteQR}
            </p>
            <select
              value={mesaClienteQR}
              onChange={(e) => setMesaClienteQR(Number(e.target.value))}
              className="mt-2 text-xs bg-slate-800 border border-white/15 rounded-lg px-2 py-1 text-white"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  Simular Mesa {n}
                </option>
              ))}
            </select>
          </div>
          <span className="w-12 shrink-0" />
        </header>
        <div className="px-3 py-2 bg-red-950/40 border-b border-red-900/50 text-[11px] text-red-100 text-center">
          En producción, el cliente escanea el QR de su mesa y ordena directamente. La orden llega al panel de cocina.
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6 pb-28">
          {(['Hamburguesas', 'Alitas', 'Boneless', 'Bebidas', 'Extras'] as const).map((c) => (
            <section key={c}>
              <h3 className="text-sm font-bold text-red-400 mb-2">{c}</h3>
              <div className="space-y-2">
                {MOCK_PRODUCTOS.filter((p) => p.categoria === c).map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      p.disponible ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-black/20 opacity-60'
                    }`}
                  >
                    <span className="text-3xl">{p.imagen}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{p.descripcion}</p>
                      <p className="text-amber-300 text-sm mt-1">{fmt(p.precio)}</p>
                    </div>
                    {p.disponible ? (
                      <button
                        type="button"
                        onClick={() => add(p.id, 1)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-red-600 text-sm font-semibold"
                      >
                        + Agregar
                      </button>
                    ) : (
                      <span className="text-[10px] bg-slate-700 px-2 py-1 rounded">Agotado</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        {countItems > 0 && (
          <button
            type="button"
            onClick={() => setModalCart(true)}
            className="fixed bottom-4 left-3 right-3 py-3 rounded-xl bg-red-600 font-semibold shadow-lg z-[110]"
          >
            Ver orden ({countItems} {countItems === 1 ? 'item' : 'items'} · {fmt(subtotal)})
          </button>
        )}
        <AnimatePresence>
          {modalCart && (
            <>
              <motion.button
                className="fixed inset-0 z-[120] bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setModalCart(false)}
                aria-label="Cerrar"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 z-[130] bg-[#111827] rounded-t-2xl border-t border-white/10 p-4 max-h-[70vh] overflow-y-auto"
              >
                <p className="font-bold mb-3">Tu orden</p>
                {buildItems().map((it) => (
                  <div key={it.productoId} className="flex justify-between text-sm py-1">
                    <span>
                      {it.nombre} x{it.cantidad}
                    </span>
                    <span>{fmt(it.precio * it.cantidad)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => void confirmarCliente()}
                  className="w-full mt-4 py-3 rounded-xl bg-red-600 font-bold disabled:opacity-50"
                >
                  {enviando ? 'Enviando…' : 'Confirmar orden'}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {toast && (
          <div className="fixed bottom-24 left-3 right-3 z-[140] bg-emerald-700 text-white text-sm p-3 rounded-xl text-center">
            {toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex rounded-lg border border-white/15 p-1 bg-white/[0.03]">
          <button
            type="button"
            onClick={() => setVista('mesero')}
            className={`px-3 py-1.5 rounded-md text-sm ${vista === 'mesero' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
          >
            👨‍💼 Vista Mesero
          </button>
          <button
            type="button"
            onClick={() => setVista('cliente')}
            className={`px-3 py-1.5 rounded-md text-sm ${vista === 'cliente' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
          >
            📱 Vista Cliente QR
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-blue-900/50 bg-blue-950/30 p-3 text-xs text-slate-300">
        En producción, el cliente escanea el QR de su mesa y ordena directamente. La orden llega automáticamente al
        panel de cocina.
      </div>

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setMesaSel(n)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              mesaSel === n ? 'bg-red-600 border-red-500 text-white' : 'border-white/15 text-slate-400'
            }`}
          >
            Mesa {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMesaSel('delivery')}
          className={`px-3 py-1.5 rounded-lg text-sm border ${
            mesaSel === 'delivery' ? 'bg-red-600 border-red-500 text-white' : 'border-white/15 text-slate-400'
          }`}
        >
          🛵 Delivery
        </button>
      </div>

      {mesaSel === 'delivery' && (
        <div className="grid sm:grid-cols-2 gap-3 rounded-xl border border-white/10 p-4 bg-white/[0.02]">
          <label className="text-xs text-slate-500">
            Nombre
            <input
              list="clientes-dl"
              value={clienteForm.nombre}
              onChange={(e) => {
                const v = e.target.value;
                const c = MOCK_CLIENTES_DELIVERY.find((x) => x.nombre === v);
                setClienteForm((f) =>
                  c
                    ? {
                        nombre: c.nombre,
                        telefono: c.telefono,
                        direccion: c.direccion,
                        colonia: c.colonia,
                      }
                    : { ...f, nombre: v }
                );
              }}
              className="mt-1 w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            />
            <datalist id="clientes-dl">
              {MOCK_CLIENTES_DELIVERY.map((c) => (
                <option key={c.id} value={c.nombre} />
              ))}
            </datalist>
          </label>
          <label className="text-xs text-slate-500">
            Teléfono
            <input
              value={clienteForm.telefono}
              onChange={(e) => setClienteForm((f) => ({ ...f, telefono: e.target.value }))}
              className="mt-1 w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-slate-500 sm:col-span-2">
            Dirección
            <input
              value={clienteForm.direccion}
              onChange={(e) => setClienteForm((f) => ({ ...f, direccion: e.target.value }))}
              className="mt-1 w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-slate-500">
            Colonia
            <input
              value={clienteForm.colonia}
              onChange={(e) => setClienteForm((f) => ({ ...f, colonia: e.target.value }))}
              className="mt-1 w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {(['Todos', 'Hamburguesas', 'Alitas', 'Boneless', 'Bebidas', 'Extras'] as Cat[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              cat === c ? 'bg-red-600 border-red-500 text-white' : 'border-white/15 text-slate-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {productos.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-xl border border-white/10 p-3 flex flex-col ${
                p.disponible ? 'bg-white/[0.03]' : 'opacity-60'
              }`}
            >
              {!p.disponible && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60 text-xs font-bold">
                  Agotado
                </div>
              )}
              <div className="text-4xl text-center mb-2">{p.imagen}</div>
              <p className="font-semibold text-sm text-center leading-tight">{p.nombre}</p>
              <p className="text-[11px] text-slate-500 text-center line-clamp-2 mt-1">{p.descripcion}</p>
              <p className="text-amber-300 text-center font-bold mt-2">{fmt(p.precio)}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <button type="button" className="px-2 py-1 rounded bg-slate-700" onClick={() => add(p.id, -1)}>
                  −
                </button>
                <span className="w-6 text-center tabular-nums">{cart[p.id] ?? 0}</span>
                <button
                  type="button"
                  className="px-2 py-1 rounded bg-red-700 disabled:opacity-40"
                  disabled={!p.disponible}
                  onClick={() => add(p.id, 1)}
                >
                  +
                </button>
              </div>
              <div className="flex justify-center gap-1 mt-2 text-[10px]">
                {p.esPicoso && <span>🌶️</span>}
                {p.esPopular && <span>⭐ Popular</span>}
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
          <p className="font-bold text-white">
            Orden — {mesaSel === 'delivery' ? '🛵 Delivery' : `Mesa ${mesaSel}`}
          </p>
          {buildItems().length === 0 ? (
            <p className="text-sm text-slate-500">Sin ítems aún</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {buildItems().map((it) => (
                <li key={it.productoId} className="flex justify-between gap-2">
                  <span className="truncate">
                    {it.nombre} x{it.cantidad}
                  </span>
                  <span className="tabular-nums text-amber-200">{fmt(it.precio * it.cantidad)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <label className="block text-xs text-slate-500">
            Notas
            <input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="sin cebolla…"
              className="mt-1 w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={enviando}
              onClick={() => void enviar('cocina')}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-bold disabled:opacity-50"
            >
              🍳 Enviar a Cocina
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => void enviar('bar')}
              className="w-full py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-sm font-bold disabled:opacity-50"
            >
              🍹 Enviar a Bar
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => void enviar('ambas')}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50"
            >
              📋 Enviar a Ambos
            </button>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
