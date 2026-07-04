'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Download,
  FileText,
  MessageCircle,
  Minus,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CwfPanelNav } from '@/components/cwf/CwfPanelNav';
import {
  normalizeWhatsapp52,
  precioDefaultPorPresentacion,
  type CotizacionColor,
  type CotizacionEstado,
  type CotizacionPresentacion,
  type CwfCotizacion,
} from '@/lib/cwf-cotizaciones';

const BRAND = {
  bg: '#1a1208',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(180, 120, 60, 0.25)',
  accent: '#c8863a',
  green: '#1A2E1A',
  copper: '#C47D2E',
} as const;

const PRESENTACIONES: CotizacionPresentacion[] = ['Galón 3.79L', 'Cubeta 19L'];
const COLORES: CotizacionColor[] = ['Claro Natural', 'Cedro', 'Redwood'];

type ProductoRow = {
  id: string;
  presentacion: CotizacionPresentacion;
  color: CotizacionColor;
  cantidad: number;
  precioUnitario: number;
};

type ClienteForm = {
  nombre: string;
  negocio: string;
  direccion: string;
  ciudad: string;
  cp: string;
  whatsapp: string;
  rfc: string;
};

type CotizacionListItem = Omit<CwfCotizacion, 'fecha'> & { fecha: string };

function newRow(): ProductoRow {
  return {
    id: crypto.randomUUID(),
    presentacion: 'Galón 3.79L',
    color: 'Claro Natural',
    cantidad: 1,
    precioUnitario: precioDefaultPorPresentacion('Galón 3.79L'),
  };
}

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function estadoLabel(e: CotizacionEstado) {
  const map: Record<CotizacionEstado, string> = {
    borrador: 'Borrador',
    enviada: 'Enviada',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
  };
  return map[e] || e;
}

async function downloadPdfResponse(res: Response, fallbackName: string) {
  const folio = res.headers.get('X-Cotizacion-Folio');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = folio ? `cotizacion-${folio}.pdf` : fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function waLink(whatsapp: string, folio: string) {
  const digits = normalizeWhatsapp52(whatsapp);
  if (!digits) return null;
  const text = encodeURIComponent(
    `Hola, le adjunto su cotización CWF México (${folio}). Quedo atento a cualquier duda.`,
  );
  return `https://wa.me/${digits}?text=${text}`;
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-stone-900/80 border border-amber-900/40 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm';

export default function CwfCotizacionesPage() {
  const [nextFolio, setNextFolio] = useState('—');
  const [cliente, setCliente] = useState<ClienteForm>({
    nombre: '',
    negocio: '',
    direccion: '',
    ciudad: '',
    cp: '',
    whatsapp: '',
    rfc: '',
  });
  const [productos, setProductos] = useState<ProductoRow[]>([newRow()]);
  const [envio, setEnvio] = useState(0);
  const [precioEspecial, setPrecioEspecial] = useState(false);
  const [notas, setNotas] = useState('');
  const [showNotas, setShowNotas] = useState(false);
  const [lista, setLista] = useState<CotizacionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cwf-panel/cotizaciones?nextFolio=1', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo cargar cotizaciones');
        return;
      }
      setLista((data.cotizaciones ?? []) as CotizacionListItem[]);
      if (data.nextFolio) setNextFolio(data.nextFolio);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const lineas = useMemo(
    () =>
      productos.map((p) => ({
        ...p,
        subtotal: p.cantidad * p.precioUnitario,
      })),
    [productos],
  );

  const subtotal = useMemo(() => lineas.reduce((s, p) => s + p.subtotal, 0), [lineas]);
  const iva = useMemo(() => subtotal * 0.16, [subtotal]);
  const total = useMemo(() => subtotal + iva + envio, [subtotal, iva, envio]);

  const updateProducto = (id: string, patch: Partial<ProductoRow>) => {
    setProductos((rows) =>
      rows.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if (patch.presentacion && patch.presentacion !== r.presentacion) {
          next.precioUnitario = precioDefaultPorPresentacion(patch.presentacion);
        }
        return next;
      }),
    );
  };

  const buildPayload = () => ({
    cliente,
    productos: lineas.map((p) => ({
      producto: 'Flood CWF-UV',
      presentacion: p.presentacion,
      color: p.color,
      cantidad: p.cantidad,
      precioUnitario: p.precioUnitario,
      subtotal: p.subtotal,
    })),
    subtotal,
    iva,
    envio,
    total,
    precioEspecialDistribuidor: precioEspecial,
    estado: 'enviada' as CotizacionEstado,
    notas: showNotas ? notas : '',
  });

  const generarPdf = async () => {
    if (!cliente.nombre.trim()) {
      setError('El nombre del cliente es obligatorio');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/cwf-panel/cotizacion/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'No se pudo generar el PDF');
        return;
      }
      await downloadPdfResponse(res, 'cotizacion-cwf.pdf');
      await loadData();
    } finally {
      setGenerating(false);
    }
  };

  const verPdf = async (folio: string) => {
    setError('');
    try {
      const res = await fetch('/api/cwf-panel/cotizacion/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'No se pudo descargar el PDF');
        return;
      }
      await downloadPdfResponse(res, `cotizacion-${folio}.pdf`);
    } catch {
      setError('Error al descargar PDF');
    }
  };

  const duplicar = (c: CotizacionListItem) => {
    setCliente({ ...c.cliente });
    setProductos(
      c.productos.map((p) => ({
        id: crypto.randomUUID(),
        presentacion: p.presentacion,
        color: p.color,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
      })),
    );
    setEnvio(c.envio);
    setPrecioEspecial(c.precioEspecialDistribuidor);
    setNotas(c.notas);
    setShowNotas(Boolean(c.notas?.trim()));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main
      className="min-h-screen text-stone-100"
      style={{ background: `linear-gradient(160deg, ${BRAND.bg} 0%, #2a1a0c 50%, ${BRAND.bg} 100%)` }}
    >
      <header
        className="border-b px-4 py-4 space-y-3"
        style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-500/80 font-semibold">CWF México</p>
            <h1 className="text-xl font-bold text-amber-50 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Generador de cotizaciones PDF
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-amber-100/90 hover:bg-white/5 transition"
            style={{ borderColor: BRAND.border }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        <CwfPanelNav />
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Folio */}
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between border"
          style={{ borderColor: BRAND.border, background: BRAND.card }}
        >
          <span className="text-sm text-stone-400">Próximo folio</span>
          <span className="font-mono font-bold text-lg" style={{ color: BRAND.copper }}>
            {nextFolio}
          </span>
        </div>

        {/* Sección 1 — Cliente */}
        <section
          className="rounded-2xl border p-5 space-y-4"
          style={{ borderColor: BRAND.border, background: BRAND.card }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            1 — Datos del cliente
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Nombre completo *</span>
              <input className={inputCls} value={cliente.nombre} onChange={(e) => setCliente((c) => ({ ...c, nombre: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Negocio / Empresa</span>
              <input className={inputCls} value={cliente.negocio} onChange={(e) => setCliente((c) => ({ ...c, negocio: e.target.value }))} />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-stone-500 mb-1 block">Dirección de entrega</span>
              <input className={inputCls} value={cliente.direccion} onChange={(e) => setCliente((c) => ({ ...c, direccion: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Ciudad</span>
              <input className={inputCls} value={cliente.ciudad} onChange={(e) => setCliente((c) => ({ ...c, ciudad: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">C.P.</span>
              <input className={inputCls} value={cliente.cp} onChange={(e) => setCliente((c) => ({ ...c, cp: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">WhatsApp (52XXXXXXXXXX)</span>
              <input
                className={inputCls}
                placeholder="529991306399"
                value={cliente.whatsapp}
                onChange={(e) => setCliente((c) => ({ ...c, whatsapp: e.target.value.replace(/\D/g, '') }))}
              />
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">RFC (factura)</span>
              <input className={inputCls} value={cliente.rfc} onChange={(e) => setCliente((c) => ({ ...c, rfc: e.target.value.toUpperCase() }))} />
            </label>
          </div>
        </section>

        {/* Sección 2 — Productos */}
        <section
          className="rounded-2xl border p-5 space-y-4"
          style={{ borderColor: BRAND.border, background: BRAND.card }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              2 — Productos
            </h2>
            <button
              type="button"
              onClick={() => setProductos((p) => [...p, newRow()])}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-amber-800/50 border border-amber-600/30 hover:bg-amber-700/50"
            >
              <Plus className="h-4 w-4" /> Agregar fila
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase text-stone-500 border-b border-amber-900/30">
                  <th className="py-2 pr-2">Producto</th>
                  <th className="py-2 pr-2">Presentación</th>
                  <th className="py-2 pr-2">Color</th>
                  <th className="py-2 pr-2 w-20">Cant.</th>
                  <th className="py-2 pr-2 w-28">P. unit.</th>
                  <th className="py-2 pr-2 w-28 text-right">Subtotal</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {lineas.map((p) => (
                  <tr key={p.id} className="border-b border-amber-900/20">
                    <td className="py-2 pr-2 font-medium text-amber-100/90">Flood CWF-UV</td>
                    <td className="py-2 pr-2">
                      <select
                        className={inputCls}
                        value={p.presentacion}
                        onChange={(e) => updateProducto(p.id, { presentacion: e.target.value as CotizacionPresentacion })}
                      >
                        {PRESENTACIONES.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        className={inputCls}
                        value={p.color}
                        onChange={(e) => updateProducto(p.id, { color: e.target.value as CotizacionColor })}
                      >
                        {COLORES.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={1}
                        className={inputCls}
                        value={p.cantidad}
                        onChange={(e) => updateProducto(p.id, { cantidad: Math.max(1, Number(e.target.value) || 1) })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        step={50}
                        className={inputCls}
                        value={p.precioUnitario}
                        onChange={(e) => updateProducto(p.id, { precioUnitario: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </td>
                    <td className="py-2 pr-2 text-right font-medium">{money(p.subtotal)}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        disabled={productos.length <= 1}
                        onClick={() => setProductos((rows) => rows.filter((r) => r.id !== p.id))}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 disabled:opacity-30"
                        aria-label="Quitar fila"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-2">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>IVA 16%</span>
                <span>{money(iva)}</span>
              </div>
              <label className="flex justify-between items-center gap-3 text-stone-400">
                <span>Envío</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  className={`${inputCls} w-32 text-right`}
                  value={envio}
                  onChange={(e) => setEnvio(Math.max(0, Number(e.target.value) || 0))}
                />
              </label>
              <div
                className="flex justify-between font-bold text-base px-3 py-2 rounded-lg text-white"
                style={{ background: BRAND.copper }}
              >
                <span>TOTAL</span>
                <span>{money(total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-amber-900/30">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={precioEspecial}
                onChange={(e) => setPrecioEspecial(e.target.checked)}
                className="rounded border-amber-700"
              />
              Precio especial distribuidor
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showNotas}
                onChange={(e) => setShowNotas(e.target.checked)}
                className="rounded border-amber-700"
              />
              Notas adicionales
            </label>
            {showNotas && (
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Condiciones especiales, tiempos de entrega..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            )}
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={() => void generarPdf()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition"
            style={{ background: BRAND.green }}
          >
            <Download className="h-5 w-5" />
            {generating ? 'Generando PDF...' : 'Generar y descargar PDF'}
          </button>
        </section>

        {/* Listado */}
        <section
          className="rounded-2xl border p-5 space-y-4"
          style={{ borderColor: BRAND.border, background: BRAND.card }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            Últimas cotizaciones
          </h2>
          {loading && lista.length === 0 ? (
            <p className="text-sm text-stone-500">Cargando...</p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-stone-500">Sin cotizaciones guardadas aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs uppercase text-stone-500 border-b border-amber-900/30">
                    <th className="py-2 pr-3">Folio</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3 text-right">Total</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c) => {
                    const wa = waLink(c.cliente.whatsapp, c.folio);
                    return (
                      <tr key={c.folio} className="border-b border-amber-900/15">
                        <td className="py-3 pr-3 font-mono text-amber-200">{c.folio}</td>
                        <td className="py-3 pr-3">{c.cliente.nombre}</td>
                        <td className="py-3 pr-3 text-right font-medium">{money(c.total)}</td>
                        <td className="py-3 pr-3">
                          <span className="text-xs px-2 py-0.5 rounded-full border border-amber-700/40 text-amber-200/80">
                            {estadoLabel(c.estado)}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-stone-500">{fmtFecha(c.fecha)}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => void verPdf(c.folio)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-amber-700/40 hover:bg-amber-900/30"
                            >
                              <Download className="h-3 w-3" /> PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicar(c)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-amber-700/40 hover:bg-amber-900/30"
                            >
                              <Copy className="h-3 w-3" /> Duplicar
                            </button>
                            {wa ? (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/20"
                              >
                                <MessageCircle className="h-3 w-3" /> WhatsApp
                              </a>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
