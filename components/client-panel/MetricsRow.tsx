'use client';

import type { ClientPanelBrand } from '@/lib/client-panel-config';
import { stageLabel } from '@/lib/client-panel-config';
import { MessageSquare, ShoppingBag, TrendingUp, Clock } from 'lucide-react';

type Metrics = {
  conversationsToday: number;
  closedSales: number;
  unanswered: number;
  avgBotResponseSec: number;
};

export function MetricsRow({ metrics, brand }: { metrics: Metrics; brand: ClientPanelBrand }) {
  const cards = [
    {
      label: 'Conversaciones hoy',
      value: metrics.conversationsToday,
      icon: MessageSquare,
    },
    {
      label: 'Ventas cerradas',
      value: metrics.closedSales,
      icon: TrendingUp,
    },
    {
      label: 'Sin responder',
      value: metrics.unanswered,
      icon: ShoppingBag,
    },
    {
      label: 'Tiempo promedio respuesta bot',
      value: metrics.avgBotResponseSec ? `${metrics.avgBotResponseSec}s` : '—',
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="p-4 bg-white"
          style={{
            border: `1px solid ${brand.border}`,
            borderRadius: brand.radius,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <c.icon size={24} style={{ color: brand.primary }} aria-hidden />
          <div className="mt-2 text-[28px] font-semibold leading-none">{c.value}</div>
          <div className="mt-1 text-[15px] opacity-75">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

export function StageBadge({ stage, brand }: { stage: string; brand: ClientPanelBrand }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-[13px] font-medium"
      style={{
        background: `${brand.primary}18`,
        color: brand.primary,
        borderRadius: '6px',
        border: `1px solid ${brand.primary}40`,
      }}
    >
      {stageLabel(stage)}
    </span>
  );
}
