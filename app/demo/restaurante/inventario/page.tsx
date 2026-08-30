'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Ingrediente } from '@/lib/mock-data-restaurante';
import { generarOrdenCompraPdf } from '@/lib/restaurante-pdf';
import { useRestaurante } from '../restaurante-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function nivelBar(i: Ingrediente) {
  const ratio = i.stockMinimo > 0 ? i.stockActual / i.stockMinimo : 2;
  if (i.stockActual <= i.stockMinimo) return { cls: 'bg-red-500 animate-pulse', label: 'CRÍTICO' };
  if (ratio < 2) return { cls: 'bg-amber-500', label: 'Bajo' };
  return { cls: 'bg-emerald-500', label: 'OK' };
}

export default function InventarioPage() {
  const { ingredientes, setIngredientes } = useRestaurante();
  const [modal, setModal] = useState<Ingrediente | null>(null);
  const [cant, setCant] = useState('');
  const [costo, setCosto] = useState('');
  const [prov, setProv] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [toast, setToast] = useState<string | null>(null);

  const alertas = useMemo(
    () => ingredientes.filter((i) => i.stockActual <= i.stockMinimo),
    [ingredientes]
  );
  const valorInv = useMemo(
    () => ingredientes.reduce((s, i) => s + i.stockActual * i.costoUnitario, 0),
    [ingredientes]
  );

  const registrar = () => {
    if (!modal) return;
    const q = Number(cant);
    const cost = Number(costo);
    if (!q || q <= 0) return;
    setIngredientes((prev) =>
      prev.map((x) =>
        x.id === modal.id
          ? {
              ...x,
              stockActual: x.stockActual + q,
              ultimaCompra: fecha,
              costoUnitario: cost > 0 ? cost / q : x.costoUnitario,
              proveedor: prov || x.proveedor,
            }
          : x
      )
    );
    setModal(null);
    setToast('Stock actualizado');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ingredientes en stock', value: String(ingredientes.length) },
          { label: 'Alertas críticas', value: String(alertas.length), color: 'text-red-400' },
          { label: 'Valor inventario', value: fmt(valorInv) },
          { label: 'Próxima compra sugerida', value: '18 mar 2026' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${'color' in k ? k.color : 'text-white'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
          <h3 className="text-sm font-semibold">Ingredientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-3 py-3">Ingrediente</th>
                <th className="px-3 py-3">Unidad</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Mínimo</th>
                <th className="px-3 py-3">Nivel</th>
                <th className="px-3 py-3">Costo u.</th>
                <th className="px-3 py-3">Proveedor</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map((i) => {
                const n = nivelBar(i);
                const pct = Math.min(100, (i.stockActual / Math.max(i.stockMinimo * 2, 1)) * 100);
                return (
                  <tr key={i.id} className="border-b border-white/5">
                    <td className="px-3 py-2 text-white">{i.nombre}</td>
                    <td className="px-3 py-2">{i.unidad}</td>
                    <td className="px-3 py-2 tabular-nums">{i.stockActual}</td>
                    <td className="px-3 py-2 tabular-nums">{i.stockMinimo}</td>
                    <td className="px-3 py-2 w-36">
                      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className={`h-full ${n.cls}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500">{n.label}</span>
                    </td>
                    <td className="px-3 py-2">{fmt(i.costoUnitario)}</td>
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
                        className="text-xs text-red-400 hover:underline"
                      >
                        Registrar compra
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <h3 className="font-semibold text-red-300 mb-2">Alertas de reabastecimiento</h3>
        <ul className="space-y-2">
          {alertas.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {i.nombre} — stock {i.stockActual} / mín {i.stockMinimo}
              </span>
              <button
                type="button"
                onClick={() => void generarOrdenCompraPdf([i])}
                className="text-xs px-3 py-1 rounded-lg bg-red-600"
              >
                Generar orden de compra
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {modal && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-black/70"
              onClick={() => setModal(null)}
              aria-label="Cerrar"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%-2rem,400px)] rounded-xl border border-white/10 bg-[#0f172a] p-5"
            >
              <p className="font-medium text-white mb-3">Compra — {modal.nombre}</p>
              <label className="block text-xs text-slate-500 mb-1">Cantidad</label>
              <input
                value={cant}
                onChange={(e) => setCant(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-3"
              />
              <label className="block text-xs text-slate-500 mb-1">Costo total</label>
              <input
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-3"
              />
              <label className="block text-xs text-slate-500 mb-1">Proveedor</label>
              <input
                value={prov}
                onChange={(e) => setProv(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-3"
              />
              <label className="block text-xs text-slate-500 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-4"
              />
              <button
                type="button"
                onClick={registrar}
                className="w-full py-2 rounded-lg bg-red-600 font-semibold"
              >
                Registrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
