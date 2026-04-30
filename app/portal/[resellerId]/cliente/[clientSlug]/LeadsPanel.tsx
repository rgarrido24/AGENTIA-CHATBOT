'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { MessageCircle, RefreshCw, Plus, X } from 'lucide-react';

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
  form_display?:      string;
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

const ACCENT = '#CCFF00';

const STATUS_SEG_CONFIG: Record<StatusSeg, { label: string; bg: string; color: string }> = {
  nuevo:       { label: 'Nuevo',         bg: '#111',    color: '#666'    },
  contactado:  { label: 'Contactado',    bg: '#0d1a2b', color: '#60a5fa' },
  interesado:  { label: 'Interesado',    bg: '#1e1a00', color: '#fbbf24' },
  cerrado:     { label: 'Cerrado ✓',     bg: '#0d1f00', color: ACCENT    },
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

// ─── Compact LeadCard (list item) ────────────────────────────────────────────

function LeadCard({
  lead, isNew, isSelected, onClick,
}: {
  lead: Lead;
  isNew: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_SEG_CONFIG[lead.status_seguimiento];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
      style={{
        background: isSelected ? 'rgba(204,255,0,0.06)' : 'transparent',
        borderBottom: '1px solid #1a1a1a',
        borderLeft: isSelected ? `3px solid ${ACCENT}` : '3px solid transparent',
        animation: isNew ? 'slideDown 0.4s cubic-bezier(0.34,1.5,0.64,1)' : undefined,
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: isNew ? ACCENT : '#1e1e1e', color: isNew ? '#000' : '#555' }}
      >
        {initials(lead.nombre)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white truncate">{lead.nombre}</span>
          {isNew && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: ACCENT, color: '#000' }}>
              NUEVO
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: '#555' }}>
          {lead.telefono ? formatPhone(lead.telefono) : lead.email || '—'}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {lead.campana && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#0d1f00', color: ACCENT }}>
              {lead.campana.length > 20 ? lead.campana.slice(0, 20) + '…' : lead.campana}
            </span>
          )}
          <span className="text-[10px]" style={{ color: '#333' }}>{timeAgo(lead.createdAt)}</span>
        </div>
      </div>

      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full self-start mt-0.5" style={{ background: cfg.bg, color: cfg.color }}>
        {cfg.label}
      </span>
    </button>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetail({
  lead, resellerId, onStatusChange, onNoteAdded, onClose,
}: {
  lead: Lead;
  resellerId: string;
  onStatusChange: (leadId: string, status: StatusSeg) => void;
  onNoteAdded:    (leadId: string, nota: Nota) => void;
  onClose:        () => void;
}) {
  const [status,   setStatus]   = useState<StatusSeg>(lead.status_seguimiento);
  const [notas,    setNotas]    = useState<Nota[]>(lead.notas);
  const [showNota, setShowNota] = useState(false);
  const [notaText, setNotaText] = useState('');
  const [savingN,  setSavingN]  = useState(false);

  // Reset state when lead changes
  useEffect(() => {
    setStatus(lead.status_seguimiento);
    setNotas(lead.notas);
    setShowNota(false);
    setNotaText('');
  }, [lead.id, lead.status_seguimiento, lead.notas]);

  const ff = lead.form_fields || {};
  const normalizeKey = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const normMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const [k, v] of Object.entries(ff)) {
      if (typeof v !== 'string') continue;
      const vv = v.trim();
      if (!vv) continue;
      m.set(normalizeKey(k), vv);
    }
    return m;
  }, [ff]);
  const getField = (...keys: string[]) => {
    for (const k of keys) {
      const direct = ff[k];
      if (typeof direct === 'string' && direct.trim()) return direct.trim();
      const vv = normMap.get(normalizeKey(k));
      if (vv) return vv;
    }
    return '—';
  };

  const detailRows: [string, string][] = [
    ['NOMBRE',            lead.nombre || '—'],
    ['WHATSAPP',          lead.telefono ? formatPhone(lead.telefono) : '—'],
    ['EMAIL',             lead.email || '—'],
    ['FECHA',             fmtDate(lead.createdAt)],
    ['CON QUE CUENTAS',   getField('Con Que Contas?', 'Con Que Contas', 'Con qué contas?', 'Con qué cuentas', 'Con Que Cuentas', 'Con que cuentas', 'Con que contas')],
    ['CONFIRMA TU EDAD',  getField('Confirma Tu Edad', 'Confirma tu edad', 'Confirma Tu edad', 'Rango de edad', 'Rango Edad', 'Edad')],
    ['DNI',               getField('Dni', 'DNI', 'dni')],
  ];

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

  const cfg = STATUS_SEG_CONFIG[status];

  return (
    <div className="h-full flex flex-col" style={{ background: '#000' }}>
      {/* Detail header */}
      <div className="px-6 py-4 flex items-center gap-4 border-b" style={{ borderColor: '#1a1a1a' }}>
        <button type="button" onClick={onClose} className="lg:hidden p-1.5 rounded-lg" style={{ background: '#111', color: '#555' }}>
          ← Atrás
        </button>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: ACCENT, color: '#000' }}
        >
          {initials(lead.nombre)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg text-white truncate">{lead.nombre}</h2>
          <p className="text-sm" style={{ color: '#555' }}>{lead.form_display || lead.form_name || lead.form_id || lead.campana || lead.platform_src || 'Lead'}</p>
        </div>
        <span className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* Contact info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>Información de contacto</p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#1e1e1e' }}>
              {detailRows.map(([k, v], i) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 px-4 py-2.5 text-sm"
                  style={{ background: i % 2 === 0 ? '#0a0a0a' : '#0d0d0d', borderBottom: i < detailRows.length - 1 ? '1px solid #161616' : 'none' }}
                >
                  <dt className="text-xs shrink-0" style={{ color: '#444' }}>{k}</dt>
                  <dd className="font-medium text-right text-white text-xs max-w-[220px] truncate" title={v}>{v}</dd>
                </div>
              ))}
            </div>
          </div>

          {/* Status selector */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>Estado de seguimiento</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_SEG_OPTIONS.map((s) => {
                const c = STATUS_SEG_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeStatus(s)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition"
                    style={{
                      background: status === s ? c.bg : '#0d0d0d',
                      color:      status === s ? c.color : '#444',
                      border:     `1px solid ${status === s ? c.color + '55' : '#1e1e1e'}`,
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT }}>
                Notas {notas.length > 0 && `(${notas.length})`}
              </p>
              {!showNota && (
                <button
                  type="button"
                  onClick={() => setShowNota(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: '#111', color: '#555', border: '1px solid #1e1e1e' }}
                >
                  <Plus className="w-3 h-3" />Agregar nota
                </button>
              )}
            </div>

            {showNota && (
              <div className="mb-4">
                <textarea
                  value={notaText}
                  onChange={(e) => setNotaText(e.target.value)}
                  placeholder="Escribe una nota…"
                  rows={3}
                  autoFocus
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#333] outline-none resize-none"
                  style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={submitNota}
                    disabled={savingN || !notaText.trim()}
                    className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition"
                    style={{ background: ACCENT, color: '#000' }}
                  >
                    {savingN ? 'Guardando…' : 'Guardar nota'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNota(false); setNotaText(''); }}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ background: '#111', color: '#555' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {notas.length > 0 ? (
              <div className="space-y-2">
                {[...notas].reverse().map((n, i) => (
                  <div key={i} className="rounded-xl px-4 py-3" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
                    <p className="text-sm" style={{ color: '#ccc' }}>{n.texto}</p>
                    <p className="mt-1.5 text-xs" style={{ color: '#333' }}>
                      {n.autor} · {timeAgo(n.fecha)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#2a2a2a' }}>Sin notas aún.</p>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp CTA — sticky bottom */}
      {lead.telefono && (
        <div className="p-4 border-t" style={{ borderColor: '#1a1a1a' }}>
          <a
            href={waUrl(lead.telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: '#16a34a', color: '#fff' }}
          >
            <MessageCircle className="w-4 h-4" />
            Abrir WhatsApp — {formatPhone(lead.telefono)}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Empty state for detail panel ────────────────────────────────────────────

function EmptyDetail() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
        👤
      </div>
      <p className="text-sm font-medium" style={{ color: '#444' }}>Seleccioná un lead</p>
      <p className="text-xs" style={{ color: '#222' }}>Hacé clic en cualquier lead de la lista para ver el detalle completo.</p>
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
  const [selectedId,   setSelectedId]  = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const apiBase = `/api/portal/${resellerId}/client/${clientSlug}/leads`;

  const fetchLeads = useCallback(async (isFirst = false, formId = '') => {
    try {
      const qs   = formId ? `?formId=${encodeURIComponent(formId)}` : '';
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

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  function handleStatusChange(leadId: string, status: StatusSeg) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status_seguimiento: status } : l));
  }
  function handleNoteAdded(leadId: string, nota: Nota) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, notas: [...l.notas, nota] } : l));
  }

  const kpis = [
    { label: 'Total',       value: leads.length, bump: totalBump },
    { label: 'Hoy',         value: totalHoy },
    { label: 'Esta semana', value: totalSemana },
    { label: 'Contactados', value: contactados },
  ];

  return (
    <>
      <style>{`
        body { background: #000; margin: 0; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes countBump { 0% { transform:scale(1.3); } 100% { transform:scale(1); } }
      `}</style>

      <div className="flex flex-col" style={{ height: '100dvh', background: '#000' }}>

        {/* ── Header ── */}
        <header className="shrink-0 border-b px-4 py-3" style={{ background: '#000', borderColor: '#1a1a1a' }}>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Back + title */}
            <div className="flex items-center gap-3 mr-auto min-w-0">
              <Link href={`/portal/${resellerId}/dashboard`} className="text-xs shrink-0 px-2 py-1 rounded-lg" style={{ color: '#444', background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
                ← Dashboard
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: ACCENT }}>{clientNombre}</p>
                <p className="font-bold text-sm text-white leading-tight">Panel de Leads</p>
              </div>
            </div>

            {/* KPIs in one row */}
            <div className="flex items-center gap-2 flex-wrap">
              {kpis.map(({ label, value, bump }) => (
                <div
                  key={label}
                  className="rounded-xl border px-3 py-1.5 text-center min-w-[60px]"
                  style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
                >
                  <p
                    key={bump ? value : 0}
                    className="text-base font-extrabold tabular-nums leading-tight"
                    style={{ color: ACCENT, animation: bump ? 'countBump 0.4s ease' : undefined }}
                  >
                    {value}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: '#444' }}>{label}</p>
                </div>
              ))}

              {/* Refresh + live indicator */}
              <button
                type="button"
                onClick={() => fetchLeads(false, selectedForm)}
                className="p-2 rounded-lg"
                style={{ background: '#0d0d0d', color: '#444', border: '1px solid #1e1e1e' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ background: '#0d1f00', borderColor: `${ACCENT}44` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                <span
                  key={totalBump ? leads.length : 0}
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: ACCENT, animation: totalBump ? 'countBump 0.4s ease' : undefined }}
                >
                  {leads.length}
                </span>
              </div>
            </div>
          </div>

          {/* Form selector */}
          {formOptions.length > 0 && (
            <div className="mt-2">
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="appearance-none rounded-lg px-3 py-1.5 text-xs font-medium max-w-xs"
                style={{ background: '#0d0d0d', color: '#aaa', border: '1px solid #1e1e1e', outline: 'none' }}
              >
                <option value="">Todos los formularios</option>
                {formOptions.map((f) => (
                  <option key={f.id} value={f.id}>{f.name || f.id}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* ── Two-column body ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left: Lead list (hidden on mobile when detail is open) */}
          <div
            className={`leads-list flex flex-col overflow-hidden border-r ${selectedLead ? 'hidden lg:flex' : 'flex'}`}
            style={{
              width: '100%',
              borderColor: '#1a1a1a',
            }}
            // On lg+, fixed width
          >
            <style>{`@media (min-width: 1024px) { .leads-list { width: 380px !important; min-width: 380px; } }`}</style>
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: '100%', height: '100%', background: '#000' }}
            >
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm" style={{ color: '#2a2a2a' }}>Cargando leads…</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-sm font-medium" style={{ color: '#333' }}>Sin leads aún</p>
                  <p className="text-xs" style={{ color: '#1e1e1e' }}>Aparecerán aquí automáticamente cuando lleguen.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isNew={newIds.has(lead.id)}
                      isSelected={selectedId === lead.id}
                      onClick={() => setSelectedId(lead.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Detail panel */}
          <div
            className={`flex-1 overflow-hidden ${selectedLead ? 'flex' : 'hidden lg:flex'}`}
            style={{ background: '#050505' }}
          >
            {selectedLead ? (
              <div className="w-full">
                <LeadDetail
                  lead={selectedLead}
                  resellerId={resellerId}
                  onStatusChange={handleStatusChange}
                  onNoteAdded={handleNoteAdded}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
