'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  getCliente,
  getVehiculo,
  type OrdenServicio,
  type StatusOrden,
} from '@/lib/mock-data-taller';
import {
  generarOrdenSalidaPdf,
  generarPresupuestoPdf,
} from '@/lib/taller-pdf';
import { useTaller } from '../taller-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const COLS: { status: StatusOrden; title: string; color: string }[] = [
  { status: 'recibido', title: 'Recibido', color: '#64748b' },
  { status: 'diagnostico', title: 'Diagnóstico', color: '#3b82f6' },
  { status: 'en_reparacion', title: 'En reparación', color: '#f59e0b' },
  { status: 'listo', title: 'Listo', color: '#22c55e' },
  { status: 'entregado', title: 'Entregado', color: '#94a3b8' },
];

const ORDER_FLOW: StatusOrden[] = [
  'recibido',
  'diagnostico',
  'en_reparacion',
  'listo',
  'entregado',
];

function nextStatus(s: StatusOrden): StatusOrden | null {
  const i = ORDER_FLOW.indexOf(s);
  if (i < 0 || i >= ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[i + 1] ?? null;
}

function diasEnTaller(fechaIngreso: string): number {
  const t = new Date(fechaIngreso + 'T12:00:00').getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.floor((today - t) / 86400000));
}

function waDigits(tel: string): string {
  return tel.replace(/\D/g, '').replace(/^52/, '') || '5210000000000';
}

function mensajeWA(o: OrdenServicio, clienteNombre: string, vehLabel: string): string {
  if (o.status === 'listo') {
    return `Hola ${clienteNombre}, su ${vehLabel} ya está listo para recoger 🔧✅\nTotal a pagar: ${fmt(o.total)}. Pase por él en horario 8am-6pm. ¡Gracias!`;
  }
  if (o.status === 'entregado') {
    return `Hola ${clienteNombre}, gracias por confiar en AutoPro. Su ${vehLabel} fue entregado. ¡Que tenga excelente día!`;
  }
  return `Hola ${clienteNombre}, le informamos sobre su ${vehLabel} (orden ${o.id}): estado actual «${o.status.replace(/_/g, ' ')}». Cualquier duda estamos al pendiente.`;
}

export default function OrdenesPage() {
  const { ordenes, updateOrdenStatus } = useTaller();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const drawerOrden = selectedId ? ordenes.find((o) => o.id === selectedId) ?? null : null;

  const Ticket = ({ o }: { o: OrdenServicio }) => {
    const v = getVehiculo(o.vehiculoId);
    const c = getCliente(o.clienteId);
    const dias = diasEnTaller(o.fechaIngreso);
    const vehLabel = v ? `${v.marca} ${v.modelo} ${v.año}` : 'Vehículo';
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-white/15 bg-black/35 p-3 mb-3 cursor-pointer hover:border-slate-500/60"
        onClick={() => setSelectedId(o.id)}
      >
        <p className="text-lg font-bold">
          {v?.emoji} {vehLabel}
        </p>
        <p className="text-sm text-slate-400">Placa: {v?.placa ?? '—'}</p>
        <p className="text-sm">Cliente: {c?.nombre ?? '—'}</p>
        <p className="text-sm text-slate-300">Técnico: {o.tecnico}</p>
        <p className="text-amber-400 text-sm mt-1">⏱ {dias} día{dias !== 1 ? 's' : ''} en taller</p>
        <p className="text-sm font-medium text-white mt-1">{o.tipo}</p>
        <p className="text-xs text-slate-500">
          Est. entrega:{' '}
          {new Date(o.fechaEstimadaEntrega + 'T12:00:00').toLocaleDateString('es-MX')}
        </p>
        <button
          type="button"
          className="mt-3 w-full py-2 rounded-lg text-sm font-semibold bg-slate-600 hover:bg-slate-500"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(o.id);
          }}
        >
          Ver orden completa
        </button>
      </motion.div>
    );
  };

  const drawerCliente = drawerOrden ? getCliente(drawerOrden.clienteId) : undefined;
  const drawerVeh = drawerOrden ? getVehiculo(drawerOrden.vehiculoId) : undefined;

  const presupuestoDesdeOrden = async () => {
    if (!drawerOrden || !drawerCliente || !drawerVeh) return;
    const folio = `P-${drawerOrden.id.toUpperCase()}`;
    const hoy = new Date().toLocaleDateString('es-MX');
    const hasta = new Date();
    hasta.setDate(hasta.getDate() + 7);
    await generarPresupuestoPdf({
      folio,
      fecha: hoy,
      validoHasta: hasta.toLocaleDateString('es-MX'),
      cliente: { nombre: drawerCliente.nombre, telefono: drawerCliente.telefono },
      vehiculo: {
        marca: drawerVeh.marca,
        modelo: drawerVeh.modelo,
        año: drawerVeh.año,
        placa: drawerVeh.placa,
        color: drawerVeh.color,
        km: drawerOrden.kilometrajeEntrada,
      },
      problema: drawerOrden.descripcionProblema,
      trabajos: drawerOrden.trabajosRealizados.map((t) => ({
        descripcion: t.descripcion,
        horas: t.tiempo,
        costo: t.costo,
      })),
      refacciones: drawerOrden.refacciones.map((r) => ({
        nombre: r.nombre,
        cantidad: r.cantidad,
        pu: r.costoUnitario,
        total: r.total,
      })),
      notas: drawerOrden.observaciones,
      tiempoEstimadoTotal: '1–2 días',
      manoObra: drawerOrden.subtotalManoObra,
      subtotalRefacciones: drawerOrden.subtotalRefacciones,
      ivaPct: 16,
      incluirIva: true,
    });
  };

  const ordenSalidaPdf = async () => {
    if (!drawerOrden || !drawerCliente || !drawerVeh) return;
    await generarOrdenSalidaPdf({
      folio: `S-${drawerOrden.id}`,
      cliente: drawerCliente.nombre,
      vehiculo: `${drawerVeh.marca} ${drawerVeh.modelo}`,
      placa: drawerVeh.placa,
      total: drawerOrden.total,
      trabajos: drawerOrden.trabajosRealizados.map((t) => t.descripcion),
      garantia: drawerOrden.garantia,
    });
  };

  const waHref = useMemo(() => {
    if (!drawerOrden || !drawerCliente || !drawerVeh) return '#';
    const vehLabel = `${drawerVeh.marca} ${drawerVeh.modelo}`;
    const msg = mensajeWA(drawerOrden, drawerCliente.nombre, vehLabel);
    return `https://wa.me/${waDigits(drawerCliente.telefono)}?text=${encodeURIComponent(msg)}`;
  }, [drawerOrden, drawerCliente, drawerVeh]);

  return (
    <div className="max-w-[1700px] mx-auto space-y-4">
      <p className="text-slate-500 text-sm">
        Arrastre mental por columnas — en producción conectado al taller en tiempo real.
      </p>

      <div className="flex flex-col xl:flex-row gap-3 overflow-x-auto pb-2">
        {COLS.map((col) => (
          <div key={col.status} className="flex-1 min-w-[260px]">
            <div
              className="text-center text-sm font-bold py-2 rounded-t-xl border-b-4"
              style={{ borderColor: col.color, color: col.color }}
            >
              {col.title}
            </div>
            <div className="bg-black/25 min-h-[320px] p-2 rounded-b-xl border border-white/10">
              <AnimatePresence>
                {ordenes
                  .filter((o) => o.status === col.status)
                  .map((o) => (
                    <Ticket key={o.id} o={o} />
                  ))}
              </AnimatePresence>
              {ordenes.filter((o) => o.status === col.status).length === 0 && (
                <p className="text-center text-slate-500 p-6 text-sm">Sin órdenes</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {drawerOrden && drawerCliente && drawerVeh && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70"
              aria-label="Cerrar"
              onClick={() => setSelectedId(null)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-lg border-l border-white/10 bg-[#0f172a] shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur">
                <p className="font-semibold">Orden {drawerOrden.id}</p>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-white/10"
                  onClick={() => setSelectedId(null)}
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4 text-sm">
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Vehículo</h3>
                  <p>
                    {drawerVeh.emoji} {drawerVeh.marca} {drawerVeh.modelo} {drawerVeh.año} — {drawerVeh.placa}
                  </p>
                  <p className="text-slate-400">Color {drawerVeh.color} · Km {drawerVeh.kilometraje.toLocaleString('es-MX')}</p>
                </section>
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Cliente</h3>
                  <p>{drawerCliente.nombre}</p>
                  <p className="text-slate-400">{drawerCliente.telefono}</p>
                </section>
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Problema</h3>
                  <p>{drawerOrden.descripcionProblema}</p>
                </section>
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Diagnóstico</h3>
                  <p>{drawerOrden.diagnostico}</p>
                </section>
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Trabajos</h3>
                  <ul className="list-disc pl-4 space-y-1">
                    {drawerOrden.trabajosRealizados.map((t, i) => (
                      <li key={i}>
                        {t.descripcion} — {t.tiempo}h — {fmt(t.costo)}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Refacciones</h3>
                  <ul className="space-y-1">
                    {drawerOrden.refacciones.map((r, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>
                          {r.nombre} ×{r.cantidad}
                        </span>
                        <span>{fmt(r.total)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="border border-white/10 rounded-lg p-3 space-y-1">
                  <p>Mano de obra: {fmt(drawerOrden.subtotalManoObra)}</p>
                  <p>Refacciones: {fmt(drawerOrden.subtotalRefacciones)}</p>
                  <p className="font-bold text-lg text-emerald-400">Total: {fmt(drawerOrden.total)}</p>
                </section>
                <div className="flex flex-col gap-2">
                  {nextStatus(drawerOrden.status) && (
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl font-semibold bg-slate-600 hover:bg-slate-500"
                      onClick={() => {
                        const n = nextStatus(drawerOrden.status);
                        if (n) updateOrdenStatus(drawerOrden.id, n);
                      }}
                    >
                      Cambiar a: {nextStatus(drawerOrden.status)!.replace(/_/g, ' ')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15"
                    onClick={() => void presupuestoDesdeOrden()}
                  >
                    Generar presupuesto PDF
                  </button>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium"
                  >
                    Notificar cliente WA
                  </a>
                  <button
                    type="button"
                    className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15"
                    onClick={() => void ordenSalidaPdf()}
                  >
                    Generar orden de salida PDF
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
