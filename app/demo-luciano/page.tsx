'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Estado = 'nuevo' | 'contactado' | 'en_seguimiento';

type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  utm_campaign: string;
  estado: Estado;
  createdAt: string;
};

// ─── Campaign config ──────────────────────────────────────────────────────────

const CAMPAIGN: Record<string, { color: string; bg: string; text: string }> = {
  'Emprendedores Córdoba 2026': { color: '#16a34a', bg: '#dcfce7', text: '#15803d' },
  'Inmuebles Centro':           { color: '#2563eb', bg: '#dbeafe', text: '#1d4ed8' },
  'Servicios Profesionales':    { color: '#ea580c', bg: '#ffedd5', text: '#c2410c' },
};

function campaignStyle(name: string) {
  return CAMPAIGN[name] ?? { color: '#6b7280', bg: '#f3f4f6', text: '#374151' };
}

// ─── Estado config ────────────────────────────────────────────────────────────

const ESTADO_NEXT: Record<Estado, Estado> = {
  nuevo: 'contactado',
  contactado: 'en_seguimiento',
  en_seguimiento: 'nuevo',
};

const ESTADO_LABEL: Record<Estado, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  en_seguimiento: 'En seguimiento',
};

const ESTADO_STYLE: Record<Estado, string> = {
  nuevo:          'bg-green-100 text-green-700',
  contactado:     'bg-blue-100  text-blue-700',
  en_seguimiento: 'bg-amber-100 text-amber-700',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function waUrl(tel: string) {
  return `https://wa.me/${tel.replace(/\D/g, '')}`;
}

function formatPhone(tel: string) {
  const d = tel.replace(/\D/g, '');
  // 5493517XXXXXX → +54 351 XXX-XXXX
  if (d.startsWith('5493') && d.length === 13) {
    return `+54 351 ${d.slice(7, 10)}-${d.slice(10)}`;
  }
  return `+${d}`;
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90)     return 'hace un momento';
  if (s < 3600)   return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400)  return `hace ${Math.floor(s / 3600)} h`;
  if (s < 172800) return 'ayer';
  return `hace ${Math.floor(s / 86400)} días`;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function playBeep() {
  try {
    type WinWithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext || (window as WinWithWebkit).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
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

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiBox({ label, value, bump }: { label: string; value: number; bump: boolean }) {
  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-3 text-center">
      <p
        key={bump ? value : undefined}
        className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums"
        style={bump ? { animation: 'countBump 0.4s ease' } : undefined}
      >
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-1 leading-tight">{label}</p>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  isNew,
  onEstadoChange,
}: {
  lead: Lead;
  isNew: boolean;
  onEstadoChange: (id: string, estado: Estado) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localEstado, setLocalEstado] = useState<Estado>(lead.estado);
  useEffect(() => { setLocalEstado(lead.estado); }, [lead.estado]);

  const cs = campaignStyle(lead.utm_campaign);

  const cycleEstado = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = ESTADO_NEXT[localEstado];
    setLocalEstado(next);
    onEstadoChange(lead.id, next);
  };

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-shadow duration-300 ${
        isNew
          ? 'border-green-300 shadow-[0_0_0_3px_rgba(22,163,74,0.12)]'
          : 'border-gray-100 shadow-sm'
      }`}
      style={isNew ? { animation: 'slideDown 0.4s cubic-bezier(0.34,1.5,0.64,1)' } : undefined}
    >
      {/* Main row */}
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
          style={{ background: cs.color }}
        >
          {initials(lead.nombre)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-900 font-bold text-[15px] leading-snug">{lead.nombre}</span>
            {isNew && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white animate-pulse">
                ● NUEVO
              </span>
            )}
          </div>

          {/* Phone + WA */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500 text-xs">{formatPhone(lead.telefono)}</span>
            <a
              href={waUrl(lead.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-white transition-opacity hover:opacity-80 active:scale-95"
              style={{ background: '#16a34a' }}
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
          </div>

          {/* Campaign + time */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cs.bg, color: cs.text }}
            >
              {lead.utm_campaign}
            </span>
            <span className="text-gray-400 text-[10px]">{timeAgo(lead.createdAt)}</span>
          </div>
        </div>

        {/* Estado + chevron */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={cycleEstado}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-opacity hover:opacity-70 ${ESTADO_STYLE[localEstado]}`}
          >
            {ESTADO_LABEL[localEstado]}
          </button>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-300 mt-0.5" />
            : <ChevronDown className="w-4 h-4 text-gray-300 mt-0.5" />
          }
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <dl className="mt-3 space-y-1.5">
            {[
              ['Email',   lead.correo],
              ['Anuncio', lead.utm_campaign],
              ['Llegó',   new Date(lead.createdAt).toLocaleString('es-AR', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-xs">
                <dt className="text-gray-400 shrink-0">{k}</dt>
                <dd className="text-gray-700 font-medium text-right truncate max-w-[200px]" title={v}>{v}</dd>
              </div>
            ))}
          </dl>
          <a
            href={waUrl(lead.telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#16a34a' }}
          >
            <MessageCircle className="w-4 h-4" />
            Abrir WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoLucianoPage() {
  const [newIds, setNewIds]     = useState<Set<string>>(new Set());
  const [totalBump, setTotalBump] = useState(false);
  const seedAttempted           = useRef(false);
  const prevIds                 = useRef<Set<string>>(new Set());
  const autoTimer               = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, mutate } = useSWR<{ ok: boolean; leads: Lead[] }>(
    '/api/demo-luciano/leads',
    fetcher,
    { refreshInterval: 4000 }
  );

  const leads = data?.leads ?? [];

  // ── Auto-seed on first empty load ────────────────────────────────────────────
  useEffect(() => {
    if (!data) return;
    if (data.leads.length === 0 && !seedAttempted.current) {
      seedAttempted.current = true;
      fetch('/api/demo-luciano/seed', { method: 'POST' })
        .then(() => mutate())
        .catch(console.error);
    }
  }, [data, mutate]);

  // ── Auto-simulate: 8s first, then 25-35s interval ────────────────────────────
  useEffect(() => {
    const fire = (delay: number) => {
      autoTimer.current = setTimeout(async () => {
        try {
          await fetch('/api/demo-luciano/simulate', { method: 'POST' });
          await mutate();
        } catch { /* ignore */ }
        fire(25_000 + Math.random() * 10_000);
      }, delay);
    };

    fire(8_000);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Detect new leads → highlight + beep ──────────────────────────────────────
  useEffect(() => {
    const incoming = leads.map((l) => l.id);
    const fresh    = incoming.filter((id) => !prevIds.current.has(id));

    if (fresh.length > 0 && prevIds.current.size > 0) {
      // Animate counter
      setTotalBump(true);
      setTimeout(() => setTotalBump(false), 400);

      // Highlight + sound
      setNewIds((prev) => new Set([...prev, ...fresh]));
      playBeep();

      // Clear highlight after 6s
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          fresh.forEach((id) => next.delete(id));
          return next;
        });
      }, 6000);
    }

    prevIds.current = new Set(incoming);
  }, [leads]);

  // ── Estado change ─────────────────────────────────────────────────────────────
  const handleEstadoChange = useCallback(async (id: string, estado: Estado) => {
    fetch(`/api/demo-luciano/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    }).then(() => mutate()).catch(console.error);
  }, [mutate]);

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week  = new Date(); week.setHours(0, 0, 0, 0); week.setDate(week.getDate() - week.getDay());
  const totalHoy     = leads.filter((l) => new Date(l.createdAt) >= today).length;
  const totalSemana  = leads.filter((l) => new Date(l.createdAt) >= week).length;
  const contactados  = leads.filter((l) => l.estado !== 'nuevo').length;

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes countBump {
          0%   { transform: scale(1.35); color: #16a34a; }
          100% { transform: scale(1);    color: inherit; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 font-bold text-base leading-tight">Panel de Leads — Demo</h1>
              <p className="text-gray-400 text-xs">Córdoba, Argentina · actualización automática</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 text-xs font-semibold">{leads.length} leads</span>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 pb-16 space-y-4">

          {/* KPIs */}
          <div className="flex gap-2">
            <KpiBox label="Total"      value={leads.length}   bump={totalBump} />
            <KpiBox label="Hoy"        value={totalHoy}        bump={false} />
            <KpiBox label="Esta semana" value={totalSemana}    bump={false} />
            <KpiBox label="Contactados" value={contactados}    bump={false} />
          </div>

          {/* Skeleton */}
          {leads.length === 0 && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
              ))}
            </div>
          )}

          {/* Lead cards */}
          <div className="space-y-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isNew={newIds.has(lead.id)}
                onEstadoChange={handleEstadoChange}
              />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
