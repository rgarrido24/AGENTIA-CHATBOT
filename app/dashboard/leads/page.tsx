'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { MessageCircle, Pause, Play, Calendar, X, User, Trash2, Send } from 'lucide-react';
import { SourceIcon } from '@/components/SourceIcon';
import { playAlertSound } from '@/src/lib/sounds';

type Lead = {
  leadId: string;
  senderName: string;
  senderId?: string;
  pageId?: string;
  clientId: string;
  source?: string;
  status: string;
  assignedTo: string | null;
  bot_status?: 'active' | 'paused';
  is_being_handled_by?: string | null;
  lastMessage: string;
  lastReply: string;
  lastMessageAt: string | null;
  lastClassifiedByAI?: string | null;
  cancelReason?: string | null;
  messageCount: number;
  platform: string;
};

type Alert = {
  id: string;
  leadId: string;
  clientId: string;
  senderId?: string;
  senderName: string;
  lastMessage: string;
  platform: string;
  reason: string;
  createdAt: string;
  sentAt?: string;
};

const PIPELINE = [
  { id: 'nuevos', label: 'Nuevos', color: 'text-slate-400', badge: 'bg-slate-500/20 border-slate-500/40' },
  { id: 'preguntones', label: 'Preguntones (Frío)', color: 'text-blue-400', badge: 'bg-blue-500/25 border-blue-500/50' },
  { id: 'seguimiento', label: 'En Seguimiento (Tibio)', color: 'text-amber-400', badge: 'bg-amber-500/25 border-amber-500/50' },
  { id: 'interesado', label: 'Interesado (Caliente)', color: 'text-emerald-500', badge: 'bg-emerald-500/25 border-emerald-500/50' },
  { id: 'cierres', label: 'Cierres', color: 'text-emerald-400', badge: 'bg-emerald-500/30 border-emerald-400/60' },
  { id: 'cancelados', label: 'Cancelados', color: 'text-red-400', badge: 'bg-red-500/20 border-red-500/40' },
] as const;

const VENDEDORES = ['Rodolfo', 'Daniela'];
const DEFAULT_CLIENT_ID = 'izzi';
const CURRENT_USER_KEY = 'agentia_crm_user';

function getBadgeClass(status: string): string {
  const col = PIPELINE.find((p) => p.id === status);
  return col?.badge ?? 'bg-slate-500/20 border-slate-500/40';
}

function getWhatsAppUrl(senderId: string | undefined): string {
  if (!senderId) return '#';
  const num = senderId.replace(/@.*$/, '').replace(/\D/g, '');
  return `https://wa.me/${num}`;
}

function getCalendarUrl(lead: Lead): string {
  const title = encodeURIComponent(`Cita: ${lead.senderName || 'Lead'} - ${lead.clientId}`);
  const details = encodeURIComponent(`Lead: ${lead.senderName}\nCliente: ${lead.clientId}\nÚltimo: ${lead.lastMessage?.slice(0, 100) || ''}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [assignMenu, setAssignMenu] = useState<string | null>(null);
  const [globalPaused, setGlobalPaused] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [recentlyMovedByAI, setRecentlyMovedByAI] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const prevLeadsRef = useRef<Lead[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem(CURRENT_USER_KEY) || VENDEDORES[0]);
    }
  }, []);

  const setUser = (u: string) => {
    setCurrentUser(u);
    if (typeof window !== 'undefined') localStorage.setItem(CURRENT_USER_KEY, u);
  };

  const fetchLeads = useCallback(() => {
    setFetchError(null);
    return Promise.all([
      fetch('/api/leads').then(async (r) => {
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(r.ok ? 'Respuesta inválida' : `Error ${r.status}: ${text.slice(0, 100)}`);
        }
      }),
      fetch('/api/leads/alerts').then(async (r) => {
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          return { alerts: [] };
        }
      }),
    ]).then(([leadsData, alertsData]) => {
      if (leadsData?.error) throw new Error(leadsData.error);
      const newLeads = leadsData.leads ?? [];
      const prev = prevLeadsRef.current;

      if (prev?.length) {
        const prevMap = new Map(prev.map((l) => [l.leadId, l]));
        const newInInteresado = newLeads.filter(
          (l: Lead) =>
            (l.status || '').toLowerCase() === 'interesado' &&
            (prevMap.get(l.leadId)?.lastMessageAt !== l.lastMessageAt || !prevMap.has(l.leadId))
        );
        const statusChangedLeads = newLeads.filter(
          (l: Lead) => (prevMap.get(l.leadId)?.status || '') !== (l.status || '')
        );
        const aiMovedLeads = statusChangedLeads.filter((l: Lead) => {
          const classifiedAt = l.lastClassifiedByAI ? new Date(l.lastClassifiedByAI).getTime() : 0;
          const now = Date.now();
          return classifiedAt > 0 && now - classifiedAt < 120000; // últimos 2 min
        });
        if (newInInteresado.length > 0) playAlertSound('message');
        if (aiMovedLeads.length > 0) {
          playAlertSound('logro');
          setRecentlyMovedByAI((s) => new Set([...s, ...aiMovedLeads.map((l: Lead) => l.leadId)]));
        } else if (statusChangedLeads.length > 0) {
          playAlertSound('moved');
        }
      }

      prevLeadsRef.current = newLeads;
      if (leadsData.leads) setLeads(leadsData.leads);
      if (alertsData.alerts) setAlerts(alertsData.alerts);
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : 'Error al cargar leads';
      setFetchError(msg);
      setLeads([]);
      setAlerts([]);
    });
  }, []);

  useEffect(() => {
    fetchLeads().finally(() => setLoading(false));
    const t = setInterval(fetchLeads, 8000);
    return () => clearInterval(t);
  }, [fetchLeads]);

  useEffect(() => {
    if (recentlyMovedByAI.size === 0) return;
    const timer = setTimeout(() => setRecentlyMovedByAI(new Set()), 2500);
    return () => clearTimeout(timer);
  }, [recentlyMovedByAI]);

  const handleStatusChange = async (leadId: string, newStatus: string, cancelReason?: string) => {
    const prev = leads.find((l) => l.leadId === leadId);
    if (!prev || prev.status === newStatus) return;
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        l.leadId === leadId ? { ...l, status: newStatus, cancelReason: cancelReason ?? l.cancelReason ?? null } : l
      )
    );
    try {
      const body: Record<string, string> = { leadId, status: newStatus };
      if (newStatus === 'cierres' && currentUser) {
        body.closedBy = currentUser;
        body.clientId = prev.clientId || '';
      }
      if (newStatus === 'cancelados' && cancelReason) {
        body.cancelReason = cancelReason;
      }
      const res = await fetch('/api/leads/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) fetchLeads();
    } catch {
      fetchLeads();
    }
  };

  const handleLeadClick = async (lead: Lead) => {
    if (!currentUser) return;
    setSelectedLead(lead);
    try {
      await fetch('/api/leads/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.leadId,
          handlerId: currentUser,
          clientId: lead.clientId,
          status: lead.status,
        }),
      });
      fetchLeads();
    } catch {
      //
    }
  };

  const releaseLead = async () => {
    if (!selectedLead) return;
    try {
      await fetch('/api/leads/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.leadId, handlerId: null }),
      });
      setSelectedLead(null);
      fetchLeads();
    } catch {
      setSelectedLead(null);
    }
  };

  const handleDeleteLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este lead? Se borrará del tablero.')) return;
    setDeletingLeadId(leadId);
    try {
      const res = await fetch('/api/leads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.ok) {
        setLeads((prev) => prev.filter((l) => l.leadId !== leadId));
        if (selectedLead?.leadId === leadId) setSelectedLead(null);
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleSendReply = async () => {
    if (!selectedLead || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.leadId, message: replyText.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setReplyText('');
        setSelectedLead((prev) =>
          prev ? { ...prev, lastReply: replyText.trim(), lastMessageAt: new Date().toISOString() } : null
        );
        fetchLeads();
      } else {
        alert(data.error || 'Error al enviar');
      }
    } catch {
      alert('Error al enviar');
    } finally {
      setSendingReply(false);
    }
  };

  const handleAssign = async (leadId: string, vendedor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await fetch('/api/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, assignedTo: vendedor || null }),
      });
      const data = await res.json();
      if (data.ok) fetchLeads();
    } catch {
      //
    }
  };

  const handlePause = async (leadId: string, paused: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await fetch('/api/leads/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, paused }),
      });
      const data = await res.json();
      if (data.ok) fetchLeads();
    } catch {
      //
    }
  };

  const fetchGlobalPause = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/pause-global?clientId=${DEFAULT_CLIENT_ID}`);
      const data = await res.json();
      if (data.paused !== undefined) setGlobalPaused(data.paused);
    } catch {
      setGlobalPaused(false);
    }
  }, []);

  const handleGlobalPause = async (paused: boolean) => {
    try {
      const res = await fetch('/api/leads/pause-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: DEFAULT_CLIENT_ID, paused }),
      });
      const data = await res.json();
      if (data.ok) {
        setGlobalPaused(paused);
        fetchLeads();
      }
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchGlobalPause();
  }, [fetchGlobalPause]);

  const formatTime = (d: string | null) => {
    if (!d) return '';
    const dt = new Date(d);
    const now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const onDragStart = (e: React.DragEvent, leadId: string) => {
    setDragging(leadId);
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const onDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(columnId);
  };

  const onDragLeave = () => setDragOver(null);

  const onDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    setDragOver(null);
    setDragging(null);
    if (leadId) handleStatusChange(leadId, columnId);
  };

  const norm = (s: string) => (s || 'nuevos').toLowerCase().trim();
  const leadsByStatus = PIPELINE.reduce(
    (acc, col) => ({
      ...acc,
      [col.id]: leads.filter((l) => norm(l.status) === col.id),
    }),
    {} as Record<string, Lead[]>
  );
  const unknownLeads = leads.filter((l) => !PIPELINE.some((p) => norm(l.status) === p.id));
  if (unknownLeads.length > 0) {
    leadsByStatus.nuevos = [...(leadsByStatus.nuevos ?? []), ...unknownLeads];
  }

  return (
    <main className="min-h-screen p-6 bg-[#0a1209]">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/dashboard" className="text-slate-400 hover:text-sage inline-flex items-center gap-2 transition">
              ← Volver
            </Link>
            <h1 className="text-2xl font-bold mt-2 tracking-tight text-white font-heading">
              Pipeline de Leads
            </h1>
            <p className="text-slate-400 text-sm mt-1">Arrastra las tarjetas · Haz clic para abrir chat</p>
            <p className="text-slate-400 text-xs mt-1">Bot sin respuesta: ejecuta <code className="bg-slate-800/60 px-1 rounded border border-forest">node scripts/whatsapp-bridge.js</code> y revisa que el lead no tenga &quot;Bot pausado&quot;</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleGlobalPause(globalPaused !== true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                globalPaused
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'border-forest bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
              }`}
              title={globalPaused ? 'Reanudar bot globalmente' : 'PAUSA GLOBAL - Detener todo el bot'}
            >
              <Pause className="w-4 h-4" />
              {globalPaused ? 'Bot pausado (clic para reanudar)' : 'Kill Switch'}
            </button>
            <User className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400 text-sm">Estoy como:</span>
            <select
              value={currentUser}
              onChange={(e) => setUser(e.target.value)}
              className="rounded-lg border border-forest bg-slate-900/60 backdrop-blur-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
            >
              {VENDEDORES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {alerts.filter((a) => !a.sentAt).length > 0 && (
          <section className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm">
            <h2 className="text-sm font-medium text-amber-400 mb-2">Leads que requieren atención</h2>
            <div className="flex flex-wrap gap-2">
              {alerts.filter((a) => !a.sentAt).map((a) => (
                <div key={a.id} className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{a.senderName || 'Sin nombre'}</span>
                    <span className="text-slate-400">({a.clientId})</span>
                    {a.senderId && <span className="text-sage text-xs">📱 {a.senderId}</span>}
                    <span className="text-amber-400/80 text-xs">
                      {a.reason === 'sale_closed' ? '💰 Venta cerrada - Validar y capturar' : a.reason === 'documents_confirmed' ? '📋 Documentos confirmados - Copiar a Izzi' : '🚨 Urgente'}
                    </span>
                  </div>
                  {a.reason === 'documents_confirmed' && a.lastMessage && (
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono mt-1 p-2 rounded bg-black/30 max-h-32 overflow-y-auto">{a.lastMessage}</pre>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <p className="text-slate-400">Cargando...</p>
        ) : fetchError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            <p className="font-medium">Error al cargar leads</p>
            <p className="text-sm mt-1">{fetchError}</p>
            <p className="text-xs mt-2 text-slate-400">Revisa que la app esté corriendo y MongoDB configurado.</p>
            <button onClick={() => { setLoading(true); fetchLeads().finally(() => setLoading(false)); }} className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm transition">
              Reintentar
            </button>
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-forest bg-forest/10 p-8 text-center">
            <p className="text-sage font-medium">No hay leads aún</p>
            <p className="text-slate-400 text-sm mt-1">Los leads aparecerán aquí cuando alguien escriba por WhatsApp.</p>
            <p className="text-slate-500 text-xs mt-2">Asegúrate de que el WhatsApp Bridge esté corriendo: <code className="bg-black/40 px-1 rounded">npm run whatsapp</code></p>
          </div>
        ) : (
          <div className="relative w-full">
            <div className="overflow-x-auto overflow-y-visible pb-6 min-h-[400px] scroll-smooth -mx-2 px-2">
              <div className="flex gap-2 min-w-max">
            {PIPELINE.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => onDragOver(e, col.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, col.id)}
                className={`
                  flex-shrink-0 w-[170px] sm:w-[185px] rounded-xl p-2.5 sm:p-3 transition-all duration-200
                  ${dragOver === col.id ? 'ring-2 ring-sage bg-forest/20' : ''}
                  bg-slate-900/60 backdrop-blur-xl border border-forest
                  hover:border-sage
                `}
              >
                <div className="flex items-center justify-between mb-2 gap-1 min-w-0">
                  <h3 className={`font-semibold text-xs truncate ${col.color}`} title={col.label}>{col.label}</h3>
                  <span className="text-slate-400 text-xs shrink-0">{leadsByStatus[col.id]?.length ?? 0}</span>
                </div>
                <div className="space-y-2">
                  {(leadsByStatus[col.id] ?? []).map((lead) => (
                    <div
                      key={lead.leadId}
                      draggable
                      onClick={() => handleLeadClick(lead)}
                      onDragStart={(e) => onDragStart(e, lead.leadId)}
                      onDragEnd={onDragEnd}
                      className={`
                        group rounded-lg p-2.5 cursor-grab active:cursor-grabbing
                        bg-slate-900/60 backdrop-blur-xl border border-forest
                        transition-all duration-300
                        ${dragging === lead.leadId ? 'opacity-50 scale-95' : 'opacity-100'}
                        ${selectedLead?.leadId === lead.leadId ? 'ring-2 ring-sage' : ''}
                        ${recentlyMovedByAI.has(lead.leadId) ? 'animate-slide-in-logro' : ''}
                        hover:border-sage
                      `}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <SourceIcon source={lead.source || lead.platform || 'whatsapp'} />
                          <span className="font-bold text-white text-xs truncate">{lead.senderName || 'Sin nombre'}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {lead.is_being_handled_by && (
                            <span className="px-1 py-0.5 rounded text-[8px] bg-amber-500/25 text-amber-400 border border-amber-500/40" title={`Atendiendo: ${lead.is_being_handled_by}`}>
                              👤
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${getBadgeClass(lead.status)}`}>
                            {lead.clientId}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-[11px] line-clamp-2 mb-1 min-h-[28px]">
                        {lead.lastMessage || 'Sin mensaje'}
                      </p>
                      {lead.status?.toLowerCase() === 'cancelados' && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] bg-red-500/20 text-red-300 border border-red-500/40 mb-1">
                          {lead.cancelReason || 'Sin especificar'}
                        </span>
                      )}
                      <p className="text-slate-400 text-[9px] mb-2">{formatTime(lead.lastMessageAt)}</p>

                      <div className="flex items-center gap-1">
                        {lead.platform === 'whatsapp' && lead.senderId && (
                          <a
                            href={getWhatsAppUrl(lead.senderId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded bg-forest/30 hover:bg-forest/50 text-sage transition"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        )}
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isPaused = lead.assignedTo || lead.bot_status === 'paused';
                              if (isPaused) handleAssign(lead.leadId, '', e);
                            }}
                            onMouseEnter={() => !(lead.assignedTo || lead.bot_status === 'paused') && setAssignMenu(lead.leadId)}
                            onMouseLeave={() => setAssignMenu(null)}
                            className={`p-1 rounded transition ${
                              lead.assignedTo || lead.bot_status === 'paused'
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                                : 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-400'
                            }`}
                            title={lead.assignedTo || lead.bot_status === 'paused' ? 'Reanudar bot' : 'Pausar bot'}
                          >
                            {lead.assignedTo || lead.bot_status === 'paused' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          </button>
                          {!(lead.assignedTo || lead.bot_status === 'paused') && assignMenu === lead.leadId && (
                            <div
                              className="absolute left-0 top-full mt-1 z-20 rounded-lg border border-forest bg-slate-900/95 backdrop-blur-xl p-1"
                              onMouseEnter={() => setAssignMenu(lead.leadId)}
                              onMouseLeave={() => setAssignMenu(null)}
                            >
                              <button
                                onClick={(e) => handlePause(lead.leadId, true, e)}
                                className="block w-full text-left px-2 py-1 text-xs hover:bg-primary/20 rounded text-sage font-medium"
                              >
                                Pausar bot
                              </button>
                              <p className="px-2 py-1 text-[10px] text-slate-400">Asignar a →</p>
                              {VENDEDORES.map((v) => (
                                <button
                                  key={v}
                                  onClick={(e) => handleAssign(lead.leadId, v, e)}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-primary/20 rounded text-sage"
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <a
                          href={getCalendarUrl(lead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 transition"
                          title="Agendar cita"
                        >
                          <Calendar className="w-3 h-3" />
                        </a>
                        <button
                          onClick={(e) => handleDeleteLead(lead.leadId, e)}
                          disabled={deletingLeadId === lead.leadId}
                          className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50"
                          title="Eliminar lead"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {(lead.assignedTo || lead.bot_status === 'paused') && (
                        <p className="text-[9px] text-amber-400/80 mt-0.5">Bot pausado{lead.assignedTo ? ` · ${lead.assignedTo}` : ''}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-1 text-center sm:text-left">← Desliza para ver todas las columnas →</p>
          </div>
        )}

        {selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={releaseLead} />
            <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-forest flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-forest">
                <div className="flex items-center gap-2">
                  <SourceIcon source={selectedLead.source || selectedLead.platform || 'whatsapp'} />
                  <span className="font-bold text-white">{selectedLead.senderName || 'Sin nombre'}</span>
                  <span className="text-xs text-amber-400">· Atendiendo: {currentUser}</span>
                </div>
                <button
                  onClick={releaseLead}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition"
                  title="Soltar chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {selectedLead.status?.toLowerCase() === 'cancelados' && (
                  <p className="text-red-400 text-xs mb-3">
                    Motivo: {selectedLead.cancelReason || 'Sin especificar'}
                  </p>
                )}
                <p className="text-slate-400 text-sm mb-2">Último mensaje:</p>
                <p className="text-white text-sm mb-4">{selectedLead.lastMessage || '—'}</p>
                <p className="text-slate-400 text-xs mb-4">Respuesta: {selectedLead.lastReply || '—'}</p>
                {selectedLead.platform === 'whatsapp' && selectedLead.senderId && (
                  <>
                    <a
                      href={getWhatsAppUrl(selectedLead.senderId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest/30 text-sage hover:bg-forest/50 transition mb-4"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Abrir en WhatsApp
                    </a>
                    <div className="mt-4 pt-4 border-t border-forest">
                      <p className="text-slate-400 text-xs mb-2">Responder desde el CRM:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                          placeholder="Escribe tu mensaje..."
                          className="flex-1 rounded-lg border border-forest bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyText.trim() || sendingReply}
                          className="px-4 py-2 rounded-lg bg-sage text-slate-900 font-medium hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Enviar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
