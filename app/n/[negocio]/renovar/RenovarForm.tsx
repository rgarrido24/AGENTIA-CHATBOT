'use client';

import { useState } from 'react';
import { calcularTotal, type MetodoPago, type Periodo } from '@/lib/lealtad-pricing';

export function RenovarForm({
  negocio,
  nombre,
  sucursales,
  enPrueba,
  vigenteHasta,
}: {
  negocio: string;
  nombre: string;
  sucursales: number;
  enPrueba: boolean;
  vigenteHasta: string | null;
}) {
  const [periodo, setPeriodo] = useState<Periodo>('mensual');
  const [pago, setPago] = useState<MetodoPago>('SPEI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const precio = calcularTotal(periodo, sucursales, pago);
  const vencida = vigenteHasta ? new Date(vigenteHasta) < new Date() : false;

  async function pagar() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lealtad/renovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocio, periodo, pago, sucursales }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || 'No pudimos crear el pago. Intenta de nuevo o escríbenos por WhatsApp.');
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  const box = 'w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white outline-none';
  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-2xl font-bold">{enPrueba ? 'Contrata tu tarjeta' : 'Renueva tu suscripción'}</h1>
      <p className="mt-2 text-white/70">
        {nombre} · {vencida ? 'tu periodo terminó y la tarjeta está en pausa.' : 'tu tarjeta sigue activa hasta que termine tu periodo.'} Tus clientes y puntos siguen guardados.
      </p>

      <label className="mt-6 block text-sm text-white/70">Periodo</label>
      <select className={box} value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
        <option value="mensual" className="text-black">Mensual — $399 (+$150 por sucursal adicional)</option>
        <option value="anual" className="text-black">Anual — $3,990 (paga 10, usa 12)</option>
      </select>

      <label className="mt-4 block text-sm text-white/70">Forma de pago</label>
      <select className={box} value={pago} onChange={(e) => setPago(e.target.value as MetodoPago)}>
        <option value="SPEI" className="text-black">Transferencia SPEI — sin comisión</option>
        <option value="OXXO" className="text-black">Efectivo en OXXO — sin comisión</option>
        <option value="Mercado Pago" className="text-black">Tarjeta (Mercado Pago) — +5%</option>
      </select>

      <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
        <span className="text-white/70">{sucursales} sucursal(es) · IVA incluido</span>
        <span className="text-3xl font-extrabold">${precio.total.toLocaleString('es-MX')}</span>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button
        onClick={pagar}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-60"
      >
        {loading ? 'Creando tu pago…' : 'Pagar y reactivar'}
      </button>
      <p className="mt-3 text-center text-xs text-white/50">En cuanto se confirme el pago, tu tarjeta se reactiva sola.</p>
    </div>
  );
}
