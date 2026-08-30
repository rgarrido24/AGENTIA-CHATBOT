'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Car, ClipboardList, DollarSign, Wrench } from 'lucide-react';
import { AnimatedNumber } from '@/app/demo/cobranza/components/AnimatedNumber';
import {
  BRAND_TALLER,
  diasDesde,
  getVehiculo,
  ingresosDelDia,
  MOCK_ORDENES,
  type StatusOrden,
  type TipoOrden,
} from '@/lib/mock-data-taller';
import { useTaller } from './taller-context';
import { useAnalytics } from '@/src/lib/analytics-client';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const COL_STATUS: Record<StatusOrden, string> = {
  recibido: '#64748b',
  diagnostico: '#3b82f6',
  en_reparacion: '#f59e0b',
  listo: '#22c55e',
  entregado: '#94a3b8',
};

const STATUS_LABEL: Record<StatusOrden, string> = {
  recibido: 'Recibido',
  diagnostico: 'Diagnóstico',
  en_reparacion: 'En reparación',
  listo: 'Listo',
  entregado: 'Entregado',
};

export default function TallerDashboardPage() {
  useAnalytics('taller');
  const { ordenes, movimientosCaja } = useTaller();
  const ingresos = ingresosDelDia(movimientosCaja);
  const activas = ordenes.filter((o) => o.status !== 'entregado');
  const vehiculosEnTaller = new Set(activas.map((o) => o.vehiculoId)).size;
  const listos = ordenes.filter((o) => o.status === 'listo').length;
  const alertas = ordenes.filter(
    (o) => o.status !== 'entregado' && diasDesde(o.fechaIngreso) > 3
  );

  const kanbanCounts: { status: StatusOrden; count: number }[] = (
    ['recibido', 'diagnostico', 'en_reparacion', 'listo', 'entregado'] as const
  ).map((status) => ({
    status,
    count: ordenes.filter((o) => o.status === status).length,
  }));

  const ingresosPorTipo: Record<TipoOrden, number> = {
    Mantenimiento: 0,
    Reparación: 0,
    Diagnóstico: 0,
    Hojalatería: 0,
    Eléctrico: 0,
  };
  for (const o of MOCK_ORDENES) {
    if (o.status === 'entregado') ingresosPorTipo[o.tipo] += o.total;
  }
  const chartTipo = (Object.keys(ingresosPorTipo) as TipoOrden[]).map((k) => ({
    name: k,
    value: ingresosPorTipo[k],
  }));

  const tecnicos = ['Miguel Ángel', 'Roberto', 'Jesús', 'Armando'];
  const porTecnico = tecnicos.map((nombre) => ({
    name: nombre.split(' ')[0] ?? nombre,
    ordenes: ordenes.filter((o) => o.tecnico === nombre).length,
  }));

  const asignacion = tecnicos.map((nombre) => {
    const cur = activas.find((o) => o.tecnico === nombre);
    const v = cur ? getVehiculo(cur.vehiculoId) : undefined;
    return { nombre, orden: cur, emoji: v?.emoji ?? '' };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <p className="text-slate-500 text-sm">
        Panel del día — {BRAND_TALLER.corto} · {activas.length} órdenes activas
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Vehículos en taller hoy',
            value: vehiculosEnTaller,
            icon: Car,
            decimals: 0,
            color: 'text-slate-300',
          },
          {
            label: 'Órdenes activas',
            value: activas.length,
            icon: ClipboardList,
            decimals: 0,
            color: 'text-sky-400',
          },
          {
            label: 'Ingresos del día',
            value: ingresos,
            icon: DollarSign,
            format: fmt,
            color: 'text-emerald-400',
          },
          {
            label: 'Listas para entregar',
            value: listos,
            icon: Wrench,
            decimals: 0,
            color: listos > 0 ? 'text-red-400' : 'text-slate-400',
            badge: listos > 0,
          },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 relative"
          >
            {'badge' in k && k.badge && (
              <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                Urgente
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm">{k.label}</span>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${k.color}`}>
              {'format' in k && k.format ? (
                <AnimatedNumber value={k.value} format={k.format} />
              ) : (
                <AnimatedNumber value={k.value} decimals={'decimals' in k ? k.decimals : 0} />
              )}
            </p>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-white">Kanban — resumen</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {kanbanCounts.map((k) => (
            <Link
              key={k.status}
              href="/demo/taller/ordenes"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center hover:border-slate-500/50 transition-colors"
            >
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{STATUS_LABEL[k.status]}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: COL_STATUS[k.status] }}>
                {k.count}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold mb-3">Técnicos — disponibilidad</h3>
          <ul className="space-y-2 text-sm">
            {asignacion.map(({ nombre, orden, emoji }) => (
              <li
                key={nombre}
                className="flex justify-between gap-2 border-b border-white/5 pb-2"
              >
                <span className="text-slate-300">{nombre}</span>
                <span className="text-slate-500 text-right truncate max-w-[60%]">
                  {orden
                    ? `${emoji} Orden ${orden.id} · ${orden.tipo}`
                    : 'Disponible'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Sin movimiento &gt; 3 días
          </h3>
          {alertas.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin alertas.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alertas.map((o) => (
                <li key={o.id} className="text-red-300">
                  Orden {o.id} — {diasDesde(o.fechaIngreso)} días en taller
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-80">
          <h3 className="text-sm font-semibold mb-2">Ingresos por tipo de servicio (demo)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartTipo}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name }: { name: string }) => name}
              >
                {chartTipo.map((_, i) => (
                  <Cell key={i} fill={['#475569', '#64748b', '#94a3b8', '#0ea5e9', '#f59e0b'][i % 5]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-80">
          <h3 className="text-sm font-semibold mb-2">Órdenes por técnico</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porTecnico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="ordenes" fill="#475569" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
