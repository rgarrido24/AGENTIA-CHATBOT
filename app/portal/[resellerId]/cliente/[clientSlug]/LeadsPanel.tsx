'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { MessageCircle, Moon, RefreshCw, Plus, Sun, Trash2, X } from 'lucide-react';
import {
  isLucianoReseller,
  LUCINO_PRODUCT_TITLE,
  LUCINO_THEME_STORAGE_KEY,
  type LucianoThemeMode,
} from '@/lib/portal-luciano-ui';

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
const EMERALD = '#50C878';

const STATUS_SEG_CONFIG: Record<StatusSeg, { label: string; bg: string; color: string }> = {
  nuevo:       { label: 'Nuevo',         bg: '#111',    color: '#666'    },
  contactado:  { label: 'Contactado',    bg: '#0d1a2b', color: '#60a5fa' },
  interesado:  { label: 'Interesado',    bg: '#1e1a00', color: '#fbbf24' },
  cerrado:     { label: 'Cerrado ✓',     bg: '#0d1f00', color: ACCENT    },
  no_contesto: { label: 'No contestó',   bg: '#1a0a0a', color: '#ef4444' },
};

const STATUS_SEG_OPTIONS: StatusSeg[] = ['nuevo', 'contactado', 'interesado', 'cerrado', 'no_contesto'];

export type LeadUITokens = {
  accent: string;
  bodyStyle: string;
  pageBg: string;
  shellBg: string;
  headerBg: string;
  headerBorder: string;
  backLinkBg: string;
  backLinkBorder: string;
  backLinkColor: string;
  clientNameColor: string;
  panelTitleColor: string;
  kpiBg: string;
  kpiBorder: string;
  kpiLabel: string;
  refreshBtnBg: string;
  refreshBtnBorder: string;
  refreshBtnColor: string;
  livePillBg: string;
  livePillBorder: string;
  selectBg: string;
  selectColor: string;
  selectBorder: string;
  listBorder: string;
  listInnerBg: string;
  loadingText: string;
  emptyTitle: string;
  emptyHint: string;
  detailAsideBg: string;
  statusSeg: Record<StatusSeg, { label: string; bg: string; color: string }>;
  leadRowSelected: string;
  leadRowBorder: string;
  leadName: string;
  leadMuted: string;
  leadTime: string;
  chipBg: string;
  chipFg: string;
  avatarIdleBg: string;
  avatarIdleFg: string;
  detailRootBg: string;
  detailHeaderBorder: string;
  detailBackBtnBg: string;
  detailBackBtnColor: string;
  detailTitle: string;
  detailSubtitle: string;
  rowEven: string;
  rowOdd: string;
  rowBorder: string;
  dtColor: string;
  ddColor: string;
  pillInactiveBg: string;
  pillInactiveFg: string;
  pillInactiveBorder: string;
  textareaBg: string;
  textareaBorder: string;
  textareaPlaceholder: string;
  textareaText: string;
  ghostBtnBg: string;
  ghostBtnColor: string;
  noteCardBg: string;
  noteCardBorder: string;
  noteText: string;
  noteMeta: string;
  emptyNotes: string;
  waBarBorder: string;
  emptyIconBg: string;
  emptyIconBorder: string;
  emptyDetailTitle: string;
  emptyDetailHint: string;
};

const STATUS_SEG_LIGHT: Record<StatusSeg, { label: string; bg: string; color: string }> = {
  nuevo:       { label: 'Nuevo',         bg: '#f1f5f9', color: '#64748b' },
  contactado:  { label: 'Contactado',    bg: '#eff6ff', color: '#2563eb' },
  interesado:  { label: 'Interesado',    bg: '#fffbeb', color: '#b45309' },
  cerrado:     { label: 'Cerrado ✓',     bg: '#ecfdf5', color: '#047857' },
  no_contesto: { label: 'No contestó',   bg: '#fef2f2', color: '#b91c1c' },
};

const TOKENS_DARK: LeadUITokens = {
  accent: ACCENT,
  bodyStyle: '#000',
  pageBg: '#000',
  shellBg: '#000',
  headerBg: '#000',
  headerBorder: '#1a1a1a',
  backLinkBg: '#0d0d0d',
  backLinkBorder: '#1e1e1e',
  backLinkColor: '#444',
  clientNameColor: ACCENT,
  panelTitleColor: '#fff',
  kpiBg: '#0d0d0d',
  kpiBorder: '#1e1e1e',
  kpiLabel: '#444',
  refreshBtnBg: '#0d0d0d',
  refreshBtnBorder: '#1e1e1e',
  refreshBtnColor: '#444',
  livePillBg: '#0d1f00',
  livePillBorder: `${ACCENT}44`,
  selectBg: '#0d0d0d',
  selectColor: '#aaa',
  selectBorder: '#1e1e1e',
  listBorder: '#1a1a1a',
  listInnerBg: '#000',
  loadingText: '#2a2a2a',
  emptyTitle: '#333',
  emptyHint: '#1e1e1e',
  detailAsideBg: '#050505',
  statusSeg: STATUS_SEG_CONFIG,
  leadRowSelected: 'rgba(204,255,0,0.06)',
  leadRowBorder: '#1a1a1a',
  leadName: '#fff',
  leadMuted: '#555',
  leadTime: '#333',
  chipBg: '#0d1f00',
  chipFg: ACCENT,
  avatarIdleBg: '#1e1e1e',
  avatarIdleFg: '#555',
  detailRootBg: '#000',
  detailHeaderBorder: '#1a1a1a',
  detailBackBtnBg: '#111',
  detailBackBtnColor: '#555',
  detailTitle: '#fff',
  detailSubtitle: '#555',
  rowEven: '#0a0a0a',
  rowOdd: '#0d0d0d',
  rowBorder: '#161616',
  dtColor: '#444',
  ddColor: '#fff',
  pillInactiveBg: '#0d0d0d',
  pillInactiveFg: '#444',
  pillInactiveBorder: '#1e1e1e',
  textareaBg: '#0d0d0d',
  textareaBorder: '#2a2a2a',
  textareaPlaceholder: '#333',
  textareaText: '#fff',
  ghostBtnBg: '#111',
  ghostBtnColor: '#555',
  noteCardBg: '#0d0d0d',
  noteCardBorder: '#1a1a1a',
  noteText: '#ccc',
  noteMeta: '#333',
  emptyNotes: '#2a2a2a',
  waBarBorder: '#1a1a1a',
  emptyIconBg: '#0d0d0d',
  emptyIconBorder: '#1e1e1e',
  emptyDetailTitle: '#444',
  emptyDetailHint: '#222',
};

const TOKENS_LIGHT: LeadUITokens = {
  accent: EMERALD,
  bodyStyle: '#f8fafc',
  pageBg: '#f8fafc',
  shellBg: '#f8fafc',
  headerBg: 'rgba(255,255,255,0.95)',
  headerBorder: '#e2e8f0',
  backLinkBg: '#ffffff',
  backLinkBorder: '#e2e8f0',
  backLinkColor: '#64748b',
  clientNameColor: '#0f766e',
  panelTitleColor: '#0f172a',
  kpiBg: '#ffffff',
  kpiBorder: '#e2e8f0',
  kpiLabel: '#64748b',
  refreshBtnBg: '#ffffff',
  refreshBtnBorder: '#e2e8f0',
  refreshBtnColor: '#64748b',
  livePillBg: '#ecfdf5',
  livePillBorder: `${EMERALD}44`,
  selectBg: '#ffffff',
  selectColor: '#334155',
  selectBorder: '#e2e8f0',
  listBorder: '#e2e8f0',
  listInnerBg: '#ffffff',
  loadingText: '#94a3b8',
  emptyTitle: '#475569',
  emptyHint: '#94a3b8',
  detailAsideBg: '#f1f5f9',
  statusSeg: STATUS_SEG_LIGHT,
  leadRowSelected: 'rgba(80,200,120,0.14)',
  leadRowBorder: '#e2e8f0',
  leadName: '#0f172a',
  leadMuted: '#64748b',
  leadTime: '#94a3b8',
  chipBg: '#ecfdf5',
  chipFg: '#047857',
  avatarIdleBg: '#e2e8f0',
  avatarIdleFg: '#64748b',
  detailRootBg: '#ffffff',
  detailHeaderBorder: '#e2e8f0',
  detailBackBtnBg: '#f8fafc',
  detailBackBtnColor: '#64748b',
  detailTitle: '#0f172a',
  detailSubtitle: '#64748b',
  rowEven: '#f8fafc',
  rowOdd: '#ffffff',
  rowBorder: '#e2e8f0',
  dtColor: '#64748b',
  ddColor: '#0f172a',
  pillInactiveBg: '#f1f5f9',
  pillInactiveFg: '#64748b',
  pillInactiveBorder: '#e2e8f0',
  textareaBg: '#ffffff',
  textareaBorder: '#cbd5e1',
  textareaPlaceholder: '#94a3b8',
  textareaText: '#0f172a',
  ghostBtnBg: '#f1f5f9',
  ghostBtnColor: '#64748b',
  noteCardBg: '#ffffff',
  noteCardBorder: '#e2e8f0',
  noteText: '#334155',
  noteMeta: '#94a3b8',
  emptyNotes: '#94a3b8',
  waBarBorder: '#e2e8f0',
  emptyIconBg: '#ffffff',
  emptyIconBorder: '#e2e8f0',
  emptyDetailTitle: '#475569',
  emptyDetailHint: '#94a3b8',
};

const LeadUiContext = createContext<LeadUITokens>(TOKENS_DARK);

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
  const ui = useContext(LeadUiContext);
  const cfg = ui.statusSeg[lead.status_seguimiento];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
      style={{
        background: isSelected ? ui.leadRowSelected : 'transparent',
        borderBottom: `1px solid ${ui.leadRowBorder}`,
        borderLeft: isSelected ? `3px solid ${ui.accent}` : '3px solid transparent',
        animation: isNew ? 'slideDown 0.4s cubic-bezier(0.34,1.5,0.64,1)' : undefined,
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: isNew ? ui.accent : ui.avatarIdleBg,
          color: isNew ? (ui.accent === EMERALD ? '#042f2e' : '#000') : ui.avatarIdleFg,
        }}
      >
        {initials(lead.nombre)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate" style={{ color: ui.leadName }}>
            {lead.nombre}
          </span>
          {isNew && (
            <span
              className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
              style={{
                background: ui.accent,
                color: ui.accent === EMERALD ? '#042f2e' : '#000',
              }}
            >
              NUEVO
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: ui.leadMuted }}>
          {lead.telefono ? formatPhone(lead.telefono) : lead.email || '—'}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {lead.campana && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: ui.chipBg, color: ui.chipFg }}>
              {lead.campana.length > 20 ? lead.campana.slice(0, 20) + '…' : lead.campana}
            </span>
          )}
          <span className="text-[10px]" style={{ color: ui.leadTime }}>{timeAgo(lead.createdAt)}</span>
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
  lead,
  resellerId,
  clientSlug,
  apiBase,
  allowDelete,
  onStatusChange,
  onNoteAdded,
  onDeleted,
  onClose,
}: {
  lead: Lead;
  resellerId: string;
  clientSlug: string;
  apiBase: string;
  allowDelete?: boolean;
  onStatusChange: (leadId: string, status: StatusSeg) => void;
  onNoteAdded:    (leadId: string, nota: Nota) => void;
  onDeleted:      (leadId: string) => void;
  onClose:        () => void;
}) {
  const ui = useContext(LeadUiContext);
  const [status,   setStatus]   = useState<StatusSeg>(lead.status_seguimiento);
  const [notas,    setNotas]    = useState<Nota[]>(lead.notas);
  const [showNota, setShowNota] = useState(false);
  const [notaText, setNotaText] = useState('');
  const [savingN,  setSavingN]  = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function deleteLead() {
    if (!allowDelete) return;
    if (!confirm('¿Eliminar este lead de forma permanente?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}?leadId=${encodeURIComponent(lead.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error || 'No se pudo eliminar');
        return;
      }
      onDeleted(lead.id);
      onClose();
    } finally {
      setDeleting(false);
    }
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

  const cfg = ui.statusSeg[status];

  return (
    <div className="h-full flex flex-col" style={{ background: ui.detailRootBg }}>
      {/* Detail header */}
      <div className="px-6 py-4 flex items-center gap-4 border-b" style={{ borderColor: ui.detailHeaderBorder }}>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg"
          style={{ background: ui.detailBackBtnBg, color: ui.detailBackBtnColor }}
        >
          ← Atrás
        </button>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: ui.accent,
            color: ui.accent === EMERALD ? '#042f2e' : '#000',
          }}
        >
          {initials(lead.nombre)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-lg font-bold" style={{ color: ui.detailTitle }}>{lead.nombre}</h2>
          <p className="text-sm" style={{ color: ui.detailSubtitle }}>{lead.form_display || lead.form_name || lead.form_id || lead.campana || lead.platform_src || 'Lead'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {allowDelete && (
            <button
              type="button"
              title="Eliminar lead"
              disabled={deleting}
              onClick={() => void deleteLead()}
              className="rounded-lg p-2 transition disabled:opacity-40"
              style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #450a0a' }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* Contact info */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: ui.accent }}>Información de contacto</p>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: ui.detailHeaderBorder }}>
              {detailRows.map(([k, v], i) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 px-4 py-2.5 text-sm"
                  style={{
                    background: i % 2 === 0 ? ui.rowEven : ui.rowOdd,
                    borderBottom: i < detailRows.length - 1 ? `1px solid ${ui.rowBorder}` : 'none',
                  }}
                >
                  <dt className="shrink-0 text-xs" style={{ color: ui.dtColor }}>{k}</dt>
                  <dd className="max-w-[220px] truncate text-right text-xs font-medium" style={{ color: ui.ddColor }} title={v}>{v}</dd>
                </div>
              ))}
            </div>
          </div>

          {/* Status selector */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: ui.accent }}>Estado de seguimiento</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_SEG_OPTIONS.map((s) => {
                const c = ui.statusSeg[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeStatus(s)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                    style={{
                      background: status === s ? c.bg : ui.pillInactiveBg,
                      color:      status === s ? c.color : ui.pillInactiveFg,
                      border:     `1px solid ${status === s ? `${c.color}55` : ui.pillInactiveBorder}`,
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
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: ui.accent }}>
                Notas {notas.length > 0 && `(${notas.length})`}
              </p>
              {!showNota && (
                <button
                  type="button"
                  onClick={() => setShowNota(true)}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                  style={{
                    background: ui.ghostBtnBg,
                    color: ui.ghostBtnColor,
                    border: `1px solid ${ui.pillInactiveBorder}`,
                  }}
                >
                  <Plus className="h-3 w-3" />Agregar nota
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
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: ui.textareaBg,
                    border: `1px solid ${ui.textareaBorder}`,
                    color: ui.textareaText,
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={submitNota}
                    disabled={savingN || !notaText.trim()}
                    className="flex-1 rounded-xl py-2 text-sm font-bold transition disabled:opacity-40"
                    style={{
                      background: ui.accent,
                      color: ui.accent === EMERALD ? '#042f2e' : '#000',
                    }}
                  >
                    {savingN ? 'Guardando…' : 'Guardar nota'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNota(false); setNotaText(''); }}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ background: ui.ghostBtnBg, color: ui.ghostBtnColor }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {notas.length > 0 ? (
              <div className="space-y-2">
                {[...notas].reverse().map((n, i) => (
                  <div key={i} className="rounded-xl px-4 py-3" style={{ background: ui.noteCardBg, border: `1px solid ${ui.noteCardBorder}` }}>
                    <p className="text-sm" style={{ color: ui.noteText }}>{n.texto}</p>
                    <p className="mt-1.5 text-xs" style={{ color: ui.noteMeta }}>
                      {n.autor} · {timeAgo(n.fecha)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: ui.emptyNotes }}>Sin notas aún.</p>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp CTA — sticky bottom */}
      {lead.telefono && (
        <div className="border-t p-4" style={{ borderColor: ui.waBarBorder }}>
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
  const ui = useContext(LeadUiContext);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
        style={{ background: ui.emptyIconBg, border: `1px solid ${ui.emptyIconBorder}` }}
      >
        👤
      </div>
      <p className="text-sm font-medium" style={{ color: ui.emptyDetailTitle }}>Seleccioná un lead</p>
      <p className="text-xs" style={{ color: ui.emptyDetailHint }}>Hacé clic en cualquier lead de la lista para ver el detalle completo.</p>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function LeadsPanel({
  resellerId,
  clientSlug,
  allowLeadDelete,
}: {
  resellerId: string;
  clientSlug: string;
  /** Solo cuando el reseller entra al panel (no el cliente final). */
  allowLeadDelete?: boolean;
}) {
  const isLuc = useMemo(() => isLucianoReseller(resellerId), [resellerId]);
  const [lucTheme, setLucTheme] = useState<LucianoThemeMode>('light');

  useEffect(() => {
    if (!isLuc) return;
    try {
      const v = window.localStorage.getItem(LUCINO_THEME_STORAGE_KEY);
      setLucTheme(v === 'dark' ? 'dark' : 'light');
    } catch {
      setLucTheme('light');
    }
    const fn = (e: Event) => {
      const d = (e as CustomEvent<LucianoThemeMode>).detail;
      if (d === 'light' || d === 'dark') setLucTheme(d);
    };
    window.addEventListener('agentia-luciano-theme', fn as EventListener);
    return () => window.removeEventListener('agentia-luciano-theme', fn as EventListener);
  }, [isLuc]);

  const ui = useMemo(
    () => (isLuc && lucTheme === 'light' ? TOKENS_LIGHT : TOKENS_DARK),
    [isLuc, lucTheme]
  );

  function toggleLucianoTheme() {
    const next: LucianoThemeMode = lucTheme === 'light' ? 'dark' : 'light';
    setLucTheme(next);
    try {
      window.localStorage.setItem(LUCINO_THEME_STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent('agentia-luciano-theme', { detail: next }));
    } catch {
      /* ignore */
    }
  }

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
  function handleLeadDeleted(leadId: string) {
    knownIds.current.delete(leadId);
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setSelectedId((cur) => (cur === leadId ? null : cur));
  }

  const kpis = [
    { label: 'Total',       value: leads.length, bump: totalBump },
    { label: 'Hoy',         value: totalHoy },
    { label: 'Esta semana', value: totalSemana },
    { label: 'Contactados', value: contactados },
  ];

  return (
    <LeadUiContext.Provider value={ui}>
      <style>{`
        body { background: ${ui.bodyStyle}; margin: 0; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes countBump { 0% { transform:scale(1.3); } 100% { transform:scale(1); } }
      `}</style>

      <div className="flex flex-col" style={{ height: '100dvh', background: ui.shellBg }}>

        {/* ── Header ── */}
        <header className="shrink-0 border-b px-4 py-3" style={{ background: ui.headerBg, borderColor: ui.headerBorder }}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Back + title */}
            <div className="mr-auto flex min-w-0 items-center gap-3">
              <Link
                href={`/portal/${resellerId}/dashboard`}
                className="shrink-0 rounded-lg px-2 py-1 text-xs"
                style={{
                  color: ui.backLinkColor,
                  background: ui.backLinkBg,
                  border: `1px solid ${ui.backLinkBorder}`,
                }}
              >
                ← Dashboard
              </Link>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold" style={{ color: ui.clientNameColor }}>{clientNombre}</p>
                <p className="text-sm font-bold leading-tight" style={{ color: ui.panelTitleColor }}>
                  {isLuc ? LUCINO_PRODUCT_TITLE : 'Panel de Leads'}
                </p>
              </div>
            </div>

            {/* KPIs in one row */}
            <div className="flex flex-wrap items-center gap-2">
              {kpis.map(({ label, value, bump }) => (
                <div
                  key={label}
                  className="min-w-[60px] rounded-xl border px-3 py-1.5 text-center"
                  style={{ background: ui.kpiBg, borderColor: ui.kpiBorder }}
                >
                  <p
                    key={bump ? value : 0}
                    className="text-base font-extrabold tabular-nums leading-tight"
                    style={{ color: ui.accent, animation: bump ? 'countBump 0.4s ease' : undefined }}
                  >
                    {value}
                  </p>
                  <p className="mt-0.5 text-[9px]" style={{ color: ui.kpiLabel }}>{label}</p>
                </div>
              ))}

              {/* Refresh + live indicator */}
              <button
                type="button"
                onClick={() => fetchLeads(false, selectedForm)}
                className="rounded-lg p-2"
                style={{
                  background: ui.refreshBtnBg,
                  color: ui.refreshBtnColor,
                  border: `1px solid ${ui.refreshBtnBorder}`,
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              {isLuc && (
                <button
                  type="button"
                  onClick={toggleLucianoTheme}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: ui.refreshBtnBg,
                    borderColor: ui.refreshBtnBorder,
                    color: ui.refreshBtnColor,
                  }}
                  aria-label={lucTheme === 'light' ? 'Modo oscuro' : 'Modo claro'}
                >
                  {lucTheme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  {lucTheme === 'light' ? 'Oscuro' : 'Claro'}
                </button>
              )}
              <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5" style={{ background: ui.livePillBg, borderColor: ui.livePillBorder }}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: ui.accent }} />
                <span
                  key={totalBump ? leads.length : 0}
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: ui.accent, animation: totalBump ? 'countBump 0.4s ease' : undefined }}
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
                className="max-w-xs appearance-none rounded-lg px-3 py-1.5 text-xs font-medium outline-none"
                style={{ background: ui.selectBg, color: ui.selectColor, border: `1px solid ${ui.selectBorder}` }}
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
              borderColor: ui.listBorder,
            }}
            // On lg+, fixed width
          >
            <style>{`@media (min-width: 1024px) { .leads-list { width: 380px !important; min-width: 380px; } }`}</style>
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: '100%', height: '100%', background: ui.listInnerBg }}
            >
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm" style={{ color: ui.loadingText }}>Cargando leads…</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-sm font-medium" style={{ color: ui.emptyTitle }}>Sin leads aún</p>
                  <p className="text-xs" style={{ color: ui.emptyHint }}>Aparecerán aquí automáticamente cuando lleguen.</p>
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
            style={{ background: ui.detailAsideBg }}
          >
            {selectedLead ? (
              <div className="w-full">
                <LeadDetail
                  lead={selectedLead}
                  resellerId={resellerId}
                  clientSlug={clientSlug}
                  apiBase={apiBase}
                  allowDelete={allowLeadDelete}
                  onStatusChange={handleStatusChange}
                  onNoteAdded={handleNoteAdded}
                  onDeleted={handleLeadDeleted}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </div>
    </LeadUiContext.Provider>
  );
}
