'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { MessageCircle, ChevronDown, ChevronUp, Zap, Users, Calendar, CalendarDays, TrendingUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Estado = 'nuevo' | 'contactado' | 'en_seguimiento' | 'cerrado';

type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  utm_campaign: string;
  estado: Estado;
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_CYCLE: Estado[] = ['nuevo', 'contactado', 'en_seguimiento', 'cerrado'];

const ESTADO_LABEL: Record<Estado, string> = {
  nuevo:          'Nuevo',
  contactado:     'Contactado',
  en_seguimiento: 'En seguimiento',
  cerrado:        'Cerrado',
};

const ESTADO_STYLE: Record<Estado, string> = {
  nuevo:          'bg-green-500 text-white',
  contactado:     'bg-blue-500 text-white',
  en_seguimiento: 'bg-amber-500 text-white',
  cerrado:        'bg-slate-400 text-white',
};

// Deterministic color from campaign name
function campaignColor(name: string): string {
  const palette = ['#3b82f6', '#a855f7', '#f97316', '#ef4444', '#0ea5e9', '#16a34a'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
  return palette[h % palette.length];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function waUrl(tel: string) {
  return `https://wa.me/${tel.replace(/\D/g, '')}`;
}

function formatPhone(tel: string) {
  const d = tel.replace(/\D/g, '');
  if (d.startsWith('5493') && d.length === 13) {
    return `+54 9 ${d.slice(4, 7)} ${d.slice(7, 10)}-${d.slice(10)}`;
  }
  return `+${d}`;
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Short Web Audio beep — no file needed
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
    ctx.close();
  } catch { /* silent fail on browsers that block audio */ }
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
  const color = campaignColor(lead.utm_campaign);

  // Sync if SWR updates the lead
  useEffect(() => { setLocalEstado(lead.estado); }, [lead.estado]);

  const cycleEstado = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = ESTADO_CYCLE[(ESTADO_CYCLE.indexOf(localEstado) + 1) % ESTADO_CYCLE.length];
    setLocalEstado(next);
    onEstadoChange(lead.id, next);
  };

  const initials = lead.nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${
        isNew ? 'border-green-400 shadow-green-100 shadow-md' : 'border-gray-100 shadow-sm'
      }`}
      style={isNew ? { animation: 'slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1)' } : undefined}
    >
      {/* Main row */}
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: color }}
        >
          {initials}
        </div>

        {/* Center info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-900 font-bold text-base leading-tight">{lead.nombre}</span>
            {isNew && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white animate-pulse">
                NUEVO
              </span>
            )}
          </div>

          {/* Phone + WhatsApp */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-gray-500 text-xs">{formatPhone(lead.telefono)}</span>
            <a
              href={waUrl(lead.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white transition active:scale-95"
              style={{ background: '#16a34a' }}
            >
              <MessageCircle className="w-3 h-3" />
              WA
            </a>
          </div>

          {/* Campaign badge + time */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ background: color }}
            >
              {lead.utm_campaign}
            </span>
            <span className="text-gray-400 text-[10px]">{timeAgo(lead.createdAt)}</span>
          </div>
        </div>

        {/* Right: estado + chevron */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={cycleEstado}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition active:scale-95 ${ESTADO_STYLE[localEstado]}`}
          >
            {ESTADO_LABEL[localEstado]}
          </button>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50">
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Email</span>
              <span className="text-gray-700 font-medium">{lead.correo}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Anuncio</span>
              <span className="text-gray-700 font-medium text-right max-w-[180px] truncate" title={lead.utm_campaign}>
                {lead.utm_campaign}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Llegó</span>
              <span className="text-gray-700 font-medium">
                {new Date(lead.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <a
              href={waUrl(lead.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold text-white transition active:scale-95"
              style={{ background: '#16a34a' }}
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-gray-500 text-xs font-medium">{label}</span>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-gray-400 text-[11px] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoLucianoPage() {
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [simulating, setSimulating] = useState(false);
  const [showAdminBar, setShowAdminBar] = useState(false);
  const seedAttempted = useRef(false);
  const prevIds = useRef<Set<string>>(new Set());
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, mutate } = useSWR<{ ok: boolean; leads: Lead[] }>(
    '/api/demo-luciano/leads',
    fetcher,
    { refreshInterval: 3000 }
  );

  const leads = data?.leads ?? [];

  // Auto-seed on first empty load
  useEffect(() => {
    if (!data) return;
    if (data.leads.length === 0 && !seedAttempted.current) {
      seedAttempted.current = true;
      fetch('/api/demo-luciano/seed', { method: 'POST' })
        .then(() => mutate())
        .catch(console.error);
    }
  }, [data, mutate]);

  // Detect new leads between polls → beep + highlight
  useEffect(() => {
    const incoming = leads.map((l) => l.id);
    const fresh = incoming.filter((id) => !prevIds.current.has(id));
    if (fresh.length > 0 && prevIds.current.size > 0) {
      setNewIds((prev) => new Set([...prev, ...fresh]));
      playBeep();
      // Clear highlight after 5 s
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          fresh.forEach((id) => next.delete(id));
          return next;
        });
      }, 5000);
    }
    prevIds.current = new Set(incoming);
  }, [leads]);

  // Optimistic estado change
  const handleEstadoChange = useCallback(async (id: string, estado: Estado) => {
    await fetch(`/api/demo-luciano/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    mutate();
  }, [mutate]);

  // Simulate new lead
  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    await fetch('/api/demo-luciano/simulate', { method: 'POST' });
    await mutate();
    setSimulating(false);
  }, [mutate]);

  // Triple-tap header → show admin bar
  const handleHeaderTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 600);
    if (tapCount.current >= 3) {
      setShowAdminBar((p) => !p);
      tapCount.current = 0;
    }
  };

  // KPI calculations
  const today = startOfToday();
  const week  = startOfWeek();
  const totalHoy     = leads.filter((l) => new Date(l.createdAt) >= today).length;
  const totalSemana  = leads.filter((l) => new Date(l.createdAt) >= week).length;
  const contactados  = leads.filter((l) => l.estado !== 'nuevo').length;
  const tasaContacto = leads.length ? Math.round((contactados / leads.length) * 100) : 0;

  // Unique campaigns for the header
  const campaigns = [...new Set(leads.map((l) => l.utm_campaign))];

  return (
    <>
      {/* Slide-down animation */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">

        {/* Hidden admin bar (triple-tap) */}
        {showAdminBar && (
          <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-gray-900 text-xs">
            <span className="text-gray-400 font-mono">modo demo</span>
            <div className="flex gap-2">
              <button
                onClick={() => { seedAttempted.current = false; fetch('/api/demo-luciano/seed', { method: 'POST' }).then(() => mutate()); }}
                className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
              >
                ↺ Reiniciar
              </button>
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-black transition disabled:opacity-60"
                style={{ background: '#4ade80' }}
              >
                <Zap className="w-3 h-3" />
                {simulating ? 'Llegando…' : '+ Nuevo lead'}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header
          className="bg-white border-b border-gray-100 px-4 pt-5 pb-4 cursor-pointer select-none"
          onClick={handleHeaderTap}
        >
          <div className="max-w-lg mx-auto">
            {/* Logo placeholder + title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm" style={{ background: '#16a34a' }}>
                L
              </div>
              <div>
                <p className="text-gray-900 font-bold text-base leading-tight">Panel de Leads</p>
                <p className="text-gray-400 text-xs">Luciano Trafficker · Córdoba, Argentina</p>
              </div>
              {/* Live dot */}
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-700 text-[10px] font-semibold">En vivo</span>
              </div>
            </div>

            {/* Campaign pills */}
            {campaigns.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {campaigns.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: campaignColor(c) }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-5 pb-24 space-y-4">

          {/* KPI Grid 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard icon={Users}       label="Total leads"      value={leads.length}    color="#16a34a" />
            <KpiCard icon={Calendar}    label="Hoy"              value={totalHoy}         color="#3b82f6" sub={totalHoy === 1 ? '1 nuevo hoy' : `${totalHoy} nuevos hoy`} />
            <KpiCard icon={CalendarDays}label="Esta semana"      value={totalSemana}      color="#a855f7" />
            <KpiCard icon={TrendingUp}  label="Tasa contacto"    value={`${tasaContacto}%`} color="#f97316" sub={`${contactados} de ${leads.length} contactados`} />
          </div>

          {/* Skeleton while loading */}
          {leads.length === 0 && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
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

        {/* Floating simulate button — low opacity, reveal on hover */}
        <button
          onClick={handleSimulate}
          disabled={simulating}
          title="Simular nuevo lead"
          className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90 disabled:opacity-40 group"
          style={{ background: '#16a34a', opacity: 0.18 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.18')}
        >
          <Zap className={`w-6 h-6 text-white ${simulating ? 'animate-pulse' : ''}`} />
        </button>

      </div>
    </>
  );
}
