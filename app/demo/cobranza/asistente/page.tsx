'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, Send } from 'lucide-react';

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const MOCK_CHATS = [
  { id: '1', title: '¿Promociones del mes?' },
  { id: '2', title: 'Cliente Ciclo 4 sin respuesta' },
  { id: '3', title: 'Guión para llamada difícil' },
  { id: '4', title: 'Plan de pagos flexible' },
];

const SUGGESTIONS = [
  '¿Cómo hablar con un tutor que no contesta?',
  'El alumno lleva 3 meses sin pagar',
  '¿Qué opciones de pago puedo ofrecer?',
  'Dame un guión para Ciclo 4',
  '¿Cuál es el bono por alumno recuperado?',
];

function AsistenteContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const prefilledRef = useRef(false);

  const scrollBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  const sendMessage = useCallback(async (text: string, history: ChatMsg[]) => {
    if (!text.trim()) return;
    setLoading(true);
    setMessages((m) => [...m, { role: 'user', content: text.trim() }, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/demo/cobranza/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          messages: history.map((x) => ({ role: x.role, content: x.content })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const em = typeof err?.error === 'string' ? err.error : `Error ${res.status}`;
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') last.content = em;
          return copy;
        });
        return;
      }
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let acc = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === 'assistant') last.content = acc;
            return [...copy];
          });
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') last.content = 'No pudimos conectar con el asistente. Intenta de nuevo.';
        return copy;
      });
    } finally {
      setLoading(false);
      setTimeout(scrollBottom, 50);
    }
  }, []);

  useEffect(() => {
    if (prefilledRef.current) return;
    const alumno = searchParams.get('alumno');
    const score = searchParams.get('score');
    const ciclo = searchParams.get('ciclo');
    if (alumno && score && ciclo) {
      prefilledRef.current = true;
      const pre = `Necesito estrategia para ${decodeURIComponent(alumno)}, Score ${score}/100, en ${decodeURIComponent(ciclo)}`;
      void sendMessage(pre, []);
    }
  }, [searchParams, sendMessage]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const history = messages.filter(
      (m) => m.role === 'user' || (m.role === 'assistant' && m.content.trim())
    ) as ChatMsg[];
    await sendMessage(text, history);
  };

  useEffect(() => {
    scrollBottom();
  }, [messages]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] max-w-6xl mx-auto">
      <aside className="w-full lg:w-[260px] shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-3 overflow-y-auto">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Conversaciones (demo)</p>
        <ul className="space-y-1">
          {MOCK_CHATS.map((c) => (
            <li
              key={c.id}
              className="text-sm px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 cursor-default border border-transparent"
            >
              {c.title}
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-white/10 bg-[#0f172a]/80">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#1e40af]/50 text-blue-200 hover:bg-[#1e40af]/20 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#1e40af] text-white'
                    : 'bg-slate-800/90 text-slate-100 border border-white/10'
                }`}
              >
                {m.content ||
                  (loading && i === messages.length - 1 && m.role === 'assistant' && !m.content ? (
                    <span className="text-slate-400 italic animate-pulse">CobranzaAI está escribiendo...</span>
                  ) : null)}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
            placeholder="Escribe tu consulta..."
            className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSend()}
            className="px-4 rounded-xl bg-[#1e40af] hover:bg-blue-800 disabled:opacity-50 transition flex items-center gap-2"
            aria-label="Enviar"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AsistentePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-400 text-sm max-w-6xl mx-auto">
        <Bot className="w-5 h-5 text-blue-400" />
        <span>Asistente CobranzaAI — Instituto Meridian (demo)</span>
      </div>
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center text-slate-500">Cargando asistente…</div>
        }
      >
        <AsistenteContent />
      </Suspense>
    </div>
  );
}
