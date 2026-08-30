'use client';

import { useCallback, useEffect, useState } from 'react';

type BridgeRow = {
  clientId: string;
  connected: boolean;
  hasQr: boolean;
  qrDataUrl: string | null;
  updatedAt: string | null;
};

type StatusPayload = { bridges?: BridgeRow[]; error?: string };

type QrJsonPayload = { qr?: string; updatedAt?: string; error?: string };

export function DecoHouseBridgePanels({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [qr, setQr] = useState<QrJsonPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, qRes] = await Promise.all([
        fetch(`/api/whatsapp/status?clientId=${encodeURIComponent(clientId)}`, { cache: 'no-store' }),
        fetch(`/api/whatsapp/qr?clientId=${encodeURIComponent(clientId)}&format=json`, { cache: 'no-store' }),
      ]);
      const sJson = (await sRes.json().catch(() => ({}))) as StatusPayload;
      const qJson = (await qRes.json().catch(() => ({}))) as QrJsonPayload;
      setStatus(sJson);
      setQr(qRes.ok ? qJson : { error: qJson.error || `HTTP ${qRes.status}` });
      setLastFetch(new Date());
    } catch {
      setStatus({ error: 'No se pudo cargar el estado.' });
      setQr({ error: 'No se pudo cargar el QR.' });
      setLastFetch(new Date());
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const clearAllSessions = useCallback(async () => {
    setClearing(true);
    setClearMsg('');
    try {
      const res = await fetch('/api/demo/deco-house/chat', { method: 'DELETE' });
      const data = (await res.json().catch(() => ({}))) as { deleted?: number };
      setClearMsg(`✓ ${data.deleted ?? 0} sesion(es) eliminadas`);
    } catch {
      setClearMsg('Error al limpiar sesiones');
    } finally {
      setClearing(false);
    }
  }, []);

  const bridge = status?.bridges?.find((b) => b.clientId === clientId) ?? status?.bridges?.[0];
  const connected = bridge?.connected ?? false;
  const hasQrDoc = bridge?.hasQr ?? false;

  return (
    <div className="mt-6 space-y-4">
      {/* ── Nueva conversación (limpiar sesiones) ── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Limpiar sesiones de chat</p>
            <p className="text-xs text-white/60 mt-1">
              Borra los historiales de conversación de Elisa (clientId: decohouse) para que los clientes
              empiecen desde cero. No afecta luciano ni agentia-ventas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {clearMsg && <p className="text-xs text-emerald-300">{clearMsg}</p>}
            <button
              type="button"
              disabled={clearing}
              onClick={() => void clearAllSessions()}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:text-white transition disabled:opacity-40"
            >
              {clearing ? 'Limpiando…' : '↺ Nueva conversación (todos)'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Estado</p>
            <p className="text-xs text-white/60 mt-1">Datos desde MongoDB (colección whatsapp_qr). Se actualiza solo.</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:text-white"
          >
            Actualizar
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 min-h-[14rem]">
          {status?.error ? (
            <p className="text-sm text-red-300">{status.error}</p>
          ) : loading && !bridge ? (
            <p className="text-sm text-white/50">Cargando…</p>
          ) : !bridge ? (
            <p className="text-sm text-amber-200/90">
              No hay registro para <code className="text-white/80">{clientId}</code>. El worker del bridge aún no escribió en la base o no incluye este{' '}
              <code className="text-white/80">clientId</code>.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  aria-hidden
                />
                <span className="text-white/90">
                  {connected ? 'Conectado' : 'No conectado'}
                  {hasQrDoc ? ' · hay QR en DB' : ' · sin QR en DB'}
                </span>
              </div>
              {bridge.updatedAt && (
                <p className="text-xs text-white/50">
                  Última actualización en DB: {new Date(bridge.updatedAt).toLocaleString('es-AR')}
                </p>
              )}
              {bridge.qrDataUrl && (
                <p className="text-xs text-white/45">Vista previa pequeña (opcional):</p>
              )}
              {bridge.qrDataUrl && (
                <img src={bridge.qrDataUrl} alt="" className="h-24 w-24 rounded bg-white p-1" />
              )}
            </div>
          )}
          <p className="text-[11px] text-white/45 mt-4">
            En Render, el worker debe incluir{' '}
            <code className="text-white/70">AGENTIA_WHATSAPP_CLIENT_IDS=…,decohouse,…</code> (lista separada por comas) y redeploy del último código. Un solo proceso puede levantar varios bridges.
          </p>
          {lastFetch && (
            <p className="text-[10px] text-white/35 mt-2">Refresco UI: {lastFetch.toLocaleTimeString('es-AR')}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold">Vincular (QR)</p>
        <p className="text-xs text-white/60 mt-1">Escanea con WhatsApp → Dispositivos vinculados (no uses la cámara del teléfono fuera de WhatsApp).</p>
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 min-h-[26rem] flex flex-col items-center justify-center text-center">
          {qr?.error ? (
            <div className="text-sm text-amber-200/90 max-w-sm">
              <p>{qr.error}</p>
              <p className="text-xs text-white/45 mt-3">
                Cuando el worker publique el QR en Mongo, este cuadro mostrará la imagen automáticamente (o pulsa Actualizar arriba).
              </p>
            </div>
          ) : qr?.qr ? (
            <>
              <img src={qr.qr} alt="Código QR para vincular WhatsApp" className="max-w-[280px] rounded-xl bg-white p-2" />
              {qr.updatedAt && (
                <p className="text-[11px] text-white/45 mt-3">
                  Generado: {new Date(qr.updatedAt).toLocaleString('es-AR')}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-white/50">Esperando QR…</p>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
