'use client';

import { DecoHouseCrmMock } from '@/components/landing/case-mocks/DecoHouseCrmMock';
import { LucianoCrmMock } from '@/components/landing/case-mocks/LucianoCrmMock';
import { VolanteoMapMock } from '@/components/landing/case-mocks/VolanteoMapMock';

const PREVIEW_IDS = new Set(['deco', 'luciano']);

export function CaseStudyMock({ id, preview = false }: { id: string; preview?: boolean }) {
  if (preview && PREVIEW_IDS.has(id)) {
    return (
      <div
      className="relative mt-4 max-h-[200px] overflow-hidden rounded-xl border border-white/10 [&>div]:!mt-0"
    >
        <div className="pointer-events-none scale-[0.92] origin-top">
          {id === 'deco' ? <DecoHouseCrmMock /> : <LucianoCrmMock />}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(to top, #0a0a0a 30%, transparent)' }}
          aria-hidden
        />
      </div>
    );
  }

  switch (id) {
    case 'deco':
      return <DecoHouseCrmMock />;
    case 'luciano':
      return <LucianoCrmMock />;
    case 'volanteo':
      return <VolanteoMapMock />;
    default:
      return null;
  }
}
