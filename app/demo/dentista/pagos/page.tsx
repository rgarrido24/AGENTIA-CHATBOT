'use client';

import { useMemo, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { HOY_DENT } from '@/lib/mock-data-dentista';
import { useDentista } from '../dentista-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function PagosPage() {
  const { pacientes, consultas, pagos, registrarPago } = useDentista();
  const [modal, setModal] = useState(false);
  const [pid, setPid] = useState('p1');
  const [monto, setMonto] = useState(500);
  const [metodo, setMetodo] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [ref, setRef] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const ingresosMes = useMemo(() => pagos.reduce((s, p) => s + p.monto, 0) + 45000, [pagos]);
  const cxp = useMemo(() => pacientes.reduce((s, p) => s + p.deuda, 0), [pacientes]);
  const conDeuda = useMemo(() => pacientes.filter((p) => p.deuda > 0).length, [pacientes]);
  const cobrosHoy = useMemo(() => pagos.filter((p) => p.fecha === HOY_DENT).reduce((s, p) => s + p.monto, 0), [pagos]);

  const cuentas = useMemo(() => {
    return consultas
      .filter((c) => c.saldo > 0)
      .map((c) => {
        const p = pacientes.find((x) => x.id === c.pacienteId);
        const dias = 5 + (c.id.length % 20);
        return { ...c, paciente: p, dias };
      })
      .slice(0, 15);
  }, [consultas, pacientes]);

  const totalesMetodo = useMemo(() => {
    const m = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    for (const p of pagos.filter((x) => x.fecha === HOY_DENT)) {
      m[p.metodo] += p.monto;
    }
    return m;
  }, [pagos]);

  const registrar = () => {
    registrarPago(pid, monto, metodo, ref.trim() || undefined);
    setModal(false);
    setToast('Pago registrado');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos del mes (demo)', value: ingresosMes, f: fmt },
          { label: 'Cuentas por cobrar', value: cxp, f: fmt },
          { label: 'Pacientes con deuda', value: conDeuda, f: (n: number) => String(n) },
          { label: 'Cobros del día', value: cobrosHoy, f: fmt },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-slate-500 text-sm">{k.label}</p>
            <p className="text-2xl font-bold text-sky-300 mt-1">{k.f(k.value)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
        En producción esta sección genera CFDI automáticamente al registrar cada pago.
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => setModal(true)} className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold text-sm">
          Registrar pago
        </button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 bg-white/[0.03] font-medium text-sm">Cuentas por cobrar (consultas con saldo)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 text-left">
                <th className="p-3">Paciente</th>
                <th className="p-3">Tratamiento</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Total</th>
                <th className="p-3">Pagado</th>
                <th className="p-3">Saldo</th>
                <th className="p-3">Días vencido</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="p-3">{c.paciente?.nombre}</td>
                  <td className="p-3 text-slate-400">{c.motivo}</td>
                  <td className="p-3">{c.fecha}</td>
                  <td className="p-3">{fmt(c.costo)}</td>
                  <td className="p-3">{fmt(c.pagado)}</td>
                  <td className="p-3 text-amber-300">{fmt(c.saldo)}</td>
                  <td className="p-3">{c.dias}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="text-sky-400 text-xs"
                      onClick={() => {
                        setPid(c.pacienteId);
                        setMonto(c.saldo);
                        setModal(true);
                      }}
                    >
                      Pagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="font-medium mb-3">Historial de pagos del día</h3>
        <ul className="text-sm space-y-2">
          {pagos
            .filter((p) => p.fecha === HOY_DENT)
            .map((p) => (
              <li key={p.id} className="flex justify-between border-b border-white/5 pb-2">
                <span>{p.pacienteNombre}</span>
                <span>
                  {fmt(p.monto)} · {p.metodo}
                </span>
              </li>
            ))}
        </ul>
        <p className="text-xs text-slate-500 mt-4">
          Totales: Efectivo {fmt(totalesMetodo.efectivo)} · Tarjeta {fmt(totalesMetodo.tarjeta)} · Transferencia{' '}
          {fmt(totalesMetodo.transferencia)}
        </p>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setModal(false)}>
            <motion.div
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1624] p-6"
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <div className="flex justify-between mb-4">
                <h2 className="font-semibold">Registrar pago</h2>
                <button type="button" onClick={() => setModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs text-slate-400">Paciente</label>
                  <select value={pid} onChange={(e) => setPid(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2">
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (deuda {fmt(p.deuda)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Monto</label>
                  <input type="number" value={monto} onChange={(e) => setMonto(Number(e.target.value) || 0)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Método</label>
                  <select value={metodo} onChange={(e) => setMetodo(e.target.value as typeof metodo)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2">
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Referencia (opcional)</label>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2" />
                </div>
                <button type="button" onClick={registrar} className="w-full py-3 rounded-xl font-semibold bg-sky-600 text-white">
                  Registrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-slate-900 border text-sm">{toast}</div>}
    </div>
  );
}
