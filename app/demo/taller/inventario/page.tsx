'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ItemInventario } from '@/lib/mock-data-taller';
import { generarOrdenCompraRefaccionesPdf } from '@/lib/taller-pdf';
import { useTaller } from '../taller-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function nivelBar(i: ItemInventario) {
  const ratio = i.minimo > 0 ? i.stock / i.minimo : 2;
  if (i.stock <= i.minimo) return { cls: 'bg-red-500 animate-pulse', label: 'CRÍTICO' };
  if (ratio < 2) return { cls: 'bg-amber-500', label: 'Bajo' };
  return { cls: 'bg-emerald-500', label: 'OK' };
}

export default function InventarioTallerPage() {
  const { inventario, setInventario } = useTaller();
  const [modal, setModal] = useState<ItemInventario | null>(null);
  const [cant, setCant] = useState('');
  const [costo, setCosto] = useState('');
  const [prov, setProv] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [toast, setToast] = useState<string | null>(null);

  const alertas = useMemo(
    () => inventario.filter((i) => i.stock <= i.minimo),
    [inventario]
  );
  const valorInv = useMemo(
    () => inventario.reduce((s, i) => s + i.stock * i.precioCompra, 0),
    [inventario]
  );

  const registrar = () => {
    if (!modal) return;
    const q = Number(cant);
    const cost = Number(costo);
    if (!q || q <= 0) return;
    setInventario((prev) =>
      prev.map((x) =>
        x.id === modal.id
          ? {
              ...x,
              stock: x.stock + q,
              precioCompra: cost > 0 ? cost / q : x.precioCompra,
              proveedor: prov || x.proveedor,
            }
          : x
      )
    );
    setModal(null);
    setToast('Stock actualizado');
    setTimeout(() => setToast(null), 2500);
  };

  const pdfOc = () => {
    void generarOrdenCompraRefaccionesPdf(inventario);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'SKU en inventario', value: String(inventario.length) },
          { label: 'Alertas críticas', value: String(alertas.length), color: 'text-red-400' },
          { label: 'Valor inventario', value: fmt(valorInv) },
          { label: 'Proveedores activos', value: '4' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${'color' in k ? k.color : 'text-white'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={pdfOc}
          className="px-4 py-2 rounded-lg bg-slate-600 text-sm font-medium hover:bg-slate-500"
        >
          PDF orden de compra a proveedor
        </button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
          <h3 className="text-sm font-semibold">Refacciones y consumibles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-3 py-3">Refacción</th>
                <th className="px-3 py-3">Categoría</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Mínimo</th>
                <th className="px-3 py-3">Nivel</th>
                <th className="px-3 py-3">P. compra</th>
                <th className="px-3 py-3">Proveedor</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map((i) => {
                const n = nivelBar(i);
                const pct = Math.min(100, (i.stock / Math.max(i.minimo * 2, 1)) * 100);
                return (
                  <tr key={i.id} className="border-b border-white/5">
                    <td className="px-3 py-2 text-white">{i.nombre}</td>
                    <td className="px-3 py-2">{i.categoria}</td>
                    <td className="px-3 py-2 tabular-nums">{i.stock}</td>
                    <td className="px-3 py-2 tabular-nums">{i.minimo}</td>
                    <td className="px-3 py-2 w-36">
                      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className={`h-full ${n.cls}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500">{n.label}</span>
                    </td>
                    <td className="px-3 py-2">{fmt(i.precioCompra)}</td>
                    <td className="px-3 py-2 text-slate-400 text-xs">{i.proveedor}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModal(i);
                          setCant('');
                          setCosto('');
                          setProv(i.proveedor);
                          setFecha(new Date().toISOString().slice(0, 10));
                        }}
                        className="text-xs text-sky-400 hover:underline"
                      >
                        Entrada stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-[#0f172a] border border-white/15 rounded-xl p-6 max-w-md w-full space-y-3"
            >
              <h3 className="font-semibold">Entrada — {modal.nombre}</h3>
              <label className="block text-xs text-slate-500">Cantidad</label>
              <input
                className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
                value={cant}
                onChange={(e) => setCant(e.target.value)}
              />
              <label className="block text-xs text-slate-500">Costo total compra</label>
              <input
                className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
              />
              <label className="block text-xs text-slate-500">Proveedor</label>
              <input
                className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
                value={prov}
                onChange={(e) => setProv(e.target.value)}
              />
              <label className="block text-xs text-slate-500">Fecha</label>
              <input
                type="date"
                className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg bg-white/10">
                  Cancelar
                </button>
                <button type="button" onClick={registrar} className="flex-1 py-2 rounded-lg bg-slate-600 font-medium">
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-700 text-white px-4 py-2 rounded-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
