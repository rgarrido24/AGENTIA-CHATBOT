'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MessageCircle, ChevronDown, ChevronUp, RefreshCw, Plus, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusSeg = 'nuevo' | 'contactado' | 'interesado' | 'cerrado' | 'no_contesto';
type EstadoLegacy = 'nuevo' | 'contactado' | 'en_seguimiento';

type Nota = { texto: string; autor: string; fecha: string };

type Lead = {
  id:                 string;
  nombre:             string;
  telefono:           string;
  email:              string;
  campana:            string;
  adset:              string;
  canal_origen:       string;
  form_id:            string;
  form_name:          string;
  page_name:          string;
  platform_src:       string;
  form_fields:        Record<string, string>;
  estado:             EstadoLegacy;
  status_seguimiento: StatusSeg;
  notas:              Nota[];
  createdAt:          string;
};

type FormOption = { id: string; name: string };

// ─── Utils ────────────────────────────────────────────────────────────────────

const ACCENT = '#22c55e';

const STATUS_SEG_CONFIG: Record<StatusSeg, { label: string; bg: string; color: string }> = {
  nuevo:       { label: 'Nuevo',         bg: '#111',    color: '#666'    },
  contactado:  { label: 'Contactado',    bg: '#0d1a2b', color: '#60a5fa' },
  interesado:  { label: 'Interesado',    bg: '#1e1a00', color: '#fbbf24' },
  cerrado:     { label: 'Cerrado ✓',     bg: '#0d2200', color: '#22c55e' },
  no_contesto: { label: 'No contestó',   bg: '#1a0a0a', color: '#ef4444' },
};

const STATUS_SEG_OPTIONS: StatusSeg[] = ['nuevo', 'contactado', 'interesado', 'cerrado', 'no_contesto'];

function waUrl(tel: string) { return `https://wa.me/${tel.replace(/\D/g, '')}`; }

function formatPhone(tel: string) {
  const d = tel.replace(/\D/g, '');
  if (d.startsWith('5493') && d.length === 13) return `+54 351 ${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length >= 10) return `+${d}`;
  return tel || '—';
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90)     return 'hace un momento';
  if (s < 3600)   return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400)  return `hace ${Math.floor(s / 3600)} h`;
  if (s < 172800) return 'ayer';
  return `hace ${Math.floor(s / 86400)} días`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function humanLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function playBeep() {
  try {
    type WA = typeof window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext || (window as WA).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 820;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22); ctx.close();
  } catch { /* silent */ }
}

// ─── LeadCard ────────────────────────────────────────────────────────────────

function LeadCard({
  lead, isNew, resellerId, onStatusChange, onNoteAdded,
}: {
  lead: Lead;
  isNew: boolean;
  resellerId: string;
  onStatusChange: (leadId: string, status: StatusSeg) => void;
  onNoteAdded:    (leadId: string, nota: Nota) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [status,    setStatus]    = useState<StatusSeg>(lead.status_seguimiento);
  const [notas,     setNotas]     = useState<Nota[]>(lead.notas);
  const [showNota,  setShowNota]  = useState(false);
  const [notaText,  setNotaText]  = useState('');
  const [savingN,   setSavingN]   = useState(false);

  const STANDARD = new Set(['Dni', 'Confirma Tu Edad', 'Con Que Contas']);
  const detailRows: [string, string][] = [
    ['Nombre',         lead.nombre                            || '—'],
    ['WhatsApp',       lead.telefono ? formatPhone(lead.telefono) : '—'],
    ['Email',          lead.email                             || '—'],
    ['DNI',            lead.form_fields['Dni']                || '—'],
    ['Edad',           lead.form_fields['Confirma Tu Edad']   || '—'],
    ['Con qué cuenta', lead.form_fields['Con Que Contas']     || '—'],
    ['Plataforma',     lead.platform_src                      || '—'],
    ['Formulario',     lead.form_name || lead.form_id         || '—'],
    ['Fecha',          fmtDate(lead.createdAt)],
  ];
  for (const [k, v] of Object.entries(lead.form_fields)) {
    if (v && !STANDARD.has(k)) detailRows.push([humanLabel(k), v]);
  }

  const cfg = STATUS_SEG_CONFIG[status];

  async function changeStatus(s: StatusSeg) {
    setStatus(s);
    onStatusChange(lead.id, s);
    await fetch(`/api/leads/${encodeURIComponent(lead.id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_seguimiento: s }),
    }).catch(console.error);
  }

  async function submitNota() {
    if (!notaText.trim()) return;
    setSavingN(true);
    const res = await fetch(`/api/leads/${encodeURIComponent(lead.id)}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: notaText.trim(), autor: resellerId }),
    }).catch(() => null);
    if (res?.ok) {
      const nueva: Nota = { texto: notaText.trim(), autor: resellerId, fecha: new Date().toISOString() };
      setNotas((prev) => [...prev, nueva]);
      onNoteAdded(lead.id, nueva);
      setNotaText('');
      setShowNota(false);
    }
    setSavingN(false);
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: '#0d0d0d',
        borderColor: isNew ? ACCENT : '#1e1e1e',
        boxShadow: isNew ? `0 0 0 2px ${ACCENT}33` : 'none',
        animation: isNew ? 'slideDown 0.4s cubic-bezier(0.34,1.5,0.64,1)' : undefined,
      }}
    >
      {/* Header row */}
      <button
        type="button"
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded((p) => !p)}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          style={{ background: ACCENT, color: '#000' }}
        >
          {initials(lead.nombre)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[15px] text-white">{lead.nombre}</span>
            {isNew && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                style={{ background: ACCENT, color: '#000' }}
              >
                ● NUEVO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: '#666' }}>{formatPhone(lead.telefono)}</span>
            {lead.telefono && (
              <a
                href={waUrl(lead.telefono)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: '#16a34a', color: '#fff' }}
              >
                <MessageCircle className="w-3 h-3" />WhatsApp
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {lead.campana && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#0d2200', color: ACCENT }}>
                {lead.campana}
              </span>
            )}
            <span className="text-[10px]" style={{ color: '#444' }}>{timeAgo(lead.createdAt)}</span>
            {notas.length > 0 && (
              <span className="text-[10px]" style={{ color: '#555' }}>
                {notas.length} nota{notas.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Status badge + chevron */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 mt-0.5" style={{ color: '#333' }} />
                    : <ChevronDown className="w-4 h-4 mt-0.5" style={{ color: '#333' }} />}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t px-4 pb-4" style={{ borderColor: '#1a1a1a' }}>
          {/* Detail rows */}
          <dl className="mt-3 space-y-1.5">
            {detailRows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-xs">
                <dt className="shrink-0" style={{ color: '#444' }}>{k}</dt>
                <dd className="font-medium text-right truncate max-w-[200px] text-white" title={v}>{v}</dd>
              </div>
            ))}
          </dl>

          {/* Status selector */}
          <div className="mt-4">
            <p className="text-[10px] mb-1.5" style={{ color: '#444' }}>Estado de seguimiento</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_SEG_OPTIONS.map((s) => {
                const c = STATUS_SEG_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeStatus(s)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition"
                    style={{
                      background: status === s ? c.bg : '#111',
                      color: status === s ? c.color : '#444',
                      border: `1px solid ${status === s ? c.color + '44' : '#222'}`,
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {notas.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px]" style={{ color: '#444' }}>Notas</p>
              {notas.map((n, i) => (
                <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                  <p style={{ color: '#ccc' }}>{n.texto}</p>
                  <p className="mt-1 text-[10px]" style={{ color: '#444' }}>
                    {n.autor} · {timeAgo(n.fecha)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add note */}
          {showNota ? (
            <div className="mt-3">
              <textarea
                value={notaText}
                onChange={(e) => setNotaText(e.target.value)}
                placeholder="Escribe una nota…"
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#444] outline-none resize-none"
                style={{ background: '#111', border: '1px solid #2a2a2a' }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={submitNota}
                  disabled={savingN || !notaText.trim()}
                  className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                  style={{ background: ACCENT, color: '#000' }}
                >
                  {savingN ? 'Guardando…' : 'Guardar nota'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNota(false); setNotaText(''); }}
                  className="px-3 py-2 rounded-xl text-xs"
                  style={{ background: '#111', color: '#555' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNota(true)}
              className="mt-3 flex items-center gap-1.5 text-xs"
              style={{ color: '#555' }}
            >
              <Plus className="w-3.5 h-3.5" />Agregar nota
            </button>
          )}

          {/* WhatsApp CTA */}
          {lead.telefono && (
            <a
              href={waUrl(lead.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: ACCENT, color: '#000' }}
            >
              <MessageCircle className="w-4 h-4" />Abrir WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function LeadsPanel({ resellerId, clientSlug }: { resellerId: string; clientSlug: string }) {
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [formOptions,  setFormOptions]  = useState<FormOption[]>([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [clientNombre, setClientNombre] = useState(clientSlug);
  const [newIds,       setNewIds]       = useState<Set<string>>(new Set());
  const [loading,      setLoading]      = useState(true);
  const [totalBump,    setTotalBump]    = useState(false);
  const knownIds = useRef<Set<string>>(new Set());

  const apiBase = `/api/portal/${resellerId}/client/${clientSlug}/leads`;

  const fetchLeads = useCallback(async (isFirst = false, formId = '') => {
    try {
      const qs  = formId ? `?formId=${encodeURIComponent(formId)}` : '';
      const res  = await fetch(`${apiBase}${qs}`, { cache: 'no-store' });
      if (!res.ok) { if (isFirst) setLoading(false); return; }
      const data = await res.json() as { leads: Lead[]; formIds: FormOption[]; clientNombre: string };
      const incoming = data.leads ?? [];
      setFormOptions(data.formIds ?? []);
      setClientNombre(data.clientNombre || clientSlug);

      if (isFirst) {
        knownIds.current = new Set(incoming.map((l) => l.id));
        setLeads(incoming);
        setLoading(false);
        return;
      }

      const fresh = incoming.filter((l) => !knownIds.current.has(l.id));
      if (fresh.length > 0) {
        const freshSet = new Set(fresh.map((l) => l.id));
        fresh.forEach((l) => knownIds.current.add(l.id));
        setLeads(incoming);
        setNewIds((prev) => new Set([...prev, ...freshSet]));
        setTotalBump(true);
        setTimeout(() => setTotalBump(false), 400);
        setTimeout(() => setNewIds((prev) => { const n = new Set(prev); freshSet.forEach((id) => n.delete(id)); return n; }), 6000);
        playBeep();
      } else {
        setLeads(incoming);
      }
    } catch (err) {
      console.error('[portal/leads] fetch error:', err);
      if (isFirst) setLoading(false);
    }
  }, [apiBase, clientSlug]);

  useEffect(() => { fetchLeads(true, selectedForm); }, [fetchLeads]);

  useEffect(() => {
    knownIds.current = new Set();
    setLoading(true);
    fetchLeads(true, selectedForm);
  }, [selectedForm, fetchLeads]);

  useEffect(() => {
    const t = setInterval(() => fetchLeads(false, selectedForm), 30_000);
    return () => clearInterval(t);
  }, [fetchLeads, selectedForm]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const week    = new Date(); week.setDate(week.getDate() - 7);
  const totalHoy    = leads.filter((l) => new Date(l.createdAt) >= today).length;
  const totalSemana = leads.filter((l) => new Date(l.createdAt) >= week).length;
  const contactados = leads.filter((l) => l.status_seguimiento !== 'nuevo').length;

  function handleStatusChange(leadId: string, status: StatusSeg) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status_seguimiento: status } : l));
  }
  function handleNoteAdded(leadId: string, nota: Nota) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, notas: [...l.notas, nota] } : l));
  }

  return (
    <>
      <style>{`
        body { background: #000; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes countBump { 0% { transform:scale(1.3); } 100% { transform:scale(1); } }
      `}</style>

      <div className="min-h-screen" style={{ background: '#000' }}>
        {/* Header */}
        <header className="sticky top-0 z-10 border-b px-4 py-3" style={{ background: '#000', borderColor: '#1a1a1a' }}>
          <div className="max-w-lg mx-auto space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Link href={`/portal/${resellerId}/dashboard`} className="text-xs shrink-0" style={{ color: '#555' }}>
                  ← Dashboard
                </Link>
                <div className="min-w-0 ml-1">
                  <p className="text-[11px] font-semibold truncate" style={{ color: ACCENT }}>{clientNombre}</p>
                  <p className="font-bold text-sm text-white leading-tight">Panel de Leads</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchLeads(false, selectedForm)}
                  className="p-1.5 rounded-lg"
                  style={{ background: '#111', color: '#555' }}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{ background: '#0d2200', borderColor: `${ACCENT}55` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                  <span
                    key={totalBump ? leads.length : 0}
                    className="text-xs font-semibold"
                    style={{ color: ACCENT, animation: totalBump ? 'countBump 0.4s ease' : undefined }}
                  >
                    {leads.length} leads
                  </span>
                </div>
              </div>
            </div>

            {/* Form selector */}
            {formOptions.length > 0 && (
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="w-full appearance-none rounded-lg px-3 py-2 text-xs font-medium"
                style={{ background: '#111', color: '#ccc', border: '1px solid #2a2a2a', outline: 'none' }}
              >
                <option value="">Todos los formularios</option>
                {formOptions.map((f) => (
                  <option key={f.id} value={f.id}>{f.name || f.id}</option>
                ))}
              </select>
            )}
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 pb-16 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total',       value: leads.length, bump: totalBump },
              { label: 'Hoy',         value: totalHoy },
              { label: 'Esta semana', value: totalSemana },
              { label: 'Contactados', value: contactados },
            ].map(({ label, value, bump }) => (
              <div key={label} className="rounded-xl border px-1 py-3 text-center" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
                <p
                  key={bump ? value : 0}
                  className="text-xl font-extrabold tabular-nums"
                  style={{ color: ACCENT, animation: bump ? 'countBump 0.4s ease' : undefined }}
                >
                  {value}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: '#555' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Leads */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm" style={{ color: '#333' }}>Cargando leads…</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <p className="text-sm font-medium" style={{ color: '#444' }}>Sin leads aún</p>
              <p className="text-xs" style={{ color: '#2a2a2a' }}>Aparecerán aquí automáticamente cuando lleguen.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isNew={newIds.has(lead.id)}
                  resellerId={resellerId}
                  onStatusChange={handleStatusChange}
                  onNoteAdded={handleNoteAdded}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="text-center pb-6 pt-2">
          <p className="text-[11px]" style={{ color: '#1e1e1e' }}>
            Powered by{' '}
            <a href="https://agentia.software" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#2a2a2a' }}>
              agentia.software
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
