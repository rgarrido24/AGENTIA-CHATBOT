'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Printer } from 'lucide-react';
import { useLoyaltyTenant } from '@/components/loyalty/tenant-context';

export function BannerTenant({ tenantId }: { tenantId: string }) {
  const tenant = useLoyaltyTenant(tenantId);
  const primary = tenant?.colorPrimario ?? '#1E2340';
  const accent = tenant?.colorAcento ?? '#F2C14E';
  const nombre = tenant?.nombre ?? '';

  const [titulo, setTitulo] = useState('Acumula puntos en cada compra');
  const [beneficio, setBeneficio] = useState('Tu tarjeta digital en el celular. Sin apps, sin plásticos.');
  const [promo, setPromo] = useState('');
  const [url, setUrl] = useState('');
  const [qr, setQr] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    setUrl(`${window.location.origin}${tenant?.basePath ?? `/n/${tenantId}`}/alta`);
  }, [tenantId, tenant?.basePath]);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 600, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sin portapapeles */
    }
  }

  if (!tenant) return null;
  const input =
    'w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/40';
  const label = 'mb-1 block text-[11px] font-semibold uppercase tracking-widest text-white/50';

  return (
    <div className="flex flex-col gap-6">
      <style>{`@media print{body *{visibility:hidden}#banner-print,#banner-print *{visibility:visible}#banner-print{position:fixed;left:0;top:0;width:100%}@page{margin:10mm}}`}</style>

      <div className="print:hidden">
        <h1 className="text-xl font-bold">Banner de tu tarjeta de lealtad</h1>
        <p className="mt-1 text-sm text-white/55">
          Imprímelo y ponlo en tu mostrador. Tus clientes escanean el QR, se registran solos y se llevan su tarjeta al celular.
        </p>
      </div>

      <div
        id="banner-print"
        className="overflow-hidden rounded-2xl border border-white/10"
        style={{ background: `linear-gradient(135deg, ${primary}, #000000 160%)` }}
      >
        <div className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex items-center gap-3">
              {tenant.logoUrl && logoOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logoUrl}
                  alt=""
                  className="h-14 w-14 rounded-xl bg-white object-contain p-1"
                  onError={() => setLogoOk(false)}
                />
              ) : null}
              <p className="text-2xl font-black leading-none text-white">{nombre}</p>
            </div>
            <h2 className="text-3xl font-black leading-tight text-white" style={{ textWrap: 'balance' } as React.CSSProperties}>
              {titulo}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{beneficio}</p>
            {promo.trim() ? (
              <div
                className="mt-5 inline-block rounded-xl px-4 py-2.5 text-sm font-bold"
                style={{ background: accent, color: '#111' }}
              >
                {promo}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="rounded-2xl bg-white p-3">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="QR de registro" className="h-40 w-40" />
              ) : (
                <div className="h-40 w-40" />
              )}
            </div>
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-white/70">
              Escanea y obtén
              <br />
              tu tarjeta gratis
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 bg-white/[0.04] px-8 py-3 text-xs text-white/60">
          <span>1. Escanea el QR</span>
          <span>2. Escribe tu nombre y celular</span>
          <span>3. Guarda tu tarjeta en Google Wallet</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: accent, color: '#111' }}
        >
          <Printer className="h-4 w-4" /> Imprimir / guardar PDF
        </button>
        <a
          href={`/api/loyalty/${tenantId}/alta-qr`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 hover:border-white/30"
        >
          <Download className="h-4 w-4" /> Descargar solo el QR
        </a>
        <button
          type="button"
          onClick={() => void copiar()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 hover:border-white/30"
        >
          <Copy className="h-4 w-4" /> {copiado ? '¡Copiado!' : 'Copiar link de registro'}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 print:hidden">
        <h2 className="mb-4 text-sm font-bold">Personalizar texto</h2>
        <div className="grid gap-4">
          <div>
            <label className={label}>Título</label>
            <input className={input} value={titulo} maxLength={60} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className={label}>Beneficio</label>
            <input className={input} value={beneficio} maxLength={110} onChange={(e) => setBeneficio(e.target.value)} />
          </div>
          <div>
            <label className={label}>Promo de bienvenida (opcional)</label>
            <input
              className={input}
              value={promo}
              maxLength={50}
              placeholder="Ej. Tu primer café gratis al registrarte"
              onChange={(e) => setPromo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/70 print:hidden">
        <p className="mb-2 font-bold text-white">¿Cómo se registran tus clientes?</p>
        <p>
          <strong className="text-white">Solos:</strong> escanean el QR (o abren tu link), ponen nombre y celular y agregan la tarjeta a Google Wallet.
        </p>
        <p className="mt-1.5">
          <strong className="text-white">Tú los registras:</strong> en Caja capturas su celular y nombre al hacer la primera venta.
        </p>
        <p className="mt-3 break-all text-xs text-white/45">Tu link: {url}</p>
        <p className="mt-2 text-xs text-white/45">
          Para Instagram, Facebook y TikTok usa tu <a className="underline" href={`/n/${tenantId}/enlaces`}>link para redes</a>.
        </p>
      </div>
    </div>
  );
}
