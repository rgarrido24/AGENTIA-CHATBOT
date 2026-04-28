'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

type Cliente = {
  _id: string;
  nombre: string;
  negocio: string;
  email: string;
  telefono: string;
  plan: string;
  moneda: string;
  proximoPago: string;
  status: 'activo' | 'suspendido' | 'cancelado';
  stripeCustomerId?: string;
  createdAt: string;
};

const STATUS_CONFIG = {
  activo:     { label: 'Activo',     color: '#22c55e', icon: CheckCircle },
  suspendido: { label: 'Suspendido', color: '#f59e0b', icon: AlertTriangle },
  cancelado:  { label: 'Cancelado',  color: '#ef4444', icon: XCircle },
};

export default function ClientesPage() {
  const [clientes, setClientes]   = useState<Cliente[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [search,   setSearch]     = useState('');
  const [filter,   setFilter]     = useState<'all' | 'activo' | 'suspendido' | 'cancelado'>('all');

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/dashboard/clientes');
      if (r.ok) {
        const d = await r.json();
        setClientes(d.clientes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  async function changeStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await fetch('/api/dashboard/clientes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setClientes(prev =>
        prev.map(c => c._id === id ? { ...c, status: status as Cliente['status'] } : c)
      );
    } finally {
      setUpdating(null);
    }
  }

  const filtered = clientes.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.negocio?.toLowerCase().includes(q) ||
        c.nombre?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const card = { background: '#0d0d0d', borderColor: '#1e1e1e' };
  const counts = {
    activo:     clientes.filter(c => c.status === 'activo').length,
    suspendido: clientes.filter(c => c.status === 'suspendido').length,
    cancelado:  clientes.filter(c => c.status === 'cancelado').length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5" style={{ color: '#22c55e' }} />
          <h1 className="text-lg font-bold text-white">Clientes Agentia</h1>
          {loading && <span className="text-xs" style={{ color: '#555' }}>cargando…</span>}
        </div>
        <button
          onClick={fetchClientes}
          className="p-2 rounded-lg transition-colors"
          style={{ color: '#555' }}
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG['activo']][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="rounded-xl border p-4" style={card}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: '#555' }}>{cfg.label}</span>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <p className="text-2xl font-extrabold" style={{ color: cfg.color }}>
                {counts[key as keyof typeof counts]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre, negocio o email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm rounded-xl px-4 py-2.5"
          style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', color: '#fff', outline: 'none' }}
        />
        <div className="flex gap-2">
          {(['all', 'activo', 'suspendido', 'cancelado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-2 rounded-lg transition-all"
              style={{
                background: filter === f ? '#1e1e1e' : 'transparent',
                border: `1px solid ${filter === f ? '#333' : '#1e1e1e'}`,
                color: filter === f ? '#fff' : '#555',
              }}
            >
              {f === 'all' ? 'Todos' : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border overflow-hidden" style={card}>
        {filtered.length === 0 && !loading && (
          <p className="text-xs text-center py-10" style={{ color: '#333' }}>
            {search || filter !== 'all' ? 'Sin resultados' : 'Sin clientes aún'}
          </p>
        )}
        <div className="divide-y" style={{ borderColor: '#1e1e1e' }}>
          {filtered.map(c => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.cancelado;
            const Icon = cfg.icon;
            return (
              <div key={c._id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{c.negocio || c.nombre}</p>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      style={{ background: `${cfg.color}18`, color: cfg.color }}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                    {c.email && <span>{c.email} · </span>}
                    Plan {c.plan?.toLowerCase()} · {c.moneda?.toUpperCase()}
                    {c.proximoPago && (
                      <span> · Pago: {new Date(c.proximoPago).toLocaleDateString('es-MX')}</span>
                    )}
                  </p>
                  {c.stripeCustomerId && (
                    <p className="text-[10px] mt-0.5" style={{ color: '#333' }}>
                      Stripe: {c.stripeCustomerId}
                    </p>
                  )}
                </div>
                <select
                  value={c.status}
                  disabled={updating === c._id}
                  onChange={e => changeStatus(c._id, e.target.value)}
                  className="text-xs rounded-lg px-2 py-1.5 shrink-0"
                  style={{ background: '#111', border: '1px solid #2a2a2a', color: '#ccc', outline: 'none' }}
                >
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-center" style={{ color: '#333' }}>
        {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} en total
      </p>
    </div>
  );
}
