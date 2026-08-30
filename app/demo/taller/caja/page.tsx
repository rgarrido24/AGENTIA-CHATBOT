'use client';

import { useMemo, useState } from 'react';
import type { MovimientoCaja } from '@/lib/mock-data-taller';
import {
  egresosDelDia,
  ingresosDelDia,
  ingresosPorRubro,
} from '@/lib/mock-data-taller';
import { generarCorteCajaTallerPdf } from '@/lib/taller-pdf';
import { useTaller } from '../taller-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function CajaTallerPage() {
  const { movimientosCaja, setMovimientosCaja } = useTaller();
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [filtroMet, setFiltroMet] = useState<string>('todos');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    tipo: 'ingreso' as MovimientoCaja['tipo'],
    concepto: '',
    monto: '',
    metodo: 'efectivo' as NonNullable<MovimientoCaja['metodoPago']>,
    rubro: '' as '' | 'mano_obra' | 'refacciones',
    notas: '',
  });

  const ing = ingresosDelDia(movimientosCaja);
  const egr = egresosDelDia(movimientosCaja);
  const fondo = 800;
  const rubro = ingresosPorRubro(movimientosCaja);

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
      rubro: form.rubro || undefined,
    };
    setMovimientosCaja((prev) => [nuevo, ...prev]);
    setModal(false);
    setForm({
      tipo: 'ingreso',
      concepto: '',
      monto: '',
      metodo: 'efectivo',
      rubro: '',
      notas: '',
    });
  };

  const cortePdf = () => {
    void generarCorteCajaTallerPdf({
      movimientos: movimientosCaja,
      totalIngresos: ing,
      totalEgresos: egr,
      fondo,
      porMetodo,
      porRubro: rubro,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section>
        <h2 className="text-sm font-semibold mb-3">Corte del día — mano de obra vs refacciones</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Ingresos', value: fmt(ing), c: 'text-emerald-400' },
            { label: 'Egresos', value: fmt(egr), c: 'text-red-400' },
            { label: 'Mano de obra', value: fmt(rubro.mano_obra), c: 'text-sky-300' },
            { label: 'Refacciones', value: fmt(rubro.refacciones), c: 'text-amber-300' },
          ].map((x) => (
            <div key={x.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-xs text-slate-500">{x.label}</p>
              <p className={`text-lg font-bold ${x.c}`}>{x.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { label: 'Efectivo', value: fmt(porMetodo.efectivo) },
            { label: 'Tarjeta', value: fmt(porMetodo.tarjeta) },
            { label: 'Transferencia', value: fmt(porMetodo.transferencia) },
          ].map((x) => (
            <div key={x.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center text-sm">
              <p className="text-slate-500">{x.label}</p>
              <p className="font-semibold">{x.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold">Movimientos</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModal(true)}
              className="text-sm px-3 py-1.5 rounded-lg bg-slate-600 font-medium"
            >
              Registrar movimiento
            </button>
            <button
              type="button"
              onClick={cortePdf}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/10 font-medium"
            >
              PDF corte de caja
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {(['todos', 'ingreso', 'egreso'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroTipo(t)}
              className={`text-xs px-2 py-1 rounded-full border ${
                filtroTipo === t ? 'bg-slate-600 border-slate-500' : 'border-white/15 text-slate-400'
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
                <th className="px-3 py-2">Rubro</th>
                <th className="px-3 py-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="px-3 py-2 text-slate-400">{m.hora}</td>
                  <td className="px-3 py-2">{m.concepto}</td>
                  <td className="px-3 py-2">{m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</td>
                  <td className="px-3 py-2">{m.metodoPago ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{m.rubro ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{fmt(m.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#0f172a] border border-white/15 rounded-xl p-6 max-w-md w-full space-y-3">
            <h3 className="font-semibold">Nuevo movimiento</h3>
            <select
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as MovimientoCaja['tipo'] }))}
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
            <input
              placeholder="Concepto"
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
              value={form.concepto}
              onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))}
            />
            <input
              placeholder="Monto"
              type="number"
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
              value={form.monto}
              onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
            />
            <select
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
              value={form.metodo}
              onChange={(e) =>
                setForm((f) => ({ ...f, metodo: e.target.value as NonNullable<MovimientoCaja['metodoPago']> }))
              }
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <select
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
              value={form.rubro}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  rubro: e.target.value as '' | 'mano_obra' | 'refacciones',
                }))
              }
            >
              <option value="">Rubro (opcional)</option>
              <option value="mano_obra">Mano de obra</option>
              <option value="refacciones">Refacciones</option>
            </select>
            <input
              placeholder="Notas"
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2"
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            />
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-2 rounded-lg bg-white/10" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button type="button" className="flex-1 py-2 rounded-lg bg-slate-600 font-medium" onClick={agregar}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
