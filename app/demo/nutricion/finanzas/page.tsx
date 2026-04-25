'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { useNutricionTheme } from '../nutricion-theme-context';

const ACCENT = '#16a34a';
const DEMO_PATIENT = 'ana-garcia';
const DEMO_NOMBRE  = 'Ana García';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Pago {
  _id:      string;
  concepto: string;
  monto:    number;
  fecha:    string;
  status:   'pagado' | 'pendiente';
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Demo seed ────────────────────────────────────────────────────────────────

const DEMO_PAGOS: Pago[] = [
  { _id: 'd1', concepto: 'Consulta inicial', monto: 4500,  fecha: '2026-01-10', status: 'pagado'   },
  { _id: 'd2', concepto: 'Plan mensual feb', monto: 8000,  fecha: '2026-02-01', status: 'pagado'   },
  { _id: 'd3', concepto: 'Consulta seguimiento', monto: 3500, fecha: '2026-02-15', status: 'pagado' },
  { _id: 'd4', concepto: 'Plan mensual mar', monto: 8000,  fecha: '2026-03-01', status: 'pagado'   },
  { _id: 'd5', concepto: 'Consulta seguimiento', monto: 3500, fecha: '2026-03-20', status: 'pagado' },
  { _id: 'd6', concepto: 'Plan mensual abr', monto: 8500,  fecha: '2026-04-01', status: 'pendiente' },
  { _id: 'd7', concepto: 'Consulta seguimiento', monto: 3500, fecha: '2026-04-22', status: 'pendiente' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FinanzasPage() {
  const { colors } = useNutricionTheme();
  const [pagos, setPagos]       = useState<Pago[]>(DEMO_PAGOS);
  const [showForm, setShowForm] = useState(false);
  const [concepto, setConcepto] = useState('Consulta de seguimiento');
  const [monto,    setMonto]    = useState('3500');
  const [fecha,    setFecha]    = useState(new Date().toISOString().slice(0, 10));
  const [statusNew, setStatusNew] = useState<'pagado' | 'pendiente'>('pendiente');
  const [saving,   setSaving]   = useState(false);
  const [loadedFromDB, setLoadedFromDB] = useState(false);

  const fetchPagos = useCallback(async () => {
    try {
      const r = await fetch(`/api/demo/nutricion/finanzas?patientId=${DEMO_PATIENT}`);
      const d = await r.json();
      if (d.payments && d.payments.length > 0) {
        setPagos(d.payments.map((p: Record<string, unknown>) => ({
          _id: String(p._id), concepto: String(p.concepto), monto: Number(p.monto),
          fecha: new Date(p.fecha as string).toISOString().slice(0, 10),
          status: p.status as 'pagado' | 'pendiente',
        })));
        setLoadedFromDB(true);
      }
    } catch { /* use demo data */ }
  }, []);

  useEffect(() => { fetchPagos(); }, [fetchPagos]);

  const addPago = async () => {
    if (!monto || !concepto) return;
    setSaving(true);
    try {
      const r = await fetch('/api/demo/nutricion/finanzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: DEMO_PATIENT, concepto, monto: parseFloat(monto), fecha, status: statusNew }),
      });
      const d = await r.json();
      const nuevo: Pago = { _id: d.id || `local_${Date.now()}`, concepto, monto: parseFloat(monto), fecha, status: statusNew };
      setPagos((prev) => [nuevo, ...prev]);
      setShowForm(false); setMonto('3500'); setConcepto('Consulta de seguimiento');
    } finally { setSaving(false); }
  };

  const marcarPagado = async (id: string) => {
    if (!id.startsWith('d')) {
      await fetch('/api/demo/nutricion/finanzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'marcar_pagado', id }),
      }).catch(() => {});
    }
    setPagos((prev) => prev.map((p) => p._id === id ? { ...p, status: 'pagado' } : p));
  };

  // KPIs
  const now   = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const pagosEste = pagos.filter((p) => p.fecha.startsWith(thisMonth));
  const ingresosMes     = pagosEste.filter((p) => p.status === 'pagado').reduce((a, p) => a + p.monto, 0);
  const pendientesMes   = pagosEste.filter((p) => p.status === 'pendiente').reduce((a, p) => a + p.monto, 0);
  const totalPagado     = pagos.filter((p) => p.status === 'pagado').reduce((a, p) => a + p.monto, 0);
  const totalPendiente  = pagos.filter((p) => p.status === 'pendiente').reduce((a, p) => a + p.monto, 0);

  const CONCEPTOS = [
    'Consulta inicial', 'Consulta de seguimiento', 'Plan mensual',
    'Consulta de urgencia', 'Análisis de composición corporal', 'Otro',
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#f0fdf4' }}>
          <DollarSign className="w-7 h-7" style={{ color: ACCENT }} />
        </div>
        <div>
          <h2 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Finanzas</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {DEMO_NOMBRE} · {loadedFromDB ? 'Datos de MongoDB' : 'Datos demo'}
          </p>
        </div>
        <button onClick={() => setShowForm((p) => !p)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shrink-0"
          style={{ background: ACCENT, color: '#fff' }}>
          <Plus className="w-4 h-4" />
          Registrar pago
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Ingresos este mes', value: ingresosMes,    color: ACCENT,    sub: `${pagosEste.filter((p) => p.status === 'pagado').length} consultas` },
          { label: 'Pendiente este mes', value: pendientesMes, color: '#f59e0b', sub: `${pagosEste.filter((p) => p.status === 'pendiente').length} sin cobrar` },
          { label: 'Total cobrado',      value: totalPagado,   color: ACCENT,    sub: 'Acumulado' },
          { label: 'Total pendiente',    value: totalPendiente, color: '#ef4444', sub: 'Por cobrar' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <p className="text-xs" style={{ color: colors.textMuted }}>{label}</p>
            <p className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color }}>{fmt(value)}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Alerta saldo pendiente */}
      {totalPendiente > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#fffbeb', border: '1px solid #f59e0b55' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Saldo pendiente de cobro</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {DEMO_NOMBRE} tiene {fmt(totalPendiente)} pendientes de pago.
              {pagos.filter((p) => p.status === 'pendiente').length} consulta{pagos.filter((p) => p.status === 'pendiente').length > 1 ? 's' : ''} sin abonar.
            </p>
          </div>
        </div>
      )}

      {/* Form nuevo pago */}
      {showForm && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: colors.cardBg, border: `1px solid ${ACCENT}55` }}>
          <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Nuevo registro de pago</p>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Concepto</label>
            <select value={concepto} onChange={(e) => setConcepto(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }}>
              {CONCEPTOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Monto (ARS)</label>
              <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="3500"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>Estado del pago</p>
            <div className="flex gap-3">
              {(['pagado', 'pendiente'] as const).map((s) => (
                <button key={s} onClick={() => setStatusNew(s)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border capitalize"
                  style={statusNew === s
                    ? { background: s === 'pagado' ? ACCENT : '#f59e0b', color: '#fff', border: 'none' }
                    : { background: colors.inputBg, color: colors.textSecondary, border: `1px solid ${colors.border}` }
                  }>{s === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: colors.inputBg, color: colors.textSecondary, border: `1px solid ${colors.border}` }}>
              Cancelar
            </button>
            <button onClick={addPago} disabled={saving || !monto || !concepto}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: ACCENT, color: '#fff' }}>
              {saving ? 'Guardando…' : 'Registrar pago'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla de pagos */}
      <div className="rounded-2xl overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.divider }}>
          <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Estado de cuenta · {DEMO_NOMBRE}</p>
        </div>

        <div className="divide-y" style={{ borderColor: colors.divider }}>
          {pagos.map((pago) => (
            <div key={pago._id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{pago.concepto}</p>
                <p className="text-xs" style={{ color: colors.textMuted }}>{fmtFecha(pago.fecha)}</p>
              </div>
              <p className="text-base font-bold tabular-nums shrink-0" style={{ color: pago.status === 'pagado' ? ACCENT : '#f59e0b' }}>
                {fmt(pago.monto)}
              </p>
              {pago.status === 'pagado' ? (
                <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
              ) : (
                <button onClick={() => marcarPagado(pago._id)}
                  className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: '#fffbeb', color: '#f59e0b', border: '1px solid #f59e0b55' }}>
                  Marcar pagado
                </button>
              )}
            </div>
          ))}
          {pagos.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: colors.textMuted }}>Sin pagos registrados</p>
          )}
        </div>
      </div>
    </div>
  );
}
