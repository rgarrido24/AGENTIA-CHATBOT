'use client';

import { useEffect, useMemo, useState } from 'react';

type BriefQuestion = {
  id: string;
  step: 1 | 2 | 3 | 4;
  label: string;
  type: 'text' | 'textarea' | 'yesno' | 'number' | 'url';
  placeholder?: string;
};

type ApiDoc = {
  token: string;
  resellerId: string;
  questions: BriefQuestion[];
  completedAt: string | null;
};

const ACCENT = '#CCFF00';

function StepPill({ n, active }: { n: number; active: boolean }) {
  return (
    <div
      className="px-3 py-1 rounded-full text-xs font-bold border"
      style={{
        background: active ? ACCENT : '#ffffff',
        color: active ? '#000' : '#0f172a',
        borderColor: 'rgba(15,23,42,0.12)',
      }}
    >
      Paso {n}
    </div>
  );
}

function yesNoLabel(v: string) {
  const s = String(v || '').toLowerCase();
  if (s === 'sí' || s === 'si') return 'Sí';
  if (s === 'no') return 'No';
  return '—';
}

export default function BriefPublicForm({ token }: { token: string }) {
  const [doc, setDoc] = useState<ApiDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ score: number; recommendation: string } | null>(null);

  const [client, setClient] = useState({
    contacto_nombre: '',
    contacto_whatsapp: '',
    contacto_email: '',
    negocio_nombre: '',
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/brief/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as Partial<ApiDoc> & { error?: string };
        if (!r.ok) throw new Error(data.error || 'No se pudo cargar el brief');
        setDoc(data as ApiDoc);
        if (data.completedAt) {
          // ya completado, el POST devolverá el resultado guardado
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [token]);

  const steps = useMemo(() => {
    const qs = doc?.questions ?? [];
    const m = new Map<1 | 2 | 3 | 4, BriefQuestion[]>();
    m.set(1, []); m.set(2, []); m.set(3, []); m.set(4, []);
    for (const q of qs) m.get(q.step)!.push(q);
    return m;
  }, [doc]);

  const current = steps.get(step) ?? [];

  function setValue(id: string, value: string) {
    setAnswers((p) => ({ ...p, [id]: value }));
  }

  function canNext() {
    // Permisivo: no bloquea por campos vacíos, solo evita token inválido
    return true;
  }

  async function submit() {
    if (!doc) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/brief/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          answers,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error enviando brief');
      setDone({ score: Number(data.score || 0), recommendation: String(data.recommendation || '') });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-3xl border shadow-sm p-6 sm:p-8" style={{ background: '#fff', borderColor: 'rgba(15,23,42,0.08)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold" style={{ color: '#64748b' }}>Brief Digital</p>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
                Contanos sobre tu negocio
              </h1>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                Te toma 3–5 minutos. Al finalizar recibirás una recomendación inicial.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2">
              <div className="rounded-2xl px-3 py-2 text-xs font-bold" style={{ background: ACCENT, color: '#000' }}>
                {step}/4
              </div>
            </div>
          </div>

          {loading && <p className="mt-6 text-sm" style={{ color: '#64748b' }}>Cargando…</p>}
          {error && <p className="mt-6 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

          {!loading && doc && !done && (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                <StepPill n={1} active={step === 1} />
                <StepPill n={2} active={step === 2} />
                <StepPill n={3} active={step === 3} />
                <StepPill n={4} active={step === 4} />
              </div>

              {step === 1 && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold" style={{ color: '#475569' }}>Nombre del negocio</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      style={{ borderColor: '#cbd5e1', background: '#fff', color: '#0f172a' }}
                      value={client.negocio_nombre}
                      onChange={(e) => setClient((p) => ({ ...p, negocio_nombre: e.target.value }))}
                      placeholder="Ej: Mi negocio"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: '#475569' }}>Tu nombre</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      style={{ borderColor: '#cbd5e1', background: '#fff', color: '#0f172a' }}
                      value={client.contacto_nombre}
                      onChange={(e) => setClient((p) => ({ ...p, contacto_nombre: e.target.value }))}
                      placeholder="Nombre y apellido"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: '#475569' }}>WhatsApp</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      style={{ borderColor: '#cbd5e1', background: '#fff', color: '#0f172a' }}
                      value={client.contacto_whatsapp}
                      onChange={(e) => setClient((p) => ({ ...p, contacto_whatsapp: e.target.value }))}
                      placeholder="+52..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold" style={{ color: '#475569' }}>Email</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      style={{ borderColor: '#cbd5e1', background: '#fff', color: '#0f172a' }}
                      value={client.contacto_email}
                      onChange={(e) => setClient((p) => ({ ...p, contacto_email: e.target.value }))}
                      placeholder="email@empresa.com"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {current.map((q) => (
                  <div key={q.id}>
                    <label className="text-xs font-semibold" style={{ color: '#475569' }}>{q.label}</label>
                    {q.type === 'textarea' ? (
                      <textarea
                        className="mt-1 w-full min-h-[88px] rounded-xl border px-3 py-2 text-sm"
                        style={{ borderColor: '#cbd5e1', background: '#fff', color: '#0f172a' }}
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setValue(q.id, e.target.value)}
                        placeholder={q.placeholder || ''}
                      />
                    ) : q.type === 'yesno' ? (
                      <div className="mt-2 flex items-center gap-2">
                        {['Sí', 'No'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setValue(q.id, opt)}
                            className="rounded-xl border px-4 py-2 text-xs font-bold"
                            style={{
                              background: (answers[q.id] || '') === opt ? ACCENT : '#fff',
                              color: '#000',
                              borderColor: 'rgba(15,23,42,0.12)',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                        <span className="text-xs" style={{ color: '#64748b' }}>
                          Seleccionado: {yesNoLabel(answers[q.id] ?? '')}
                        </span>
                      </div>
                    ) : (
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        style={{ borderColor: '#cbd5e1', background: '#fff', color: '#0f172a' }}
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setValue(q.id, e.target.value)}
                        placeholder={q.placeholder || ''}
                        inputMode={q.type === 'number' ? 'numeric' : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as any)))}
                  disabled={step === 1 || submitting}
                  className="rounded-xl border px-4 py-2 text-xs font-bold disabled:opacity-40"
                  style={{ background: '#fff', borderColor: '#cbd5e1', color: '#0f172a' }}
                >
                  Volver
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => canNext() && setStep((s) => ((s + 1) as any))}
                    disabled={submitting}
                    className="rounded-xl px-5 py-2.5 text-xs font-bold"
                    style={{ background: ACCENT, color: '#000' }}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50"
                    style={{ background: ACCENT, color: '#000' }}
                  >
                    {submitting ? 'Enviando…' : 'Finalizar'}
                  </button>
                )}
              </div>
            </>
          )}

          {done && (
            <div className="mt-6">
              <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(15,23,42,0.08)', background: '#f8fafc' }}>
                <p className="text-xs font-semibold" style={{ color: '#64748b' }}>Resultado</p>
                <p className="text-3xl font-extrabold mt-1" style={{ color: '#0f766e' }}>{done.score}/100</p>
                <pre className="mt-4 whitespace-pre-wrap text-sm" style={{ color: '#0f172a', fontFamily: 'inherit' }}>
                  {done.recommendation || 'Gracias. Te responderemos a la brevedad.'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

