'use client';

import { useMemo, useState } from 'react';
import {
  MOCK_CLIENTES,
  MOCK_VEHICULOS,
  getVehiculo,
} from '@/lib/mock-data-taller';
import { generarPresupuestoPdf } from '@/lib/taller-pdf';

type Trabajo = { descripcion: string; horas: number; costo: number };
type Ref = { nombre: string; cantidad: number; pu: number };

export default function PresupuestosPage() {
  const [vehiculoId, setVehiculoId] = useState(MOCK_VEHICULOS[0]?.id ?? '');
  const [problema, setProblema] = useState('Ruido al frenar en frío');
  const [trabajos, setTrabajos] = useState<Trabajo[]>([
    { descripcion: 'Cambio de aceite y filtro', horas: 0.5, costo: 450 },
  ]);
  const [refs, setRefs] = useState<Ref[]>([{ nombre: 'Aceite 5W30 1L', cantidad: 4, pu: 85 }]);
  const [notas, setNotas] = useState('');
  const [validoDias, setValidoDias] = useState(7);
  const [iva, setIva] = useState(true);
  const [q, setQ] = useState('');

  const v = getVehiculo(vehiculoId);
  const c = v ? MOCK_CLIENTES.find((x) => x.id === v.propietarioId) : undefined;

  const sugerencias = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return MOCK_VEHICULOS.slice(0, 8);
    return MOCK_VEHICULOS.filter((veh) => {
      const cl = MOCK_CLIENTES.find((x) => x.id === veh.propietarioId);
      return `${veh.placa} ${veh.marca} ${cl?.nombre ?? ''}`.toLowerCase().includes(t);
    }).slice(0, 12);
  }, [q]);

  const manoObra = trabajos.reduce((s, t) => s + t.costo, 0);
  const subRefs = refs.reduce((s, r) => s + r.cantidad * r.pu, 0);
  const sub = manoObra + subRefs;
  const ivaMonto = iva ? sub * 0.16 : 0;
  const total = sub + ivaMonto;

  const addTrabajo = () => {
    setTrabajos((x) => [...x, { descripcion: '', horas: 1, costo: 0 }]);
  };
  const addRef = () => {
    setRefs((x) => [...x, { nombre: '', cantidad: 1, pu: 0 }]);
  };

  const tiempoTotal = useMemo(() => {
    const h = trabajos.reduce((s, t) => s + t.horas, 0);
    return `${h} h`;
  }, [trabajos]);

  const generar = async () => {
    if (!v || !c) return;
    const folio = `P-${Math.floor(1000 + Math.random() * 8999)}`;
    const hoy = new Date();
    const hasta = new Date(hoy);
    hasta.setDate(hasta.getDate() + validoDias);
    await generarPresupuestoPdf({
      folio,
      fecha: hoy.toLocaleDateString('es-MX'),
      validoHasta: hasta.toLocaleDateString('es-MX'),
      cliente: { nombre: c.nombre, telefono: c.telefono },
      vehiculo: {
        marca: v.marca,
        modelo: v.modelo,
        año: v.año,
        placa: v.placa,
        color: v.color,
        km: v.kilometraje,
      },
      problema,
      trabajos: trabajos.filter((t) => t.descripcion.trim()),
      refacciones: refs
        .filter((r) => r.nombre.trim())
        .map((r) => ({
          nombre: r.nombre,
          cantidad: r.cantidad,
          pu: r.pu,
          total: r.cantidad * r.pu,
        })),
      notas,
      tiempoEstimadoTotal: tiempoTotal,
      manoObra,
      subtotalRefacciones: subRefs,
      ivaPct: 16,
      incluirIva: iva,
    });
  };

  const waPresupuesto = () => {
    if (!v || !c) return '#';
    const txt = `Hola ${c.nombre}, le enviamos el presupuesto AutoPro para su ${v.marca} ${v.modelo} (${v.placa}). ¿Lo revisamos por teléfono?`;
    const num = c.telefono.replace(/\D/g, '').replace(/^52/, '');
    return `https://wa.me/52${num}?text=${encodeURIComponent(txt)}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <p className="text-slate-500 text-sm">
        Presupuesto PDF profesional con totales e IVA opcional — listo para enviar por WhatsApp.
      </p>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <label className="text-xs font-semibold text-slate-500 uppercase">Buscar cliente / vehículo</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Placa, marca o nombre…"
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
          {sugerencias.map((veh) => {
            const cl = MOCK_CLIENTES.find((x) => x.id === veh.propietarioId);
            return (
              <button
                key={veh.id}
                type="button"
                onClick={() => {
                  setVehiculoId(veh.id);
                  setQ('');
                }}
                className={`text-xs px-2 py-1 rounded-full border ${
                  vehiculoId === veh.id ? 'bg-slate-600 border-slate-500' : 'border-white/15 text-slate-400'
                }`}
              >
                {veh.placa} · {veh.marca} · {cl?.nombre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
        <p className="text-sm">
          <span className="text-slate-500">Cliente:</span> {c?.nombre ?? '—'}{' '}
          <span className="text-slate-500">· Vehículo:</span> {v ? `${v.marca} ${v.modelo}` : '—'}
        </p>
        <label className="text-xs font-semibold text-slate-500 uppercase block mt-2">Descripción del problema</label>
        <textarea
          value={problema}
          onChange={(e) => setProblema(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">Trabajos (mano de obra)</h3>
          <button type="button" onClick={addTrabajo} className="text-xs px-2 py-1 rounded bg-slate-600">
            + Agregar
          </button>
        </div>
        {trabajos.map((t, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            <input
              className="md:col-span-5 rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
              placeholder="Descripción"
              value={t.descripcion}
              onChange={(e) => {
                const n = [...trabajos];
                n[i] = { ...t, descripcion: e.target.value };
                setTrabajos(n);
              }}
            />
            <input
              type="number"
              className="md:col-span-2 rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
              placeholder="Hrs"
              value={t.horas || ''}
              onChange={(e) => {
                const n = [...trabajos];
                n[i] = { ...t, horas: Number(e.target.value) };
                setTrabajos(n);
              }}
            />
            <input
              type="number"
              className="md:col-span-3 rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
              placeholder="Costo MO"
              value={t.costo || ''}
              onChange={(e) => {
                const n = [...trabajos];
                n[i] = { ...t, costo: Number(e.target.value) };
                setTrabajos(n);
              }}
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">Refacciones</h3>
          <button type="button" onClick={addRef} className="text-xs px-2 py-1 rounded bg-slate-600">
            + Agregar
          </button>
        </div>
        {refs.map((r, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <input
              className="md:col-span-5 rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
              placeholder="Nombre refacción"
              value={r.nombre}
              onChange={(e) => {
                const n = [...refs];
                n[i] = { ...r, nombre: e.target.value };
                setRefs(n);
              }}
            />
            <input
              type="number"
              className="md:col-span-2 rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
              placeholder="Cant."
              value={r.cantidad || ''}
              onChange={(e) => {
                const n = [...refs];
                n[i] = { ...r, cantidad: Number(e.target.value) };
                setRefs(n);
              }}
            />
            <input
              type="number"
              className="md:col-span-3 rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm"
              placeholder="P. unitario"
              value={r.pu || ''}
              onChange={(e) => {
                const n = [...refs];
                n[i] = { ...r, pu: Number(e.target.value) };
                setRefs(n);
              }}
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
        <label className="text-xs text-slate-500">Notas adicionales</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <span>
            Tiempo estimado total: <strong>{tiempoTotal}</strong>
          </span>
          <label className="flex items-center gap-2">
            Válido (días):
            <input
              type="number"
              min={1}
              className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1"
              value={validoDias}
              onChange={(e) => setValidoDias(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={iva} onChange={(e) => setIva(e.target.checked)} />
            IVA 16%
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-600/50 bg-slate-900/40 p-4 space-y-1 text-sm">
        <p>Mano de obra: {manoObra.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
        <p>Refacciones: {subRefs.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
        <p>Subtotal: {sub.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
        {iva && <p>IVA 16%: {ivaMonto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>}
        <p className="text-lg font-bold text-emerald-400">
          TOTAL: {total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void generar()}
          className="px-5 py-3 rounded-xl font-semibold bg-slate-600 hover:bg-slate-500"
        >
          Generar presupuesto PDF
        </button>
        <a
          href={waPresupuesto()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500"
        >
          Enviar por WhatsApp
        </a>
      </div>
    </div>
  );
}
