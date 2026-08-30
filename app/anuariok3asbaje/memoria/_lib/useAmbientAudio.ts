'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SectionTone = 'intro' | 'chapter' | 'student' | 'gallery' | 'letter' | 'finale';

/**
 * Ambiente sintético (Web Audio) — sin autoplay agresivo.
 * Crossfade entre tonos por sección.
 */
export function useAmbientAudio() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscARef = useRef<OscillatorNode | null>(null);
  const oscBRef = useRef<OscillatorNode | null>(null);
  const toneRef = useRef<SectionTone>('intro');

  const freqs: Record<SectionTone, [number, number]> = {
    intro: [110, 164.81],
    chapter: [98, 146.83],
    student: [130.81, 196],
    gallery: [123.47, 185],
    letter: [87.31, 130.81],
    finale: [73.42, 110],
  };

  const ensure = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      g1.gain.value = 0.035;
      g2.gain.value = 0.022;
      o1.type = 'sine';
      o2.type = 'sine';
      o1.frequency.value = freqs.intro[0];
      o2.frequency.value = freqs.intro[1];
      o1.connect(g1);
      o2.connect(g2);
      g1.connect(master);
      g2.connect(master);
      o1.start();
      o2.start();

      ctxRef.current = ctx;
      gainRef.current = master;
      oscARef.current = o1;
      oscBRef.current = o2;
    }
    if (ctxRef.current.state === 'suspended') await ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const enable = useCallback(async () => {
    const ctx = await ensure();
    if (!ctx || !gainRef.current) return;
    const now = ctx.currentTime;
    gainRef.current.gain.cancelScheduledValues(now);
    gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
    gainRef.current.gain.linearRampToValueAtTime(0.85, now + 1.2);
    setEnabled(true);
  }, [ensure]);

  const disable = useCallback(() => {
    const ctx = ctxRef.current;
    const g = gainRef.current;
    if (!ctx || !g) {
      setEnabled(false);
      return;
    }
    const now = ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, now + 0.9);
    setEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) disable();
    else void enable();
  }, [enabled, enable, disable]);

  const setTone = useCallback(
    (tone: SectionTone) => {
      toneRef.current = tone;
      const ctx = ctxRef.current;
      const a = oscARef.current;
      const b = oscBRef.current;
      if (!ctx || !a || !b || !enabled) return;
      const [f1, f2] = freqs[tone];
      const now = ctx.currentTime;
      a.frequency.cancelScheduledValues(now);
      b.frequency.cancelScheduledValues(now);
      a.frequency.setValueAtTime(a.frequency.value, now);
      b.frequency.setValueAtTime(b.frequency.value, now);
      a.frequency.linearRampToValueAtTime(f1, now + 1.4);
      b.frequency.linearRampToValueAtTime(f2, now + 1.4);
    },
    [enabled]
  );

  const silenceFinale = useCallback(() => {
    const ctx = ctxRef.current;
    const g = gainRef.current;
    if (!ctx || !g) return;
    const now = ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, now + 1.6);
  }, []);

  useEffect(() => {
    return () => {
      try {
        oscARef.current?.stop();
        oscBRef.current?.stop();
        void ctxRef.current?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return { enabled, toggle, enable, disable, setTone, silenceFinale };
}
