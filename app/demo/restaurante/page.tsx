'use client';

import { motion } from 'framer-motion';
import PhoneMockup from '@/components/PhoneMockup';
import Link from 'next/link';
import { Coffee, DollarSign, ShoppingBag, Trophy } from 'lucide-react';
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
import { AnimatedNumber } from '@/app/demo/cobranza/components/AnimatedNumber';
import {
  BRAND,
  TOP_PRODUCTOS_HOY,
  VENTAS_POR_CATEGORIA,
  VENTAS_POR_HORA,
  ingresosDelDia,
  mesaMasConsumo,
  ordenesCompletadas,
} from '@/lib/mock-data-restaurante';
import { useRestaurante } from './restaurante-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function RestauranteDashboardPage() {
  const { mesas, ordenes, movimientosCaja } = useRestaurante();
  const ventas = ingresosDelDia(movimientosCaja);
  const completadas = ordenesCompletadas(ordenes);
  const ticket = completadas > 0 ? ventas / completadas : 0;
  const topMesa = mesaMasConsumo(mesas);

  const mesaBadge = (s: (typeof mesas)[0]['status']) => {
    const map = {
      disponible: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      ocupada: 'bg-red-500/20 text-red-300 border-red-500/40',
      cuenta_pedida: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
      reservada: 'bg-blue-500/20 text-blue-200 border-blue-500/40',
    };
    const labels = {
      disponible: 'Disponible',
      ocupada: 'Ocupada',
      cuenta_pedida: 'Cuenta pedida',
      reservada: 'Reservada',
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[s]}`}>● {labels[s]}</span>
    );
  };

  return (
    <>
      {/* Hero: PhoneMockup */}
      <section className="max-w-7xl mx-auto mb-12 flex flex-col lg:flex-row items-center gap-10 px-2">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400">Demo en vivo · Restaurante</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Pedidos y reservas<br />
            <span className="text-red-400">por WhatsApp automático</span>
          </h2>
          <p className="text-slate-400 text-base max-w-md">
            El bot toma pedidos a domicilio, informa el menú y promos, y confirma órdenes — sin que nadie conteste.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            {['Pedidos a domicilio paso a paso', 'Menú completo con precios', 'Promos del día en tiempo real'].map(t => (
              <li key={t} className="flex items-center gap-2"><span className="text-red-400">✓</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="flex-shrink-0">
          <PhoneMockup
            businessName="La Séptima Bar & Kitchen"
            businessEmoji="🍔"
            accentColor="#ef4444"
            apiRoute="/api/demo/restaurante/chat"
            initialMessage="¡Hola! 🍔 Bienvenido a La Séptima. ¿Quieres ver el menú, hacer un pedido o conocer nuestras promos del día?"
            suggestedChips={['🍔 Ver menú', '🛵 Pedir a domicilio', '🍹 Promos del día', '⏰ Horarios']}
          />
        </div>
      </section>

      {/* Dashboard */}
      <div id="panel-admin" className="space-y-8 max-w-7xl mx-auto">
      <p className="text-slate-500 text-sm dark:text-slate-400">
        Panel del día — {BRAND.corto} · {ordenes.filter((o) => ['nueva', 'en_preparacion', 'lista'].includes(o.status)).length}{' '}
        órdenes activas en cocina/bar
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Ventas del día',
            value: ventas,
            icon: DollarSign,
            format: fmt,
            color: 'text-red-400',
          },
          {
            label: 'Órdenes completadas',
            value: completadas,
            icon: ShoppingBag,
            decimals: 0,
            color: 'text-amber-400',
          },
          {
            label: 'Mesa con más consumo',
            value: topMesa?.consumoActual ?? 0,
            icon: Trophy,
            format: fmt,
            color: 'text-emerald-400',
            sub: topMesa ? topMesa.nombre : '—',
          },
          {
            label: 'Ticket promedio',
            value: ticket,
            icon: Coffee,
            format: fmt,
            color: 'text-sky-400',
          },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] dark:bg-white/[0.03] p-5"
          >
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
            {'sub' in k && k.sub && <p className="text-xs text-slate-500 mt-1">{k.sub}</p>}
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-white">Estado de mesas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {mesas.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col gap-2"
            >
              <p className="text-xs font-bold text-center text-white">{m.nombre}</p>
              <div className="flex justify-center">{mesaBadge(m.status)}</div>
              <p className="text-center text-[11px] text-slate-500">{m.capacidad} pers.</p>
              <p className="text-center text-xs text-slate-400">
                {m.tiempoOcupada != null ? `${m.tiempoOcupada} min` : '—'}
              </p>
              <p className="text-center text-sm font-semibold text-amber-300">
                {m.consumoActual ? fmt(m.consumoActual) : '—'}
              </p>
              <Link
                href="/demo/restaurante/menu"
                className="text-center text-[11px] text-red-400 hover:underline"
              >
                Ver orden
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[300px]">
          <h3 className="text-sm font-semibold mb-2">Ventas por hora</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={VENTAS_POR_HORA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="hora" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
                formatter={(v: number) => [fmt(v), 'Venta']}
              />
              <Bar dataKey="venta" fill="#dc2626" radius={[4, 4, 0, 0]} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[300px]">
          <h3 className="text-sm font-semibold mb-2">Ventas por categoría</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={VENTAS_POR_CATEGORIA}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {VENTAS_POR_CATEGORIA.map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
          <h3 className="text-sm font-semibold">Productos más vendidos hoy</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-white/10">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Monto</th>
            </tr>
          </thead>
          <tbody>
            {TOP_PRODUCTOS_HOY.map((r) => (
              <tr key={r.rank} className="border-b border-white/5">
                <td className="px-4 py-2 text-amber-400 font-bold">{r.rank}</td>
                <td className="px-4 py-2 text-white">{r.nombre}</td>
                <td className="px-4 py-2 tabular-nums">{fmt(r.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
