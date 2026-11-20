'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus, FileText, Download, X, ChevronDown, Building2,
  Receipt, Search, RefreshCw, AlertCircle, CheckCircle2,
  Loader2, Pencil, Trash2, ExternalLink
} from 'lucide-react';
import AgentiaAuthGuard from '../AgentiaAuthGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

type Marca = 'agentia' | 'cwf';

interface MarcaInfo {
  id: Marca;
  label: string;
  color: string;
  accent: string;
  logoText: string;
  serie: string;
  regimenFiscal: string;
  cp: string;
}

interface Receptor {
  rfc: string;
  nombre: string;
  regimenFiscal: string;
  codigoPostal: string;
  usoCFDI: string;
}

interface Concepto {
  claveProdServ: string;
  claveUnidad: string;
  unidad?: string;
  cantidad: number;
  descripcion: string;
  valorUnitario: number;
}

interface Factura {
  _id: string;
  marca: Marca;
  uuid: string;
  folio: string;
  serie: string;
  fechaEmision: string;
  fechaTimbrado: string;
  receptorRFC: string;
  receptorNombre: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'vigente' | 'cancelado';
  xmlUrl?: string;
  pdfUrl?: string;
}

interface ClienteGuardado {
  rfc: string;
  nombre: string;
  regimenFiscal: string;
  codigoPostal: string;
  usoCFDI: string;
  alias?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MARCAS: MarcaInfo[] = [
  {
    id: 'agentia',
    label: 'Agentia Software',
    color: '#3b82f6',
    accent: '#60a5fa',
    logoText: 'A·',
    serie: 'AG',
    regimenFiscal: '601',
    cp: '97000',
  },
  {
    id: 'cwf',
    label: 'CWF México',
    color: '#f59e0b',
    accent: '#fbbf24',
    logoText: 'CWF',
    serie: 'CW',
    regimenFiscal: '601',
    cp: '97000',
  },
];

const CLAVES_PROD = [
  { clave: '81112105', desc: 'Servicios de software de aplicación' },
  { clave: '81111500', desc: 'Consultoría en TI' },
  { clave: '81112101', desc: 'Desarrollo de software' },
  { clave: '73111600', desc: 'Servicios de publicidad' },
  { clave: '84111500', desc: 'Servicios empresariales generales' },
];

const CLAVES_UNIDAD = [
  { clave: 'E48', desc: 'Servicio' },
  { clave: 'ACT', desc: 'Actividad' },
  { clave: 'MO', desc: 'Mes' },
  { clave: 'H87', desc: 'Pieza' },
];

const USO_CFDI = [
  { clave: 'G03', desc: 'Gastos en general' },
  { clave: 'S01', desc: 'Sin efectos fiscales' },
  { clave: 'D01', desc: 'Honorarios médicos' },
];

const REGIMENES = [
  { clave: '601', desc: '601 — General de Ley PM' },
  { clave: '603', desc: '603 — Personas Morales con fines no lucrativos' },
  { clave: '612', desc: '612 — Personas Físicas con actividades empresariales' },
  { clave: '616', desc: '616 — Sin obligaciones fiscales' },
  { clave: '626', desc: '626 — Régimen Simplificado de Confianza' },
];

const BRAND = {
  bg: '#0a0f1a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.10)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getMarca(id: Marca) {
  return MARCAS.find(m => m.id === id)!;
}

// ─── Componente Logo por marca ────────────────────────────────────────────────

function MarcaBadge({ marca, size = 'sm' }: { marca: Marca; size?: 'sm' | 'md' | 'lg' }) {
  const m = getMarca(marca);
  const sizes = { sm: { px: 28, fs: 9, fw: 700 }, md: { px: 36, fs: 11, fw: 700 }, lg: { px: 48, fs: 14, fw: 800 } };
  const s = sizes[size];
  return (
    <div style={{
      width: s.px, height: s.px, borderRadius: 8,
      background: `${m.color}22`,
      border: `1.5px solid ${m.color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', fontSize: s.fs, fontWeight: s.fw,
      color: m.accent, letterSpacing: '-0.5px', flexShrink: 0,
    }}>
      {m.logoText}
    </div>
  );
}

// ─── Modal Nueva Factura ──────────────────────────────────────────────────────

function ModalEmitir({
  onClose, onSuccess, clientes,
}: {
  onClose: () => void;
  onSuccess: () => void;
  clientes: ClienteGuardado[];
}) {
  const [marca, setMarca] = useState<Marca>('agentia');
  const [receptor, setReceptor] = useState<Receptor>({
    rfc: '', nombre: '', regimenFiscal: '601', codigoPostal: '', usoCFDI: 'G03',
  });
  const [conceptos, setConceptos] = useState<Concepto[]>([{
    claveProdServ: '81112105', claveUnidad: 'E48', unidad: 'Servicio',
    cantidad: 1, descripcion: '', valorUnitario: 0,
  }]);
  const [metodoPago, setMetodoPago] = useState('PUE');
  const [formaPago, setFormaPago] = useState('03');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = conceptos.reduce((s, c) => s + c.cantidad * c.valorUnitario, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  function cargarCliente(c: ClienteGuardado) {
    setReceptor({ rfc: c.rfc, nombre: c.nombre, regimenFiscal: c.regimenFiscal, codigoPostal: c.codigoPostal, usoCFDI: c.usoCFDI });
  }

  function addConcepto() {
    setConceptos(cs => [...cs, {
      claveProdServ: '81112105', claveUnidad: 'E48', unidad: 'Servicio',
      cantidad: 1, descripcion: '', valorUnitario: 0,
    }]);
  }

  function removeConcepto(i: number) {
    setConceptos(cs => cs.filter((_, idx) => idx !== i));
  }

  function updateConcepto(i: number, field: keyof Concepto, val: string | number) {
    setConceptos(cs => cs.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  }

  async function emitir() {
    if (!receptor.rfc || !receptor.nombre || conceptos.some(c => !c.descripcion)) {
      setError('Completa RFC, nombre y descripción de conceptos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/facturacion/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marca, receptor, conceptos, metodoPago, formaPago }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir');
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  const marcaActual = getMarca(marca);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#0e1527', border: `1px solid ${BRAND.border}`,
        borderRadius: 16, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${BRAND.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#0e1527', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Receipt size={18} color="#60a5fa" />
            <span style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 15 }}>
              Nueva Factura
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a99', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Marca */}
          <div>
            <label style={labelStyle}>Emisor / Marca</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MARCAS.map(m => (
                <button key={m.id} onClick={() => setMarca(m.id)} style={{
                  background: marca === m.id ? `${m.color}18` : BRAND.card,
                  border: `1.5px solid ${marca === m.id ? m.color : BRAND.border}`,
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <MarcaBadge marca={m.id} size="sm" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: marca === m.id ? m.accent : '#c9d8ef', fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ color: '#6b7a99', fontSize: 11 }}>Serie {m.serie} · RFC GHO2606309U4</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Receptor */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={labelStyle}>Receptor (Datos Fiscales)</label>
              {clientes.length > 0 && (
                <select
                  style={{ ...inputStyle, padding: '4px 8px', fontSize: 12, maxWidth: 200 }}
                  onChange={e => {
                    const c = clientes.find(cl => cl.rfc === e.target.value);
                    if (c) cargarCliente(c);
                  }}
                  defaultValue=""
                >
                  <option value="">Cargar cliente guardado</option>
                  {clientes.map(c => (
                    <option key={c.rfc} value={c.rfc}>{c.alias || c.nombre}</option>
                  ))}
                </select>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={sublabelStyle}>RFC *</label>
                <input style={inputStyle} placeholder="XAXX010101000" value={receptor.rfc}
                  onChange={e => setReceptor(r => ({ ...r, rfc: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label style={sublabelStyle}>Código Postal *</label>
                <input style={inputStyle} placeholder="97000" value={receptor.codigoPostal}
                  onChange={e => setReceptor(r => ({ ...r, codigoPostal: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={sublabelStyle}>Nombre o Razón Social *</label>
                <input style={inputStyle} placeholder="PÚBLICO EN GENERAL" value={receptor.nombre}
                  onChange={e => setReceptor(r => ({ ...r, nombre: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label style={sublabelStyle}>Régimen Fiscal</label>
                <select style={inputStyle} value={receptor.regimenFiscal}
                  onChange={e => setReceptor(r => ({ ...r, regimenFiscal: e.target.value }))}>
                  {REGIMENES.map(r => <option key={r.clave} value={r.clave}>{r.desc}</option>)}
                </select>
              </div>
              <div>
                <label style={sublabelStyle}>Uso CFDI</label>
                <select style={inputStyle} value={receptor.usoCFDI}
                  onChange={e => setReceptor(r => ({ ...r, usoCFDI: e.target.value }))}>
                  {USO_CFDI.map(u => <option key={u.clave} value={u.clave}>{u.clave} — {u.desc}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Conceptos */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={labelStyle}>Conceptos</label>
              <button onClick={addConcepto} style={{
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, color: '#60a5fa', fontSize: 12,
              }}>
                <Plus size={12} /> Agregar
              </button>
            </div>
            {conceptos.map((c, i) => (
              <div key={i} style={{
                background: BRAND.card, border: `1px solid ${BRAND.border}`,
                borderRadius: 10, padding: '12px 14px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#6b7a99', fontSize: 12 }}>Concepto {i + 1}</span>
                  {conceptos.length > 1 && (
                    <button onClick={() => removeConcepto(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={sublabelStyle}>Descripción *</label>
                    <input style={inputStyle} placeholder="Suscripción mensual Agentia" value={c.descripcion}
                      onChange={e => updateConcepto(i, 'descripcion', e.target.value)} />
                  </div>
                  <div>
                    <label style={sublabelStyle}>Clave Prod/Serv SAT</label>
                    <select style={inputStyle} value={c.claveProdServ}
                      onChange={e => updateConcepto(i, 'claveProdServ', e.target.value)}>
                      {CLAVES_PROD.map(p => <option key={p.clave} value={p.clave}>{p.clave} — {p.desc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={sublabelStyle}>Clave Unidad</label>
                    <select style={inputStyle} value={c.claveUnidad}
                      onChange={e => updateConcepto(i, 'claveUnidad', e.target.value)}>
                      {CLAVES_UNIDAD.map(u => <option key={u.clave} value={u.clave}>{u.clave} — {u.desc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={sublabelStyle}>Cantidad</label>
                    <input type="number" style={inputStyle} min={1} step={1} value={c.cantidad}
                      onChange={e => updateConcepto(i, 'cantidad', parseFloat(e.target.value) || 1)} />
                  </div>
                  <div>
                    <label style={sublabelStyle}>Precio Unitario (sin IVA)</label>
                    <input type="number" style={inputStyle} min={0} step={0.01} value={c.valorUnitario}
                      onChange={e => updateConcepto(i, 'valorUnitario', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            ))}

            {/* Totales */}
            <div style={{
              background: `${marcaActual.color}10`, border: `1px solid ${marcaActual.color}30`,
              borderRadius: 10, padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8898b4', marginBottom: 4 }}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8898b4', marginBottom: 6 }}>
                <span>IVA 16%</span><span>{fmt(iva)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: marcaActual.accent }}>
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Pago */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={sublabelStyle}>Método de Pago</label>
              <select style={inputStyle} value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                <option value="PUE">PUE — Pago en una sola exhibición</option>
                <option value="PPD">PPD — Pago en parcialidades o diferido</option>
              </select>
            </div>
            <div>
              <label style={sublabelStyle}>Forma de Pago</label>
              <select style={inputStyle} value={formaPago} onChange={e => setFormaPago(e.target.value)}>
                <option value="01">01 — Efectivo</option>
                <option value="02">02 — Cheque nominativo</option>
                <option value="03">03 — Transferencia electrónica</option>
                <option value="04">04 — Tarjeta de crédito</option>
                <option value="28">28 — Tarjeta de débito</option>
                <option value="99">99 — Por definir</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertCircle size={15} color="#ef4444" />
              <span style={{ color: '#fca5a5', fontSize: 13 }}>{error}</span>
            </div>
          )}

          <button onClick={emitir} disabled={loading} style={{
            background: loading ? '#1e2d4a' : `linear-gradient(135deg, ${marcaActual.color}, ${marcaActual.color}cc)`,
            border: 'none', borderRadius: 10, padding: '12px',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}>
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Timbrando con SAT...</> : <><Receipt size={16} /> Emitir Factura</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Agregar Cliente ────────────────────────────────────────────────────

function ModalCliente({
  onClose, onSave, inicial,
}: {
  onClose: () => void;
  onSave: (c: ClienteGuardado) => void;
  inicial?: ClienteGuardado;
}) {
  const [data, setData] = useState<ClienteGuardado>(inicial || {
    rfc: '', nombre: '', regimenFiscal: '601', codigoPostal: '', usoCFDI: 'G03', alias: '',
  });

  function save() {
    if (!data.rfc || !data.nombre) return;
    onSave(data);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#0e1527', border: `1px solid ${BRAND.border}`,
        borderRadius: 16, width: '100%', maxWidth: 480,
      }}>
        <div style={{
          padding: '18px 22px 14px', borderBottom: `1px solid ${BRAND.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} color="#60a5fa" />
            <span style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 14 }}>
              {inicial ? 'Editar Cliente' : 'Agregar Cliente'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a99' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={sublabelStyle}>Alias / Nombre corto</label>
            <input style={inputStyle} placeholder="Empresa ABC" value={data.alias || ''}
              onChange={e => setData(d => ({ ...d, alias: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={sublabelStyle}>RFC *</label>
              <input style={inputStyle} placeholder="ABC010101XYZ" value={data.rfc}
                onChange={e => setData(d => ({ ...d, rfc: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label style={sublabelStyle}>Código Postal *</label>
              <input style={inputStyle} placeholder="97000" value={data.codigoPostal}
                onChange={e => setData(d => ({ ...d, codigoPostal: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={sublabelStyle}>Razón Social (exacta según SAT) *</label>
              <input style={inputStyle} value={data.nombre}
                onChange={e => setData(d => ({ ...d, nombre: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label style={sublabelStyle}>Régimen Fiscal</label>
              <select style={inputStyle} value={data.regimenFiscal}
                onChange={e => setData(d => ({ ...d, regimenFiscal: e.target.value }))}>
                {REGIMENES.map(r => <option key={r.clave} value={r.clave}>{r.desc}</option>)}
              </select>
            </div>
            <div>
              <label style={sublabelStyle}>Uso CFDI habitual</label>
              <select style={inputStyle} value={data.usoCFDI}
                onChange={e => setData(d => ({ ...d, usoCFDI: e.target.value }))}>
                {USO_CFDI.map(u => <option key={u.clave} value={u.clave}>{u.clave} — {u.desc}</option>)}
              </select>
            </div>
          </div>
          <button onClick={save} disabled={!data.rfc || !data.nombre} style={{
            background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: 10, padding: '10px', color: '#93c5fd', fontWeight: 600,
            fontSize: 14, cursor: 'pointer', marginTop: 4,
          }}>
            Guardar Cliente
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#8898b4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
};
const sublabelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#6b7a99', marginBottom: 4,
};
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
  padding: '8px 10px', color: '#e2eaf8', fontSize: 13,
  outline: 'none',
};

// ─── Página principal ─────────────────────────────────────────────────────────

function FacturacionPage() {
  const [marcaFilter, setMarcaFilter] = useState<Marca | 'todas'>('todas');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEmitir, setShowEmitir] = useState(false);
  const [showCliente, setShowCliente] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteGuardado | undefined>();
  const [clientes, setClientes] = useState<ClienteGuardado[]>([]);
  const [toast, setToast] = useState('');

  // Clientes guardados en localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('facturacion_clientes');
      if (raw) setClientes(JSON.parse(raw));
    } catch {}
  }, []);

  function saveClientes(list: ClienteGuardado[]) {
    setClientes(list);
    try { localStorage.setItem('facturacion_clientes', JSON.stringify(list)); } catch {}
  }

  function handleSaveCliente(c: ClienteGuardado) {
    const updated = editingCliente
      ? clientes.map(x => x.rfc === editingCliente.rfc ? c : x)
      : [...clientes.filter(x => x.rfc !== c.rfc), c];
    saveClientes(updated);
    setShowCliente(false);
    setEditingCliente(undefined);
    showToast(editingCliente ? 'Cliente actualizado' : 'Cliente guardado');
  }

  function deleteCliente(rfc: string) {
    saveClientes(clientes.filter(c => c.rfc !== rfc));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const loadFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (marcaFilter !== 'todas') qs.set('marca', marcaFilter);
      const res = await fetch(`/api/facturacion/lista?${qs}`, { credentials: 'include' });
      const data = await res.json();
      setFacturas(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  }, [marcaFilter, page]);

  useEffect(() => { loadFacturas(); }, [loadFacturas]);

  const filtered = search
    ? facturas.filter(f =>
        f.receptorNombre.toLowerCase().includes(search.toLowerCase()) ||
        f.receptorRFC.toLowerCase().includes(search.toLowerCase()) ||
        f.uuid?.toLowerCase().includes(search.toLowerCase())
      )
    : facturas;

  const totalesPorMarca = MARCAS.map(m => ({
    ...m,
    count: facturas.filter(f => f.marca === m.id).length,
    monto: facturas.filter(f => f.marca === m.id).reduce((s, f) => s + f.total, 0),
  }));

  return (
    <div style={{
      minHeight: '100vh', background: BRAND.bg,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: 40,
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #0e1527; }
        input::placeholder { color: #3d4f6b; }
        input:focus, select:focus { border-color: rgba(59,130,246,0.5) !important; outline: none; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${BRAND.border}`, padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={20} color="#60a5fa" />
          <span style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 17 }}>Facturación</span>
          <span style={{
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#93c5fd',
          }}>CFDI 4.0 · GHO2606309U4</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setEditingCliente(undefined); setShowCliente(true); }} style={{
            background: BRAND.card, border: `1px solid ${BRAND.border}`,
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: '#c9d8ef', fontSize: 13,
          }}>
            <Building2 size={14} /> Clientes
          </button>
          <button onClick={() => setShowEmitir(true)} style={{
            background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: '#93c5fd', fontWeight: 600, fontSize: 13,
          }}>
            <Plus size={14} /> Nueva Factura
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Tarjetas resumen por marca */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {totalesPorMarca.map(m => (
            <div key={m.id} style={{
              background: BRAND.card, border: `1px solid ${BRAND.border}`,
              borderRadius: 12, padding: '16px 18px',
              cursor: 'pointer',
              borderTopColor: marcaFilter === m.id ? m.color : BRAND.border,
              borderTopWidth: marcaFilter === m.id ? 2 : 1,
            }} onClick={() => setMarcaFilter(marcaFilter === m.id ? 'todas' : m.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <MarcaBadge marca={m.id} size="md" />
                <div>
                  <div style={{ color: '#c9d8ef', fontWeight: 600, fontSize: 13 }}>{m.label}</div>
                  <div style={{ color: '#6b7a99', fontSize: 11 }}>Serie {m.serie}</div>
                </div>
              </div>
              <div style={{ color: m.accent, fontSize: 20, fontWeight: 700 }}>{fmt(m.monto)}</div>
              <div style={{ color: '#6b7a99', fontSize: 12, marginTop: 2 }}>{m.count} facturas emitidas</div>
            </div>
          ))}

          {/* Total general */}
          <div style={{
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 12, padding: '16px 18px',
          }}>
            <div style={{ color: '#8898b4', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total acumulado</div>
            <div style={{ color: '#60a5fa', fontSize: 22, fontWeight: 700 }}>
              {fmt(facturas.reduce((s, f) => s + f.total, 0))}
            </div>
            <div style={{ color: '#6b7a99', fontSize: 12, marginTop: 2 }}>{total} facturas · todas las marcas</div>
          </div>
        </div>

        {/* Clientes guardados */}
        {clientes.length > 0 && (
          <div>
            <div style={{ color: '#6b7a99', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Clientes Guardados</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {clientes.map(c => (
                <div key={c.rfc} style={{
                  background: BRAND.card, border: `1px solid ${BRAND.border}`,
                  borderRadius: 8, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Building2 size={13} color="#6b7a99" />
                  <div>
                    <div style={{ color: '#c9d8ef', fontSize: 13, fontWeight: 500 }}>{c.alias || c.nombre}</div>
                    <div style={{ color: '#6b7a99', fontSize: 11 }}>{c.rfc}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                    <button onClick={() => { setEditingCliente(c); setShowCliente(true); }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#4b6a99', padding: 2,
                    }}><Pencil size={12} /></button>
                    <button onClick={() => deleteCliente(c.rfc)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#6b2d2d', padding: 2,
                    }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingCliente(undefined); setShowCliente(true); }} style={{
                background: 'rgba(59,130,246,0.08)', border: '1px dashed rgba(59,130,246,0.3)',
                borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, color: '#4b7aab', fontSize: 12,
              }}>
                <Plus size={12} /> Agregar
              </button>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4b6a99' }} />
            <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Buscar por RFC, nombre o UUID..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['todas', ...MARCAS.map(m => m.id)] as Array<Marca | 'todas'>).map(id => {
              const m = id !== 'todas' ? getMarca(id) : null;
              return (
                <button key={id} onClick={() => { setMarcaFilter(id); setPage(1); }} style={{
                  background: marcaFilter === id ? (m ? `${m.color}22` : 'rgba(59,130,246,0.15)') : BRAND.card,
                  border: `1px solid ${marcaFilter === id ? (m?.color || '#3b82f6') + '55' : BRAND.border}`,
                  borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
                  color: marcaFilter === id ? (m?.accent || '#60a5fa') : '#8898b4',
                  fontSize: 12, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {m && <MarcaBadge marca={id as Marca} size="sm" />}
                  {id === 'todas' ? 'Todas' : m!.label}
                </button>
              );
            })}
          </div>
          <button onClick={loadFacturas} style={{
            background: BRAND.card, border: `1px solid ${BRAND.border}`,
            borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#6b7a99',
          }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Tabla de facturas */}
        <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Loader2 size={24} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#4b6a99' }}>
              <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>No hay facturas aún</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>Presiona "Nueva Factura" para emitir la primera</div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      {['Folio', 'Marca', 'Receptor', 'Total', 'Estado', 'Fecha', 'Descargas'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7a99', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(f => {
                      const m = getMarca(f.marca);
                      return (
                        <tr key={f._id} style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                          <td style={{ padding: '10px 14px', color: '#c9d8ef', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {f.serie}-{f.folio}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <MarcaBadge marca={f.marca} size="sm" />
                              <span style={{ color: m.accent, fontSize: 12 }}>{m.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ color: '#c9d8ef', fontWeight: 500 }}>{f.receptorNombre}</div>
                            <div style={{ color: '#6b7a99', fontSize: 11, fontFamily: 'monospace' }}>{f.receptorRFC}</div>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#e2eaf8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {fmt(f.total)}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              background: f.estado === 'vigente' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                              border: `1px solid ${f.estado === 'vigente' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                              borderRadius: 20, padding: '2px 8px', fontSize: 11,
                              color: f.estado === 'vigente' ? '#4ade80' : '#f87171',
                              display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content',
                            }}>
                              {f.estado === 'vigente'
                                ? <><CheckCircle2 size={10} /> Vigente</>
                                : <><X size={10} /> Cancelado</>
                              }
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#6b7a99', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {fmtDate(f.fechaTimbrado || f.fechaEmision)}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {f.pdfUrl && (
                                <a href={f.pdfUrl} target="_blank" rel="noopener noreferrer" style={{
                                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                  borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  color: '#fca5a5', fontSize: 11, textDecoration: 'none',
                                }}>
                                  <Download size={11} /> PDF
                                </a>
                              )}
                              {f.xmlUrl && (
                                <a href={f.xmlUrl} target="_blank" rel="noopener noreferrer" style={{
                                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                                  borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  color: '#93c5fd', fontSize: 11, textDecoration: 'none',
                                }}>
                                  <ExternalLink size={11} /> XML
                                </a>
                              )}
                              {!f.pdfUrl && !f.xmlUrl && <span style={{ color: '#3d4f6b', fontSize: 11 }}>—</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Paginación */}
              {pages > 1 && (
                <div style={{
                  borderTop: `1px solid ${BRAND.border}`, padding: '10px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#6b7a99', fontSize: 12 }}>{total} facturas</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)} style={{
                        background: page === p ? 'rgba(59,130,246,0.2)' : BRAND.card,
                        border: `1px solid ${page === p ? 'rgba(59,130,246,0.4)' : BRAND.border}`,
                        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                        color: page === p ? '#93c5fd' : '#6b7a99', fontSize: 12,
                      }}>{p}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#4ade80', fontSize: 13, fontWeight: 500,
        }}>
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      {showEmitir && (
        <ModalEmitir
          onClose={() => setShowEmitir(false)}
          onSuccess={() => { setShowEmitir(false); loadFacturas(); showToast('Factura emitida y timbrada'); }}
          clientes={clientes}
        />
      )}

      {showCliente && (
        <ModalCliente
          onClose={() => { setShowCliente(false); setEditingCliente(undefined); }}
          onSave={handleSaveCliente}
          inicial={editingCliente}
        />
      )}
    </div>
  );
}

export default function FacturacionPageWrapper() {
  return (
    <AgentiaAuthGuard>
      <FacturacionPage />
    </AgentiaAuthGuard>
  );
}
