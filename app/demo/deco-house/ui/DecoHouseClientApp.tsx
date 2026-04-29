'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, LogOut, Pause, Play, RefreshCw } from 'lucide-react';

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
  comuna: string;
  direccion: string;
  cantidad: string;
  perfil: string;
  color: string;
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

async function generateDecoPdf(params: {
  title: string;
  subtitle?: string;
  rows: Array<[string, string]>;
  filename: string;
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(7, 20, 20);
  doc.rect(0, 0, W, 86, 'F');

  // Logo (best effort)
  try {
    const dataUrl = await imageUrlToDataUrl('/deco-logo.png');
    // PNG
    doc.addImage(dataUrl, 'PNG', W - 140, 18, 100, 50, undefined, 'FAST');
  } catch {
    // ignore
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(params.title, 40, 46);
  if (params.subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(220, 235, 235);
    doc.text(params.subtitle, 40, 68);
  }

  // Body
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  let y = 120;
  for (const [k, v] of params.rows) {
    const key = (k || '').trim();
    const val = (v || '—').trim() || '—';
    doc.setFont('helvetica', 'bold');
    doc.text(`${key}:`, 40, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(val, W - 140);
    doc.text(lines, 140, y);
    y += Math.max(18, lines.length * 14);
    if (y > H - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.save(params.filename);
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
    comuna: '',
    direccion: '',
    cantidad: '1',
    perfil: 'Aluminio',
    color: '',
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
    await generateDecoPdf({
      title: 'Deco House — Presupuesto',
      subtitle: 'Generado desde pipeline',
      rows: [
        ['Cliente', selected.senderName || '—'],
        ['WhatsApp', selected.senderId || '—'],
        ['Canal', selected.platform || '—'],
        ['Etapa', selected.deco_stage || 'Nuevo'],
        ['Creado', fmtWhen(selected.createdAt)],
        ['Último mensaje', fmtWhen(selected.lastMessageAt)],
        ['Mensaje', selected.lastMessage || '—'],
      ],
      filename: `decohouse-presupuesto-${(selected.senderId || selected.leadId).slice(-8)}.pdf`,
    });
  }, [selected]);

  const downloadManual = useCallback(async () => {
    const title = 'Deco House — Presupuesto';
    await generateDecoPdf({
      title,
      subtitle: 'Presupuesto manual',
      rows: [
        ['Nombre', manual.nombre || '—'],
        ['WhatsApp', manual.whatsapp || '—'],
        ['Email', manual.email || '—'],
        ['Producto', manual.producto || '—'],
        ['Medidas', manual.medidas || '—'],
        ['Comuna / Sector', manual.comuna || '—'],
        ['Dirección', manual.direccion || '—'],
        ['Cantidad', manual.cantidad || '—'],
        ['Perfil', manual.perfil || '—'],
        ['Color', manual.color || '—'],
        ['Notas', manual.notas || '—'],
      ],
      filename: `decohouse-presupuesto-manual-${Date.now()}.pdf`,
    });
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
              href="/dashboard/whatsapp"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:text-white transition"
            >
              WhatsApp Bridge
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
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => toggleLeadPause(selected.leadId, !(selected.bot_status === 'paused' || selected.assignedTo))}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:text-white transition inline-flex items-center gap-2"
                      >
                        {(selected.bot_status === 'paused' || selected.assignedTo) ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        {(selected.bot_status === 'paused' || selected.assignedTo) ? 'Reanudar bot' : 'Pausar bot'}
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
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/70">Producto</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.producto} onChange={(e) => setManual((p) => ({ ...p, producto: e.target.value }))} placeholder="Ventana / Mampara / PVC..." />
                </div>
                <div>
                  <label className="text-xs text-white/70">Medidas</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.medidas} onChange={(e) => setManual((p) => ({ ...p, medidas: e.target.value }))} placeholder="ancho × alto (cm)" />
                </div>
                <div>
                  <label className="text-xs text-white/70">Cantidad (unidades)</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.cantidad} onChange={(e) => setManual((p) => ({ ...p, cantidad: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/70">Comuna / Sector</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.comuna} onChange={(e) => setManual((p) => ({ ...p, comuna: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/70">Dirección</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.direccion} onChange={(e) => setManual((p) => ({ ...p, direccion: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/70">Perfil</label>
                  <select className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.perfil} onChange={(e) => setManual((p) => ({ ...p, perfil: e.target.value }))}>
                    <option>Aluminio</option>
                    <option>PVC</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/70">Color</label>
                  <input className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                    value={manual.color} onChange={(e) => setManual((p) => ({ ...p, color: e.target.value }))} placeholder="Negro / Blanco / ..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/70">Notas</label>
                  <textarea className="mt-1 w-full min-h-[90px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
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
                  <p><span className="text-white/60">Medidas:</span> {manual.medidas || '—'}</p>
                  <p><span className="text-white/60">Cantidad:</span> {manual.cantidad || '—'} unidad(es)</p>
                  <p><span className="text-white/60">Perfil:</span> {manual.perfil || '—'} {manual.color ? `· ${manual.color}` : ''}</p>
                  <p><span className="text-white/60">Dirección:</span> {manual.direccion || '—'}</p>
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

