'use client';

import { useEffect, useState } from 'react';

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  format?: (n: number) => string;
};

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  format,
}: Props) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const t0 = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - (1 - p) ** 3;
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const text = format
    ? format(n)
    : `${prefix}${decimals > 0 ? n.toFixed(decimals) : Math.round(n)}${suffix}`;
  return <span>{text}</span>;
}
