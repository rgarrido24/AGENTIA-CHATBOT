'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wifi, WifiOff, RefreshCw, QrCode, Clock } from 'lucide-react';

interface Bridge {
  clientId: string;
  connected: boolean;
  hasQr: boolean;
  qrDataUrl: string | null;
  updatedAt: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Nunca';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function BridgeCard({ bridge, onRefresh }: { bridge: Bridge; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bridge.connected ? 'bg-emerald-500/20' : 'bg-slate-700/50'}`}>
            {bridge.connected
              ? <Wifi size={18} className="text-emerald-400" />
              : <WifiOff size={18} className="text-slate-500" />
            }
          </div>
          <div>
            <p className="font-semibold text-white capitalize">{bridge.clientId}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${bridge.connected ? 'bg-emerald-400 animate-pulse' : bridge.hasQr ? 'bg-amber-400' : 'bg-slate-600'}`} />
              <span className={`text-xs ${bridge.connected ? 'text-emerald-400' : bridge.hasQr ? 'text-amber-400' : 'text-slate-500'}`}>
                {bridge.connected ? 'Conectado' : bridge.hasQr ? 'Esperando escaneo' : 'Bridge offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={11} />
            {timeAgo(bridge.updatedAt)}
          </div>
          {bridge.hasQr && !bridge.connected && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors text-xs font-medium"
            >
              <QrCode size={13} />
              {expanded ? 'Ocultar' : 'Ver QR'}
            </button>
          )}
        </div>
      </div>

      {/* QR Panel */}
      {expanded && bridge.qrDataUrl && (
        <div className="border-t border-white/10 p-5 flex flex-col items-center gap-4 bg-black/20">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 max-w-xs text-center">
            <strong>⚠ Usa el escáner de WhatsApp</strong>, no la cámara del celular.
          </div>
          <img
            src={bridge.qrDataUrl}
            alt={`QR ${bridge.clientId}`}
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl bg-white p-2"
          />
          <div className="text-center text-xs text-slate-400 space-y-1">
            <p>1. Abre WhatsApp → Menú → <strong className="text-slate-300">Dispositivos vinculados</strong></p>
            <p>2. Toca <strong className="text-slate-300">Vincular dispositivo</strong></p>
            <p>3. Escanea con el escáner de WhatsApp</p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mt-1"
          >
            <RefreshCw size={12} />
            Actualizar QR
          </button>
        </div>
      )}

      {/* Connected banner */}
      {bridge.connected && (
        <div className="border-t border-emerald-500/20 px-5 py-3 bg-emerald-500/5">
          <p className="text-xs text-emerald-400">✓ Bridge activo — mensajes entrando al chatbot</p>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppDashboardPage() {
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setBridges(data.bridges ?? []);
        setError(null);
      } else {
        setError('No se pudo cargar el estado de los bridges');
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const connectedCount = bridges.filter((b) => b.connected).length;
  const pendingCount   = bridges.filter((b) => !b.connected && b.hasQr).length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-5 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Dashboard</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm">WhatsApp</span>
          </div>
          <h1 className="text-2xl font-bold">WhatsApp Bridges</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {bridges.length} bridge{bridges.length !== 1 ? 's' : ''} · actualizado {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white transition-colors text-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Status pills */}
      {bridges.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <Wifi size={12} />{connectedCount} conectado{connectedCount !== 1 ? 's' : ''}
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <QrCode size={12} />{pendingCount} esperando escaneo
            </div>
          )}
          <div className="px-3 py-1.5 rounded-full bg-slate-700/30 border border-white/10 text-xs text-slate-500">
            Auto-refresh 30s
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 text-sm mb-6">{error}</div>
      )}

      {loading && bridges.length === 0 && (
        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Cargando bridges…</div>
      )}

      {!loading && bridges.length === 0 && !error && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <WifiOff size={32} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-300 font-medium mb-2">No hay bridges registrados</p>
          <p className="text-slate-500 text-sm mb-4">Ejecuta el bridge para que aparezca aquí:</p>
          <code className="inline-block bg-black/40 px-3 py-2 rounded-lg text-sm text-slate-300 font-mono">npm run whatsapp</code>
          <p className="text-slate-600 text-xs mt-3">
            Configura <code className="text-slate-500">AGENTIA_WHATSAPP_CLIENT_ID</code> en .env para identificar este bridge.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {bridges.map((bridge) => (
          <BridgeCard key={bridge.clientId} bridge={bridge} onRefresh={load} />
        ))}
      </div>

      {bridges.length > 0 && (
        <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-500">
          <p className="font-medium text-slate-400 mb-1">Agregar otro bridge</p>
          <p>Configura <code className="text-slate-400">AGENTIA_WHATSAPP_CLIENT_ID=nombre-cliente</code> en el proceso nuevo y ejecuta <code className="text-slate-400">npm run whatsapp</code>.</p>
        </div>
      )}
    </div>
  );
}
