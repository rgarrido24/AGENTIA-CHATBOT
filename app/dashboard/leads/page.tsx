'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Pause, Play, X, User, Trash2, Send,
  Search, Phone, Mail, MapPin, Package, FileText, Clock,
  ChevronRight, AlertTriangle, CheckCircle2, Circle,
  Copy, RefreshCw,
} from 'lucide-react';
import { SourceIcon } from '@/components/SourceIcon';
import { playAlertSound } from '@/src/lib/sounds';

type DocumentExpedient = {
  nombre: string;
  curp: string;
  direccion: string;
  telefono: string;
  correo: string;
  paquete: string;
  promocion: string;
};

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
  documentExpedient?: DocumentExpedient | null;
  createdAt?: string | null;
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
  {
    id: 'nuevos',
    label: 'Nuevos',
    icon: '👋',
    color: 'text-slate-300',
    headerBg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
    dropBg: 'ring-slate-400/50 bg-slate-500/10',
  },
  {
    id: 'preguntones',
    label: 'Preguntones',
    icon: '❄️',
    color: 'text-blue-300',
    headerBg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
    dropBg: 'ring-blue-400/50 bg-blue-500/10',
  },
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    icon: '🌤️',
    color: 'text-amber-300',
    headerBg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    dropBg: 'ring-amber-400/50 bg-amber-500/10',
  },
  {
    id: 'interesado',
    label: 'Interesado',
    icon: '🔥',
    color: 'text-orange-300',
    headerBg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
    dropBg: 'ring-orange-400/50 bg-orange-500/10',
  },
  {
    id: 'cierres',
    label: 'Cierres',
    icon: '✅',
    color: 'text-emerald-300',
    headerBg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    dropBg: 'ring-emerald-400/50 bg-emerald-500/10',
  },
  {
    id: 'cancelados',
    label: 'Cancelados',
    icon: '❌',
    color: 'text-red-300',
    headerBg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    dropBg: 'ring-red-400/50 bg-red-500/10',
  },
] as const;

const VENDEDORES = ['Rodolfo', 'Daniela'];
const DEFAULT_CLIENT_ID = 'izzi';
const CURRENT_USER_KEY = 'agentia_crm_user';

// ─── Urgency helpers ─────────────────────────────────────
function getUrgencyBorder(lastMessageAt: string | null): string {
  if (!lastMessageAt) return 'border-l-2 border-l-slate-700';
  const diff = Date.now() - new Date(lastMessageAt).getTime();
  if (diff < 5 * 60_000)        return 'border-l-2 border-l-emerald-400';
  if (diff < 60 * 60_000)       return 'border-l-2 border-l-amber-400';
  if (diff < 24 * 60 * 60_000)  return 'border-l-2 border-l-orange-500';
  return                               'border-l-2 border-l-slate-700';
}

function getUrgencyDot(lastMessageAt: string | null): string {
  if (!lastMessageAt) return 'bg-slate-600';
  const diff = Date.now() - new Date(lastMessageAt).getTime();
  if (diff < 5 * 60_000)        return 'bg-emerald-400 animate-pulse';
  if (diff < 60 * 60_000)       return 'bg-amber-400';
  if (diff < 24 * 60 * 60_000)  return 'bg-orange-500';
  return                               'bg-slate-600';
}

function getUrgencyLabel(lastMessageAt: string | null): string {
  if (!lastMessageAt) return '';
  const diff = Date.now() - new Date(lastMessageAt).getTime();
  if (diff < 5 * 60_000)       return 'Ahora';
  if (diff < 60 * 60_000)      return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / 3_600_000)}h`;
  const days = Math.floor(diff / 86_400_000);
  return `${days}d`;
}

function getWhatsAppUrl(senderId: string | undefined): string {
  if (!senderId) return '#';
  const num = senderId.replace(/@.*$/, '').replace(/\D/g, '');
  return `https://wa.me/${num}`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── CancelModal component ────────────────────────────────
function CancelModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl p-6 w-80 shadow-2xl">
        <h3 className="text-white font-semibold mb-3">¿Por qué se cancela?</h3>
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && reason.trim() && onConfirm(reason.trim())}
          placeholder="Ej: Sin cobertura, No contesta..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition">
            Cancelar
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="flex-1 px-3 py-2 rounded-lg bg-red-500/80 text-white text-sm font-medium hover:bg-red-500 transition disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
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
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [cancelModal, setCancelModal] = useState<{ leadId: string } | null>(null);
  const [copied, setCopied] = useState('');
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
        try { return JSON.parse(text); }
        catch { throw new Error(r.ok ? 'Respuesta inválida' : `Error ${r.status}: ${text.slice(0, 100)}`); }
      }),
      fetch('/api/leads/alerts').then(async (r) => {
        const text = await r.text();
        try { return JSON.parse(text); }
        catch { return { alerts: [] }; }
      }),
    ]).then(([leadsData, alertsData]) => {
      if (leadsData?.error) throw new Error(leadsData.error);
      const newLeads: Lead[] = leadsData.leads ?? [];
      prevLeadsRef.current = newLeads;
      if (leadsData.leads) setLeads(newLeads);
      if (alertsData.alerts) setAlerts(alertsData.alerts);
      setSelectedLead((prev) => {
        if (!prev) return null;
        return newLeads.find((l) => l.leadId === prev.leadId) ?? prev;
      });
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : 'Error al cargar leads';
      setFetchError(msg);
    });
  }, []);

  // Procesa un nuevo array de leads: detecta cambios y dispara sonidos
  const processLeadsPayload = useCallback((newLeads: Lead[]) => {
    const prev = prevLeadsRef.current;
    if (prev?.length) {
      const prevMap = new Map(prev.map((l) => [l.leadId, l]));
      const newInInteresado = newLeads.filter(
        (l) =>
          (l.status || '').toLowerCase() === 'interesado' &&
          (prevMap.get(l.leadId)?.lastMessageAt !== l.lastMessageAt || !prevMap.has(l.leadId))
      );
      const statusChangedLeads = newLeads.filter(
        (l) => (prevMap.get(l.leadId)?.status || '') !== (l.status || '')
      );
      const aiMovedLeads = statusChangedLeads.filter((l) => {
        const classifiedAt = l.lastClassifiedByAI ? new Date(l.lastClassifiedByAI).getTime() : 0;
        return classifiedAt > 0 && Date.now() - classifiedAt < 120000;
      });
      if (newInInteresado.length > 0) playAlertSound('message');
      if (aiMovedLeads.length > 0) {
        playAlertSound('logro');
        setRecentlyMovedByAI((s) => new Set([...s, ...aiMovedLeads.map((l) => l.leadId)]));
      } else if (statusChangedLeads.length > 0) {
        playAlertSound('moved');
      }
    }
    prevLeadsRef.current = newLeads;
    setLeads(newLeads);
    setSelectedLead((prev) => {
      if (!prev) return null;
      return newLeads.find((l) => l.leadId === prev.leadId) ?? prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling garantizado cada 6s — siempre activo independientemente de SSE
  useEffect(() => {
    fetchLeads().finally(() => setLoading(false));
    const poll = setInterval(() => {
      fetch('/api/leads')
        .then((r) => r.json())
        .then((data) => {
          if (data?.leads) processLeadsPayload(data.leads as Lead[]);
        })
        .catch(() => { /* silencioso — el error de red ya se maneja en fetchLeads */ });
    }, 6000);
    return () => clearInterval(poll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SSE como capa adicional de velocidad (actualiza en ~3s cuando funciona)
  useEffect(() => {
    let es: EventSource | null = null;

    const connect = () => {
      try {
        es = new EventSource('/api/leads/stream');

        es.addEventListener('leads', (e) => {
          try {
            const { leads: newLeads } = JSON.parse(e.data) as { leads: Lead[] };
            processLeadsPayload(newLeads);
          } catch { /* ignore */ }
        });

        es.addEventListener('alerts', (e) => {
          try {
            const { alerts: newAlerts } = JSON.parse(e.data) as { alerts: Alert[] };
            setAlerts(newAlerts);
          } catch { /* ignore */ }
        });

        es.onerror = () => {
          es?.close();
          es = null;
          // Reconectar en 10s; el polling garantizado sigue corriendo de todas formas
          setTimeout(connect, 10000);
        };
      } catch { /* SSE no soportado — el polling cubre */ }
    };

    connect();
    return () => { es?.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recentlyMovedByAI.size === 0) return;
    const timer = setTimeout(() => setRecentlyMovedByAI(new Set()), 2500);
    return () => clearTimeout(timer);
  }, [recentlyMovedByAI]);

  const handleStatusChange = async (leadId: string, newStatus: string, cancelReason?: string) => {
    const prev = leads.find((l) => l.leadId === leadId);
    if (!prev || prev.status === newStatus) return;
    if (newStatus === 'cancelados' && !cancelReason) {
      setCancelModal({ leadId });
      return;
    }
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        l.leadId === leadId ? { ...l, status: newStatus, cancelReason: cancelReason ?? l.cancelReason ?? null } : l
      )
    );
    try {
      const body: Record<string, string> = { leadId, status: newStatus };
      if (newStatus === 'cierres' && currentUser) { body.closedBy = currentUser; body.clientId = prev.clientId || ''; }
      if (newStatus === 'cancelados' && cancelReason) body.cancelReason = cancelReason;
      const res = await fetch('/api/leads/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.ok) fetchLeads();
    } catch { fetchLeads(); }
  };

  const handleLeadClick = async (lead: Lead) => {
    if (!currentUser) return;
    setSelectedLead(lead);
    setReplyText('');
    try {
      await fetch('/api/leads/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.leadId, handlerId: currentUser, clientId: lead.clientId, status: lead.status }),
      });
      fetchLeads();
    } catch { /**/ }
  };

  const releaseLead = async () => {
    if (!selectedLead) return;
    try {
      await fetch('/api/leads/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.leadId, handlerId: null }),
      });
    } catch { /**/ }
    setSelectedLead(null);
    fetchLeads();
  };

  const handleDeleteLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este lead y reiniciar su sesión de chat?')) return;
    setDeletingLeadId(leadId);
    try {
      const res = await fetch('/api/leads/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId }) });
      const data = await res.json();
      if (data.ok) {
        setLeads((prev) => prev.filter((l) => l.leadId !== leadId));
        if (selectedLead?.leadId === leadId) setSelectedLead(null);
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch { alert('Error al eliminar'); }
    finally { setDeletingLeadId(null); }
  };

  const handleSendReply = async () => {
    if (!selectedLead || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch('/api/chat/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: selectedLead.leadId, message: replyText.trim() }) });
      const data = await res.json();
      if (data.ok) {
        setReplyText('');
        fetchLeads();
      } else { alert(data.error || 'Error al enviar'); }
    } catch { alert('Error al enviar'); }
    finally { setSendingReply(false); }
  };

  const handleAssign = async (leadId: string, vendedor: string, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    await fetch('/api/leads/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, assignedTo: vendedor || null }) }).catch(() => {});
    fetchLeads();
  };

  const handlePause = async (leadId: string, paused: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    await fetch('/api/leads/pause', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, paused }) }).catch(() => {});
    fetchLeads();
  };

  const fetchGlobalPause = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/pause-global?clientId=${DEFAULT_CLIENT_ID}`);
      const data = await res.json();
      if (data.paused !== undefined) setGlobalPaused(data.paused);
    } catch { setGlobalPaused(false); }
  }, []);

  const handleGlobalPause = async (paused: boolean) => {
    await fetch('/api/leads/pause-global', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: DEFAULT_CLIENT_ID, paused }) }).catch(() => {});
    setGlobalPaused(paused);
    fetchLeads();
  };

  useEffect(() => { fetchGlobalPause(); }, [fetchGlobalPause]);

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  // Drag & drop
  const onDragStart = (e: React.DragEvent, leadId: string) => {
    setDragging(leadId); e.dataTransfer.setData('text/plain', leadId); e.dataTransfer.effectAllowed = 'move';
  };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };
  const onDragOver = (e: React.DragEvent, columnId: string) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(columnId); };
  const onDragLeave = () => setDragOver(null);
  const onDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    setDragOver(null); setDragging(null);
    if (leadId) handleStatusChange(leadId, columnId);
  };

  // Filtered leads
  const norm = (s: string) => (s || 'nuevos').toLowerCase().trim();
  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (l.senderName || '').toLowerCase().includes(q) ||
      (l.senderId || '').replace(/@.*$/, '').includes(q) ||
      (l.lastMessage || '').toLowerCase().includes(q);
    const matchAssignee = !filterAssignee || l.assignedTo === filterAssignee;
    return matchSearch && matchAssignee;
  });

  const leadsByStatus = PIPELINE.reduce(
    (acc, col) => ({ ...acc, [col.id]: filteredLeads.filter((l) => norm(l.status) === col.id) }),
    {} as Record<string, Lead[]>
  );
  const unknownLeads = filteredLeads.filter((l) => !PIPELINE.some((p) => norm(l.status) === p.id));
  if (unknownLeads.length > 0) leadsByStatus.nuevos = [...(leadsByStatus.nuevos ?? []), ...unknownLeads];

  const totalLeads = leads.length;
  const pendingAlerts = alerts.filter((a) => !a.sentAt && a.reason === 'documents_confirmed');

  return (
    <main className="min-h-screen bg-[#070d06] text-white">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#070d06]/95 backdrop-blur-xl border-b border-forest/50 px-4 sm:px-6 py-3">
        <div className="max-w-[1900px] mx-auto flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 hover:text-sage transition text-sm">← Dashboard</Link>
            <span className="text-forest/60">|</span>
            <h1 className="font-bold text-white tracking-tight">Pipeline CRM</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-xs border border-forest/30">
              {totalLeads} leads
            </span>
            {loading && <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Kill switch */}
            <button
              onClick={() => handleGlobalPause(globalPaused !== true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                globalPaused
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'border-forest bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {globalPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {globalPaused ? 'Bot pausado — Reanudar' : 'Kill Switch'}
            </button>
            {/* User selector */}
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={currentUser}
                onChange={(e) => setUser(e.target.value)}
                className="rounded-lg border border-forest bg-slate-800/60 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sage"
              >
                {VENDEDORES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1900px] mx-auto px-4 sm:px-6 py-4">

        {/* ── Alerta documentos confirmados ─────────────── */}
        {pendingAlerts.length > 0 && (
          <section className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-500/20 bg-emerald-500/10">
              <AlertTriangle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-semibold">
                {pendingAlerts.length} venta{pendingAlerts.length > 1 ? 's' : ''} para capturar en IZZI
              </span>
            </div>
            <div className="divide-y divide-emerald-500/10">
              {pendingAlerts.map((a) => (
                <div key={a.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{a.senderName || 'Sin nombre'}</span>
                      {a.senderId && (
                        <button
                          onClick={() => handleCopy(a.senderId!.replace(/@.*$/, '').replace(/\D/g, ''), `alert-${a.id}`)}
                          className="flex items-center gap-1 text-xs text-sage hover:text-white transition"
                        >
                          <Phone className="w-3 h-3" />
                          {a.senderId.replace(/@.*$/, '').replace(/\D/g, '')}
                          {copied === `alert-${a.id}` ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-50" />}
                        </button>
                      )}
                    </div>
                    {a.lastMessage && (
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono p-2.5 rounded-lg bg-black/30 border border-forest/20 max-h-40 overflow-y-auto">
                        {a.lastMessage}
                      </pre>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopy(a.lastMessage || '', `alert-copy-${a.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-500/30 transition shrink-0"
                  >
                    {copied === `alert-copy-${a.id}` ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar datos
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Stats bar ─────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {PIPELINE.map((col) => {
            const count = leads.filter((l) => norm(l.status) === col.id).length;
            return (
              <div key={col.id} className={`rounded-xl p-3 border ${col.border} ${col.headerBg} text-center`}>
                <div className="text-lg font-bold text-white">{count}</div>
                <div className={`text-[10px] font-medium ${col.color} truncate`}>{col.icon} {col.label}</div>
              </div>
            );
          })}
        </div>

        {/* ── Search & Filter bar ───────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o mensaje..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-forest bg-slate-900/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage/50"
            />
          </div>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="rounded-lg border border-forest bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage/50"
          >
            <option value="">Todos los asesores</option>
            {VENDEDORES.map((v) => <option key={v} value={v}>{v}</option>)}
            <option value="__unassigned__">Sin asignar</option>
          </select>
          {(search || filterAssignee) && (
            <button
              onClick={() => { setSearch(''); setFilterAssignee(''); }}
              className="px-3 py-2 rounded-lg border border-forest text-slate-400 text-sm hover:text-white hover:border-slate-500 transition"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* ── Error state ───────────────────────────────── */}
        {fetchError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-4 flex items-center justify-between">
            <span className="text-sm">{fetchError}</span>
            <button onClick={() => { setLoading(true); fetchLeads().finally(() => setLoading(false)); }} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs transition">
              Reintentar
            </button>
          </div>
        )}

        {/* ── Loading / Empty states ─────────────────────── */}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando pipeline...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-forest bg-forest/5 p-10 text-center">
            <p className="text-sage font-semibold text-lg mb-1">Pipeline vacío</p>
            <p className="text-slate-400 text-sm">Los leads aparecerán aquí en tiempo real cuando alguien escriba.</p>
            <code className="mt-2 inline-block text-xs text-slate-500 bg-black/40 px-2 py-1 rounded">npm run whatsapp</code>
          </div>
        ) : (
          /* ── Kanban board ─────────────────────────────── */
          <div className="overflow-x-auto overflow-y-visible pb-6 -mx-2 px-2">
            <div className="flex gap-3 min-w-max">
              {PIPELINE.map((col) => {
                const colLeads = leadsByStatus[col.id] ?? [];
                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => onDragOver(e, col.id)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, col.id)}
                    className={`
                      flex-shrink-0 w-[210px] rounded-2xl
                      bg-slate-900/50 backdrop-blur-xl border
                      transition-all duration-200
                      ${dragOver === col.id ? `ring-2 ${col.dropBg} border-transparent` : `${col.border}`}
                    `}
                  >
                    {/* Column header */}
                    <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-2xl ${col.headerBg} border-b ${col.border}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <span className={`font-semibold text-xs ${col.color}`}>{col.icon} {col.label}</span>
                      </div>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-black/20 ${col.color}`}>
                        {colLeads.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="p-2 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                      {colLeads.length === 0 && (
                        <div className="py-6 text-center text-slate-600 text-[11px]">Sin leads</div>
                      )}
                      {colLeads.map((lead) => (
                        <div
                          key={lead.leadId}
                          draggable
                          onClick={() => handleLeadClick(lead)}
                          onDragStart={(e) => onDragStart(e, lead.leadId)}
                          onDragEnd={onDragEnd}
                          className={`
                            group rounded-xl cursor-grab active:cursor-grabbing
                            bg-slate-800/70 backdrop-blur-sm pl-0 overflow-hidden
                            border border-slate-700/50 hover:border-slate-500/80
                            transition-all duration-200
                            ${dragging === lead.leadId ? 'opacity-40 scale-95' : 'opacity-100'}
                            ${selectedLead?.leadId === lead.leadId ? 'ring-2 ring-sage/70 border-sage/40' : ''}
                            ${recentlyMovedByAI.has(lead.leadId) ? 'animate-slide-in-logro' : ''}
                            flex
                          `}
                        >
                          {/* Urgency bar */}
                          <div className={`w-1 shrink-0 rounded-l-xl ${
                            (() => {
                              if (!lead.lastMessageAt) return 'bg-slate-700';
                              const diff = Date.now() - new Date(lead.lastMessageAt).getTime();
                              if (diff < 5 * 60_000)       return 'bg-emerald-400';
                              if (diff < 60 * 60_000)      return 'bg-amber-400';
                              if (diff < 24 * 60 * 60_000) return 'bg-orange-500';
                              return 'bg-slate-700';
                            })()
                          }`} />

                          <div className="flex-1 p-2.5 min-w-0">
                            {/* Name row */}
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <SourceIcon source={lead.source || lead.platform || 'whatsapp'} />
                                <span className="font-semibold text-white text-xs truncate" title={lead.senderName}>
                                  {lead.senderName || 'Sin nombre'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {lead.is_being_handled_by && (
                                  <span className="text-[9px] text-amber-400" title={`Viendo: ${lead.is_being_handled_by}`}>👤</span>
                                )}
                                {lead.messageCount > 0 && (
                                  <span className="px-1 py-0.5 rounded text-[9px] bg-slate-700/60 text-slate-400 border border-slate-600/50">
                                    {lead.messageCount}💬
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Last message */}
                            <p className="text-slate-400 text-[11px] line-clamp-2 mb-1.5 leading-relaxed">
                              {lead.lastMessage || '—'}
                            </p>

                            {/* Doc expedient badge */}
                            {lead.documentExpedient?.nombre && lead.documentExpedient.nombre !== 'NO_LEIBLE' && (
                              <div className="flex items-center gap-1 mb-1.5">
                                <FileText className="w-2.5 h-2.5 text-emerald-400" />
                                <span className="text-[9px] text-emerald-400 truncate">{lead.documentExpedient.nombre}</span>
                              </div>
                            )}

                            {/* Cancel reason */}
                            {lead.status === 'cancelados' && lead.cancelReason && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-red-500/15 text-red-300 border border-red-500/30 mb-1.5 truncate max-w-full">
                                {lead.cancelReason}
                              </span>
                            )}

                            {/* Time + status row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${getUrgencyDot(lead.lastMessageAt)}`} />
                                <span className="text-[10px] text-slate-500">{getUrgencyLabel(lead.lastMessageAt)}</span>
                              </div>
                              {(lead.assignedTo || lead.bot_status === 'paused') && (
                                <span className="text-[9px] text-amber-400/80 truncate max-w-[80px]">
                                  {lead.assignedTo ? `⏸ ${lead.assignedTo}` : '⏸ Pausado'}
                                </span>
                              )}
                            </div>

                            {/* Actions row */}
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-700/40">
                              {lead.platform === 'whatsapp' && lead.senderId && (
                                <a
                                  href={getWhatsAppUrl(lead.senderId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded-lg bg-forest/20 hover:bg-forest/40 text-sage transition"
                                  title="Abrir WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                              )}

                              {/* Pause / assign dropdown */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (lead.assignedTo || lead.bot_status === 'paused') handleAssign(lead.leadId, '', e);
                                  }}
                                  onMouseEnter={() => !(lead.assignedTo || lead.bot_status === 'paused') && setAssignMenu(lead.leadId)}
                                  onMouseLeave={() => setAssignMenu(null)}
                                  className={`p-1 rounded-lg transition ${
                                    lead.assignedTo || lead.bot_status === 'paused'
                                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                                      : 'bg-slate-700/30 hover:bg-slate-700/60 text-slate-400'
                                  }`}
                                  title={lead.assignedTo || lead.bot_status === 'paused' ? 'Reanudar bot' : 'Pausar / Asignar'}
                                >
                                  {lead.assignedTo || lead.bot_status === 'paused' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                                </button>
                                {!(lead.assignedTo || lead.bot_status === 'paused') && assignMenu === lead.leadId && (
                                  <div
                                    className="absolute left-0 top-full mt-1 z-20 rounded-xl border border-forest bg-slate-900/98 backdrop-blur-xl p-1 min-w-[120px] shadow-xl"
                                    onMouseEnter={() => setAssignMenu(lead.leadId)}
                                    onMouseLeave={() => setAssignMenu(null)}
                                  >
                                    <button onClick={(e) => handlePause(lead.leadId, true, e)} className="block w-full text-left px-2.5 py-1.5 text-xs hover:bg-sage/10 rounded-lg text-sage font-medium">
                                      ⏸ Pausar bot
                                    </button>
                                    <div className="border-t border-forest/30 mt-1 pt-1">
                                      <p className="px-2.5 py-1 text-[10px] text-slate-500">Asignar a →</p>
                                      {VENDEDORES.map((v) => (
                                        <button key={v} onClick={(e) => handleAssign(lead.leadId, v, e)} className="block w-full text-left px-2.5 py-1.5 text-xs hover:bg-sage/10 rounded-lg text-slate-300">
                                          👤 {v}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={(e) => handleDeleteLead(lead.leadId, e)}
                                disabled={deletingLeadId === lead.leadId}
                                className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition ml-auto"
                                title="Eliminar lead y reiniciar chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Urgency legend ────────────────────────────── */}
        {!loading && leads.length > 0 && (
          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
            <span className="font-medium">Actividad:</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ahora (−5m)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Reciente (−1h)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Hoy (−24h)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600" /> Inactivo</span>
          </div>
        )}
      </div>

      {/* ── Detail Panel ──────────────────────────────────── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={releaseLead} />
          <div className="relative w-full max-w-lg bg-[#0a1209]/98 backdrop-blur-xl border-l border-forest/60 flex flex-col shadow-2xl">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-forest/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <SourceIcon source={selectedLead.source || selectedLead.platform || 'whatsapp'} />
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{selectedLead.senderName || 'Sin nombre'}</p>
                  {selectedLead.senderId && (
                    <button
                      onClick={() => handleCopy(selectedLead.senderId!.replace(/@.*$/, '').replace(/\D/g, ''), 'phone-header')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sage transition"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      {selectedLead.senderId.replace(/@.*$/, '').replace(/\D/g, '')}
                      {copied === 'phone-header' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                    </button>
                  )}
                </div>
                <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  PIPELINE.find(p => p.id === norm(selectedLead.status))?.color ?? 'text-slate-400'
                } bg-slate-800/50 border-slate-600/40`}>
                  {PIPELINE.find(p => p.id === norm(selectedLead.status))?.icon} {PIPELINE.find(p => p.id === norm(selectedLead.status))?.label ?? selectedLead.status}
                </span>
              </div>
              <button onClick={releaseLead} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* ── Quick stats ── */}
              <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-forest/20">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{selectedLead.messageCount}</div>
                  <div className="text-[10px] text-slate-500">Mensajes</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getUrgencyDot(selectedLead.lastMessageAt)}`} />
                    <span className="text-sm font-bold text-white">{getUrgencyLabel(selectedLead.lastMessageAt)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Último msg</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—'}</div>
                  <div className="text-[10px] text-slate-500">Ingresó</div>
                </div>
              </div>

              {/* ── Document expedient ── */}
              {selectedLead.documentExpedient && (
                <div className="px-5 py-4 border-b border-forest/20">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300">Expediente OCR</span>
                    <button
                      onClick={() => {
                        const exp = selectedLead.documentExpedient!;
                        const txt = `NOMBRE: ${exp.nombre}\nCURP: ${exp.curp}\nDIRECCIÓN: ${exp.direccion}\nTELÉFONO: ${exp.telefono}\nCORREO: ${exp.correo}\nPAQUETE: ${exp.paquete}\nPROMOCIÓN: ${exp.promocion}`;
                        handleCopy(txt, 'expedient-all');
                      }}
                      className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] hover:bg-emerald-500/25 transition"
                    >
                      {copied === 'expedient-all' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copiar todo
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { icon: <User className="w-3 h-3" />, label: 'Nombre', value: selectedLead.documentExpedient.nombre, key: 'exp-nombre' },
                      { icon: <FileText className="w-3 h-3" />, label: 'CURP', value: selectedLead.documentExpedient.curp, key: 'exp-curp' },
                      { icon: <MapPin className="w-3 h-3" />, label: 'Dirección', value: selectedLead.documentExpedient.direccion, key: 'exp-dir' },
                      { icon: <Phone className="w-3 h-3" />, label: 'Teléfono', value: selectedLead.documentExpedient.telefono, key: 'exp-tel' },
                      { icon: <Mail className="w-3 h-3" />, label: 'Correo', value: selectedLead.documentExpedient.correo, key: 'exp-email' },
                      { icon: <Package className="w-3 h-3" />, label: 'Paquete', value: selectedLead.documentExpedient.paquete, key: 'exp-pkg' },
                    ].filter(row => row.value && row.value !== 'NO_LEIBLE' && row.value !== 'NO_ESPECIFICADO').map(row => (
                      <div key={row.key} className="flex items-start gap-2 group/row">
                        <div className="flex items-center gap-1.5 shrink-0 w-20 mt-0.5">
                          <span className="text-slate-500">{row.icon}</span>
                          <span className="text-[10px] text-slate-500">{row.label}</span>
                        </div>
                        <span className="text-xs text-slate-200 flex-1 break-all">{row.value}</span>
                        <button
                          onClick={() => handleCopy(row.value, row.key)}
                          className="opacity-0 group-hover/row:opacity-100 transition p-0.5 text-slate-500 hover:text-sage"
                        >
                          {copied === row.key ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Last conversation ── */}
              <div className="px-5 py-4 border-b border-forest/20">
                <p className="text-xs font-semibold text-slate-400 mb-2">Última conversación</p>
                {selectedLead.lastMessage && (
                  <div className="flex justify-start mb-2">
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tl-sm bg-slate-700/60 text-sm text-slate-200">
                      {selectedLead.lastMessage}
                    </div>
                  </div>
                )}
                {selectedLead.lastReply && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tr-sm bg-forest/40 text-sm text-sage border border-forest/30">
                      {selectedLead.lastReply}
                    </div>
                  </div>
                )}
                {selectedLead.status === 'cancelados' && selectedLead.cancelReason && (
                  <p className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    Cancelado: {selectedLead.cancelReason}
                  </p>
                )}
              </div>

              {/* ── Move to stage ── */}
              <div className="px-5 py-4 border-b border-forest/20">
                <p className="text-xs font-semibold text-slate-400 mb-2">Mover a etapa</p>
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE.filter(p => p.id !== norm(selectedLead.status)).map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (p.id === 'cancelados') {
                          setCancelModal({ leadId: selectedLead.leadId });
                        } else {
                          handleStatusChange(selectedLead.leadId, p.id);
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] transition ${p.border} ${p.headerBg} ${p.color} hover:opacity-80`}
                    >
                      {p.icon} {p.label} <ChevronRight className="w-2.5 h-2.5 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Assign / Pause ── */}
              <div className="px-5 py-4 border-b border-forest/20">
                <p className="text-xs font-semibold text-slate-400 mb-2">Asignación y Bot</p>
                <div className="flex flex-wrap gap-2">
                  {VENDEDORES.map(v => (
                    <button
                      key={v}
                      onClick={() => handleAssign(selectedLead.leadId, selectedLead.assignedTo === v ? '' : v, { stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent)}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                        selectedLead.assignedTo === v
                          ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                          : 'bg-slate-800/50 border-forest text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      👤 {v} {selectedLead.assignedTo === v && '✓'}
                    </button>
                  ))}
                  <button
                    onClick={(e) => handlePause(selectedLead.leadId, selectedLead.bot_status !== 'paused', e)}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition flex items-center gap-1.5 ${
                      selectedLead.bot_status === 'paused'
                        ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800/50 border-forest text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {selectedLead.bot_status === 'paused' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {selectedLead.bot_status === 'paused' ? 'Reanudar bot' : 'Pausar bot'}
                  </button>
                </div>
              </div>

              {/* ── WhatsApp reply ── */}
              {selectedLead.platform === 'whatsapp' && selectedLead.senderId && (
                <div className="px-5 py-4">
                  <a
                    href={getWhatsAppUrl(selectedLead.senderId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest/20 text-sage hover:bg-forest/35 transition text-sm mb-3 border border-forest/30 w-fit"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Abrir en WhatsApp
                  </a>
                  <p className="text-xs font-semibold text-slate-400 mb-2">Responder desde CRM</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 rounded-xl border border-forest bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sage/50"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="px-4 py-2 rounded-xl bg-sage text-slate-900 font-medium hover:bg-sage/90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 text-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel footer — delete */}
            <div className="px-5 py-3 border-t border-forest/30 flex items-center justify-between">
              <span className="text-[10px] text-slate-600">
                {selectedLead.assignedTo ? `⏸ ${selectedLead.assignedTo}` : `🤖 Bot activo · ${currentUser} viendo`}
              </span>
              <button
                onClick={(e) => { handleDeleteLead(selectedLead.leadId, e); }}
                disabled={deletingLeadId === selectedLead.leadId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar y reiniciar chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel modal ────────────────────────────────── */}
      {cancelModal && (
        <CancelModal
          onConfirm={(reason) => {
            handleStatusChange(cancelModal.leadId, 'cancelados', reason);
            setCancelModal(null);
          }}
          onClose={() => setCancelModal(null)}
        />
      )}
    </main>
  );
}
