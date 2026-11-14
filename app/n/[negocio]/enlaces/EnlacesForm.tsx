'use client';

import { useEffect, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';

const CAMPOS: { k: string; label: string; ph: string }[] = [
  { k: 'menuUrl', label: 'Link de tu menú', ph: 'https://...' },
  { k: 'mapsUrl', label: 'Link de ubicación (Google Maps)', ph: 'https://maps.app.goo.gl/...' },
  { k: 'whatsapp', label: 'WhatsApp de tu negocio (10 dígitos)', ph: '9991234567' },
  { k: 'instagram', label: 'Instagram', ph: '@tunegocio' },
  { k: 'facebook', label: 'Facebook', ph: 'https://facebook.com/...' },
  { k: 'tiktok', label: 'TikTok', ph: '@tunegocio' },
  { k: 'web', label: 'Sitio web', ph: 'https://...' },
];

export function EnlacesForm({ tenantId }: { tenantId: string }) {
  const [v, setV] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    setLink(`${window.location.origin}/l/${tenantId}`);
    fetch(`/api/loyalty/${tenantId}/enlaces`)
      .then((r) => r.json())
      .then((j) => setV(j.enlaces ?? {}))
      .catch(() => {});
  }, [tenantId]);

  async function guardar() {
    setEstado('Guardando…');
    try {
      const r = await fetch(`/api/loyalty/${tenantId}/enlaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Error');
      setV(j.enlaces);
      setEstado('✅ Guardado');
    } catch (e) {
      setEstado(e instanceof Error ? e.message : 'No se pudo guardar');
    }
  }

  const input =
    'w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/40';
  const label = 'mb-1 block text-[11px] font-semibold uppercase tracking-widest text-white/50';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Tu link para redes</h1>
        <p className="mt-1 text-sm text-white/55">
          Una sola página con tu tarjeta de lealtad, menú, ubicación y redes. Ponla en la bio de Instagram, Facebook o TikTok.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="break-all text-sm font-semibold">{link}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* */ }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-white/80"
          >
            <Copy className="h-3.5 w-3.5" /> {copiado ? '¡Copiado!' : 'Copiar link'}
          </button>
          <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-white/80">
            <ExternalLink className="h-3.5 w-3.5" /> Ver cómo se ve
          </a>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div>
          <label className={label}>Descripción corta</label>
          <input className={input} maxLength={160} value={v.descripcion ?? ''} placeholder="Ej. Comida tradicional en Mérida" onChange={(e) => setV({ ...v, descripcion: e.target.value })} />
        </div>
        {CAMPOS.map((c) => (
          <div key={c.k}>
            <label className={label}>{c.label}</label>
            <input className={input} value={v[c.k] ?? ''} placeholder={c.ph} onChange={(e) => setV({ ...v, [c.k]: e.target.value })} />
          </div>
        ))}
        <p className="text-xs text-white/45">Lo que dejes vacío no aparece en tu página. El botón de tu tarjeta de lealtad siempre aparece.</p>
        <button type="button" onClick={() => void guardar()} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-black">
          Guardar
        </button>
        {estado ? <p className="text-center text-sm text-white/70">{estado}</p> : null}
      </div>
    </div>
  );
}
