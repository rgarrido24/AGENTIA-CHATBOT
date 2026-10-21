'use client';

import Link from 'next/link';
import QRCode from 'qrcode';
import { useCallback, useEffect, useState } from 'react';

type FieldType = 'name' | 'phone' | 'email' | 'text' | 'longtext' | 'select' | 'date';
type Field = { id: string; label: string; type: FieldType; required: boolean; options?: string[] };
type FormRow = {
  formId: string;
  publicSlug: string;
  title: string;
  description?: string;
  fields: Field[];
  submitText: string;
  thankYouText: string;
  messageIntro: string;
  whatsappNumber: string;
  active: boolean;
  responses: number;
};

const TYPE_LABELS: Record<FieldType, string> = {
  name: 'Nombre',
  phone: 'Teléfono',
  email: 'Correo',
  text: 'Texto corto',
  longtext: 'Texto largo',
  select: 'Opciones',
  date: 'Fecha',
};

const card = 'rounded-xl border border-zinc-800 bg-zinc-900 p-4';
const input = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100';
const btn = 'rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50';
const btnGhost = 'rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-200';

type Draft = Omit<FormRow, 'responses' | 'formId' | 'publicSlug'> & { formId?: string };

function emptyDraft(number: string): Draft {
  return {
    title: '',
    description: '',
    fields: [
      { id: 'q1', label: 'Nombre', type: 'name', required: true },
      { id: 'q2', label: 'WhatsApp', type: 'phone', required: true },
    ],
    submitText: 'Enviar',
    thankYouText: '¡Gracias! Ahora continúa por WhatsApp para terminar.',
    messageIntro: 'Hola, llené el formulario:',
    whatsappNumber: number,
    active: true,
  };
}

function QrImage({ url }: { url: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 220 }).then(setSrc).catch(() => setSrc(''));
  }, [url]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Código QR del formulario" width={110} height={110} className="rounded bg-white" />
  ) : null;
}

export default function FormsManager({ resellerId, clientSlug, clientName, defaultNumber }: { resellerId: string; clientSlug: string; clientName: string; defaultNumber: string }) {
  const base = `/api/portal/${resellerId}/client/${clientSlug}/forms`;
  const [forms, setForms] = useState<FormRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [origin, setOrigin] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(base, { cache: 'no-store' });
    const j = (await res.json().catch(() => ({}))) as { forms?: FormRow[]; error?: string };
    if (res.ok) setForms(j.forms ?? []);
    else setNotice(j.error || 'No se pudieron leer los formularios');
  }, [base]);

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setNotice('');
    const res = await fetch(draft.formId ? `${base}/${draft.formId}` : base, {
      method: draft.formId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) return setNotice(j.error || 'No se pudo guardar');
    setDraft(null);
    await load();
  }

  async function toggleActive(f: FormRow) {
    await fetch(`${base}/${f.formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, active: !f.active }),
    });
    await load();
  }

  async function remove(f: FormRow) {
    if (!confirm(`¿Eliminar "${f.title}"? Los leads y respuestas ya guardados se conservan, pero el enlace dejará de funcionar.`)) return;
    await fetch(`${base}/${f.formId}`, { method: 'DELETE' });
    await load();
  }

  function setField(i: number, patch: Partial<Field>) {
    if (!draft) return;
    setDraft({ ...draft, fields: draft.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });
  }

  function moveField(i: number, dir: -1 | 1) {
    if (!draft) return;
    const j = i + dir;
    if (j < 0 || j >= draft.fields.length) return;
    const fields = [...draft.fields];
    [fields[i], fields[j]] = [fields[j], fields[i]];
    setDraft({ ...draft, fields });
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Formularios a WhatsApp · {clientName}</h1>
          <Link href={`/portal/${resellerId}/cliente/${clientSlug}`} className="text-xs text-zinc-400 underline">
            Volver a leads
          </Link>
        </div>
        {notice ? <p className="rounded-lg bg-zinc-800 p-3 text-sm">{notice}</p> : null}

        {!draft ? (
          <>
            <button className={btn} onClick={() => setDraft(emptyDraft(defaultNumber))}>
              + Nuevo formulario
            </button>
            {forms.length === 0 ? <p className="text-sm text-zinc-500">Aún no hay formularios para este cliente.</p> : null}
            {forms.map((f) => {
              const url = origin ? `${origin}/f/${f.publicSlug}` : '';
              return (
                <section key={f.formId} className={card}>
                  <div className="flex gap-3">
                    {url ? <QrImage url={url} /> : null}
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">
                        {f.title} {f.active ? null : <span className="text-xs text-yellow-400">(desactivado)</span>}
                      </p>
                      <p className="mt-1 break-all text-xs text-zinc-400">{url}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {f.fields.length} preguntas · {f.responses} respuestas · WhatsApp {f.whatsappNumber}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button className={btnGhost} onClick={() => navigator.clipboard?.writeText(url).then(() => setNotice('Enlace copiado'))}>
                          Copiar enlace
                        </button>
                        <a className={btnGhost} href={url} target="_blank" rel="noreferrer">Abrir</a>
                        <a className={btnGhost} href={`${base}/${f.formId}/responses?format=csv`}>Descargar CSV</a>
                        <button className={btnGhost} onClick={() => setDraft({ ...f })}>Editar</button>
                        <button className={btnGhost} onClick={() => void toggleActive(f)}>{f.active ? 'Desactivar' : 'Activar'}</button>
                        <button className={btnGhost} onClick={() => void remove(f)}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </>
        ) : (
          <section className={`${card} space-y-3`}>
            <h2 className="text-sm font-semibold">{draft.formId ? 'Editar formulario' : 'Nuevo formulario'}</h2>
            <input className={input} placeholder="Título (lo ve la persona)" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <textarea className={input} rows={2} placeholder="Descripción (opcional)" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />

            <p className="text-xs font-semibold text-zinc-300">Preguntas</p>
            {draft.fields.map((f, i) => (
              <div key={f.id + i} className="space-y-2 rounded-lg bg-zinc-950 p-3">
                <input className={input} placeholder="Texto de la pregunta" value={f.label} onChange={(e) => setField(i, { label: e.target.value })} />
                <div className="flex flex-wrap items-center gap-2">
                  <select className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs" value={f.type} onChange={(e) => setField(i, { type: e.target.value as FieldType })}>
                    {(Object.keys(TYPE_LABELS) as FieldType[]).map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} /> Obligatoria
                  </label>
                  <button className={btnGhost} onClick={() => moveField(i, -1)}>↑</button>
                  <button className={btnGhost} onClick={() => moveField(i, 1)}>↓</button>
                  <button className={btnGhost} onClick={() => setDraft({ ...draft, fields: draft.fields.filter((_, idx) => idx !== i) })}>Quitar</button>
                </div>
                {f.type === 'select' ? (
                  <input
                    className={input}
                    placeholder="Opciones separadas por coma (mínimo 2)"
                    value={(f.options ?? []).join(', ')}
                    onChange={(e) => setField(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  />
                ) : null}
              </div>
            ))}
            <button
              className={btnGhost}
              disabled={draft.fields.length >= 20}
              onClick={() => setDraft({ ...draft, fields: [...draft.fields, { id: `q${Date.now().toString(36)}`, label: '', type: 'text', required: false }] })}
            >
              + Agregar pregunta
            </button>

            <p className="pt-2 text-xs font-semibold text-zinc-300">Cuando envían el formulario</p>
            <input className={input} placeholder="WhatsApp del cliente con código de país (ej. 5491112345678)" value={draft.whatsappNumber} onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })} />
            <input className={input} placeholder="Texto del botón de envío" value={draft.submitText} onChange={(e) => setDraft({ ...draft, submitText: e.target.value })} />
            <input className={input} placeholder="Mensaje de agradecimiento" value={draft.thankYouText} onChange={(e) => setDraft({ ...draft, thankYouText: e.target.value })} />
            <input className={input} placeholder="Cómo empieza el mensaje de WhatsApp" value={draft.messageIntro} onChange={(e) => setDraft({ ...draft, messageIntro: e.target.value })} />

            <div className="flex gap-2 pt-2">
              <button className={btn} disabled={busy} onClick={() => void save()}>{busy ? 'Guardando…' : 'Guardar'}</button>
              <button className={btnGhost} onClick={() => setDraft(null)}>Cancelar</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
