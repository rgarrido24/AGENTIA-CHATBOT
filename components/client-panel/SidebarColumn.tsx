'use client';

import { useState } from 'react';
import type { ClientPanelBrand, FunnelStage } from '@/lib/client-panel-config';
import { PANEL_FUNNEL_STAGES, PANEL_TAGS } from '@/lib/client-panel-config';
import { initials } from '@/lib/client-panel-hooks';

export type SidebarColumnProps = {
  brand: ClientPanelBrand;
  contactName: string;
  phone: string;
  stage: string;
  tags: string[];
  notes: string;
  purchaseIntent: number;
  onStage: (stage: FunnelStage) => void;
  onTags: (tags: string[]) => void;
  onNotes: (notes: string) => void;
};

export function SidebarPanelContent({
  brand,
  contactName,
  phone,
  stage,
  tags,
  notes,
  purchaseIntent,
  onStage,
  onTags,
  onNotes,
}: SidebarColumnProps) {
  return (
    <>
      <section>
        <h3 className="text-[13px] font-semibold uppercase opacity-60 mb-2">Contacto</h3>
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: `${brand.primary}22`, color: brand.primary }}
          >
            {initials(contactName)}
          </div>
          <div className="font-semibold text-[16px]">{contactName}</div>
          <div className="text-[15px] opacity-70">{phone}</div>
        </div>
      </section>

      <section>
        <h3 className="text-[13px] font-semibold uppercase opacity-60 mb-2">Embudo de venta</h3>
        <div className="space-y-1">
          {PANEL_FUNNEL_STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStage(s.id)}
              className="w-full text-left px-3 py-2 text-[15px]"
              style={{
                borderRadius: '8px',
                background: stage === s.id ? `${brand.primary}18` : 'transparent',
                border: `1px solid ${stage === s.id ? brand.primary : brand.border}`,
                color: stage === s.id ? brand.primary : brand.text,
                fontWeight: stage === s.id ? 600 : 400,
              }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[13px] font-semibold uppercase opacity-60 mb-2">Notas</h3>
        <textarea
          className="w-full min-h-[100px] p-3 text-[15px] resize-y"
          style={{ border: `1px solid ${brand.border}`, borderRadius: brand.radius }}
          placeholder="Anota detalles del cliente..."
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          onBlur={() => onNotes(notes)}
        />
      </section>

      <section>
        <h3 className="text-[13px] font-semibold uppercase opacity-60 mb-2">Etiquetas</h3>
        <div className="flex flex-wrap gap-1">
          {PANEL_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const next = active ? tags.filter((t) => t !== tag) : [...tags, tag];
                  onTags(next);
                }}
                className="px-2 py-1 text-[14px] capitalize"
                style={{
                  borderRadius: '20px',
                  border: `1px solid ${active ? brand.primary : brand.border}`,
                  background: active ? `${brand.primary}15` : '#fff',
                  color: active ? brand.primary : brand.text,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-[13px] font-semibold uppercase opacity-60 mb-2">Intención de compra</h3>
        <div
          className="h-3 w-full rounded-full overflow-hidden"
          style={{ background: brand.border }}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${purchaseIntent}%`, background: brand.primary }}
          />
        </div>
        <p className="text-[15px] mt-1 font-semibold">{purchaseIntent}%</p>
      </section>
    </>
  );
}

export function SidebarColumn(props: SidebarColumnProps) {
  return (
    <aside
      className="hidden md:flex flex-col gap-4 p-4 border-l overflow-y-auto h-full bg-white"
      style={{ width: 260, borderColor: props.brand.border }}
    >
      <SidebarPanelContent {...props} />
    </aside>
  );
}

type MobileTab = 'perfil' | 'embudo' | 'notas' | 'etiquetas';

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'embudo', label: 'Embudo' },
  { id: 'notas', label: 'Notas' },
  { id: 'etiquetas', label: 'Etiquetas' },
];

export function SidebarMobileTabs(props: SidebarColumnProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('perfil');
  const { brand, contactName, phone, stage, tags, notes, purchaseIntent, onStage, onTags, onNotes } = props;

  return (
    <div
      className="flex shrink-0 flex-col border-t bg-white md:hidden"
      style={{ height: 200, borderColor: brand.border }}
    >
      <div className="flex shrink-0 border-b" style={{ borderColor: brand.border }}>
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 text-center text-[13px] font-medium transition-colors"
            style={{
              color: activeTab === tab.id ? brand.primary : brand.text,
              borderBottom: activeTab === tab.id ? `2px solid ${brand.primary}` : '2px solid transparent',
              background: activeTab === tab.id ? `${brand.primary}08` : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'perfil' && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
              style={{ background: `${brand.primary}22`, color: brand.primary }}
            >
              {initials(contactName)}
            </div>
            <div className="text-[15px] font-semibold">{contactName}</div>
            <div className="text-[14px] opacity-70">{phone}</div>
            <div className="mt-2 w-full">
              <p className="mb-1 text-left text-[12px] font-semibold uppercase opacity-60">Intención de compra</p>
              <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: brand.border }}>
                <div className="h-full transition-all" style={{ width: `${purchaseIntent}%`, background: brand.primary }} />
              </div>
              <p className="mt-1 text-left text-[14px] font-semibold">{purchaseIntent}%</p>
            </div>
          </div>
        )}
        {activeTab === 'embudo' && (
          <div className="space-y-1">
            {PANEL_FUNNEL_STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onStage(s.id)}
                className="w-full px-3 py-2 text-left text-[14px]"
                style={{
                  borderRadius: '8px',
                  background: stage === s.id ? `${brand.primary}18` : 'transparent',
                  border: `1px solid ${stage === s.id ? brand.primary : brand.border}`,
                  color: stage === s.id ? brand.primary : brand.text,
                  fontWeight: stage === s.id ? 600 : 400,
                }}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        )}
        {activeTab === 'notas' && (
          <textarea
            className="h-full min-h-[120px] w-full resize-none p-2 text-[14px]"
            style={{ border: `1px solid ${brand.border}`, borderRadius: brand.radius }}
            placeholder="Anota detalles del cliente..."
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            onBlur={() => onNotes(notes)}
          />
        )}
        {activeTab === 'etiquetas' && (
          <div className="flex flex-wrap gap-1.5">
            {PANEL_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const next = active ? tags.filter((t) => t !== tag) : [...tags, tag];
                    onTags(next);
                  }}
                  className="px-2.5 py-1 text-[13px] capitalize"
                  style={{
                    borderRadius: '20px',
                    border: `1px solid ${active ? brand.primary : brand.border}`,
                    background: active ? `${brand.primary}15` : '#fff',
                    color: active ? brand.primary : brand.text,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
