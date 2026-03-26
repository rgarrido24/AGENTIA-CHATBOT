'use client';

export type DemoPreviewProps = {
  accentColor: string;
  stats: Array<{ label: string; value: string }>;
  chatMessages: Array<{ role: 'user' | 'bot'; text: string }>;
  hasChart?: boolean;
};

const BAR_HEIGHTS = [42, 78, 55, 88, 63];

export function DemoPreview({ accentColor, stats, chatMessages, hasChart = true }: DemoPreviewProps) {
  const pad = { label: '—', value: '—' };
  const kpiPair = [...stats];
  while (kpiPair.length < 2) kpiPair.push(pad);
  return (
    <div className="relative h-full min-h-[200px] overflow-hidden rounded-t-xl border-b border-white/10">
      {/* Fondo con gradiente accent */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(165deg, ${accentColor}40 0%, rgba(10,15,26,0.92) 48%, rgba(5,8,14,0.98) 100%)`,
        }}
      />
      <div
        className="relative flex h-[calc(100%+36px)] min-h-[268px] flex-col transition-transform duration-[600ms] ease-in-out group-hover:-translate-y-[30px]"
      >
        {/* Header: EN VIVO */}
        <div className="flex shrink-0 items-center justify-end px-2 pt-2">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm animate-pulse"
            style={{ borderColor: `${accentColor}55` }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ backgroundColor: accentColor }}
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            </span>
            En vivo
          </span>
        </div>

        <div className="flex min-h-0 flex-1 gap-1.5 px-1.5 pb-2 pt-1">
          {/* Sidebar */}
          <div
            className="flex w-[18%] shrink-0 flex-col items-center justify-center gap-1.5 rounded-md py-2"
            style={{ backgroundColor: `${accentColor}22` }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: i === 0 ? accentColor : `${accentColor}55`,
                  opacity: i === 0 ? 1 : 0.45 + i * 0.1,
                }}
              />
            ))}
          </div>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-1">
              {kpiPair.slice(0, 2).map((s, idx) => (
                <div
                  key={`${s.label}-${idx}`}
                  className="rounded-md border border-white/10 bg-black/25 px-1.5 py-1 backdrop-blur-sm"
                >
                  <p className="text-[8px] leading-tight text-slate-500">{s.label}</p>
                  <p className="truncate text-[11px] font-bold tabular-nums text-white">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Gráfica */}
            {hasChart && (
              <div className="flex h-9 items-end justify-between gap-0.5 rounded-md border border-white/5 bg-black/20 px-1 pb-0.5 pt-1">
                {BAR_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="demo-preview-bar w-full max-w-[14px] rounded-t-[2px]"
                    style={{
                      height: `${h}%`,
                      backgroundColor: accentColor,
                      opacity: 0.75,
                      animationDelay: `${i * 90}ms`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Chat */}
            <div className="flex flex-col gap-1">
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[95%] rounded-lg px-1.5 py-1 text-[8px] leading-snug ${
                    m.role === 'user'
                      ? 'ml-auto text-right'
                      : 'mr-auto border border-white/10 text-left'
                  }`}
                  style={
                    m.role === 'user'
                      ? { backgroundColor: `${accentColor}cc`, color: '#fff' }
                      : { backgroundColor: 'rgba(30,41,59,0.85)', color: '#e2e8f0' }
                  }
                >
                  <span className="line-clamp-2">{m.text}</span>
                </div>
              ))}
            </div>

            {/* Contenido extra (se revela con hover) */}
            <div className="mt-auto space-y-1 border-t border-white/5 pt-1.5">
              <div className="flex items-center gap-1 text-[7px] text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                <span>Actividad reciente</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <div className="flex gap-1">
                <div
                  className="h-6 flex-1 rounded border border-white/10 bg-black/30"
                  style={{ boxShadow: `inset 0 0 0 1px ${accentColor}22` }}
                />
                <div className="h-6 w-8 rounded border border-white/10 bg-black/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
