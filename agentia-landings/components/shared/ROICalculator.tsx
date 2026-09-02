"use client";

import { useMemo, useState } from "react";

export type ROIField = {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string; // ej. "leads/mes", "%", "MXN"
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
  /** se llama cada vez que cambia el resultado, útil para adjuntarlo al lead form */
  onResultChange?: (values: Record<string, number>, result: ROIResultLine[]) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.defaultValue]))
  );

  const result = useMemo(() => {
    const r = calculate(values);
    onResultChange?.(values, r);
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  return (
    <div className="ag-card">
      <p className="ag-eyebrow">SIMULADOR</p>
      <p className="ag-h2" style={{ fontSize: 22, marginBottom: 20 }}>
        {title}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
        {fields.map((f) => (
          <div key={f.key}>
            <label className="ag-label">
              {f.label}
              {f.suffix ? ` (${f.suffix})` : ""}: {values[f.key]}
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
              style={{ width: "100%", accentColor: "var(--verde)" }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {result.map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span style={{ color: "var(--text-1)", fontSize: 14 }}>{r.label}</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: r.highlight ? 24 : 15,
                color: r.highlight ? "var(--verde)" : "var(--text-0)",
                fontWeight: r.highlight ? 700 : 500,
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
