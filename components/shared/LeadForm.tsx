'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function LeadForm({
  product,
  roiSnapshot,
}: {
  product: string;
  roiSnapshot?: Record<string, unknown>;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [values, setValues] = useState({
    nombre: '',
    negocio: '',
    whatsapp: '',
    email: '',
    website: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/diagnostico-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: values.nombre,
          negocio: values.negocio,
          whatsapp: values.whatsapp,
          email: values.email,
          website: values.website,
          producto: product,
          roi: roiSnapshot ?? null,
          origen: 'landing',
          url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('sent');
      setValues({ nombre: '', negocio: '', whatsapp: '', email: '', website: '' });
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:p-8">
        <p className="font-[family-name:var(--font-space)] text-xl font-bold">Listo, ya lo recibimos</p>
        <p className="mt-2 text-white/55">Te contactamos por WhatsApp en las próximas horas.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:p-8"
    >
      <p className="font-[family-name:var(--font-space)] text-xl font-bold">Diagnóstico gratis</p>
      <p className="mt-1 text-sm text-white/50">Sin compromiso. Te decimos qué automatizar primero.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-[12px] text-white/55" htmlFor={`nombre-${product}`}>
            Nombre
          </label>
          <input
            id={`nombre-${product}`}
            className="w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-[border-color] duration-[160ms] placeholder:text-white/30 focus:border-[#00D4FF]"
            required
            autoComplete="name"
            value={values.nombre}
            onChange={(e) => setValues({ ...values, nombre: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[12px] text-white/55" htmlFor={`negocio-${product}`}>
            Nombre del negocio
          </label>
          <input
            id={`negocio-${product}`}
            className="w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-[border-color] duration-[160ms] placeholder:text-white/30 focus:border-[#00D4FF]"
            required
            autoComplete="organization"
            value={values.negocio}
            onChange={(e) => setValues({ ...values, negocio: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[12px] text-white/55" htmlFor={`whatsapp-${product}`}>
            WhatsApp
          </label>
          <input
            id={`whatsapp-${product}`}
            className="w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-[border-color] duration-[160ms] placeholder:text-white/30 focus:border-[#00D4FF]"
            type="tel"
            required
            autoComplete="tel"
            placeholder="9991234567"
            value={values.whatsapp}
            onChange={(e) => setValues({ ...values, whatsapp: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[12px] text-white/55" htmlFor={`email-${product}`}>
            Correo (opcional)
          </label>
          <input
            id={`email-${product}`}
            className="w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-[border-color] duration-[160ms] placeholder:text-white/30 focus:border-[#00D4FF]"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </div>
      </div>

      <div className="hidden" aria-hidden>
        <label htmlFor={`website-${product}`}>Sitio web</label>
        <input
          id={`website-${product}`}
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => setValues({ ...values, website: e.target.value })}
        />
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded-full bg-[#00D4FF] px-6 py-3.5 text-sm font-bold text-[#0a0a0a] transition-[transform,box-shadow] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:shadow-[0_0_28px_rgba(0,212,255,0.4)] active:scale-[0.97] disabled:opacity-60"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Enviando...' : 'Quiero mi diagnóstico gratis'}
      </button>
      {status === 'error' ? (
        <p className="mt-2.5 text-[13px] text-red-300">
          No se pudo enviar. Intenta de nuevo o escríbenos por WhatsApp.
        </p>
      ) : null}
    </form>
  );
}
