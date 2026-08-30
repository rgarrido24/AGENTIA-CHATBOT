'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ClipboardList, Camera, FileText, Wrench, Check, Eye, Lock, Paperclip, MessageCircle, CircleDot } from 'lucide-react';
import {
  getCliente,
  getVehiculo,
  type DanoVehiculo,
  type FotoOrden,
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

// ── Gauge de gasolina ─────────────────────────────────────────────────────────
function GaugeGasolina({ nivel }: { nivel: number }) {
  const labels = ['', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', 'Lleno'];
  const texto = labels[nivel] ?? `${nivel}/8`;
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-slate-400">Nivel de gasolina al ingreso</p>
      <div className="flex gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-4 rounded-sm"
            style={{
              background: i < nivel
                ? nivel <= 2 ? '#ef4444' : nivel <= 4 ? '#f59e0b' : '#22c55e'
                : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-white">{texto}</p>
    </div>
  );
}

// ── SVG diagrama del auto ─────────────────────────────────────────────────────
const ZONA_COORDS: Record<DanoVehiculo['zona'], { x: number; y: number; w: number; h: number; label: string }> = {
  defensa_delantera: { x: 36, y: 8,   w: 48, h: 14, label: 'Def. delantera' },
  cofre:             { x: 36, y: 22,  w: 48, h: 22, label: 'Cofre' },
  techo:             { x: 36, y: 56,  w: 48, h: 28, label: 'Techo' },
  cajuela:           { x: 36, y: 84,  w: 48, h: 18, label: 'Cajuela' },
  defensa_trasera:   { x: 36, y: 102, w: 48, h: 14, label: 'Def. trasera' },
  puerta_del_izq:    { x: 6,  y: 44,  w: 28, h: 22, label: 'Pta. Del. Izq' },
  puerta_del_der:    { x: 86, y: 44,  w: 28, h: 22, label: 'Pta. Del. Der' },
  puerta_tra_izq:    { x: 6,  y: 68,  w: 28, h: 22, label: 'Pta. Tra. Izq' },
  puerta_tra_der:    { x: 86, y: 68,  w: 28, h: 22, label: 'Pta. Tra. Der' },
  costado_izq:       { x: 6,  y: 22,  w: 14, h: 72, label: 'Costado Izq' },
  costado_der:       { x: 100,y: 22,  w: 14, h: 72, label: 'Costado Der' },
};

function nivelColor(nivel: DanoVehiculo['nivel']): string {
  if (nivel === 'severo') return '#ef4444';
  if (nivel === 'moderado') return '#f59e0b';
  return '#22c55e';
}

function DiagramaAuto({ golpes, rayones }: { golpes: DanoVehiculo[]; rayones: DanoVehiculo[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const danos = [...golpes, ...rayones];
  const danoMap = new Map(danos.map((d) => [d.zona, d]));

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">Diagrama de daños al ingreso</p>
      <div className="relative w-full max-w-[200px] mx-auto">
        <svg viewBox="0 0 120 120" className="w-full" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>
          {/* Carrocería base */}
          <rect x="36" y="22" width="48" height="72" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          {/* Defensas */}
          <rect x="38" y="10" width="44" height="13" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          <rect x="38" y="97" width="44" height="13" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          {/* Puertas */}
          <rect x="8"  y="46" width="26" height="20" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          <rect x="86" y="46" width="26" height="20" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          <rect x="8"  y="68" width="26" height="20" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          <rect x="86" y="68" width="26" height="20" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          {/* Costados */}
          <rect x="8"  y="22" width="12" height="72" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          <rect x="100" y="22" width="12" height="72" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          {/* Zonas dañadas */}
          {danos.map((d) => {
            const c = ZONA_COORDS[d.zona];
            if (!c) return null;
            return (
              <rect
                key={d.id}
                x={c.x} y={c.y} width={c.w} height={c.h}
                rx="3"
                fill={nivelColor(d.nivel)}
                fillOpacity={hoveredId === d.id ? 0.75 : 0.45}
                stroke={nivelColor(d.nivel)}
                strokeWidth="1.2"
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredId(d.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
          })}
          {/* Parabrisas */}
          <rect x="40" y="26" width="40" height="16" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
          <rect x="40" y="78" width="40" height="14" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
        </svg>
        {/* Tooltip */}
        {hoveredId && (() => {
          const d = danos.find((x) => x.id === hoveredId);
          if (!d) return null;
          const c = ZONA_COORDS[d.zona];
          return (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/20 rounded-lg px-2 py-1 text-xs whitespace-nowrap z-10 pointer-events-none">
              <span style={{ color: nivelColor(d.nivel) }}>{d.nivel}</span>{' · '}{c?.label}
            </div>
          );
        })()}
      </div>
      {danos.length === 0 && (
        <p className="text-xs text-slate-500 text-center">Sin daños registrados al ingreso</p>
      )}
    </div>
  );
}

// ── Pestaña Checklist ─────────────────────────────────────────────────────────
function TabChecklist({ orden, clienteNombre }: { orden: OrdenServicio; clienteNombre: string }) {
  const cl = orden.checklist;
  if (!cl) {
    return <p className="text-slate-500 text-sm py-6 text-center">No hay checklist registrado para esta orden.</p>;
  }

  const items = [
    { key: 'llavesEntregadas', label: 'Llaves entregadas', val: cl.llavesEntregadas },
    { key: 'llantaRefaccion', label: 'Llanta de refacción', val: cl.llantaRefaccion },
    { key: 'gato', label: 'Gato hidráulico', val: cl.gato },
    { key: 'herramientas', label: 'Herramientas', val: cl.herramientas },
    { key: 'tapetes', label: 'Tapetes', val: cl.tapetes },
    { key: 'radio', label: 'Radio / Autoestéreo', val: cl.radio },
  ];

  const nivelesColor: Record<DanoVehiculo['nivel'], string> = { leve: '#22c55e', moderado: '#f59e0b', severo: '#ef4444' };
  const nivelesLabel: Record<DanoVehiculo['nivel'], string> = { leve: 'Leve', moderado: 'Moderado', severo: 'Severo' };

  return (
    <div className="space-y-5 py-2">
      {/* Header firmado */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-amber-300" />
            Checklist de Recepción
          </p>
          <p className="text-xs text-slate-400">Firmado por el cliente al ingresar</p>
        </div>
        {cl.firmaCliente && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
            <Check className="w-3 h-3" strokeWidth={3} />
            Firmado — {cl.fechaChecklist}
          </span>
        )}
      </div>

      {/* Gauge gasolina */}
      <GaugeGasolina nivel={cl.nivelGasolina} />

      {/* Artículos */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Artículos entregados</p>
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((it) => (
            <div key={it.key} className="flex items-center gap-2 text-xs">
              <span className={`inline-flex ${it.val ? 'text-emerald-400' : 'text-slate-600'}`}>
                {it.val ? <Check className="w-3 h-3" strokeWidth={3} /> : <CircleDot className="w-3 h-3" />}
              </span>
              <span className={it.val ? 'text-slate-200' : 'text-slate-500'}>{it.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daños */}
      {(cl.golpes.length > 0 || cl.rayones.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Daños registrados al ingreso</p>
          <ul className="space-y-2">
            {[...cl.golpes, ...cl.rayones].map((d) => (
              <li key={d.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full" style={{ background: nivelesColor[d.nivel] }} />
                    {nivelesLabel[d.nivel]}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    {d.tipo} — {d.zona.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{d.descripcion}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diagrama */}
      <DiagramaAuto golpes={cl.golpes} rayones={cl.rayones} />

      {/* Firma */}
      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4">
        <p className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
          <Check className="w-4 h-4" strokeWidth={3} />
          El cliente revisó y firmó conforme
        </p>
        <p className="text-xs text-slate-400 mt-1">{clienteNombre} · {cl.fechaChecklist}</p>
      </div>
    </div>
  );
}

// ── Pestaña Fotos ─────────────────────────────────────────────────────────────
const TIPO_FOTO_LABEL: Record<FotoOrden['tipo'], string> = {
  recepcion: 'Recepción',
  avance: 'Avance',
  entrega: 'Entrega',
};

function TabFotos({ orden }: { orden: OrdenServicio }) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ tipo: 'avance', descripcion: '', visible: true });
  const [toast, setToast] = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  const fotos = orden.fotosOrden;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-300" />
            Registro fotográfico
          </p>
          <p className="text-xs text-slate-400">Las fotos marcadas como "visible" las ve el cliente en tiempo real</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-slate-600 hover:bg-slate-500 transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          Agregar foto
        </button>
      </div>

      {fotos.length === 0 ? (
        <p className="text-slate-500 text-sm py-6 text-center">Sin fotos registradas para esta orden.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {fotos.map((f) => (
            <div key={f.id} className="rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.descripcion} className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
              <div className="p-2.5 space-y-1">
                <p className="text-xs font-semibold text-white">{TIPO_FOTO_LABEL[f.tipo]}</p>
                <p className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  {f.tecnico}
                </p>
                <p className="text-[11px] text-slate-500">{f.fecha}</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{f.descripcion}</p>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${
                    f.visibleCliente
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {f.visibleCliente ? <><Eye className="w-3 h-3" />Visible para cliente</> : <><Lock className="w-3 h-3" />Solo taller</>}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar foto */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setAddOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="bg-[#0f172a] rounded-2xl border border-white/10 max-w-sm w-full p-5 space-y-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Agregar foto</p>
                <button type="button" onClick={() => setAddOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                >
                  <option value="recepcion">Recepción</option>
                  <option value="avance">Avance</option>
                  <option value="entrega">Entrega</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Descripción</label>
                <input
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Describe la foto…"
                  className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 flex-1">Visible para el cliente</span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, visible: !f.visible }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.visible ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <button
                type="button"
                className="w-full py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Paperclip className="w-4 h-4" />
                Seleccionar foto — (demo)
              </button>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl font-semibold text-white text-sm bg-slate-600 hover:bg-slate-500 transition-colors"
                onClick={() => {
                  setAddOpen(false);
                  showToast('Foto agregada');
                  setForm({ tipo: 'avance', descripcion: '', visible: true });
                }}
              >
                Guardar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-slate-900 border border-white/15 text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Kanban ticket ─────────────────────────────────────────────────────────────
export default function OrdenesPage() {
  const { ordenes, updateOrdenStatus } = useTaller();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'orden' | 'checklist' | 'fotos'>('orden');

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
        onClick={() => { setSelectedId(o.id); setTab('orden'); }}
      >
        <p className="text-lg font-bold">{v?.emoji} {vehLabel}</p>
        <p className="text-sm text-slate-400">Placa: {v?.placa ?? '—'}</p>
        <p className="text-sm">Cliente: {c?.nombre ?? '—'}</p>
        <p className="text-sm text-slate-300">Técnico: {o.tecnico}</p>
        <p className="text-amber-400 text-sm mt-1">{dias} día{dias !== 1 ? 's' : ''} en taller</p>
        <p className="text-sm font-medium text-white mt-1">{o.tipo}</p>
        <p className="text-xs text-slate-500">
          Est. entrega:{' '}
          {new Date(o.fechaEstimadaEntrega + 'T12:00:00').toLocaleDateString('es-MX')}
        </p>
        <div className="flex gap-2 mt-2 text-slate-400">
          {o.checklist && <ClipboardList className="w-3 h-3" aria-label="Checklist" />}
          {o.fotosOrden.length > 0 && <Camera className="w-3 h-3" aria-label={`${o.fotosOrden.length} fotos`} />}
        </div>
        <button
          type="button"
          className="mt-2 w-full py-2 rounded-lg text-sm font-semibold bg-slate-600 hover:bg-slate-500"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedId(o.id); setTab('orden'); }}
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

  const TABS = [
    { id: 'orden' as const, label: 'Orden', icon: FileText },
    { id: 'checklist' as const, label: 'Checklist', icon: ClipboardList },
    { id: 'fotos' as const, label: 'Fotos', icon: Camera },
  ];

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
              {/* Sticky header */}
              <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="font-semibold">
                    {drawerVeh.emoji} Orden {drawerOrden.id} · {drawerVeh.marca} {drawerVeh.modelo}
                  </p>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-white/10"
                    onClick={() => setSelectedId(null)}
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Tabs */}
                <div className="flex border-t border-white/10">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 inline-flex items-center justify-center gap-1.5 ${
                        tab === t.id
                          ? 'border-sky-500 text-sky-300 bg-sky-950/30'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 text-sm">
                {/* Pestaña Orden */}
                {tab === 'orden' && (
                  <div className="space-y-4">
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
                            <span>{r.nombre} ×{r.cantidad}</span>
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
                    {drawerOrden.observaciones && (
                      <section className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3">
                        <p className="text-xs text-amber-300 inline-flex items-center gap-1.5">
                          <MessageCircle className="w-3 h-3" />
                          Observaciones
                        </p>
                        <p className="mt-1 text-slate-300">{drawerOrden.observaciones}</p>
                      </section>
                    )}
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
                )}

                {/* Pestaña Checklist */}
                {tab === 'checklist' && (
                  <TabChecklist orden={drawerOrden} clienteNombre={drawerCliente.nombre} />
                )}

                {/* Pestaña Fotos */}
                {tab === 'fotos' && (
                  <TabFotos orden={drawerOrden} />
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
