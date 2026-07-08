'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
      className="hidden xl:flex flex-col gap-4 p-4 border-l overflow-y-auto h-full bg-white"
      style={{ width: 260, borderColor: props.brand.border }}
    >
      <SidebarPanelContent {...props} />
    </aside>
  );
}

type ProfileDrawerProps = SidebarColumnProps & {
  open: boolean;
  onClose: () => void;
};

export function ProfileDrawer({ open, onClose, brand, ...rest }: ProfileDrawerProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar perfil"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 flex flex-col bg-white rounded-t-2xl shadow-xl"
        style={{ height: '80vh', borderTop: `1px solid ${brand.border}` }}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0]?.clientY ?? null;
        }}
        onTouchMove={(e) => {
          if (touchStartY.current === null || !sheetRef.current) return;
          const dy = (e.touches[0]?.clientY ?? 0) - touchStartY.current;
          if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
        }}
        onTouchEnd={(e) => {
          if (touchStartY.current === null || !sheetRef.current) return;
          const dy = (e.changedTouches[0]?.clientY ?? 0) - touchStartY.current;
          sheetRef.current.style.transform = '';
          touchStartY.current = null;
          if (dy > 80) onClose();
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: brand.border }}>
          <div className="w-10 flex justify-center">
            <div className="w-10 h-1 rounded-full opacity-30" style={{ background: brand.text }} />
          </div>
          <span className="text-[15px] font-semibold">Perfil del lead</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg"
            aria-label="Cerrar"
            style={{ color: brand.text }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <SidebarPanelContent brand={brand} {...rest} />
        </div>
      </div>
    </div>
  );
}
