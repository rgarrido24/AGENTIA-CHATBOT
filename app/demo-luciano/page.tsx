'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { MessageCircle, ChevronDown, ChevronUp, RefreshCw, ChevronDown as SelectIcon } from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────

const CLIENT_NAME = 'Antonio Campetella';
const ACCENT      = '#CCFF00';

// ─── Types ────────────────────────────────────────────────────────────────────

type Estado = 'nuevo' | 'contactado' | 'en_seguimiento';

type Lead = {
  id:          string;
  nombre:      string;
  telefono:    string;
  email:       string;
  campana:     string;
  adset:       string;
  canal_origen: string;
  form_id:     string;
  form_fields: Record<string, string>;
  estado:      Estado;
  createdAt:   string;
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function waUrl(tel: string) {
  return `https://wa.me/${tel.replace(/\D/g, '')}`;
}

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
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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
    const ctx  = new AC();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 820;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
    ctx.close();
  } catch { /* silent */ }
}

// ─── Estado config ────────────────────────────────────────────────────────────

const ESTADO_NEXT: Record<Estado, Estado> = {
  nuevo: 'contactado', contactado: 'en_seguimiento', en_seguimiento: 'nuevo',
};
const ESTADO_LABEL: Record<Estado, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', en_seguimiento: 'En seguimiento',
};
const ESTADO_STYLE: Record<Estado, { background: string; color: string }> = {
  nuevo:          { background: '#1e2800', color: ACCENT },
  contactado:     { background: '#0d1a2b', color: '#60a5fa' },
  en_seguimiento: { background: '#2a1a00', color: '#fbbf24' },
};

// ─── KPI Box ──────────────────────────────────────────────────────────────────

function KpiBox({ label, value, bump }: { label: string; value: number; bump?: boolean }) {
  return (
    <div className="flex-1 rounded-xl border border-white/10 px-2 py-3 text-center" style={{ background: '#111' }}>
      <p
        key={bump ? value : 0}
        className="text-2xl font-extrabold leading-none tabular-nums"
        style={{ color: ACCENT, animation: bump ? 'countBump 0.4s ease' : undefined }}
      >
        {value}
      </p>
      <p className="text-[10px] mt-1 leading-tight" style={{ color: '#666' }}>{label}</p>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, isNew }: { lead: Lead; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [estado, setEstado]     = useState<Estado>(lead.estado);

  const cycleEstado = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEstado((prev) => ESTADO_NEXT[prev]);
  };

  const estStyle = ESTADO_STYLE[estado];

  // Build detail rows: standard fields + all form_fields entries
  const detailRows: [string, string][] = [
    ['Email',   lead.email    || '—'],
    ['Campaña', lead.campana  || lead.canal_origen || '—'],
    ['Adset',   lead.adset    || '—'],
    ['Form ID', lead.form_id  || '—'],
    ['Llegó',   fmtDate(lead.createdAt)],
  ];
  // Append extra form fields
  for (const [k, v] of Object.entries(lead.form_fields)) {
    if (v) detailRows.push([humanLabel(k), v]);
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-shadow duration-300"
      style={{
        background:  '#111',
        borderColor: isNew ? ACCENT : '#222',
        boxShadow:   isNew ? `0 0 0 2px ${ACCENT}33` : '0 1px 3px rgba(0,0,0,0.4)',
        animation:   isNew ? 'slideDown 0.4s cubic-bezier(0.34,1.5,0.64,1)' : undefined,
      }}
    >
      <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpanded((p) => !p)}>
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          style={{ background: ACCENT, color: '#000' }}
        >
          {initials(lead.nombre)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[15px] leading-snug" style={{ color: '#f5f5f5' }}>{lead.nombre}</span>
            {isNew && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                style={{ background: ACCENT, color: '#000' }}
              >
                ● NUEVO
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: '#888' }}>{formatPhone(lead.telefono)}</span>
            {lead.telefono && (
              <a
                href={waUrl(lead.telefono)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: '#16a34a', color: '#fff' }}
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {lead.campana && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#1e2800', color: ACCENT }}
              >
                {lead.campana}
              </span>
            )}
            {!lead.campana && lead.canal_origen && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#1a1a1a', color: '#888' }}>
                {lead.canal_origen}
              </span>
            )}
            <span className="text-[10px]" style={{ color: '#555' }}>{timeAgo(lead.createdAt)}</span>
          </div>
        </div>

        {/* Estado + chevron */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={cycleEstado}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={estStyle}
          >
            {ESTADO_LABEL[estado]}
          </button>
          {expanded
            ? <ChevronUp   className="w-4 h-4 mt-0.5" style={{ color: '#444' }} />
            : <ChevronDown className="w-4 h-4 mt-0.5" style={{ color: '#444' }} />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: '#1e1e1e' }}>
          <dl className="mt-3 space-y-1.5">
            {detailRows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-xs">
                <dt className="shrink-0" style={{ color: '#555' }}>{k}</dt>
                <dd className="font-medium text-right truncate max-w-[200px]" style={{ color: '#ccc' }} title={v}>{v}</dd>
              </div>
            ))}
          </dl>
          {lead.telefono && (
            <a
              href={waUrl(lead.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: ACCENT, color: '#000' }}
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoLucianoPage() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [formIds, setFormIds]     = useState<string[]>([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [newIds, setNewIds]       = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [totalBump, setTotalBump] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const knownIds                  = useRef<Set<string>>(new Set());

  const fetchLeads = useCallback(async (isFirst = false, formId = '') => {
    try {
      const qs  = formId ? `?formId=${encodeURIComponent(formId)}` : '';
      const res  = await fetch(`/api/demo/luciano/leads${qs}`, { cache: 'no-store' });
      const data = await res.json() as { leads: Lead[]; formIds: string[] };
      const incoming = data.leads ?? [];

      setFormIds(data.formIds ?? []);

      if (isFirst) {
        knownIds.current = new Set(incoming.map((l) => l.id));
        setLeads(incoming);
        setLastCount(incoming.length);
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
        setLastCount(incoming.length);
        setTimeout(() => setTotalBump(false), 400);
        setTimeout(() => setNewIds((prev) => {
          const n = new Set(prev);
          freshSet.forEach((id) => n.delete(id));
          return n;
        }), 6000);
        playBeep();
      } else {
        setLeads(incoming);
        setLastCount(incoming.length);
      }
    } catch (err) {
      console.error('[demo-luciano] fetch error:', err);
      if (isFirst) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeads(true, selectedForm);
  }, [fetchLeads]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when form filter changes (not first)
  useEffect(() => {
    knownIds.current = new Set();
    setLoading(true);
    fetchLeads(true, selectedForm);
  }, [selectedForm, fetchLeads]);

  // Poll every 30s
  useEffect(() => {
    const t = setInterval(() => fetchLeads(false, selectedForm), 30_000);
    return () => clearInterval(t);
  }, [fetchLeads, selectedForm]);

  // Time refresh every 60s
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // KPIs (based on visible leads)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week  = new Date(); week.setHours(0, 0, 0, 0); week.setDate(week.getDate() - week.getDay());
  const totalHoy    = leads.filter((l) => new Date(l.createdAt) >= today).length;
  const totalSemana = leads.filter((l) => new Date(l.createdAt) >= week).length;
  const contactados = leads.filter((l) => l.estado !== 'nuevo').length;

  return (
    <>
      <style>{`
        body { background: #000; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes countBump {
          0%   { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div className="min-h-screen" style={{ background: '#000' }}>

        {/* Header */}
        <header className="sticky top-0 z-10 border-b px-4 py-3" style={{ background: '#000', borderColor: '#1a1a1a' }}>
          <div className="max-w-lg mx-auto space-y-3">

            {/* Row 1: identity + counter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/luciano-logo.png"
                  alt={CLIENT_NAME}
                  width={38}
                  height={38}
                  className="rounded-lg object-contain"
                  style={{ background: '#111', padding: 2 }}
                />
                <div>
                  <p className="text-[11px] font-semibold leading-tight" style={{ color: ACCENT }}>
                    {CLIENT_NAME}
                  </p>
                  <h1 className="font-bold text-sm leading-tight" style={{ color: '#f5f5f5' }}>
                    Panel Gestión de Leads
                  </h1>
                  <p className="text-[10px] leading-tight" style={{ color: '#444' }}>
                    Córdoba, Argentina
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLeads(false, selectedForm)}
                  className="p-1.5 rounded-lg"
                  style={{ background: '#111', color: '#555' }}
                  title="Actualizar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{ background: '#0d1400', borderColor: `${ACCENT}55` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                  <span
                    key={totalBump ? lastCount : 0}
                    className="text-xs font-semibold"
                    style={{ color: ACCENT, animation: totalBump ? 'countBump 0.4s ease' : undefined }}
                  >
                    {lastCount} leads
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: form selector */}
            {formIds.length > 0 && (
              <div className="relative">
                <select
                  value={selectedForm}
                  onChange={(e) => setSelectedForm(e.target.value)}
                  className="w-full appearance-none rounded-lg px-3 py-2 text-xs font-medium pr-8"
                  style={{ background: '#111', color: '#ccc', border: '1px solid #2a2a2a', outline: 'none' }}
                >
                  <option value="">Todos los formularios</option>
                  {formIds.map((fid) => (
                    <option key={fid} value={fid}>{fid}</option>
                  ))}
                </select>
                <SelectIcon
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: '#555' }}
                />
              </div>
            )}

          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 pb-16 space-y-4">

          {/* KPIs */}
          <div className="flex gap-2">
            <KpiBox label="Total"       value={lastCount} bump={totalBump} />
            <KpiBox label="Hoy"         value={totalHoy} />
            <KpiBox label="Esta semana" value={totalSemana} />
            <KpiBox label="Contactados" value={contactados} />
          </div>

          {/* Lead cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Image
                src="/luciano-logo.png"
                alt={CLIENT_NAME}
                width={64}
                height={64}
                className="rounded-2xl object-contain opacity-40"
                style={{ background: '#111', padding: 8 }}
              />
              <p className="text-sm" style={{ color: '#444' }}>Cargando leads…</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Image
                src="/luciano-logo.png"
                alt={CLIENT_NAME}
                width={72}
                height={72}
                className="rounded-2xl object-contain opacity-30"
                style={{ background: '#111', padding: 10 }}
              />
              <p className="text-sm font-medium" style={{ color: '#555' }}>
                Esperando leads de tus campañas…
              </p>
              <p className="text-xs" style={{ color: '#333' }}>
                Cuando llegue el primer lead aparecerá aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} isNew={newIds.has(lead.id)} />
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="text-center pb-6 pt-2">
          <p className="text-[11px]" style={{ color: '#2a2a2a' }}>
            Powered by{' '}
            <a
              href="https://agentia.software"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: '#333' }}
            >
              Agentia · agentia.software
            </a>
          </p>
        </footer>

      </div>
    </>
  );
}
