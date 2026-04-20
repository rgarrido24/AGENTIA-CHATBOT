'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { MessageCircle, Zap, RefreshCw, Users, TrendingUp, Wifi } from 'lucide-react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  utm_campaign: string;
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function waUrl(telefono: string) {
  const digits = telefono.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

const CAMPAIGN_COLORS: Record<string, string> = {
  'Barberías CDMX — Leads Q2':       '#22c55e',
  'Spas & Estéticas GDL':             '#a855f7',
  'Restaurantes MTY Retargeting':     '#f97316',
  'Dentistas CDMX — Awareness':       '#0ea5e9',
  'Nutriólogos — Intereses Salud':    '#84cc16',
  'Talleres Mecánicos — Norte':       '#f59e0b',
};

function campaignColor(c: string) {
  return CAMPAIGN_COLORS[c] ?? '#64748b';
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, isNew }: { lead: Lead; isNew: boolean }) {
  const color = campaignColor(lead.utm_campaign);
  const [justAdded, setJustAdded] = useState(isNew);

  useEffect(() => {
    if (!isNew) return;
    const t = setTimeout(() => setJustAdded(false), 4000);
    return () => clearTimeout(t);
  }, [isNew]);

  return (
    <div
      className="relative rounded-2xl p-4 flex items-center gap-4 transition-all duration-500"
      style={{
        background: justAdded
          ? `linear-gradient(135deg, ${color}18 0%, rgba(255,255,255,0.04) 100%)`
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${justAdded ? color + '55' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: justAdded ? `0 0 24px ${color}22` : 'none',
      }}
    >
      {/* New badge */}
      {justAdded && (
        <span
          className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
          style={{ background: color, color: '#000' }}
        >
          NUEVO
        </span>
      )}

      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: color + '22', border: `1.5px solid ${color}55`, color }}
      >
        {initials(lead.nombre)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-base leading-tight truncate">{lead.nombre}</p>
        <p className="text-slate-400 text-xs truncate">{lead.correo}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: color + '22', color, border: `1px solid ${color}44` }}
          >
            {lead.utm_campaign}
          </span>
          <span className="text-slate-600 text-[10px]">{timeAgo(lead.createdAt)}</span>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <a
        href={waUrl(lead.telefono)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-white shrink-0 transition-all duration-200 active:scale-95"
        style={{ background: '#22c55e' }}
        title={`Contactar a ${lead.nombre}`}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoLucianoPage() {
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [simulating, setSimulating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [showAdminBar, setShowAdminBar] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIds = useRef<Set<string>>(new Set());

  const { data, mutate, isLoading, error: swrError } = useSWR<{ leads: Lead[]; ok: boolean; error?: string }>(
    '/api/demo-luciano/leads',
    fetcher,
    { refreshInterval: 3000, shouldRetryOnError: true }
  );

  const leads = data?.leads ?? [];
  const fetchError = swrError || (data && !data.ok ? data.error : null);

  // Detect newly arrived leads between polls
  useEffect(() => {
    const incoming = leads.map((l) => l.id);
    const fresh = incoming.filter((id) => !prevIds.current.has(id));
    if (fresh.length > 0 && prevIds.current.size > 0) {
      setNewIds((prev) => new Set([...prev, ...fresh]));
    }
    prevIds.current = new Set(incoming);
  }, [leads]);

  // Seed mock data
  const handleSeed = useCallback(async () => {
    setSeedError(null);
    setSeeding(true);
    try {
      const res = await fetch('/api/demo-luciano/seed', { method: 'POST' });
      const body = await res.json();
      console.log('[demo-luciano] seed response:', res.status, body);
      if (!res.ok || !body.ok) {
        setSeedError(body.error ?? `HTTP ${res.status}`);
        setSeeding(false);
        return;
      }
      setSeeded(true);
    } catch (err) {
      console.error('[demo-luciano] seed fetch error:', err);
      setSeedError(String(err));
      setSeeding(false);
      return;
    }
    setNewIds(new Set());
    prevIds.current = new Set();
    await mutate();
    setSeeding(false);
  }, [mutate]);

  // Simulate incoming lead
  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    const res = await fetch('/api/demo-luciano/simulate', { method: 'POST' });
    const { lead } = await res.json();
    setNewIds((prev) => new Set([...prev, lead.id]));
    await mutate();
    setSimulating(false);
  }, [mutate]);

  // Triple-tap the header logo to reveal admin bar
  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 600);
    if (tapCount.current >= 3) {
      setShowAdminBar((p) => !p);
      tapCount.current = 0;
    }
  };

  const totalLeads = leads.length;
  const campaigns = [...new Set(leads.map((l) => l.utm_campaign))];

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(160deg, #050a12 0%, #0a0f1a 100%)' }}
    >
      {/* Admin bar (hidden by default, revealed by triple-tap on logo) */}
      {showAdminBar && (
        <div
          className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
          style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
          <span className="text-slate-400 font-mono">modo demo</span>
          <div className="flex gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${seeding ? 'animate-spin' : ''}`} />
              {seeded ? 'Reiniciar datos' : 'Cargar mock data'}
            </button>
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-50"
              style={{ background: '#22c55e', color: '#000' }}
            >
              <Zap className={`w-3 h-3 ${simulating ? 'animate-pulse' : ''}`} />
              {simulating ? 'Llegando…' : '+ Nuevo lead'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleLogoTap} className="flex items-center gap-3 select-none">
            <Image
              src="/logo-agentia-2026.png"
              alt="Agentia"
              width={36}
              height={36}
              className="rounded-xl object-contain"
            />
            <div className="text-left">
              <p className="text-white font-bold text-sm leading-tight">Agentia</p>
              <p className="text-slate-500 text-[11px]">Panel de Leads</p>
            </div>
          </button>

          {/* Live indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}
          >
            <Wifi className="w-3 h-3" />
            En vivo
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-xs">Leads totales</span>
            </div>
            <p className="text-3xl font-extrabold text-white">{totalLeads}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-xs">Campañas activas</span>
            </div>
            <p className="text-3xl font-extrabold text-white">{campaigns.length}</p>
          </div>
        </div>

        {/* Fetch / seed error */}
        {(fetchError || seedError) && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 font-mono break-all">
            {seedError ? `Seed error: ${seedError}` : `API error: ${String(fetchError)}`}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && leads.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <p className="text-slate-500 text-sm">No hay leads aún.</p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition disabled:opacity-50"
              style={{ background: '#22c55e' }}
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Insertando...' : 'Cargar datos demo'}
            </button>
          </div>
        )}

        {/* Lead list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 h-20 animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} isNew={newIds.has(lead.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Floating simulate button — subtle, bottom-right */}
      <button
        onClick={handleSimulate}
        disabled={simulating}
        title="Simular nuevo lead de Meta"
        className="fixed bottom-6 right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 disabled:opacity-60"
        style={{
          background: simulating ? '#16a34a' : '#22c55e',
          boxShadow: '0 4px 24px rgba(34,197,94,0.35)',
          opacity: 0.2,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.2')}
      >
        <Zap className={`w-5 h-5 text-black ${simulating ? 'animate-pulse' : ''}`} />
      </button>
    </div>
  );
}
