'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  MessageCircle,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { playAlertSound } from '@/src/lib/sounds';

const LS_CLIENT = 'agentia_pipeline_clientId';
const LS_SOUND = 'agentia_pipeline_sound_on';
const POLL_MS = 5000;

type LeadRow = {
  leadId: string;
  senderName: string;
  senderId?: string;
  clientId: string;
  status: string;
  assignedTo?: string | null;
  bot_status?: 'active' | 'paused';
  lastMessageAt: string | null;
  platform: string;
};

function waDigits(senderId?: string): string {
  return (senderId || '').replace(/@.*$/, '').replace(/\D/g, '');
}

function waUrl(senderId?: string): string {
  const d = waDigits(senderId);
  return d ? `https://wa.me/${d}` : '#';
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function displayStatus(status: string): string {
  const s = (status || '').toLowerCase().trim();
  if (s === 'nuevos') return 'Nuevo';
  if (s === 'preguntones' || s === 'seguimiento') return 'Contactado';
  if (s === 'interesado') return 'Interesado';
  if (s === 'cierres') return 'Cerrado';
  if (s === 'cancelados') return 'No contestó';
  return status || 'Nuevo';
}

function botPausedVisual(l: LeadRow): boolean {
  return l.bot_status === 'paused' || !!l.assignedTo;
}

export default function IzziPipelinePage() {
  const [clientFilter, setClientFilter] = useState('izzi');
  const [soundOn, setSoundOn] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBadge, setNewBadge] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const pollReadyRef = useRef(false);
  const soundOnRef = useRef(true);
  soundOnRef.current = soundOn;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const c = localStorage.getItem(LS_CLIENT);
    if (c === null || c === undefined || c === '') {
      setClientFilter('izzi');
    } else if (c === '__all__') {
      setClientFilter('');
    } else if (c === 'izzi' || c === 'agentia-ventas') {
      setClientFilter(c);
    }
    const s = localStorage.getItem(LS_SOUND);
    if (s === '0') setSoundOn(false);
  }, []);

  /** Evita sonido/badge al cambiar filtro: el primer poll solo rellena el set de ids. */
  useEffect(() => {
    prevIdsRef.current = new Set();
    pollReadyRef.current = false;
  }, [clientFilter]);

  const persistClient = (v: string) => {
    setClientFilter(v);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_CLIENT, v === '' ? '__all__' : v);
    }
  };

  const persistSound = (on: boolean) => {
    setSoundOn(on);
    if (typeof window !== 'undefined') localStorage.setItem(LS_SOUND, on ? '1' : '0');
  };

  const fetchLeads = useCallback(async () => {
    setError(null);
    const q = clientFilter ? `?clientId=${encodeURIComponent(clientFilter)}` : '';
    const res = await fetch(`/api/leads${q}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      setError(data?.error || `Error ${res.status}`);
      return;
    }
    const list: LeadRow[] = (data.leads || []).map((l: Record<string, unknown>) => ({
      leadId: String(l.leadId),
      senderName: String(l.senderName || 'Sin nombre'),
      senderId: l.senderId ? String(l.senderId) : undefined,
      clientId: String(l.clientId || ''),
      status: String(l.status || 'nuevos'),
      assignedTo: (l.assignedTo as string | null | undefined) ?? null,
      bot_status: (l.bot_status as 'active' | 'paused') || 'active',
      lastMessageAt: l.lastMessageAt ? new Date(l.lastMessageAt as string).toISOString() : null,
      platform: String(l.platform || ''),
    }));
    list.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });

    const incoming = new Set(list.map((l) => l.leadId));
    if (pollReadyRef.current) {
      for (const id of incoming) {
        if (!prevIdsRef.current.has(id)) {
          setNewBadge(true);
          if (soundOnRef.current) playAlertSound('logro');
          break;
        }
      }
    }
    pollReadyRef.current = true;
    prevIdsRef.current = incoming;
    setLeads(list);
  }, [clientFilter]);

  useEffect(() => {
    setLoading(true);
    fetchLeads().finally(() => setLoading(false));
  }, [fetchLeads]);

  useEffect(() => {
    const id = setInterval(() => {
      void fetchLeads();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchLeads]);

  const setPaused = async (lead: LeadRow, paused: boolean) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.leadId === lead.leadId
          ? {
              ...l,
              bot_status: paused ? 'paused' : 'active',
              assignedTo: paused ? l.assignedTo : null,
            }
          : l
      )
    );
    try {
      await fetch('/api/leads/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.leadId, paused }),
      });
      if (!paused && lead.assignedTo) {
        await fetch('/api/leads/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: lead.leadId, assignedTo: '' }),
        });
      }
    } catch {
      void fetchLeads();
    }
  };

  const filterLabel = useMemo(() => {
    if (!clientFilter) return 'Todos';
    if (clientFilter === 'izzi') return 'izzi';
    return 'agentia-ventas';
  }, [clientFilter]);

  return (
    <main className="min-h-screen bg-[#070d06] text-white pb-24">
      <header className="sticky top-0 z-30 border-b border-emerald-900/40 bg-[#070d06]/95 backdrop-blur-xl px-4 py-3">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard" className="text-slate-500 hover:text-emerald-300 text-sm">
              ← Dashboard
            </Link>
            <span className="text-slate-600">|</span>
            <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
              Pipeline leads
              <span
                className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                title="Actualización en vivo (cada 5s)"
              />
            </h1>
            {newBadge && (
              <button
                type="button"
                onClick={() => setNewBadge(false)}
                className="relative flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/15 px-2.5 py-1 text-xs text-amber-200 animate-pulse"
              >
                <Bell className="h-3.5 w-3.5" />
                Nuevo lead
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => persistSound(!soundOn)}
              className="rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-slate-300 hover:text-white"
              title={soundOn ? 'Silenciar alertas' : 'Activar sonido'}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <select
              value={clientFilter === '' ? '__all__' : clientFilter}
              onChange={(e) => persistClient(e.target.value === '__all__' ? '' : e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="izzi">izzi</option>
              <option value="agentia-ventas">agentia-ventas</option>
              <option value="__all__">Todos</option>
            </select>
          </div>
        </div>
        <p className="max-w-3xl mx-auto mt-2 text-[11px] text-slate-500 px-4">
          Vista {filterLabel} · refresco automático cada {POLL_MS / 1000}s · mismo fondo que CRM Leads
        </p>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {loading && (
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        )}
        {!loading && leads.length === 0 && !error && (
          <p className="text-slate-500 text-sm">Sin leads con este filtro.</p>
        )}

        {leads.map((lead) => {
          const paused = botPausedVisual(lead);
          return (
            <article
              key={lead.leadId}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{lead.senderName || 'Sin nombre'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lead.clientId} · {timeAgo(lead.lastMessageAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                    paused
                      ? 'border-red-500/40 text-red-300 bg-red-500/10'
                      : 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10'
                  }`}
                >
                  {paused ? '🔴 Pausado' : '🟢 Activo'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-400">Estado:</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
                  {displayStatus(lead.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={waUrl(lead.senderId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/50"
                >
                  <MessageCircle className="h-4 w-4" />
                  {waDigits(lead.senderId) || 'WhatsApp'}
                </a>
                <button
                  type="button"
                  disabled={paused}
                  onClick={() => void setPaused(lead, true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-200 hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Pause className="h-4 w-4" />
                  PAUSAR bot
                </button>
                <button
                  type="button"
                  disabled={!paused}
                  onClick={() => void setPaused(lead, false)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-4 w-4" />
                  REANUDAR bot
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8 text-center">
        <Link href="/dashboard/leads" className="text-xs text-slate-500 hover:text-emerald-400 underline">
          Abrir vista Kanban completa (Leads)
        </Link>
      </div>
    </main>
  );
}
