'use client';

import type { ClientPanelBrand } from '@/lib/client-panel-config';
import { StageBadge } from '@/components/client-panel/MetricsRow';
import { initials, relativeTime } from '@/lib/client-panel-hooks';
import { Search } from 'lucide-react';

export type ConversationItem = {
  id: string;
  phone: string;
  contactName: string;
  stage: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
  humanMode: boolean;
};

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'unread', label: 'Sin leer' },
  { id: 'bot_active', label: 'Bot activo' },
  { id: 'advisor_active', label: 'Asesor activo' },
  { id: 'closed', label: 'Cerradas' },
] as const;

type Props = {
  brand: ClientPanelBrand;
  items: ConversationItem[];
  selectedId: string | null;
  filter: string;
  query: string;
  onFilter: (f: string) => void;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
  waConnected: boolean;
  waPhone: string | null;
  onConnectClick: () => void;
};

export function ConversationList({
  brand,
  items,
  selectedId,
  filter,
  query,
  onFilter,
  onQuery,
  onSelect,
  waConnected,
  waPhone,
  onConnectClick,
}: Props) {
  return (
    <aside
      className="flex flex-col h-full border-r"
      style={{ width: '100%', maxWidth: 280, borderColor: brand.border, background: '#fff' }}
    >
      <div className="p-4 border-b" style={{ borderColor: brand.border }}>
        <img
          src={brand.logoUrl}
          alt={brand.name}
          className="h-12 w-auto object-contain mb-4"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {waConnected ? (
          <div
            className="flex items-center gap-2 p-3 text-[15px]"
            style={{
              background: `${brand.success}12`,
              border: `1px solid ${brand.success}40`,
              borderRadius: brand.radius,
            }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: brand.success }}
              aria-hidden
            />
            <div>
              <div className="font-semibold" style={{ color: brand.success }}>
                WhatsApp activo
              </div>
              {waPhone && <div className="text-sm opacity-80">{waPhone}</div>}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConnectClick}
            className="w-full py-3 px-4 font-semibold text-white text-[15px]"
            style={{ background: brand.primary, borderRadius: brand.radius }}
          >
            Conectar WhatsApp
          </button>
        )}
      </div>

      <div className="p-3 border-b" style={{ borderColor: brand.border }}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ border: `1px solid ${brand.border}`, borderRadius: brand.radius }}
        >
          <Search size={20} className="opacity-50" />
          <input
            className="flex-1 bg-transparent outline-none text-[15px]"
            placeholder="Buscar conversación..."
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilter(f.id)}
              className="px-2 py-1 text-[13px]"
              style={{
                borderRadius: '6px',
                background: filter === f.id ? `${brand.primary}20` : 'transparent',
                color: filter === f.id ? brand.primary : brand.text,
                border: `1px solid ${filter === f.id ? brand.primary : brand.border}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && (
          <p className="p-4 text-center opacity-60 text-[15px]">No hay conversaciones</p>
        )}
        {items.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className="w-full text-left p-3 flex gap-3 border-b hover:bg-[#FAF9F7]"
            style={{
              borderColor: brand.border,
              background: selectedId === c.id ? '#FFF8EC' : undefined,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0"
              style={{ background: `${brand.primary}25`, color: brand.primary }}
            >
              {initials(c.contactName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 items-start">
                <span className="font-semibold truncate">{c.contactName}</span>
                <span className="text-[13px] opacity-60 shrink-0">
                  {relativeTime(c.lastMessageAt)}
                </span>
              </div>
              <p className="text-[14px] opacity-70 truncate mt-0.5">{c.lastMessage || '—'}</p>
              <div className="mt-1 flex items-center gap-2">
                <StageBadge stage={c.stage} brand={brand} />
                {c.humanMode && (
                  <span className="text-[12px]" style={{ color: brand.primary }}>
                    Asesor
                  </span>
                )}
                {c.unreadCount > 0 && (
                  <span
                    className="w-2 h-2 rounded-full ml-auto"
                    style={{ background: '#c62828' }}
                    title="Sin leer"
                  />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
