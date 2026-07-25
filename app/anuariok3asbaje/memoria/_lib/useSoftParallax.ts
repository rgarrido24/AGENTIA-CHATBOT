'use client';

import { useEffect, useState } from 'react';

/** Parallax suave por mouse (desktop) o giroscopio (móvil) */
export function useSoftParallax(intensity = 12) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;

    const onMove = (e: MouseEvent) => {
      if (!active) return;
      const x = (e.clientX / window.innerWidth - 0.5) * intensity;
      const y = (e.clientY / window.innerHeight - 0.5) * intensity;
      setOffset({ x, y });
    };

    const onOrient = (e: DeviceOrientationEvent) => {
      if (!active) return;
      const g = e.gamma ?? 0;
      const b = e.beta ?? 0;
      setOffset({
        x: Math.max(-intensity, Math.min(intensity, g * 0.35)),
        y: Math.max(-intensity, Math.min(intensity, (b - 45) * 0.25)),
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('deviceorientation', onOrient, { passive: true });

    return () => {
      active = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, [intensity]);

  return offset;
}
