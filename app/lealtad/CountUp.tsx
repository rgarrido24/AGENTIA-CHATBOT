'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

type Props = {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  format?: (n: number) => string;
  className?: string;
};

/** Counts from 0 to `end` once the node enters the viewport. Respects reduced motion. */
export function CountUp({
  end,
  prefix = '',
  suffix = '',
  duration = 1100,
  decimals = 0,
  format,
  className,
}: Props) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(reduceMotion ? end : 0);
  const started = useRef(false);
  const current = useRef(reduceMotion ? end : 0);

  useEffect(() => {
    if (reduceMotion) {
      current.current = end;
      setValue(end);
      return;
    }

    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let cancelled = false;

    const run = (from: number, to: number) => {
      const t0 = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - (1 - t) ** 3;
        const next = from + (to - from) * eased;
        current.current = next;
        setValue(next);
        if (t < 1) raf = requestAnimationFrame(tick);
        else {
          current.current = to;
          setValue(to);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    if (started.current) {
      run(current.current, end);
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();
        run(0, end);
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [end, duration, reduceMotion]);

  const display = format
    ? format(value)
    : `${prefix}${decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('es-MX')}${suffix}`;

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
