'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Pause, Play, RefreshCw } from 'lucide-react';

type Lead = {
  leadId: string;
  senderName?: string;
  senderId?: string;
  clientId?: string;
  platform?: string;
  lastMessage?: string;
  lastMessageAt?: string | null;
  createdAt?: string | null;
  bot_status?: 'active' | 'paused';
  assignedTo?: string | null;
  deco_stage?: string;
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

function fmtWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function generateQuotePdf(lead: Lead) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(7, 20, 20);
  doc.rect(0, 0, W, 76, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Deco House — Presupuesto', 40, 48);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.text(`Lead: ${lead.senderName || lead.senderId || lead.leadId}`, 40, 120);
  doc.text(`Canal: ${lead.platform || '—'}`, 40, 140);
  doc.text(`Etapa: ${lead.deco_stage || 'Nuevo'}`, 40, 160);
  doc.text(`Creado: ${fmtWhen(lead.createdAt)}`, 40, 180);
  doc.text(`Último mensaje: ${fmtWhen(lead.lastMessageAt)}`, 40, 200);

  doc.setFontSize(11);
  const msg = (lead.lastMessage || '').trim();
  const lines = doc.splitTextToSize(msg ? `Mensaje:\n${msg}` : 'Mensaje:\n—', W - 80);
  doc.text(lines, 40, 232);

  doc.save(`decohouse-presupuesto-${(lead.senderId || lead.leadId).slice(-8)}.pdf`);
}

export default function DecoHouseRealPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [globalPaused, setGlobalPaused] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#071414] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-white/60">Deco House</p>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline de Leads + Presupuesto</h1>
            <p className="text-sm text-white/60 mt-1">
              clientId: <span className="font-mono text-white/80">{CLIENT_ID}</span> · Actualiza cada 15s
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-6">
          {STAGES.map((stage) => (
            <div key={stage} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
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
                        on ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/20 hover:bg-black/30'
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

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Detalle</p>
              <p className="text-xs text-white/60">Selecciona un lead para pausar/reanudar, mover en el pipeline o generar PDF.</p>
            </div>
            {selected && (
              <button
                onClick={() => generateQuotePdf(selected)}
                className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20 transition inline-flex items-center gap-2"
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
                          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
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

        <p className="mt-6 text-xs text-white/40">
          Demo mock anterior guardada en{' '}
          <Link className="underline hover:text-white" href="/demo/vidrieria">/demo/vidrieria</Link>
        </p>

        {loading && <p className="mt-4 text-sm text-white/60">Cargando leads…</p>}
      </div>
    </div>
  );
}

