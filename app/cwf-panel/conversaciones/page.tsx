'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, Pause, Play, RefreshCw, User } from 'lucide-react';
import { CwfPanelNav } from '@/components/cwf/CwfPanelNav';
import { PanelMessageBubble } from '@/components/panel/PanelMessageBubble';
import { PanelReplyComposer } from '@/components/panel/PanelReplyComposer';

type ConversationSummary = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  platform: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  botPaused: boolean;
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

const BRAND = {
  bg: '#1a1208',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(180, 120, 60, 0.25)',
  accent: '#c8863a',
} as const;

function fmtWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
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

export default function CwfConversacionesPage() {
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
  const chatOpen = Boolean(selectedId);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const res = await fetch('/api/cwf-panel/conversations', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo cargar la lista');
        return;
      }
      const items = (data.conversations ?? []) as ConversationSummary[];
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
      const res = await fetch(`/api/cwf-panel/conversations/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo cargar la conversación');
        setDetail(null);
        return;
      }
      setDetail(data.conversation as ConversationDetail);
    } catch {
      setError('Error al cargar historial');
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

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

  const closeChat = () => {
    setSelectedId(null);
    setDetail(null);
    setReplyText('');
  };

  const takeControl = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/cwf-panel/conversations/${encodeURIComponent(selectedId)}/take-control`,
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
        `/api/cwf-panel/conversations/${encodeURIComponent(selectedId)}/reactivate`,
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
        `/api/cwf-panel/conversations/${encodeURIComponent(selectedId)}/reply`,
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
        `/api/cwf-panel/conversations/${encodeURIComponent(selectedId)}/reply`,
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

  return (
    <main
      className="min-h-[100dvh] text-stone-100 flex flex-col"
      style={{ background: `linear-gradient(160deg, ${BRAND.bg} 0%, #2a1a0c 50%, #1a1208 100%)` }}
    >
      <header
        className={`border-b px-4 py-4 space-y-3 ${chatOpen ? 'hidden lg:block' : ''}`}
        style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-500/80 font-semibold">CWF México</p>
            <h1 className="text-xl font-bold text-amber-50 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              Conversaciones WhatsApp
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadList();
              if (selectedId) void loadDetail(selectedId);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-amber-100/90 hover:bg-white/5 transition"
            style={{ borderColor: BRAND.border }}
          >
            <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        <CwfPanelNav />
      </header>

      {error && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row lg:h-[calc(100dvh-160px)]">
        {/* Lista */}
        <aside
          className={`${
            chatOpen ? 'hidden lg:flex' : 'flex'
          } flex-col w-full lg:w-96 border-b lg:border-b-0 lg:border-r overflow-y-auto shrink-0 min-h-0 flex-1 lg:flex-none`}
          style={{ borderColor: BRAND.border, background: BRAND.card }}
        >
          <div
            className="p-3 text-xs text-stone-500 uppercase tracking-wide sticky top-0 z-10 backdrop-blur-sm"
            style={{ background: BRAND.card }}
          >
            Activas · {list.length}
          </div>
          {loadingList && list.length === 0 ? (
            <p className="p-4 text-sm text-stone-500">Cargando...</p>
          ) : list.length === 0 ? (
            <p className="p-4 text-sm text-stone-500">Sin conversaciones aún.</p>
          ) : (
            <ul>
              {list.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left px-4 py-3.5 border-b transition ${
                        active ? 'bg-amber-900/25' : 'hover:bg-white/5 active:bg-white/10'
                      }`}
                      style={{ borderColor: BRAND.border }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-amber-50 truncate text-[15px]">{c.senderName}</p>
                          <p className="text-xs text-stone-500 truncate">{c.senderId}</p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${
                            c.botPaused
                              ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                              : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                          }`}
                        >
                          {c.botPaused ? 'MANUAL' : 'BOT'}
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

        {/* Detalle */}
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
                  className="lg:hidden shrink-0 rounded-lg p-2 -ml-1 hover:bg-white/10 text-amber-100"
                  aria-label="Volver a conversaciones"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-full bg-amber-900/40 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-amber-50 truncate text-[15px]">
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
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs sm:text-sm font-medium disabled:opacity-50"
                    >
                      <Pause className="h-4 w-4" />
                      <span className="hidden sm:inline">Tomar control</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void reactivateBot()}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-xs sm:text-sm font-medium disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      <span className="hidden sm:inline">Reactivar bot</span>
                    </button>
                  )}
                </div>
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
                      agentBubbleClass="rounded-tr-sm bg-amber-800/50 text-amber-50 border border-amber-600/30"
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
                  <p className="text-xs text-amber-400/80 mb-2">
                    Usa &quot;Tomar control&quot; para pausar el bot y responder manualmente.
                  </p>
                )}
                <PanelReplyComposer
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  onSendText={sendReply}
                  onSendFile={sendAttachment}
                  disabled={!botPaused}
                  sending={sending}
                  placeholder={
                    botPaused
                      ? 'Escribe tu respuesta por WhatsApp...'
                      : 'Toma control primero para responder...'
                  }
                  accentSendClass="bg-amber-700 hover:bg-amber-600"
                  textareaClass="flex-1 resize-none rounded-xl px-4 py-3 bg-stone-900/80 border border-amber-900/40 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:opacity-50 text-sm min-h-[44px]"
                />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
