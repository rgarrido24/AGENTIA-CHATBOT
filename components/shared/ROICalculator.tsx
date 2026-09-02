'use client';

import { useEffect, useMemo, useState } from 'react';

export type ROIField = {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
};

export type ROIResultLine = {
  label: string;
  value: string;
  highlight?: boolean;
};

export default function ROICalculator({
  title,
  fields,
  calculate,
  onResultChange,
}: {
  title: string;
  fields: ROIField[];
  calculate: (values: Record<string, number>) => ROIResultLine[];
  onResultChange?: (values: Record<string, number>, result: ROIResultLine[]) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.defaultValue])),
  );

  const result = useMemo(() => calculate(values), [values, calculate]);

  useEffect(() => {
    onResultChange?.(values, result);
  }, [values, result, onResultChange]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:p-8">
      <h3 className="font-[family-name:var(--font-space)] text-xl font-bold sm:text-2xl">{title}</h3>

      <div className="mt-6 flex flex-col gap-5">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-2 flex justify-between gap-3 font-mono text-[12px] text-white/55">
              <span>
                {f.label}
                {f.suffix ? ` (${f.suffix})` : ''}
              </span>
              <span className="tabular-nums text-white">{values[f.key]}</span>
            </label>
            <input
              type="range"
              min={f.min ?? 0}
              max={f.max ?? 100}
              step={f.step ?? 1}
              value={values[f.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#00D4FF]"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5">
        {result.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-white/55">{r.label}</span>
            <span
              className={
                'font-mono tabular-nums ' +
                (r.highlight ? 'text-2xl font-bold text-[#00D4FF]' : 'text-[15px] text-white')
              }
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
