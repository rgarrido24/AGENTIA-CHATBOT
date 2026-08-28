'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Camera, ImageUp, Loader2, RotateCcw, X } from 'lucide-react';

type Props = {
  disabled?: boolean;
  accentColor?: string;
  primaryColor?: string;
  onScan: (value: string) => void;
};

type ScannerLike = {
  isScanning: boolean;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
  start: (
    camera: unknown,
    config: unknown,
    onSuccess: (decoded: string) => void,
    onFailure?: (err: string) => void,
  ) => Promise<void>;
  scanFileV2: (file: File, showImage?: boolean) => Promise<{ decodedText: string }>;
};

/** Extrae dígitos de teléfono del valor del QR (puede venir con wa.me, texto, etc.). */
export function telefonoFromQrPayload(raw: string): string {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  const ten = text.match(/(?:^|\D)(\d{10})(?:\D|$)/);
  if (ten?.[1]) return ten[1];
  let digits = text.replace(/\D/g, '');
  if (digits.startsWith('52') && digits.length >= 12) {
    digits = digits.slice(-10);
  }
  return digits;
}

function cameraErrorMessage(e: unknown): string {
  const name = e && typeof e === 'object' && 'name' in e ? String((e as Error).name) : '';
  const msg = e instanceof Error ? e.message : String(e ?? '');
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permiso de cámara denegado. Actívalo en el candado de la barra de direcciones y vuelve a intentar.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No se encontró ninguna cámara en este dispositivo.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'La cámara está ocupada por otra app. Cierra la otra app o la otra pestaña y reintenta.';
    case 'OverconstrainedError':
      return 'La cámara trasera no está disponible en este equipo.';
    default:
      return msg || 'No se pudo abrir la cámara. Usa la foto del QR o teclea el teléfono.';
  }
}

/** Espera a que el contenedor exista en el DOM antes de arrancar html5-qrcode. */
async function waitForElement(id: string, tries = 20): Promise<HTMLElement | null> {
  for (let i = 0; i < tries; i += 1) {
    const el = document.getElementById(id);
    if (el) return el;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

export function LoyaltyQrScanner({
  disabled,
  accentColor = '#F2691F',
  primaryColor = '#1E2340',
  onScan,
}: Props) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const regionId = `loyalty-qr-${reactId}`;
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRaw, setLastRaw] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const scannerRef = useRef<ScannerLike | null>(null);
  const handledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      if (s.isScanning) await s.stop();
      await s.clear();
    } catch {
      // ignore stop races
    }
  }, []);

  const handleDecoded = useCallback(
    (decoded: string) => {
      if (handledRef.current) return;
      const tel = telefonoFromQrPayload(decoded);
      if (tel.length < 10) {
        setLastRaw(decoded);
        setError('QR leído, pero no contiene un teléfono de 10 dígitos.');
        return;
      }
      handledRef.current = true;
      onScan(tel);
      setOpen(false);
    },
    [onScan],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    handledRef.current = false;
    setStarting(true);
    setError(null);
    setLastRaw(null);

    (async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Este navegador no permite usar la cámara. Necesita HTTPS (o localhost) y un navegador moderno.',
          );
        }

        const el = await waitForElement(regionId);
        if (cancelled) return;
        if (!el) throw new Error('No se pudo montar el visor de la cámara.');

        // Pide permiso explícitamente: da errores con nombre y evita fallos silenciosos.
        const probe = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        probe.getTracks().forEach((t) => t.stop());
        if (cancelled) return;

        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode(regionId, {
          verbose: false,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        } as never) as unknown as ScannerLike;
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: (viewW: number, viewH: number) => {
            const side = Math.max(160, Math.floor(Math.min(viewW, viewH) * 0.72));
            return { width: side, height: side };
          },
        };

        // La cámara trasera por deviceId es más confiable que facingMode en Android.
        let cameraId: unknown = { facingMode: 'environment' };
        try {
          const cams = (await Html5Qrcode.getCameras()) ?? [];
          if (cams.length > 0) {
            const back =
              cams.find((c) => /back|rear|tras|environment/i.test(c.label ?? '')) ??
              cams[cams.length - 1];
            if (back?.id) cameraId = back.id;
          }
        } catch {
          // sin permisos de enumeración: seguimos con facingMode
        }
        if (cancelled) return;

        const onFrameFailure = () => {
          /* frame sin QR — silencioso */
        };

        try {
          await scanner.start(cameraId, config, handleDecoded, onFrameFailure);
        } catch (first) {
          if (cancelled) return;
          try {
            await scanner.start(
              { facingMode: 'environment' },
              config,
              handleDecoded,
              onFrameFailure,
            );
          } catch {
            if (cancelled) return;
            try {
              await scanner.start({ facingMode: 'user' }, config, handleDecoded, onFrameFailure);
            } catch {
              throw first;
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(cameraErrorMessage(e));
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, attempt, regionId, handleDecoded, stopScanner]);

  async function scanFromFile(file: File) {
    setError(null);
    setLastRaw(null);
    setStarting(true);
    try {
      await stopScanner();
      const { Html5Qrcode } = await import('html5-qrcode');
      const el = await waitForElement(regionId);
      if (!el) throw new Error('No se pudo montar el visor.');
      const scanner = new Html5Qrcode(regionId) as unknown as ScannerLike;
      const result = await scanner.scanFileV2(file, false);
      handleDecoded(result.decodedText);
    } catch (e) {
      setError(
        e instanceof Error && /No MultiFormat Readers|NotFoundException/i.test(e.message)
          ? 'No se detectó ningún QR en la imagen. Toma la foto más cerca y enfocada.'
          : cameraErrorMessage(e),
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setAttempt((n) => n + 1);
          setOpen(true);
        }}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          borderColor: `${accentColor}73`,
          backgroundColor: `${accentColor}26`,
          color: accentColor,
        }}
      >
        <Camera className="h-4 w-4" />
        Escanear tarjeta
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center">
          <div
            className="w-full max-w-md rounded-3xl border border-white/15 p-4 shadow-2xl sm:p-5"
            style={{ backgroundColor: primaryColor }}
          >
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
              className="min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black [&_img]:w-full [&_video]:max-h-[55vh] [&_video]:w-full [&_video]:object-cover"
            />
            {starting ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-white/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Abriendo cámara…
              </p>
            ) : null}
            {error ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-red-300">{error}</p>
                {lastRaw ? (
                  <p className="break-all text-[11px] text-white/40">Contenido leído: {lastRaw}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAttempt((n) => n + 1)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reintentar cámara
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    <ImageUp className="h-3.5 w-3.5" />
                    Leer QR desde foto
                  </button>
                </div>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void scanFromFile(file);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
