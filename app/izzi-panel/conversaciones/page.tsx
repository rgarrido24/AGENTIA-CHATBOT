'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, MessageSquare, Pause, Play, RefreshCw, Smartphone, User, Wifi, WifiOff, X } from 'lucide-react';
import { PanelMessageBubble } from '@/components/panel/PanelMessageBubble';
import { PanelReplyComposer } from '@/components/panel/PanelReplyComposer';
import {
  loadIzziConversacionesSession,
  saveIzziConversacionesSession,
} from '@/lib/izzi-panel-session';
import {
  etapasForTipo,
  IZZI_TIPOS,
  tipoLabel,
  type IzziConversationTipo,
} from '@/lib/izzi-panel';

type ConversationSummary = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  platform: string;
  lastMessage: string;
  lastMessageAt: string;
  createdAt?: string;
  messageCount: number;
  botPaused: boolean;
  tipo: IzziConversationTipo;
  etapa: string;
  notas: string;
};

type ConversationMessage = {
  role: 'user' | 'assistant' | 'agent';
  content: string;
  at: string;
  mediaType?: 'image' | 'document';
  mediaUrl?: string;
  fileName?: string;
  waMessageId?: string;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
};

type ConversationDetail = ConversationSummary & {
  pageId: string;
  messages: ConversationMessage[];
};

type WhatsAppStatus = {
  connected: boolean;
  phone: string | null;
  hasQr: boolean;
  qrDataUrl: string | null;
  source: 'bridge' | 'mongo' | 'activity' | 'none';
  lastMessageAt: string | null;
};

const BRAND = {
  bg: '#140810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(236, 0, 140, 0.22)',
  accent: '#EC008C',
} as const;

function fmtWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return '—';
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function roleLabel(role: ConversationMessage['role']) {
  if (role === 'user') return 'Cliente';
  if (role === 'agent') return 'Agente';
  return 'Bot';
}

function isDesktopViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 1024px)').matches;
}

function etapaText(tipo: IzziConversationTipo, etapa: string) {
  return etapasForTipo(tipo).find((e) => e.id === etapa)?.label ?? etapa;
}

export default function IzziConversacionesPage() {
  const [list, setList] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const chatOpen = Boolean(selectedId);

  const [filterTipo, setFilterTipo] = useState<'all' | IzziConversationTipo>('all');
  const [filterEtapa, setFilterEtapa] = useState('all');
  const [search, setSearch] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportTipo, setExportTipo] = useState<'all' | IzziConversationTipo>('all');
  const [exportEtapa, setExportEtapa] = useState('all');
  const [tenantId, setTenantId] = useState('');
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);

  useEffect(() => {
    const saved = loadIzziConversacionesSession();
    if (saved.selectedId) setSelectedId(saved.selectedId);
    if (saved.replyText) setReplyText(saved.replyText);
    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    saveIzziConversacionesSession({ selectedId, replyText });
  }, [selectedId, replyText, sessionReady]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const res = await fetch('/api/izzi-panel/conversations', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo cargar la lista');
        return;
      }
      const items = (data.conversations ?? []) as ConversationSummary[];
      if (typeof data.clientId === 'string' && data.clientId.trim()) {
        setTenantId(data.clientId.trim());
      }
      setList(items);
      setSelectedId((prev) => {
        if (prev && !items.some((c) => c.id === prev)) {
          return isDesktopViewport() ? items[0]?.id ?? null : null;
        }
        if (!prev && items[0] && isDesktopViewport()) return items[0].id;
        return prev;
      });
    } catch {
      setError('Error de conexión al cargar conversaciones');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    setError('');
    try {
      const res = await fetch(`/api/izzi-panel/conversations/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo cargar la conversación');
        setDetail(null);
        return;
      }
      const conv = data.conversation as ConversationDetail;
      setDetail(conv);
      setNotesDraft(conv.notas || '');
    } catch {
      setError('Error al cargar historial');
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const loadWaStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/izzi-panel/whatsapp', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setWaStatus({
        connected: !!data.connected,
        phone: typeof data.phone === 'string' ? data.phone : null,
        hasQr: !!data.hasQr,
        qrDataUrl: typeof data.qrDataUrl === 'string' ? data.qrDataUrl : null,
        source: data.source === 'activity' || data.source === 'mongo' || data.source === 'bridge' ? data.source : 'none',
        lastMessageAt: typeof data.lastMessageAt === 'string' ? data.lastMessageAt : null,
      });
    } catch {
      /* el listado de chats sigue siendo usable */
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadWaStatus();
    const t = window.setInterval(() => {
      void loadWaStatus();
    }, 15000);
    return () => window.clearInterval(t);
  }, [loadWaStatus]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages?.length, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const t = window.setInterval(() => {
      void loadDetail(selectedId);
    }, 8000);
    return () => window.clearInterval(t);
  }, [selectedId, loadDetail]);

  const selectedSummary = useMemo(
    () => list.find((c) => c.id === selectedId) ?? null,
    [list, selectedId]
  );

  const botPaused = detail?.botPaused ?? selectedSummary?.botPaused ?? false;
  const currentTipo = detail?.tipo ?? selectedSummary?.tipo ?? 'venta';
  const currentEtapa = detail?.etapa ?? selectedSummary?.etapa ?? 'nuevo_contacto';

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (filterTipo !== 'all' && c.tipo !== filterTipo) return false;
      if (filterEtapa !== 'all' && c.etapa !== filterEtapa) return false;
      if (!q) return true;
      return (
        c.senderName.toLowerCase().includes(q) ||
        c.senderId.toLowerCase().includes(q) ||
        (c.notas || '').toLowerCase().includes(q)
      );
    });
  }, [list, filterTipo, filterEtapa, search]);

  const etapaOptions = etapasForTipo(filterTipo === 'all' ? 'venta' : filterTipo);

  const closeChat = () => {
    setSelectedId(null);
    setDetail(null);
    setReplyText('');
    saveIzziConversacionesSession({ selectedId: null, replyText: '' });
  };

  const patchMeta = async (patch: { tipo?: IzziConversationTipo; etapa?: string; notas?: string }) => {
    if (!selectedId) return;
    setError('');
    const res = await fetch(`/api/izzi-panel/conversations/${encodeURIComponent(selectedId)}/meta`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || 'No se pudo guardar');
      return;
    }
    const nextTipo = (data.conversation?.tipo as IzziConversationTipo) ?? currentTipo;
    const nextEtapa = (data.conversation?.etapa as string) ?? currentEtapa;
    const nextNotas = (data.conversation?.notas as string) ?? notesDraft;
    setList((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, tipo: nextTipo, etapa: nextEtapa, notas: nextNotas } : c
      )
    );
    setDetail((prev) =>
      prev ? { ...prev, tipo: nextTipo, etapa: nextEtapa, notas: nextNotas } : prev
    );
  };

  const takeControl = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/izzi-panel/conversations/${encodeURIComponent(selectedId)}/take-control`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo tomar control');
        return;
      }
      setList((prev) => prev.map((c) => (c.id === selectedId ? { ...c, botPaused: true } : c)));
      if (detail) setDetail({ ...detail, botPaused: true });
    } finally {
      setActionLoading(false);
    }
  };

  const reactivateBot = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/izzi-panel/conversations/${encodeURIComponent(selectedId)}/reactivate`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo reactivar el bot');
        return;
      }
      setList((prev) => prev.map((c) => (c.id === selectedId ? { ...c, botPaused: false } : c)));
      if (detail) setDetail({ ...detail, botPaused: false });
    } finally {
      setActionLoading(false);
    }
  };

  const applyReplyResponse = (data: {
    conversation?: { messages?: ConversationMessage[]; lastMessageAt?: string };
  }) => {
    if (data.conversation?.messages) {
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              messages: data.conversation!.messages!,
              lastMessageAt: data.conversation!.lastMessageAt ?? prev.lastMessageAt,
              botPaused: true,
            }
          : prev
      );
    } else if (selectedId) {
      void loadDetail(selectedId);
    }
  };

  const sendReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(
        `/api/izzi-panel/conversations/${encodeURIComponent(selectedId)}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: replyText.trim() }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo enviar el mensaje');
        return;
      }
      setReplyText('');
      applyReplyResponse(data);
      await loadList();
    } finally {
      setSending(false);
    }
  };

  const sendAttachment = async (file: File) => {
    if (!selectedId) return;
    setSending(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (replyText.trim()) form.append('message', replyText.trim());
      const res = await fetch(
        `/api/izzi-panel/conversations/${encodeURIComponent(selectedId)}/reply`,
        { method: 'POST', body: form }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo enviar el adjunto');
        return;
      }
      setReplyText('');
      applyReplyResponse(data);
      await loadList();
    } finally {
      setSending(false);
    }
  };

  const downloadExport = async () => {
    setExporting(true);
    setError('');
    try {
      const res = await fetch('/api/izzi-panel/conversations/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: exportFrom || undefined,
          to: exportTo || undefined,
          tipo: exportTipo,
          etapa: exportEtapa,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'No se pudo exportar');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `izzi-conversaciones-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch {
      setError('Error al descargar Excel');
    } finally {
      setExporting(false);
    }
  };

  const selectClass =
    'rounded-lg border bg-stone-950/70 px-2.5 py-2 text-xs text-pink-50 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-pink-600';

  return (
    <main
      className="min-h-[100dvh] text-stone-100 flex flex-col"
      style={{ background: `linear-gradient(160deg, ${BRAND.bg} 0%, #2a0a1c 50%, #140810 100%)` }}
    >
      <header
        className={`border-b px-4 py-4 space-y-3 ${chatOpen ? 'hidden lg:block' : ''}`}
        style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-pink-400/80 font-semibold">izzi</p>
            <h1 className="text-xl font-bold text-pink-50 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-pink-400" />
              Conversaciones WhatsApp
            </h1>
            {tenantId ? (
              <p className="text-xs text-pink-200/50 mt-1">
                Cuenta <span className="text-pink-200/80 font-medium">{tenantId}</span>
                {tenantId === 'izzi' ? ' · número original' : ''}
              </p>
            ) : null}
            {waStatus ? (
              <p
                className={`mt-1.5 inline-flex items-center gap-1.5 text-xs ${
                  waStatus.connected ? 'text-emerald-300' : 'text-amber-200'
                }`}
              >
                {waStatus.connected ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {waStatus.connected
                  ? waStatus.source === 'activity'
                    ? 'WhatsApp activo (el bot está contestando)'
                    : waStatus.phone
                      ? `WhatsApp conectado · ${waStatus.phone}`
                      : 'WhatsApp conectado'
                  : waStatus.hasQr
                    ? 'Esperando que escanees el QR'
                    : 'WhatsApp sin señal en el panel — si el bot ya responde, igual puedes pausar chats'}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/izzi-panel/whatsapp"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-pink-100/90 hover:bg-white/5 transition min-h-[40px]"
              style={{ borderColor: BRAND.border }}
            >
              <Smartphone className="h-4 w-4" />
              WhatsApp
            </Link>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-pink-100/90 hover:bg-white/5 transition min-h-[40px]"
              style={{ borderColor: BRAND.border }}
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              type="button"
              onClick={() => {
                void loadList();
                void loadWaStatus();
                if (selectedId) void loadDetail(selectedId);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-pink-100/90 hover:bg-white/5 transition min-h-[40px]"
              style={{ borderColor: BRAND.border }}
            >
              <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row lg:h-[calc(100dvh-132px)]">
        <aside
          className={`${
            chatOpen ? 'hidden lg:flex' : 'flex'
          } flex-col w-full lg:w-[26rem] border-b lg:border-b-0 lg:border-r overflow-y-auto shrink-0 min-h-0 flex-1 lg:flex-none`}
          style={{ borderColor: BRAND.border, background: BRAND.card }}
        >
          <div
            className="p-3 space-y-2 sticky top-0 z-10 backdrop-blur-sm"
            style={{ background: BRAND.card }}
          >
            <div className="text-xs text-stone-500 uppercase tracking-wide">
              Activas · {filteredList.length}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre, teléfono o notas"
              className="w-full rounded-lg border bg-stone-950/70 px-3 py-2 text-sm text-pink-50 placeholder-stone-600 min-h-[40px]"
              style={{ borderColor: BRAND.border }}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterTipo}
                onChange={(e) => {
                  setFilterTipo(e.target.value as 'all' | IzziConversationTipo);
                  setFilterEtapa('all');
                }}
                className={selectClass}
                style={{ borderColor: BRAND.border }}
                aria-label="Filtrar por tipo"
              >
                <option value="all">Todos los tipos</option>
                {IZZI_TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
              <select
                value={filterEtapa}
                onChange={(e) => setFilterEtapa(e.target.value)}
                className={selectClass}
                style={{ borderColor: BRAND.border }}
                aria-label="Filtrar por estado"
              >
                <option value="all">Todos los estados</option>
                {(filterTipo === 'all'
                  ? [...etapasForTipo('venta'), ...etapasForTipo('reclutamiento').filter((e) => e.id !== 'nuevo_contacto')]
                  : etapaOptions
                ).map((e) => (
                  <option key={`${e.id}-${e.label}`} value={e.id}>
                    {e.emoji ? `${e.emoji} ${e.label}` : e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loadingList && list.length === 0 ? (
            <p className="p-4 text-sm text-stone-500">Cargando...</p>
          ) : filteredList.length === 0 ? (
            <p className="p-4 text-sm text-stone-500">Sin conversaciones aún.</p>
          ) : (
            <ul>
              {filteredList.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left px-4 py-3.5 border-b transition ${
                        active ? 'bg-pink-900/25' : 'hover:bg-white/5 active:bg-white/10'
                      }`}
                      style={{ borderColor: BRAND.border }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-pink-50 truncate text-[15px]">{c.senderName}</p>
                          <p className="text-xs text-stone-500 truncate">{c.senderId}</p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${
                            c.botPaused
                              ? 'border-pink-500/40 text-pink-300 bg-pink-500/10'
                              : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                          }`}
                        >
                          {c.botPaused ? 'MANUAL' : 'BOT'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-pink-500/25 text-pink-200/90">
                          {tipoLabel(c.tipo)}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-stone-300">
                          {etapaText(c.tipo, c.etapa)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-400 mt-1 line-clamp-2">{c.lastMessage || '—'}</p>
                      <p className="text-[11px] text-stone-600 mt-1">{fmtWhen(c.lastMessageAt)}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section
          className={`${
            chatOpen ? 'flex' : 'hidden lg:flex'
          } flex-1 flex-col min-h-0 min-w-0 ${chatOpen ? 'fixed inset-0 z-40 lg:static lg:z-auto' : ''}`}
          style={chatOpen ? { background: BRAND.bg } : undefined}
        >
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-stone-500 text-sm px-6 text-center">
              Selecciona una conversación
            </div>
          ) : (
            <>
              <div
                className="px-3 sm:px-4 py-3 border-b flex items-center gap-2 sm:gap-3 shrink-0"
                style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.35)' }}
              >
                <button
                  type="button"
                  onClick={closeChat}
                  className="lg:hidden shrink-0 rounded-lg p-2 -ml-1 hover:bg-white/10 text-pink-100 min-h-[44px] min-w-[44px]"
                  aria-label="Volver a conversaciones"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-full bg-pink-900/40 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-pink-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-pink-50 truncate text-[15px]">
                    {detail?.senderName ?? selectedSummary?.senderName}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {detail?.senderId ?? selectedSummary?.senderId}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!botPaused ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void takeControl()}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-[#EC008C] hover:bg-pink-500 text-white text-xs sm:text-sm font-medium disabled:opacity-50 min-h-[40px]"
                    >
                      <Pause className="h-4 w-4" />
                      <span className="hidden sm:inline">Tomar control</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void reactivateBot()}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-xs sm:text-sm font-medium disabled:opacity-50 min-h-[40px]"
                    >
                      <Play className="h-4 w-4" />
                      <span className="hidden sm:inline">Reactivar bot</span>
                    </button>
                  )}
                </div>
              </div>

              <div
                className="px-3 sm:px-4 py-3 border-b shrink-0 space-y-2"
                style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.22)' }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-stone-400">Tipo</span>
                    <select
                      value={currentTipo}
                      onChange={(e) => void patchMeta({ tipo: e.target.value as IzziConversationTipo })}
                      className={`${selectClass} w-full`}
                      style={{ borderColor: BRAND.border }}
                    >
                      {IZZI_TIPOS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.emoji} {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-stone-400">Estado del embudo</span>
                    <select
                      value={currentEtapa}
                      onChange={(e) => void patchMeta({ etapa: e.target.value })}
                      className={`${selectClass} w-full`}
                      style={{ borderColor: BRAND.border }}
                    >
                      {etapasForTipo(currentTipo).map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.emoji ? `${e.emoji} ${e.label}` : e.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-[11px] text-stone-400">Notas</span>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    onBlur={() => {
                      if (notesDraft !== (detail?.notas ?? '')) void patchMeta({ notas: notesDraft });
                    }}
                    rows={2}
                    placeholder="Notas libres de esta conversación"
                    className="w-full resize-none rounded-lg border bg-stone-950/70 px-3 py-2 text-sm text-pink-50 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-pink-600"
                    style={{ borderColor: BRAND.border }}
                  />
                </label>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3 min-h-0">
                {loadingDetail && !detail ? (
                  <p className="text-sm text-stone-500">Cargando historial...</p>
                ) : !detail?.messages?.length ? (
                  <p className="text-sm text-stone-500">Sin mensajes en esta conversación.</p>
                ) : (
                  detail.messages.map((m, i) => (
                    <PanelMessageBubble
                      key={`${m.at}-${i}-${m.waMessageId || ''}`}
                      message={m}
                      isUser={m.role === 'user'}
                      isAgent={m.role === 'agent'}
                      roleLabel={roleLabel(m.role)}
                      fmtWhen={fmtWhen}
                      userBubbleClass="rounded-tl-sm bg-stone-800/80 text-stone-100"
                      agentBubbleClass="rounded-tr-sm bg-pink-800/50 text-pink-50 border border-pink-600/30"
                      botBubbleClass="rounded-tr-sm bg-stone-700/60 text-stone-200 border border-stone-600/30"
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div
                className="p-3 sm:p-4 border-t shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.35)' }}
              >
                {!botPaused && (
                  <p className="text-xs text-pink-400/80 mb-2">
                    Usa &quot;Tomar control&quot; para pausar el bot y responder o adjuntar archivos.
                  </p>
                )}
                {botPaused && (
                  <p className="text-xs text-pink-200/70 mb-2">
                    Puedes adjuntar imágenes, PDF o documentos (máx. 16 MB).
                  </p>
                )}
                <PanelReplyComposer
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  onSendText={sendReply}
                  onSendFile={sendAttachment}
                  disabled={!botPaused}
                  attachEnabled={botPaused}
                  sending={sending}
                  placeholder={
                    botPaused
                      ? 'Escribe tu respuesta por WhatsApp...'
                      : 'Toma control primero para responder...'
                  }
                  accentSendClass="bg-[#EC008C] hover:bg-pink-500"
                  attachButtonClass="border-pink-500/50 bg-pink-600/25 text-pink-100 hover:bg-pink-600/40"
                  textareaClass="flex-1 min-w-0 resize-none rounded-xl px-4 py-3 bg-stone-900/80 border border-pink-900/40 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-pink-600 disabled:opacity-50 text-sm min-h-[44px]"
                />
              </div>
            </>
          )}
        </section>
      </div>

      {exportOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border p-5 shadow-2xl"
            style={{ background: '#1a0a14', borderColor: BRAND.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-pink-50">Exportar a Excel</h2>
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 min-h-[40px] min-w-[40px]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] text-stone-400">Desde</span>
                  <input
                    type="date"
                    value={exportFrom}
                    onChange={(e) => setExportFrom(e.target.value)}
                    className={`${selectClass} w-full`}
                    style={{ borderColor: BRAND.border }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] text-stone-400">Hasta</span>
                  <input
                    type="date"
                    value={exportTo}
                    onChange={(e) => setExportTo(e.target.value)}
                    className={`${selectClass} w-full`}
                    style={{ borderColor: BRAND.border }}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] text-stone-400">Tipo</span>
                <select
                  value={exportTipo}
                  onChange={(e) => {
                    setExportTipo(e.target.value as 'all' | IzziConversationTipo);
                    setExportEtapa('all');
                  }}
                  className={`${selectClass} w-full`}
                  style={{ borderColor: BRAND.border }}
                >
                  <option value="all">Todos</option>
                  {IZZI_TIPOS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] text-stone-400">Estado del embudo</span>
                <select
                  value={exportEtapa}
                  onChange={(e) => setExportEtapa(e.target.value)}
                  className={`${selectClass} w-full`}
                  style={{ borderColor: BRAND.border }}
                >
                  <option value="all">Todos</option>
                  {(exportTipo === 'all'
                    ? [
                        ...etapasForTipo('venta'),
                        ...etapasForTipo('reclutamiento').filter((e) => e.id !== 'nuevo_contacto'),
                      ]
                    : etapasForTipo(exportTipo)
                  ).map((e) => (
                    <option key={`${exportTipo}-${e.id}-${e.label}`} value={e.id}>
                      {e.emoji ? `${e.emoji} ${e.label}` : e.label}
                    </option>
                  ))}
                </select>
                {exportTipo === 'all' ? (
                  <p className="mt-1 text-[10px] text-stone-500">
                    Elige un tipo para ver solo sus estados. Con &quot;Todos&quot; aparecen etapas de venta y de reclutamiento.
                  </p>
                ) : null}
              </label>
              <button
                type="button"
                disabled={exporting}
                onClick={() => void downloadExport()}
                className="w-full py-3 rounded-xl bg-[#EC008C] hover:bg-pink-500 text-white font-semibold disabled:opacity-50 min-h-[44px]"
              >
                {exporting ? 'Generando...' : 'Descargar .xlsx'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
