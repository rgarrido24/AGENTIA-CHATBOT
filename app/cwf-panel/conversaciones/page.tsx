'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Pause, Play, RefreshCw, Send, User } from 'lucide-react';

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
      if (!selectedId && items[0]) {
        setSelectedId(items[0].id);
      }
    } catch {
      setError('Error de conexión al cargar conversaciones');
    } finally {
      setLoadingList(false);
    }
  }, [selectedId]);

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
  }, [selectedId, loadDetail]);

  const selectedSummary = useMemo(
    () => list.find((c) => c.id === selectedId) ?? null,
    [list, selectedId]
  );

  const botPaused = detail?.botPaused ?? selectedSummary?.botPaused ?? false;

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
      if (data.conversation?.messages) {
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                messages: data.conversation.messages,
                lastMessageAt: data.conversation.lastMessageAt,
                botPaused: true,
              }
            : prev
        );
      } else {
        await loadDetail(selectedId);
      }
      await loadList();
    } finally {
      setSending(false);
    }
  };

  return (
    <main
      className="min-h-screen text-stone-100"
      style={{ background: `linear-gradient(160deg, ${BRAND.bg} 0%, #2a1a0c 50%, #1a1208 100%)` }}
    >
      <header
        className="border-b px-4 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.25)' }}
      >
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
      </header>

      {error && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* Lista */}
        <aside
          className="lg:w-96 border-b lg:border-b-0 lg:border-r overflow-y-auto shrink-0"
          style={{ borderColor: BRAND.border, background: BRAND.card }}
        >
          <div className="p-3 text-xs text-stone-500 uppercase tracking-wide">
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
                      className={`w-full text-left px-4 py-3 border-b transition ${
                        active ? 'bg-amber-900/25' : 'hover:bg-white/5'
                      }`}
                      style={{ borderColor: BRAND.border }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-amber-50 truncate">{c.senderName}</p>
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
        <section className="flex-1 flex flex-col min-h-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-stone-500 text-sm">
              Selecciona una conversación
            </div>
          ) : (
            <>
              <div
                className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3"
                style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-amber-900/40 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-50 truncate">
                      {detail?.senderName ?? selectedSummary?.senderName}
                    </p>
                    <p className="text-xs text-stone-500">{detail?.senderId ?? selectedSummary?.senderId}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!botPaused ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void takeControl()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      <Pause className="h-4 w-4" />
                      Tomar control
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void reactivateBot()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-sm font-medium disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      Reactivar bot
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingDetail && !detail ? (
                  <p className="text-sm text-stone-500">Cargando historial...</p>
                ) : !detail?.messages?.length ? (
                  <p className="text-sm text-stone-500">Sin mensajes en esta conversación.</p>
                ) : (
                  detail.messages.map((m, i) => {
                    const isUser = m.role === 'user';
                    const isAgent = m.role === 'agent';
                    return (
                      <div
                        key={`${m.at}-${i}`}
                        className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            isUser
                              ? 'rounded-tl-sm bg-stone-800/80 text-stone-100'
                              : isAgent
                                ? 'rounded-tr-sm bg-amber-800/50 text-amber-50 border border-amber-600/30'
                                : 'rounded-tr-sm bg-stone-700/60 text-stone-200 border border-stone-600/30'
                          }`}
                        >
                          <p className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
                            {roleLabel(m.role)} · {fmtWhen(m.at)}
                          </p>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div
                className="p-4 border-t"
                style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.25)' }}
              >
                {!botPaused && (
                  <p className="text-xs text-amber-400/80 mb-2">
                    Usa &quot;Tomar control&quot; para pausar el bot y responder manualmente.
                  </p>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      botPaused
                        ? 'Escribe tu respuesta por WhatsApp...'
                        : 'Toma control primero para responder...'
                    }
                    disabled={!botPaused || sending}
                    rows={2}
                    className="flex-1 resize-none rounded-xl px-4 py-3 bg-stone-900/80 border border-amber-900/40 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:opacity-50 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && botPaused && replyText.trim()) {
                        e.preventDefault();
                        void sendReply();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!botPaused || sending || !replyText.trim()}
                    onClick={() => void sendReply()}
                    className="self-end px-4 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white disabled:opacity-40 transition"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
