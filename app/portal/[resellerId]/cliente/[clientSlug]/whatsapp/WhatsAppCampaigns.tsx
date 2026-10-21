'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Template = { name: string; status: string; category: string; language: string; bodyText: string; variables: number; rejectedReason?: string };
type Campaign = { id: string; name: string; templateName: string; status: string; total: number; pending: number; sent: number; failed: number };
type Usage = { month: string; byCategory: Array<{ category: string; messages: number; billable: number }>; byStatus: Record<string, number> };

const card = 'rounded-xl border border-zinc-800 bg-zinc-900 p-4';
const input = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100';
const btn = 'rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50';

export default function WhatsAppCampaigns({ resellerId, clientSlug, clientName }: { resellerId: string; clientSlug: string; clientName: string }) {
  const base = `/api/portal/${resellerId}/client/${clientSlug}/whatsapp`;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [notice, setNotice] = useState('');

  // Plantilla nueva
  const [tName, setTName] = useState('');
  const [tCategory, setTCategory] = useState<'MARKETING' | 'UTILITY'>('MARKETING');
  const [tBody, setTBody] = useState('');
  const [tExamples, setTExamples] = useState('');
  const [tBusy, setTBusy] = useState(false);

  // Campaña nueva
  const [cName, setCName] = useState('');
  const [cTemplate, setCTemplate] = useState('');
  const [cContacts, setCContacts] = useState('');
  const [cOptIn, setCOptIn] = useState(false);
  const [cBusy, setCBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const load = useCallback(async () => {
    const [t, c, u] = await Promise.all([
      fetch(`${base}/templates`, { cache: 'no-store' }),
      fetch(`${base}/campaigns`, { cache: 'no-store' }),
      fetch(`${base}/usage`, { cache: 'no-store' }),
    ]);
    const tj = (await t.json().catch(() => ({}))) as { templates?: Template[]; error?: string };
    if (t.ok) setTemplates(tj.templates ?? []);
    else setNotice(tj.error || 'No se pudieron leer las plantillas');
    const cj = (await c.json().catch(() => ({}))) as { campaigns?: Campaign[] };
    if (c.ok) setCampaigns(cj.campaigns ?? []);
    const uj = (await u.json().catch(() => ({}))) as Usage;
    if (u.ok) setUsage(uj);
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTemplate() {
    setTBusy(true);
    setNotice('');
    const res = await fetch(`${base}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tName,
        category: tCategory,
        language: 'es_MX',
        bodyText: tBody,
        examples: tExamples.split('|').map((s) => s.trim()).filter(Boolean),
      }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setTBusy(false);
    if (!res.ok) return setNotice(j.error || 'No se pudo crear la plantilla');
    setNotice('Plantilla enviada a Meta. Queda pendiente hasta que la aprueben.');
    setTName('');
    setTBody('');
    setTExamples('');
    await load();
  }

  async function launchCampaign() {
    setCBusy(true);
    setNotice('');
    setProgress('');
    const recipients = cContacts
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [phone, ...params] = l.split(',').map((s) => s.trim());
        return { phone, params };
      });
    const created = await fetch(`${base}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cName, templateName: cTemplate, optInConfirmed: cOptIn, recipients }),
    });
    const cj = (await created.json().catch(() => ({}))) as { error?: string; campaignId?: string; total?: number; skipped?: number };
    if (!created.ok || !cj.campaignId) {
      setCBusy(false);
      return setNotice(cj.error || 'No se pudo crear la campaña');
    }
    if (cj.skipped) setNotice(`${cj.skipped} contacto(s) omitidos por número inválido o repetido.`);
    await runLoop(cj.campaignId, false);
    setCBusy(false);
    setCName('');
    setCContacts('');
    setCOptIn(false);
    await load();
  }

  async function runLoop(id: string, resume: boolean) {
    for (let i = 0; i < 200; i++) {
      const res = await fetch(`${base}/campaigns/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; status?: string; sent?: number; failed?: number; pending?: number; lastError?: string };
      if (!res.ok) {
        setNotice(j.error || 'Error al enviar');
        return;
      }
      setProgress(`Enviados ${j.sent ?? 0} · fallidos ${j.failed ?? 0} · pendientes ${j.pending ?? 0}`);
      if (j.status === 'paused') {
        setNotice(`Campaña pausada: Meta limitó los envíos. ${j.lastError ?? ''}`);
        return;
      }
      if (j.status === 'done') return;
    }
  }

  const approved = templates.filter((t) => t.status === 'APPROVED');
  const selected = templates.find((t) => t.name === cTemplate);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">WhatsApp · {clientName}</h1>
          <Link href={`/portal/${resellerId}/cliente/${clientSlug}`} className="text-xs text-zinc-400 underline">
            Volver a leads
          </Link>
        </div>
        {notice ? <p className="rounded-lg bg-zinc-800 p-3 text-sm">{notice}</p> : null}

        <section className={card}>
          <h2 className="text-sm font-semibold">Plantillas</h2>
          <p className="mt-1 text-xs text-zinc-400">Solo se pueden enviar las aprobadas por Meta. Usa {'{{1}}'}, {'{{2}}'} para datos del contacto.</p>
          <ul className="mt-3 space-y-2">
            {templates.length === 0 ? <li className="text-xs text-zinc-500">Sin plantillas todavía.</li> : null}
            {templates.map((t) => (
              <li key={`${t.name}-${t.language}`} className="rounded-lg bg-zinc-950 p-3 text-xs">
                <span className="font-semibold">{t.name}</span> · {t.category} · {t.language} ·{' '}
                <span className={t.status === 'APPROVED' ? 'text-green-400' : t.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}>{t.status}</span>
                <p className="mt-1 text-zinc-400">{t.bodyText}</p>
                {t.rejectedReason ? <p className="mt-1 text-red-400">Motivo: {t.rejectedReason}</p> : null}
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
            <p className="text-xs font-semibold">Nueva plantilla</p>
            <input className={input} placeholder="nombre_en_minusculas" value={tName} onChange={(e) => setTName(e.target.value)} />
            <select className={input} value={tCategory} onChange={(e) => setTCategory(e.target.value as 'MARKETING' | 'UTILITY')}>
              <option value="MARKETING">Marketing (promociones)</option>
              <option value="UTILITY">Utilidad (avisos sobre algo que el cliente pidió)</option>
            </select>
            <textarea className={input} rows={3} placeholder="Hola {{1}}, gracias por tu interés en…" value={tBody} onChange={(e) => setTBody(e.target.value)} />
            <input className={input} placeholder="Ejemplos de las variables separados por | (p. ej. Ana | Seguro de vida)" value={tExamples} onChange={(e) => setTExamples(e.target.value)} />
            <button className={btn} disabled={tBusy || !tName || !tBody} onClick={() => void createTemplate()}>
              {tBusy ? 'Enviando…' : 'Enviar a Meta para aprobación'}
            </button>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold">Nueva campaña</h2>
          <div className="mt-3 space-y-2">
            <input className={input} placeholder="Nombre de la campaña" value={cName} onChange={(e) => setCName(e.target.value)} />
            <select className={input} value={cTemplate} onChange={(e) => setCTemplate(e.target.value)}>
              <option value="">Elige una plantilla aprobada…</option>
              {approved.map((t) => (
                <option key={`${t.name}-${t.language}`} value={t.name}>{t.name} ({t.variables} variable{t.variables === 1 ? '' : 's'})</option>
              ))}
            </select>
            <textarea
              className={input}
              rows={6}
              placeholder={'Un contacto por línea: número con código de país, y luego las variables separadas por coma\n5491112345678, Ana, Seguro de vida'}
              value={cContacts}
              onChange={(e) => setCContacts(e.target.value)}
            />
            {selected ? <p className="text-xs text-zinc-400">Cada línea necesita {selected.variables} variable(s) después del número.</p> : null}
            <label className="flex items-start gap-2 text-xs text-zinc-300">
              <input type="checkbox" className="mt-0.5" checked={cOptIn} onChange={(e) => setCOptIn(e.target.checked)} />
              Confirmo que todos estos contactos aceptaron recibir mensajes de este negocio. Escribir a contactos que no lo pidieron baja la calidad del número y puede bloquearlo.
            </label>
            <button className={btn} disabled={cBusy || !cName || !cTemplate || !cContacts.trim() || !cOptIn} onClick={() => void launchCampaign()}>
              {cBusy ? 'Enviando…' : 'Crear y enviar'}
            </button>
            {progress ? <p className="text-xs text-zinc-300">{progress}</p> : null}
            {cBusy ? <p className="text-xs text-zinc-500">No cierres esta página mientras se envía.</p> : null}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold">Campañas</h2>
          <ul className="mt-3 space-y-2">
            {campaigns.length === 0 ? <li className="text-xs text-zinc-500">Aún no hay campañas.</li> : null}
            {campaigns.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-950 p-3 text-xs">
                <span>
                  <span className="font-semibold">{c.name}</span> · {c.templateName}
                  <br />
                  <span className="text-zinc-400">{c.status} · {c.sent}/{c.total} enviados · {c.failed} fallidos · {c.pending} pendientes</span>
                </span>
                {c.pending > 0 ? (
                  <button className={btn} disabled={cBusy} onClick={async () => { setCBusy(true); await runLoop(c.id, true); setCBusy(false); await load(); }}>
                    {c.status === 'paused' ? 'Reanudar' : 'Continuar'}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold">Consumo de {usage?.month ?? 'este mes'}</h2>
          <p className="mt-1 text-xs text-zinc-400">Conteo de mensajes salientes según lo que reporta Meta. El costo exacto es el de tu factura de Meta.</p>
          <ul className="mt-2 space-y-1 text-xs">
            {(usage?.byCategory ?? []).map((r) => (
              <li key={r.category}>{r.category}: {r.messages} mensajes ({r.billable} cobrables)</li>
            ))}
            {usage && usage.byCategory.length === 0 ? <li className="text-zinc-500">Sin mensajes este mes.</li> : null}
          </ul>
          {usage && Object.keys(usage.byStatus).length ? (
            <p className="mt-2 text-xs text-zinc-400">
              Estados: {Object.entries(usage.byStatus).map(([k, v]) => `${k} ${v}`).join(' · ')}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
