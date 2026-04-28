'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DollarSign, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type Cliente = {
  _id: string;
  negocio: string;
  plan: string;
  moneda: string;
  proximoPago: string;
  status: string;
  stripeCustomerId: string;
};

type Gasto = { nombre: string; usd: number };

const GASTOS_DEFAULT: Gasto[] = [
  { nombre: 'Render web',  usd: 25   },
  { nombre: 'Render worker', usd: 25 },
  { nombre: 'MongoDB',     usd: 9    },
  { nombre: 'Gemini API',  usd: 15   },
  { nombre: 'Zapier',      usd: 20   },
  { nombre: 'Dominio',     usd: 1.25 },
];

const PLAN_MRR: Record<string, number> = {
  starter: 25, profesional: 35, premium: 55,
};

const METAS = [500, 1000, 3000, 5000];

function kpi(label: string, value: string | number, icon: React.ReactNode, color = '#22c55e') {
  return (
    <div className="rounded-xl border p-4" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs" style={{ color: '#555' }}>{label}</p>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  );
}

export default function FinanzasPage() {
  const [clientes,   setClientes]   = useState<Cliente[]>([]);
  const [gastos,     setGastos]     = useState<Gasto[]>(GASTOS_DEFAULT);
  const [tcambio,    setTcambio]    = useState(18.5);
  const [meta,       setMeta]       = useState(1000);
  const [loading,    setLoading]    = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/dashboard/finanzas');
      if (r.ok) {
        const d = await r.json();
        if (d.clientes) setClientes(d.clientes);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activos     = clientes.filter(c => c.status === 'activo');
  const suspendidos = clientes.filter(c => c.status === 'suspendido');
  const cancelados  = clientes.filter(c => c.status === 'cancelado');

  const mrrUSD = activos.reduce((sum, c) => sum + (PLAN_MRR[c.plan] ?? 25), 0);
  const totalGastosUSD = gastos.reduce((s, g) => s + g.usd, 0);
  const utilidadUSD    = mrrUSD - totalGastosUSD;
  const mrrMXN         = mrrUSD * tcambio;

  // Break-even por plan
  const clientesNecesarios = (planKey: string) => {
    const precio = PLAN_MRR[planKey] ?? 25;
    return Math.ceil(totalGastosUSD / precio);
  };

  // Proyección 12 meses (tasa de adquisición = clientes/mes actual)
  const tasaMensual = Math.max(activos.length / 3, 0.5);
  const proyeccion = Array.from({ length: 12 }, (_, i) => {
    const mes = new Date();
    mes.setMonth(mes.getMonth() + i + 1);
    const cltsProyectados = Math.round(activos.length + tasaMensual * (i + 1));
    const mrr = cltsProyectados * (mrrUSD / Math.max(activos.length, 1));
    return {
      mes:     mes.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      ingresos: Math.round(mrr),
    };
  });

  const progresoPct = Math.min((mrrUSD / meta) * 100, 100);

  const card = { background: '#0d0d0d', borderColor: '#1e1e1e' };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
        <h1 className="text-lg font-bold text-white">Finanzas</h1>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpi('MRR (USD)',    `$${mrrUSD.toLocaleString()}`,    <TrendingUp className="w-4 h-4" />)}
        {kpi('MRR (MXN)',   `$${Math.round(mrrMXN).toLocaleString()}`, <DollarSign className="w-4 h-4" />, '#38bdf8')}
        {kpi('Activos',     activos.length,                   <CheckCircle className="w-4 h-4" />)}
        {kpi('Suspendidos', suspendidos.length,               <AlertTriangle className="w-4 h-4" />, '#f59e0b')}
      </div>

      {/* ── Gastos fijos ── */}
      <div className="rounded-2xl border p-5" style={card}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Gastos fijos mensuales</p>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#555' }}>TC:</span>
            <input
              type="number"
              value={tcambio}
              onChange={e => setTcambio(Number(e.target.value))}
              className="w-16 text-xs text-center rounded-lg px-2 py-1"
              style={{ background: '#111', border: '1px solid #2a2a2a', color: '#fff', outline: 'none' }}
            />
            <span className="text-xs" style={{ color: '#555' }}>MXN/USD</span>
          </div>
        </div>
        <div className="space-y-2">
          {gastos.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={g.nombre}
                onChange={e => setGastos(prev => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                className="flex-1 text-xs rounded-lg px-3 py-1.5"
                style={{ background: '#111', border: '1px solid #1e1e1e', color: '#ccc', outline: 'none' }}
              />
              <span className="text-xs" style={{ color: '#555' }}>$</span>
              <input
                type="number"
                value={g.usd}
                onChange={e => setGastos(prev => prev.map((x, j) => j === i ? { ...x, usd: Number(e.target.value) } : x))}
                className="w-16 text-xs text-right rounded-lg px-2 py-1.5"
                style={{ background: '#111', border: '1px solid #1e1e1e', color: '#fff', outline: 'none' }}
              />
              <span className="text-xs" style={{ color: '#555' }}>USD</span>
              <button onClick={() => setGastos(prev => prev.filter((_, j) => j !== i))} style={{ color: '#333', fontSize: 14 }}>✕</button>
            </div>
          ))}
          <button
            onClick={() => setGastos(prev => [...prev, { nombre: '', usd: 0 }])}
            className="text-xs mt-1"
            style={{ color: '#22c55e' }}
          >
            + Agregar gasto
          </button>
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between" style={{ borderColor: '#1e1e1e' }}>
          <span className="text-xs font-bold" style={{ color: '#aaa' }}>Total USD</span>
          <span className="text-sm font-extrabold" style={{ color: '#ef4444' }}>${totalGastosUSD.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: '#555' }}>Total MXN (~)</span>
          <span className="text-xs" style={{ color: '#888' }}>${(totalGastosUSD * tcambio).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs font-bold" style={{ color: '#aaa' }}>Utilidad neta</span>
          <span className="text-sm font-extrabold" style={{ color: utilidadUSD >= 0 ? '#22c55e' : '#ef4444' }}>
            ${utilidadUSD.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* ── Punto de equilibrio ── */}
      <div className="rounded-2xl border p-5" style={card}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Punto de equilibrio</p>
          <select
            value={meta}
            onChange={e => setMeta(Number(e.target.value))}
            className="text-xs rounded-lg px-2 py-1"
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#ccc', outline: 'none' }}
          >
            {METAS.map(m => <option key={m} value={m}>${m} USD/mes</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {Object.entries(PLAN_MRR).map(([planKey, precio]) => (
            <div key={planKey}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#888' }} className="capitalize">{planKey}</span>
                <span style={{ color: '#555' }}>{clientesNecesarios(planKey)} clientes para breakeven</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: '#888' }}>Progreso hacia meta ${meta} USD</span>
            <span style={{ color: '#22c55e' }}>{progresoPct.toFixed(0)}%</span>
          </div>
          <div className="rounded-full h-3 overflow-hidden" style={{ background: '#111' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progresoPct}%`, background: 'linear-gradient(90deg, #22c55e, #4ade80)' }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: '#444' }}>
            <span>$0</span>
            <span>${meta}</span>
          </div>
        </div>
      </div>

      {/* ── Proyección 12 meses ── */}
      <div className="rounded-2xl border p-5" style={card}>
        <p className="text-sm font-semibold text-white mb-4">Proyección 12 meses (USD)</p>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={proyeccion} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="mes" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: 8 }}
                labelStyle={{ color: '#888', fontSize: 11 }}
                itemStyle={{ color: '#22c55e', fontSize: 12 }}
                formatter={(v: number) => [`$${v} USD`, 'MRR']}
              />
              <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] mt-2" style={{ color: '#333' }}>
          Proyección basada en tasa de adquisición actual ({tasaMensual.toFixed(1)} clientes/mes)
        </p>
      </div>

      {/* ── Lista de clientes ── */}
      <div className="rounded-2xl border p-5" style={card}>
        <p className="text-sm font-semibold text-white mb-4">
          Clientes ({clientes.length})
          {loading && <span className="text-xs ml-2" style={{ color: '#555' }}>cargando…</span>}
        </p>
        {clientes.length === 0 && !loading && (
          <p className="text-xs text-center py-8" style={{ color: '#333' }}>Sin clientes aún</p>
        )}
        <div className="space-y-2">
          {clientes.map((c) => {
            const statusColor = c.status === 'activo' ? '#22c55e' : c.status === 'suspendido' ? '#f59e0b' : '#ef4444';
            return (
              <div key={c._id} className="flex items-center justify-between rounded-xl px-3 py-2.5 border" style={{ background: '#111', borderColor: '#1e1e1e' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{c.negocio}</p>
                  <p className="text-[10px]" style={{ color: '#555' }}>
                    Plan {c.plan} · {c.moneda?.toUpperCase()} · Próximo pago: {c.proximoPago ? new Date(c.proximoPago).toLocaleDateString('es-MX') : '-'}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-3" style={{ background: `${statusColor}18`, color: statusColor }}>
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
