'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MovimientoCaja } from '@/lib/mock-data-restaurante';
import { ingresosDelDia, egresosDelDia } from '@/lib/mock-data-restaurante';
import { generarCorteCajaPdf } from '@/lib/restaurante-pdf';
import { useRestaurante } from '../restaurante-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function CajaPage() {
  const { movimientosCaja, setMovimientosCaja } = useRestaurante();
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [filtroMet, setFiltroMet] = useState<string>('todos');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    tipo: 'ingreso' as MovimientoCaja['tipo'],
    concepto: '',
    monto: '',
    metodo: 'efectivo' as NonNullable<MovimientoCaja['metodoPago']>,
    notas: '',
  });

  const ing = ingresosDelDia(movimientosCaja);
  const egr = egresosDelDia(movimientosCaja);
  const fondo = 500;

  const porMetodo = useMemo(() => {
    let efectivo = 0;
    let tarjeta = 0;
    let transferencia = 0;
    for (const m of movimientosCaja) {
      if (m.tipo !== 'ingreso' || !m.metodoPago) continue;
      if (m.metodoPago === 'efectivo') efectivo += m.monto;
      else if (m.metodoPago === 'tarjeta') tarjeta += m.monto;
      else if (m.metodoPago === 'transferencia') transferencia += m.monto;
    }
    return { efectivo, tarjeta, transferencia };
  }, [movimientosCaja]);

  const filtrados = useMemo(() => {
    return movimientosCaja.filter((m) => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
      if (filtroMet !== 'todos' && m.metodoPago !== filtroMet) return false;
      return true;
    });
  }, [movimientosCaja, filtroTipo, filtroMet]);

  const agregar = () => {
    const monto = Number(form.monto);
    if (!form.concepto.trim() || !monto) return;
    const nuevo: MovimientoCaja = {
      id: `mx-${Date.now()}`,
      tipo: form.tipo,
      concepto: form.notas ? `${form.concepto} (${form.notas})` : form.concepto,
      monto,
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      metodoPago: form.metodo,
    };
    setMovimientosCaja((prev) => [nuevo, ...prev]);
    setModal(false);
    setForm({ tipo: 'ingreso', concepto: '', monto: '', metodo: 'efectivo', notas: '' });
  };

  const cortePdf = () => {
    void generarCorteCajaPdf({
      movimientos: movimientosCaja,
      totalIngresos: ing,
      totalEgresos: egr,
      fondo,
      porMetodo: porMetodo,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section>
        <h2 className="text-sm font-semibold mb-3">Resumen del día</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Ingresos', value: fmt(ing), c: 'text-emerald-400' },
            { label: 'Egresos', value: fmt(egr), c: 'text-red-400' },
            { label: 'Efectivo (ing.)', value: fmt(porMetodo.efectivo), c: 'text-amber-300' },
            { label: 'Tarjeta (ing.)', value: fmt(porMetodo.tarjeta), c: 'text-sky-300' },
          ].map((x) => (
            <div key={x.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-xs text-slate-500">{x.label}</p>
              <p className={`text-lg font-bold ${x.c}`}>{x.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold">Movimientos del día</h2>
          <button
            type="button"
            onClick={() => setModal(true)}
            className="text-sm px-3 py-1.5 rounded-lg bg-red-600 font-medium"
          >
            Registrar movimiento manual
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {(['todos', 'ingreso', 'egreso'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroTipo(t)}
              className={`text-xs px-2 py-1 rounded-full border ${
                filtroTipo === t ? 'bg-red-600 border-red-500' : 'border-white/15 text-slate-400'
              }`}
            >
              {t === 'todos' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Egresos'}
            </button>
          ))}
          <span className="text-slate-600">|</span>
          {(['todos', 'efectivo', 'tarjeta', 'transferencia'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroMet(t)}
              className={`text-xs px-2 py-1 rounded-full border ${
                filtroMet === t ? 'bg-amber-600/40 border-amber-500' : 'border-white/15 text-slate-400'
              }`}
            >
              {t === 'todos' ? 'Todos mét.' : t}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10 bg-white/[0.03]">
                <th className="px-3 py-2">Hora</th>
                <th className="px-3 py-2">Concepto</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Método</th>
                <th className="px-3 py-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="px-3 py-2 text-slate-400">{m.hora}</td>
                  <td className="px-3 py-2">{m.concepto}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        m.tipo === 'ingreso'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{m.metodoPago ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{fmt(m.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-bold text-lg mb-4">Corte del día</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Total ingresos</span>
            <span>{fmt(ing)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total egresos</span>
            <span>{fmt(egr)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between">
            <span className="text-slate-400">Fondo de caja</span>
            <span>{fmt(fondo)}</span>
          </div>
          <div className="flex justify-between font-bold text-amber-300 text-lg">
            <span>TOTAL A RETIRAR</span>
            <span>{fmt(ing - egr - fondo)}</span>
          </div>
          <p className="text-xs text-slate-500 pt-2">
            Por método: Efectivo {fmt(porMetodo.efectivo)} | Tarjeta {fmt(porMetodo.tarjeta)} | Transfer.{' '}
            {fmt(porMetodo.transferencia)}
          </p>
        </div>
        <button
          type="button"
          onClick={cortePdf}
          className="mt-4 w-full py-3 rounded-xl bg-red-600 font-semibold"
        >
          📄 Generar reporte de corte PDF
        </button>
      </section>

      <AnimatePresence>
        {modal && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-black/70"
              onClick={() => setModal(false)}
              aria-label="Cerrar"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%-2rem,400px)] rounded-xl border border-white/10 bg-[#0f172a] p-5"
            >
              <p className="font-semibold mb-3">Movimiento manual</p>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tipo: e.target.value as MovimientoCaja['tipo'] }))
                }
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-2"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
              <input
                placeholder="Concepto"
                value={form.concepto}
                onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-2"
              />
              <input
                placeholder="Monto"
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-2"
              />
              <select
                value={form.metodo}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    metodo: e.target.value as NonNullable<MovimientoCaja['metodoPago']>,
                  }))
                }
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-2"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
              <input
                placeholder="Notas"
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm mb-4"
              />
              <button type="button" onClick={agregar} className="w-full py-2 rounded-lg bg-red-600 font-semibold">
                Guardar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
