'use client';

import type { ClientPanelBrand } from '@/lib/client-panel-config';
import type { CatalogProduct } from '@/lib/biovela-catalog';
import { catalogImageUrl, formatProductMessage } from '@/lib/biovela-catalog';
import { relativeTime } from '@/lib/client-panel-hooks';
import { Send, Hand, ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type ChatMessage = {
  id: string;
  role: 'user' | 'bot' | 'advisor';
  content: string;
  createdAt: string;
  productCard?: { image?: string; name: string; price: string };
};

type Props = {
  brand: ClientPanelBrand;
  contactName: string;
  humanMode: boolean;
  messages: ChatMessage[];
  catalog: CatalogProduct[];
  onBack?: () => void;
  onTakeover: () => void;
  onRelease: () => void;
  onSend: (text: string) => Promise<void>;
};

export function ChatColumn({
  brand,
  contactName,
  humanMode,
  messages,
  catalog,
  onBack,
  onTakeover,
  onRelease,
  onSend,
}: Props) {
  const [tab, setTab] = useState<'chat' | 'catalog'>('chat');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [catQuery, setCatQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredCatalog = catalog.filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().includes(catQuery.toLowerCase())
  );

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex flex-col flex-1 min-w-0 h-full" style={{ background: '#FAF9F7' }}>
      <header
        className="flex flex-wrap items-center gap-3 p-4 border-b bg-white"
        style={{ borderColor: brand.border }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-lg p-2 md:hidden"
            style={{ color: brand.text }}
            aria-label="Volver a conversaciones"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{contactName || 'Selecciona una conversación'}</h2>
          <p className="text-[14px] opacity-70">
            {humanMode ? 'Asesor en control — bot pausado' : 'Bot respondiendo automáticamente'}
          </p>
        </div>
        {!humanMode ? (
          <button
            type="button"
            onClick={onTakeover}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-white text-[15px]"
            style={{ background: brand.primary, borderRadius: brand.radius }}
          >
            <Hand size={22} />
            Tomar control
          </button>
        ) : (
          <button
            type="button"
            onClick={onRelease}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-[15px]"
            style={{
              border: `1px solid ${brand.border}`,
              borderRadius: brand.radius,
              background: '#fff',
            }}
          >
            Reactivar bot
          </button>
        )}
      </header>

      {humanMode && (
        <div
          className="px-4 py-2 text-[15px] font-medium"
          style={{ background: '#FFF8EC', color: brand.primary, borderBottom: `1px solid ${brand.primary}30` }}
        >
          Estás en control — el bot está pausado
        </div>
      )}

      <div className="flex gap-2 px-4 pt-3">
        {(['chat', 'catalog'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-3 py-1.5 text-[15px] font-medium"
            style={{
              borderRadius: '8px',
              background: tab === t ? `${brand.primary}18` : '#fff',
              border: `1px solid ${tab === t ? brand.primary : brand.border}`,
              color: tab === t ? brand.primary : brand.text,
            }}
          >
            {t === 'chat' ? 'Mensajes' : 'Catálogo'}
          </button>
        ))}
      </div>

      {tab === 'catalog' ? (
        <div className="flex-1 overflow-y-auto p-4">
          <input
            className="w-full mb-3 px-3 py-2 text-[15px]"
            style={{ border: `1px solid ${brand.border}`, borderRadius: brand.radius }}
            placeholder="Buscar producto..."
            value={catQuery}
            onChange={(e) => setCatQuery(e.target.value)}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCatalog.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDraft(formatProductMessage(p));
                  setTab('chat');
                }}
                className="text-left p-3 bg-white"
                style={{
                  border: `1px solid ${brand.border}`,
                  borderRadius: brand.radius,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <img src={catalogImageUrl(p)} alt="" className="w-full h-24 object-contain mb-2" />
                <div className="font-semibold text-[15px]">{p.name}</div>
                <div style={{ color: brand.primary }}>${p.price} MXN</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isBot = m.role === 'bot';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3 py-2 text-[15px] whitespace-pre-wrap"
                  style={{
                    borderRadius: brand.radius,
                    background: isUser ? '#E8E8E8' : isBot ? '#FFF8EC' : '#fff',
                    border: isBot
                      ? `1px solid ${brand.primary}30`
                      : isUser
                        ? 'none'
                        : `1px solid ${brand.border}`,
                    borderLeft: !isUser && !isBot ? `3px solid ${brand.primary}` : undefined,
                  }}
                >
                  {m.productCard && (
                    <div
                      className="mb-2 p-2 flex gap-2"
                      style={{ border: `1px solid ${brand.border}`, borderRadius: '8px' }}
                    >
                      {m.productCard.image && (
                        <img src={m.productCard.image} alt="" className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <div className="font-semibold">{m.productCard.name}</div>
                        <div style={{ color: brand.primary }}>{m.productCard.price}</div>
                      </div>
                    </div>
                  )}
                  {m.content}
                  <div className="text-[12px] opacity-50 mt-1 text-right">
                    {relativeTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {humanMode && tab === 'chat' && (
        <div
          className="p-4 border-t bg-white flex gap-2"
          style={{ borderColor: brand.border }}
        >
          <input
            className="flex-1 px-3 py-2 text-[15px]"
            style={{ border: `1px solid ${brand.border}`, borderRadius: brand.radius }}
            placeholder="Escribe tu mensaje..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <button
            type="button"
            disabled={sending || !draft.trim()}
            onClick={handleSend}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-white disabled:opacity-50"
            style={{ background: brand.primary, borderRadius: brand.radius }}
          >
            <Send size={22} />
            Enviar
          </button>
        </div>
      )}
    </section>
  );
}
