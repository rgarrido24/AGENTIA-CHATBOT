'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, LogOut, MessageSquarePlus, Pause, Play, RefreshCw } from 'lucide-react';

type Lead = {
  leadId: string;
  senderName?: string;
  senderId?: string;
  platform?: string;
  lastMessage?: string;
  lastMessageAt?: string | null;
  createdAt?: string | null;
  bot_status?: 'active' | 'paused';
  assignedTo?: string | null;
  deco_stage?: string;
};

type ManualQuote = {
  nombre: string;
  whatsapp: string;
  email: string;
  producto: string;
  medidas: string;
  grosor: string;
  tipo_vidrio: string;
  uso: string;
  instalacion: string;
  piso: string;
  tipo_inmueble: string;
  comuna: string;
  direccion: string;
  cantidad: string;
  perfil: string;
  color: string;
  precio_material: string;
  costo_instalacion: string;
  descuento: string;
  tiempo_entrega: string;
  notas: string;
};

const CLIENT_ID = 'decohouse';

const STAGES = [
  'Nuevo',
  'En seguimiento',
  'Visita técnico',
  'Anticipo 50%',
  'Contra entrega',
  'Cerrado',
] as const;

const BRAND = {
  bg: '#071414',
  card: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.10)',
  accent: '#4fc3f7',
} as const;

function fmtWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error('No se pudo cargar logo');
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Error leyendo logo'));
    r.readAsDataURL(blob);
  });
}

async function generateDecoPdf(quote: ManualQuote, filename: string) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const d = doc as unknown as Record<string, unknown>;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const at = (opts: Record<string, unknown>) =>
    (d.autoTable as (o: unknown) => void)(opts);
  const lastY = () =>
    ((d.lastAutoTable as { finalY: number }).finalY);
  const FOOTER_H = 48;
  const SAFE_BOTTOM = FOOTER_H + 18; // margen para que nada quede debajo del footer
  const safeContentBottomY = () => H - SAFE_BOTTOM;

  const ensureSpace = (y: number, needed: number) => {
    if (y + needed <= safeContentBottomY()) return y;
    doc.addPage();
    // Reiniciar Y para nuevo contenido. No repetimos header: el footer ya se dibuja en todas las páginas.
    return 40;
  };

  // Header
  doc.setFillColor(27, 63, 107);
  doc.rect(0, 0, W, 90, 'F');
  doc.setFillColor(245, 166, 35);
  doc.rect(0, 88, W, 3, 'F');

  // Logo (public/deco-house-logo.png — fondo azul con amarillo)
  try {
    const dataUrl = await imageUrlToDataUrl('/deco-house-logo.png');
    doc.addImage(dataUrl, 'PNG', W - 148, 12, 110, 66, undefined, 'FAST');
  } catch {
    /* sin logo si el archivo no está en /public */
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('COTIZACIÓN', 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Deco House — Vidrios, Aluminio y PVC', 40, 58);
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 220);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 40, 74);

  const drawSection = (y: number, title: string): number => {
    doc.setFillColor(27, 63, 107);
    doc.rect(30, y, W - 60, 20, 'F');
    doc.setTextColor(245, 166, 35);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 40, y + 13);
    return y + 20;
  };

  const tbl = (startY: number, body: string[][], opts?: Record<string, unknown>) =>
    at({
      startY,
      margin: { left: 30, right: 30, bottom: SAFE_BOTTOM },
      body,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }, textColor: [40, 40, 40], lineColor: [225, 228, 232], lineWidth: 0.3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 140, fillColor: [248, 250, 252], textColor: [80, 80, 80] },
        1: { fillColor: [255, 255, 255] },
      },
      ...opts,
    });

  let y = 110;

  // DATOS DEL CLIENTE
  y = drawSection(y, 'DATOS DEL CLIENTE');
  tbl(y, [
    ['Nombre',            quote.nombre        || '—'],
    ['WhatsApp',          quote.whatsapp       || '—'],
    ['Email',             quote.email          || '—'],
    ['Dirección',         quote.direccion      || '—'],
    ['Comuna',            quote.comuna         || '—'],
    ['Tipo de inmueble',  quote.tipo_inmueble  || '—'],
  ]);
  y = lastY() + 12;

  // ESPECIFICACIONES
  y = drawSection(y, 'ESPECIFICACIONES DEL PRODUCTO');
  tbl(y, [
    ['Producto',          quote.producto    || '—'],
    ['Medidas',           quote.medidas     || '—'],
    ['Grosor',            quote.grosor ? `${quote.grosor} mm` : '—'],
    ['Tipo de vidrio',    quote.tipo_vidrio || '—'],
    ['Perfil / Material', quote.perfil      || '—'],
    ['Color',             quote.color       || '—'],
    ['Uso',               quote.uso         || '—'],
    ['Cantidad',          quote.cantidad    || '1'],
  ]);
  y = lastY() + 12;

  // INSTALACIÓN
  y = drawSection(y, 'INSTALACIÓN Y LOGÍSTICA');
  tbl(y, [
    ['Instalación',    quote.instalacion || '—'],
    ['Piso / Altura',  quote.piso        || '—'],
  ]);
  y = lastY() + 12;

  // COTIZACIÓN
  const pMat   = parseFloat(quote.precio_material   || '0') || 0;
  const pInst  = parseFloat(quote.costo_instalacion || '0') || 0;
  const pDesc  = parseFloat(quote.descuento         || '0') || 0;
  const subtotal  = pMat + pInst;
  const descAmt   = subtotal * (pDesc / 100);
  const baseNeto  = subtotal - descAmt;
  const iva       = baseNeto * 0.19;
  const total     = baseNeto + iva;
  const has       = pMat > 0 || pInst > 0;
  const fmtClp    = (n: number) =>
    `$${n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP`;

  const cotizRows: string[][] = [
    ['Precio material',    has && pMat  > 0 ? fmtClp(pMat)  : '—'],
    ['Costo instalación',  has && pInst > 0 ? fmtClp(pInst) : '—'],
    ...(pDesc > 0 ? [['Descuento', `${pDesc}%`]] : []),
    ['Subtotal neto',      has ? fmtClp(baseNeto) : '—'],
    ['IVA (19%)',          has ? fmtClp(iva)      : '—'],
    ['TOTAL',              has ? fmtClp(total)    : '(a confirmar)'],
    ['Tiempo de entrega',  quote.tiempo_entrega   || '—'],
  ];

  y = drawSection(y, 'COTIZACIÓN');
  tbl(y, cotizRows, {
    didParseCell: (data: Record<string, unknown>) => {
      const cell = data.cell as Record<string, unknown>;
      const styles = cell.styles as Record<string, unknown>;
      const rowIdx  = (data.row as { index: number }).index;
      const colIdx  = (data.column as { index: number }).index;
      const totalIdx = cotizRows.findIndex((r) => r[0] === 'TOTAL');
      if (rowIdx === totalIdx && colIdx === 1) {
        styles.fontStyle = 'bold';
        styles.textColor = [27, 63, 107];
        styles.fontSize  = 10;
      }
    },
  });
  y = lastY() + 12;

  // NOTAS
  if (quote.notas) {
    y = drawSection(y, 'NOTAS ADICIONALES');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(quote.notas, W - 80);
    doc.text(lines, 40, y + 12);
    y += (lines as string[]).length * 13 + 20;
  }

  // CONDICIONES Y GARANTÍA
  y = drawSection(y, 'CONDICIONES Y GARANTÍA');
  tbl(y, [
    ['Validez',       '7 días desde la fecha de emisión'],
    ['Forma de pago', '50% abono — 50% previa entrega, despacho y/o instalación'],
    ['Garantía',      '6 meses por defectos de fabricación e instalación'],
    ['Cancelaciones', 'No se aceptan una vez cortado el material'],
  ]);
  y = lastY() + 12;

  // DATOS DE TRANSFERENCIA (si no entra, pasa a segunda hoja)
  // Estimación conservadora: sección (20) + tabla (7 filas * ~22) + padding
  y = ensureSpace(y, 20 + 7 * 22 + 40);
  y = drawSection(y, 'DATOS DE TRANSFERENCIA');
  tbl(y, [
    ['Razón social',      'INNOVA DIGITAL SpA'],
    ['RUT',               '78.106.463-7'],
    ['Banco',             'Banco de Chile'],
    ['Cuenta corriente',  '00-174-11902-10'],
    ['Email',             'innovadigital888@gmail.com'],
    ['Condiciones de pago', '50% abono — 50% previa entrega, despacho y/o instalación'],
    ['Medios de pago',    'Transferencia, débito, crédito'],
  ]);

  // Footer on every page
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(27, 63, 107);
    doc.rect(0, H - 48, W, 48, 'F');
    doc.setFillColor(245, 166, 35);
    doc.rect(0, H - 48, W, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Innova Digital Spa', 30, H - 31);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('RUT 78.106.463-7  ·  +56 9 7902 5062  ·  innovadigital888@gmail.com  ·  infodecohousecl@gmail.com', 30, H - 18);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(245, 166, 35);
    doc.text('Deco House — Soluciones en vidrios, aluminio y PVC', W - 30, H - 18, { align: 'right' });
  }

  doc.save(filename);
}

export function DecoHouseClientApp() {
  const [tab, setTab] = useState<'pipeline' | 'manual'>('pipeline');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [globalPaused, setGlobalPaused] = useState(false);

  const [manual, setManual] = useState<ManualQuote>({
    nombre: '',
    whatsapp: '',
    email: '',
    producto: '',
    medidas: '',
    grosor: '',
    tipo_vidrio: '',
    uso: '',
    instalacion: 'Sí',
    piso: '',
    tipo_inmueble: '',
    comuna: '',
    direccion: '',
    cantidad: '1',
    perfil: 'Aluminio',
    color: '',
    precio_material: '',
    costo_instalacion: '',
    descuento: '0',
    tiempo_entrega: '',
    notas: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?clientId=${encodeURIComponent(CLIENT_ID)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      const arr = Array.isArray(data?.leads) ? data.leads : [];
      setLeads(arr);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGlobalPause = useCallback(async () => {
    const res = await fetch(`/api/leads/pause-global?clientId=${encodeURIComponent(CLIENT_ID)}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    if (typeof data?.paused === 'boolean') setGlobalPaused(data.paused);
  }, []);

  useEffect(() => {
    load();
    loadGlobalPause();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load, loadGlobalPause]);

  const selected = useMemo(() => leads.find((l) => l.leadId === selectedId) || null, [leads, selectedId]);

  const grouped = useMemo(() => {
    const m = new Map<string, Lead[]>();
    STAGES.forEach((s) => m.set(s, []));
    for (const l of leads) {
      const raw = String(l.deco_stage || 'Nuevo');
      const stage = (STAGES as readonly string[]).includes(raw) ? raw : 'Nuevo';
      m.get(stage)!.push(l);
    }
    for (const s of STAGES) {
      m.get(s)!.sort((a, b) => String(b.lastMessageAt || b.createdAt || '').localeCompare(String(a.lastMessageAt || a.createdAt || '')));
    }
    return m;
  }, [leads]);

  const setStage = useCallback(async (leadId: string, stage: string) => {
    await fetch('/api/leads/deco-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, stage }),
    }).catch(() => {});
    setLeads((prev) => prev.map((l) => (l.leadId === leadId ? { ...l, deco_stage: stage } : l)));
  }, []);

  const toggleLeadPause = useCallback(async (leadId: string, paused: boolean) => {
    await fetch('/api/leads/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, paused }),
    }).catch(() => {});
    setLeads((prev) => prev.map((l) => (l.leadId === leadId ? { ...l, bot_status: paused ? 'paused' : 'active' } : l)));
  }, []);

  const resetConversation = useCallback(async (senderId: string) => {
    const qs = senderId ? `?senderId=${encodeURIComponent(senderId)}` : '';
    await fetch(`/api/demo/deco-house/chat${qs}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const toggleGlobalPause = useCallback(async (paused: boolean) => {
    await fetch('/api/leads/pause-global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: CLIENT_ID, paused }),
    }).catch(() => {});
    setGlobalPaused(paused);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/decohouse/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.reload();
  }, []);

  const downloadFromLead = useCallback(async () => {
    if (!selected) return;
    const q: ManualQuote = {
      nombre: selected.senderName || '—',
      whatsapp: selected.senderId || '—',
      email: '',
      producto: '',
      medidas: '',
      grosor: '',
      tipo_vidrio: '',
      uso: '',
      instalacion: '',
      piso: '',
      tipo_inmueble: '',
      comuna: '',
      direccion: '',
      cantidad: '1',
      perfil: '',
      color: '',
      precio_material: '',
      costo_instalacion: '',
      descuento: '0',
      tiempo_entrega: '',
      notas: selected.lastMessage || '',
    };
    await generateDecoPdf(q, `decohouse-presupuesto-${(selected.senderId || selected.leadId).slice(-8)}.pdf`);
  }, [selected]);

  const downloadManual = useCallback(async () => {
    await generateDecoPdf(manual, `decohouse-presupuesto-manual-${Date.now()}.pdf`);
  }, [manual]);

  return (
    <div className="min-h-screen text-white" style={{ background: BRAND.bg }}>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-white/60">Deco House</p>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline + Presupuestos</h1>
            <p className="text-sm text-white/60 mt-1">
              clientId: <span className="font-mono text-white/80">{CLIENT_ID}</span> · Actualiza cada 15s
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setTab('pipeline')}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${tab === 'pipeline' ? 'text-white' : 'text-white/70 hover:text-white'}`}
              style={{ background: tab === 'pipeline' ? 'rgba(79,195,247,0.14)' : 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }}
            >
              Pipeline
            </button>
            <button
              onClick={() => setTab('manual')}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${tab === 'manual' ? 'text-white' : 'text-white/70 hover:text-white'}`}
              style={{ background: tab === 'manual' ? 'rgba(79,195,247,0.14)' : 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }}
            >
              Presupuesto manual
            </button>

            <Link
              href="/demo/deco-house/bridge"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:text-white transition"
            >
              Bridge Deco House
            </Link>
            <button
              onClick={load}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:text-white transition inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </button>
            <button
              onClick={() => toggleGlobalPause(!globalPaused)}
              className="rounded-xl px-3 py-2 text-xs font-semibold inline-flex items-center gap-2"
              style={{
                background: globalPaused ? 'rgba(255,255,255,0.10)' : 'rgba(80,220,160,0.14)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {globalPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {globalPaused ? 'Reanudar bot (global)' : 'Pausar bot (global)'}
            </button>
            <button
              onClick={logout}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:text-white transition inline-flex items-center gap-2"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>

        {tab === 'pipeline' ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-6">
              {STAGES.map((stage) => (
                <div key={stage} className="rounded-2xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: BRAND.border }}>
                    <p className="text-sm font-semibold">{stage}</p>
                    <p className="text-xs text-white/60">{grouped.get(stage)!.length} lead(s)</p>
                  </div>
                  <div className="p-3 space-y-2 max-h-[70vh] overflow-auto">
                    {grouped.get(stage)!.map((l) => {
                      const on = selectedId === l.leadId;
                      const paused = l.bot_status === 'paused' || !!l.assignedTo;
                      return (
                        <button
                          key={l.leadId}
                          onClick={() => setSelectedId(l.leadId)}
                          className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                            on ? 'border-sky-300/40 bg-sky-400/10' : 'border-white/10 bg-black/20 hover:bg-black/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{l.senderName || l.senderId || 'Sin nombre'}</p>
                              <p className="text-[11px] text-white/60 truncate">{l.lastMessage || '—'}</p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] border ${
                                paused ? 'border-amber-400/30 text-amber-200 bg-amber-500/10' : 'border-emerald-400/30 text-emerald-200 bg-emerald-500/10'
                              }`}
                            >
                              {paused ? 'PAUSADO' : 'BOT'}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
                            <span>{l.platform || '—'}</span>
                            <span>{fmtWhen(l.lastMessageAt || l.createdAt)}</span>
                          </div>
                        </button>
                      );
                    })}
                    {grouped.get(stage)!.length === 0 && <p className="text-xs text-white/40 px-2 py-3">Sin leads</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl p-5" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Detalle</p>
                  <p className="text-xs text-white/60">Selecciona un lead para pausar/reanudar, mover en el pipeline o generar PDF.</p>
                </div>
                {selected && (
                  <button
                    onClick={downloadFromLead}
                    className="rounded-xl border px-4 py-2 text-xs font-semibold transition inline-flex items-center gap-2"
                    style={{ background: 'rgba(79,195,247,0.14)', borderColor: 'rgba(79,195,247,0.35)', color: '#e8f8ff' }}
                  >
                    <Download className="h-4 w-4" /> Descargar PDF
                  </button>
                )}
              </div>

              {!selected ? (
                <p className="mt-4 text-sm text-white/60">Ningún lead seleccionado.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/60">Lead</p>
                    <p className="text-sm font-semibold mt-1">{selected.senderName || selected.senderId || selected.leadId}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {selected.platform || '—'} · {fmtWhen(selected.lastMessageAt || selected.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/60">Pipeline</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {STAGES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStage(selected.leadId, s)}
                          className={`rounded-full px-3 py-1 text-[11px] border transition ${
                            String(selected.deco_stage || 'Nuevo') === s
                              ? 'border-sky-300/40 bg-sky-400/10 text-white'
                              : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/60">Bot</p>
                    <p className="text-sm font-semibold mt-1">{(selected.bot_status === 'paused' || selected.assignedTo) ? 'En pausa' : 'Activo'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleLeadPause(selected.leadId, !(selected.bot_status === 'paused' || selected.assignedTo))}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:text-white transition inline-flex items-center gap-2"
                      >
                        {(selected.bot_status === 'paused' || selected.assignedTo) ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        {(selected.bot_status === 'paused' || selected.assignedTo) ? 'Reanudar bot' : 'Pausar bot'}
                      </button>
                      <button
                        onClick={async () => {
                          await resetConversation(selected.senderId ?? '');
                          await load();
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:text-white transition inline-flex items-center gap-2"
                        title="Borra la sesión de chat — Elisa empezará desde cero con este cliente"
                      >
                        <MessageSquarePlus className="h-4 w-4" />
                        Nueva conversación
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading && <p className="mt-4 text-sm text-white/60">Cargando leads…</p>}
          </>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl p-6" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="text-lg font-bold">Presupuesto manual</h2>
              <p className="text-sm text-white/60 mt-1">Para cotizar leads que llegan por otros medios.</p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Cliente */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/70">Nombre</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.nombre} onChange={(e) => setManual((p) => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/70">WhatsApp</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.whatsapp} onChange={(e) => setManual((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="+56 9..." />
                </div>
                <div>
                  <label className="text-xs text-white/70">Email</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.email} onChange={(e) => setManual((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/70">Dirección</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.direccion} onChange={(e) => setManual((p) => ({ ...p, direccion: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/70">Comuna / Sector</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.comuna} onChange={(e) => setManual((p) => ({ ...p, comuna: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/70">Tipo de inmueble</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.tipo_inmueble} onChange={(e) => setManual((p) => ({ ...p, tipo_inmueble: e.target.value }))} placeholder="Casa / Depto / Oficina / Local..." />
                </div>

                {/* Producto */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/70">Producto</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.producto} onChange={(e) => setManual((p) => ({ ...p, producto: e.target.value }))} placeholder="Ventana / Mampara / Vidrio / Espejo..." />
                </div>
                <div>
                  <label className="text-xs text-white/70">Medidas (ancho × alto cm)</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.medidas} onChange={(e) => setManual((p) => ({ ...p, medidas: e.target.value }))} placeholder="ej. 120 × 200" />
                </div>
                <div>
                  <label className="text-xs text-white/70">Grosor (mm)</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.grosor} onChange={(e) => setManual((p) => ({ ...p, grosor: e.target.value }))} placeholder="4 / 5 / 6 / 8" />
                </div>
                <div>
                  <label className="text-xs text-white/70">Tipo de vidrio</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.tipo_vidrio} onChange={(e) => setManual((p) => ({ ...p, tipo_vidrio: e.target.value }))} placeholder="Crudo / Laminado / Templado / Espejo..." />
                </div>
                <div>
                  <label className="text-xs text-white/70">Perfil / Material</label>
                  <select className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.perfil} onChange={(e) => setManual((p) => ({ ...p, perfil: e.target.value }))}>
                    <option value="">— Sin perfil (solo vidrio) —</option>
                    <option>Aluminio</option>
                    <option>PVC</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/70">Color del perfil</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.color} onChange={(e) => setManual((p) => ({ ...p, color: e.target.value }))} placeholder="Blanco / Negro / Titanio..." />
                </div>
                <div>
                  <label className="text-xs text-white/70">Uso</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.uso} onChange={(e) => setManual((p) => ({ ...p, uso: e.target.value }))} placeholder="Residencial / Comercial / Baño..." />
                </div>
                <div>
                  <label className="text-xs text-white/70">Cantidad (unidades)</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.cantidad} onChange={(e) => setManual((p) => ({ ...p, cantidad: e.target.value }))} />
                </div>

                {/* Instalación */}
                <div>
                  <label className="text-xs text-white/70">Instalación</label>
                  <select className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.instalacion} onChange={(e) => setManual((p) => ({ ...p, instalacion: e.target.value }))}>
                    <option>Sí</option>
                    <option>No (solo producto)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/70">Piso / Altura</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.piso} onChange={(e) => setManual((p) => ({ ...p, piso: e.target.value }))} placeholder="Piso 1 / 3er piso con escaleras..." />
                </div>

                {/* Cotización */}
                <div>
                  <label className="text-xs text-white/70">Precio material (CLP)</label>
                  <input type="number" min="0" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.precio_material} onChange={(e) => setManual((p) => ({ ...p, precio_material: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-white/70">Costo instalación (CLP)</label>
                  <input type="number" min="0" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.costo_instalacion} onChange={(e) => setManual((p) => ({ ...p, costo_instalacion: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-white/70">Descuento (%)</label>
                  <input type="number" min="0" max="100" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.descuento} onChange={(e) => setManual((p) => ({ ...p, descuento: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-white/70">Tiempo de entrega</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.tiempo_entrega} onChange={(e) => setManual((p) => ({ ...p, tiempo_entrega: e.target.value }))} placeholder="5-7 días hábiles..." />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-white/70">Notas adicionales</label>
                  <textarea className="mt-1 w-full min-h-[80px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.notas} onChange={(e) => setManual((p) => ({ ...p, notas: e.target.value }))} />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={downloadManual}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold transition inline-flex items-center gap-2"
                  style={{ background: 'rgba(79,195,247,0.14)', borderColor: 'rgba(79,195,247,0.35)', color: '#e8f8ff' }}
                >
                  <Download className="h-4 w-4" /> Descargar PDF
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="text-lg font-bold">Vista previa</h2>
              <p className="text-sm text-white/60 mt-1">El PDF se genera con logo y colores Deco House.</p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs text-white/60">Resumen</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p><span className="text-white/60">Nombre:</span> {manual.nombre || '—'}</p>
                  <p><span className="text-white/60">WhatsApp:</span> {manual.whatsapp || '—'}</p>
                  <p><span className="text-white/60">Producto:</span> {manual.producto || '—'}</p>
                  <p><span className="text-white/60">Medidas:</span> {manual.medidas || '—'}{manual.grosor ? ` · ${manual.grosor}mm` : ''}</p>
                  <p><span className="text-white/60">Vidrio:</span> {manual.tipo_vidrio || '—'}</p>
                  <p><span className="text-white/60">Perfil:</span> {manual.perfil || 'Sin perfil'} {manual.color ? `· ${manual.color}` : ''}</p>
                  <p><span className="text-white/60">Cantidad:</span> {manual.cantidad || '—'} unidad(es)</p>
                  <p><span className="text-white/60">Instalación:</span> {manual.instalacion || '—'} {manual.piso ? `· ${manual.piso}` : ''}</p>
                  <p><span className="text-white/60">Dirección:</span> {manual.direccion || '—'}{manual.comuna ? `, ${manual.comuna}` : ''}</p>
                  {(parseFloat(manual.precio_material || '0') > 0 || parseFloat(manual.costo_instalacion || '0') > 0) && (
                    <p><span className="text-white/60">Total estimado:</span> $
                      {(
                        (parseFloat(manual.precio_material || '0') + parseFloat(manual.costo_instalacion || '0')) *
                        (1 - parseFloat(manual.descuento || '0') / 100) * 1.19
                      ).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-white/50">
                Tip: puedes usar esta sección aunque el lead no venga de WhatsApp/Facebook.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

