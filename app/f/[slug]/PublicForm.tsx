'use client';

import { useEffect, useState } from 'react';

type Field = { id: string; label: string; type: string; required: boolean; options?: string[] };
type FormDef = { title: string; description: string; fields: Field[]; submitText: string; clientName: string };

const input = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900';

export default function PublicForm({ slug }: { slug: string }) {
  const [form, setForm] = useState<FormDef | null>(null);
  const [missing, setMissing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ thankYouText: string; whatsappUrl: string } | null>(null);

  useEffect(() => {
    fetch(`/api/public/forms/${slug}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return setMissing(true);
        setForm((await r.json()) as FormDef);
      })
      .catch(() => setMissing(true));
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/public/forms/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, website: trap }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; thankYouText?: string; whatsappUrl?: string };
      if (!res.ok) return setError(j.error || 'No se pudo enviar. Intenta de nuevo.');
      if (j.whatsappUrl) setDone({ thankYouText: j.thankYouText ?? '', whatsappUrl: j.whatsappUrl });
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow-sm">{children}</div>
    </main>
  );

  if (missing) return shell(<p className="text-center text-zinc-700">Este formulario no está disponible.</p>);
  if (!form) return shell(<p className="text-center text-zinc-500">Cargando…</p>);

  if (done) {
    return shell(
      <div className="space-y-4 text-center">
        <p className="text-lg font-semibold text-zinc-900">¡Listo!</p>
        <p className="text-zinc-700">{done.thankYouText}</p>
        <a href={done.whatsappUrl} className="block rounded-xl bg-green-600 px-4 py-3 text-base font-semibold text-white">
          Abrir WhatsApp
        </a>
      </div>,
    );
  }

  return shell(
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">{form.title}</h1>
        {form.description ? <p className="mt-1 text-sm text-zinc-600">{form.description}</p> : null}
      </div>
      {form.fields.map((f) => (
        <label key={f.id} className="block text-sm font-medium text-zinc-800">
          {f.label}
          {f.required ? <span className="text-red-600"> *</span> : null}
          <div className="mt-1">
            {f.type === 'longtext' ? (
              <textarea className={input} rows={3} required={f.required} value={answers[f.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })} />
            ) : f.type === 'select' ? (
              <select className={input} required={f.required} value={answers[f.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}>
                <option value="">Selecciona…</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                className={input}
                required={f.required}
                type={f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : f.type === 'phone' ? 'tel' : 'text'}
                inputMode={f.type === 'phone' ? 'tel' : undefined}
                autoComplete={f.type === 'name' ? 'name' : f.type === 'phone' ? 'tel' : f.type === 'email' ? 'email' : 'off'}
                value={answers[f.id] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
              />
            )}
          </div>
        </label>
      ))}
      {/* Campo trampa para bots, oculto a las personas */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }}
        name="website"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-green-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-60">
        {busy ? 'Enviando…' : form.submitText}
      </button>
    </form>,
  );
}
