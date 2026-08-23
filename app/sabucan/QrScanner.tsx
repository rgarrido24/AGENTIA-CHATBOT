'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';

type Props = {
  disabled?: boolean;
  onScan: (value: string) => void;
};

/** Extrae dígitos de teléfono del valor del QR (puede venir con wa.me, texto, etc.). */
export function telefonoFromQrPayload(raw: string): string {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  // Preferir secuencia de 10 dígitos MX
  const ten = text.match(/(?:^|\D)(\d{10})(?:\D|$)/);
  if (ten?.[1]) return ten[1];
  let digits = text.replace(/\D/g, '');
  if (digits.startsWith('52') && digits.length >= 12) {
    digits = digits.slice(-10);
  }
  return digits;
}

export function SabucanQrScanner({ disabled, onScan }: Props) {
  const reactId = useId().replace(/:/g, '');
  const regionId = `sabucan-qr-${reactId}`;
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<{
    isScanning: boolean;
    stop: () => Promise<void>;
    clear: () => Promise<void>;
    start: (
      camera: { facingMode: string } | string,
      config: { fps: number; qrbox: { width: number; height: number } },
      onSuccess: (decoded: string) => void,
      onFailure?: (err: string) => void,
    ) => Promise<void>;
  } | null>(null);
  const handledRef = useRef(false);

  async function stopScanner() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      if (s.isScanning) await s.stop();
      await s.clear();
    } catch {
      // ignore stop races
    }
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    handledRef.current = false;
    setStarting(true);
    setError(null);

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner as unknown as NonNullable<typeof scannerRef.current>;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (handledRef.current) return;
            const tel = telefonoFromQrPayload(decoded);
            if (tel.length < 10) {
              setError('QR leído, pero no contiene un teléfono válido');
              return;
            }
            handledRef.current = true;
            onScan(tel);
            setOpen(false);
          },
          () => {
            /* frame sin QR — silencioso */
          },
        );
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : 'No se pudo abrir la cámara. Revisa permisos o teclea el teléfono.',
          );
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regionId estable por mount
  }, [open, regionId]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#F2691F]/45 bg-[#F2691F]/15 px-4 py-3.5 text-sm font-semibold text-[#F2691F] transition-colors hover:bg-[#F2691F]/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Camera className="h-4 w-4" />
        Escanear tarjeta
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#1E2340] p-4 shadow-2xl sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-[family-name:var(--font-space)] text-sm font-semibold text-white">
                Escanear pase
              </p>
              <button
                type="button"
                aria-label="Cerrar escáner"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-xs text-white/45">
              Apunta al código QR del pase de Google Wallet. El teléfono se llenará solo.
            </p>
            <div
              id={regionId}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black [&_video]:max-h-[55vh] [&_video]:w-full [&_video]:object-cover"
            />
            {starting ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-white/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Abriendo cámara…
              </p>
            ) : null}
            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
