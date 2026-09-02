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
    <div className="rounded-2xl border border-[#14161A]/8 bg-white p-6 shadow-[0_8px_24px_rgba(20,22,26,0.04)] sm:p-8">
      <h3 className="text-xl font-bold sm:text-2xl">{title}</h3>

      <div className="mt-6 flex flex-col gap-5">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-2 flex justify-between gap-3 text-[12px] text-[#14161A]/55">
              <span>
                {f.label}
                {f.suffix ? ` (${f.suffix})` : ''}
              </span>
              <span className="tabular-nums text-[#14161A]">{values[f.key]}</span>
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
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#14161A]/10 accent-[#B8935A]"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-[#14161A]/10 pt-5">
        {result.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-[#14161A]/55">{r.label}</span>
            <span
              className={
                'tabular-nums ' +
                (r.highlight ? 'text-2xl font-bold text-[#B8935A]' : 'text-[15px] text-[#14161A]')
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
