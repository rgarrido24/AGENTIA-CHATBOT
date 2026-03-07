let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playAlertSound(type: 'message' | 'moved' | 'logro' = 'message') {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (type === 'logro') {
      // Sonido de logro/achievement: arpegio ascendente breve
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = f;
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.12);
      });
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = type === 'message' ? 880 : 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    if (type === 'message') {
      setTimeout(() => {
        const osc2 = ctx!.createOscillator();
        const gain2 = ctx!.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx!.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.12, ctx!.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx!.currentTime + 0.1);
        osc2.start(ctx!.currentTime);
        osc2.stop(ctx!.currentTime + 0.1);
      }, 120);
    }
  } catch {
    //
  }
}
