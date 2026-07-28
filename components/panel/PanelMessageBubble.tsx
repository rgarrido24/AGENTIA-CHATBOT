'use client';

import { Check, CheckCheck, FileText, Image as ImageIcon } from 'lucide-react';

export type PanelChatMessage = {
  role: 'user' | 'assistant' | 'agent';
  content: string;
  at: string;
  mediaType?: 'image' | 'document';
  mediaUrl?: string;
  fileName?: string;
  waMessageId?: string;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
};

type PanelMessageBubbleProps = {
  message: PanelChatMessage;
  isUser: boolean;
  isAgent: boolean;
  roleLabel: string;
  fmtWhen: (iso: string) => string;
  userBubbleClass: string;
  agentBubbleClass: string;
  botBubbleClass: string;
};

function DeliveryTicks({
  status,
}: {
  status: PanelChatMessage['deliveryStatus'];
}) {
  const s = status || 'sent';
  if (s === 'failed') {
    return <span className="text-[10px] text-red-400 ml-1">Error</span>;
  }
  if (s === 'pending') {
    return <Check className="inline h-3.5 w-3.5 ml-1 opacity-40" aria-label="Enviando" />;
  }
  if (s === 'read') {
    return <CheckCheck className="inline h-3.5 w-3.5 ml-1 text-sky-400" aria-label="Leído" />;
  }
  if (s === 'delivered') {
    return <CheckCheck className="inline h-3.5 w-3.5 ml-1 opacity-70" aria-label="Entregado" />;
  }
  // sent
  return <Check className="inline h-3.5 w-3.5 ml-1 opacity-60" aria-label="Enviado" />;
}

export function PanelMessageBubble({
  message: m,
  isUser,
  isAgent,
  roleLabel,
  fmtWhen,
  userBubbleClass,
  agentBubbleClass,
  botBubbleClass,
}: PanelMessageBubbleProps) {
  const bubbleClass = isUser ? userBubbleClass : isAgent ? agentBubbleClass : botBubbleClass;
  const showTicks = !isUser;

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${bubbleClass}`}>
        <p className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
          {roleLabel} · {fmtWhen(m.at)}
          {showTicks ? <DeliveryTicks status={m.deliveryStatus} /> : null}
        </p>
        {m.mediaType === 'image' && m.mediaUrl ? (
          <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.mediaUrl}
              alt={m.fileName || 'Imagen'}
              className="max-h-64 rounded-lg object-contain bg-black/20"
            />
          </a>
        ) : null}
        {m.mediaType === 'document' && m.mediaUrl ? (
          <a
            href={m.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 hover:bg-black/30 transition"
          >
            <FileText className="h-5 w-5 shrink-0 opacity-80" />
            <span className="truncate text-sm">{m.fileName || 'Documento'}</span>
          </a>
        ) : null}
        {!m.mediaType && m.mediaUrl ? (
          <a
            href={m.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm underline opacity-90"
          >
            <ImageIcon className="h-4 w-4" />
            {m.fileName || 'Ver archivo'}
          </a>
        ) : null}
        {m.content ? (
          <p className={`whitespace-pre-wrap break-words ${m.mediaUrl ? 'mt-2' : ''}`}>{m.content}</p>
        ) : null}
      </div>
    </div>
  );
}
