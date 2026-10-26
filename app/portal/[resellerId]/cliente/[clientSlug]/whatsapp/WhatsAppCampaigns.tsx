'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeWaPhone } from '@/lib/wa-phone';

type Template = { name: string; status: string; category: string; language: string; bodyText: string; variables: number; rejectedReason?: string };
type Campaign = { id: string; name: string; templateName: string; status: string; total: number; pending: number; sent: number; failed: number };
type Usage = { month: string; byCategory: Array<{ category: string; messages: number; billable: number }>; byStatus: Record<string, number> };

const card = 'rounded-xl border border-zinc-800 bg-zinc-900 p-4';
const input = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100';
const btn = 'rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50';
const btnGhost = 'rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-200 disabled:opacity-50';

export default function WhatsAppCampaigns({ resellerId, clientSlug, clientName, defaultCc }: { resellerId: string; clientSlug: string; clientName: string; defaultCc?: string }) {
  const base = `/api/portal/${resellerId}/client/${clientSlug}/whatsapp`;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [notice, setNotice] = useState('');
  // Mensajes automáticos al llegar un lead
  type Auto = { enabled: boolean; templateName: string; language: string };
  const [autoWelcome, setAutoWelcome] = useState<Auto>({ enabled: false, templateName: '', language: 'es_MX' });
  const [autoAlert, setAutoAlert] = useState<Auto>({ enabled: false, templateName: '', language: 'es_MX' });
  const [autoReply, setAutoReply] = useState<Auto>({ enabled: false, templateName: '', language: 'es_MX' });
  const [autoBusy, setAutoBusy] = useState(false);
  // Tarifa por mensaje (USD) que el usuario captura por categoría, para estimar el gasto. Se guarda solo en este navegador.
  const [rates, setRates] = useState<Record<string, string>>({});
  const ratesKey = `wa_rates_${clientSlug}`;
  const [testPhone, setTestPhone] = useState('');
  const [testBusy, setTestBusy] = useState(false);

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState('');

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
    const sres = await fetch(`${base}/settings`, { cache: 'no-store' });
    const sj = (await sres.json().catch(() => ({}))) as { settings?: { welcome?: Auto; advisorAlert?: Auto; replyAlert?: Auto } };
    if (sres.ok) {
      if (sj.settings?.welcome) setAutoWelcome(sj.settings.welcome);
      if (sj.settings?.advisorAlert) setAutoAlert(sj.settings.advisorAlert);
      if (sj.settings?.replyAlert) setAutoReply(sj.settings.replyAlert);
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ratesKey);
      if (raw) setRates(JSON.parse(raw) as Record<string, string>);
    } catch {
      /* sin almacenamiento: se captura cada vez */
    }
  }, [ratesKey]);

  function setRate(category: string, value: string) {
    const next = { ...rates, [category]: value };
    setRates(next);
    try {
      window.localStorage.setItem(ratesKey, JSON.stringify(next));
    } catch {
      /* no crítico */
    }
  }

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

  async function createDefaults() {
    setAutoBusy(true);
    setNotice('');
    const res = await fetch(`${base}/templates/defaults`, { method: 'POST' });
    const j = (await res.json().catch(() => ({}))) as { error?: string; results?: Array<{ name: string; result: string }> };
    setAutoBusy(false);
    if (!res.ok) return setNotice(j.error || 'No se pudieron crear las plantillas');
    setNotice((j.results ?? []).map((r) => `${r.name}: ${r.result}`).join(' · ') + '. Meta las revisa; cuando estén aprobadas ya puedes activarlas abajo.');
    await load();
  }

  async function sendTest() {
    setTestBusy(true);
    setNotice('');
    const res = await fetch(`${base}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string; results?: Array<{ kind: string; ok: boolean; error?: string; skipped?: string }> };
    setTestBusy(false);
    if (!res.ok) return setNotice(j.error || 'No se pudo hacer la prueba');
    const names: Record<string, string> = { welcome: 'Bienvenida', advisorAlert: 'Aviso de lead nuevo', replyAlert: 'Aviso al contestar' };
    setNotice(
      (j.results ?? []).map((r) => `${names[r.kind] ?? r.kind}: ${r.ok ? 'enviado ✓' : r.skipped ? `omitido (${r.skipped})` : `falló (${r.error})`}`).join(' · '),
    );
  }

  async function saveAuto() {
    setAutoBusy(true);
    setNotice('');
    const payload: Record<string, Auto> = {};
    if (autoWelcome.templateName) payload.welcome = autoWelcome;
    if (autoAlert.templateName) payload.advisorAlert = autoAlert;
    if (autoReply.templateName) payload.replyAlert = autoReply;
    const res = await fetch(`${base}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setAutoBusy(false);
    setNotice(res.ok ? 'Mensajes automáticos guardados.' : j.error || 'No se pudo guardar');
  }

  /** Lee un Excel (.xlsx/.xls) o CSV en el navegador: columna 1 = teléfono, columnas siguientes = variables de la plantilla. */
  async function loadContactsFile(file: File) {
    setNotice('');
    setFileInfo('');
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, blankrows: false });
      const cellText = (v: unknown) => (typeof v === 'number' ? String(Math.round(v)) : String(v ?? '')).replace(/[\r\n,]+/g, ' ').trim();
      const body = rows.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== ''));
      // Si la primera fila no trae un teléfono (7+ dígitos) se toma como encabezado.
      const firstPhone = String((body[0] as unknown[] | undefined)?.[0] ?? '').replace(/\D/g, '');
      const data = firstPhone.length >= 7 ? body : body.slice(1);
      const width = selected ? selected.variables + 1 : Math.max(1, ...data.map((r) => (r as unknown[]).length));
      const lines = data.map((r) => {
        const cells = r as unknown[];
        return Array.from({ length: width }, (_, i) => cellText(cells[i])).join(', ');
      });
      if (lines.length === 0) return setNotice('El archivo no tiene contactos.');
      setCContacts(lines.join('\n'));
      setFileInfo(`${file.name}: ${lines.length} fila(s) leídas.`);
    } catch {
      setNotice('No se pudo leer el archivo. Usa un Excel (.xlsx) o un CSV con el teléfono en la primera columna.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  /** Descarga un Excel de ejemplo con las columnas que pide la plantilla elegida (teléfono como texto). */
  async function downloadExample() {
    const XLSX = await import('xlsx');
    const n = selected ? selected.variables : 1;
    const header = ['telefono', ...Array.from({ length: n }, (_, i) => (i === 0 ? 'nombre' : `variable${i + 1}`))];
    const sample = [defaultCc === '52' ? '5219991234567' : '5493517012345', 'Ana', ...Array.from({ length: Math.max(0, n - 1) }, () => 'ejemplo')];
    const ws = XLSX.utils.aoa_to_sheet([header, sample.slice(0, n + 1)]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
    XLSX.writeFile(wb, 'contactos-ejemplo.xlsx');
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
  const selected0 = templates.find((t) => t.name === cTemplate);

  // Revisión en vivo de la lista: cuántos son válidos, repetidos o inválidos, y cuántos faltan de variables.
  const contactStats = useMemo(() => {
    const seen = new Set<string>();
    let valid = 0, invalid = 0, dup = 0, missing = 0;
    const badExamples: string[] = [];
    for (const line of cContacts.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const [phone, ...params] = line.split(',').map((x) => x.trim());
      const p = normalizeWaPhone(phone, defaultCc);
      if (p.length < 10 || p.length > 15) {
        invalid++;
        if (badExamples.length < 3) badExamples.push(phone || '(vacío)');
        continue;
      }
      if (seen.has(p)) { dup++; continue; }
      seen.add(p);
      if (selected0 && selected0.variables > 0 && (params.length < selected0.variables || params.slice(0, selected0.variables).some((x) => !x))) missing++;
      valid++;
    }
    return { valid, invalid, dup, missing, badExamples };
  }, [cContacts, defaultCc, selected0]);

  // Si aún no se eligió plantilla, se sugiere la básica correspondiente (cuando ya está aprobada).
  useEffect(() => {
    const pick = (cur: Auto, name: string, set: (a: Auto) => void) => {
      const t = approved.find((x) => x.name === name);
      if (!cur.templateName && t) set({ ...cur, templateName: t.name, language: t.language });
    };
    pick(autoWelcome, 'bienvenida_lead_v1', setAutoWelcome);
    pick(autoAlert, 'aviso_nuevo_lead_v1', setAutoAlert);
    pick(autoReply, 'respuesta_lead_v1', setAutoReply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, autoWelcome.templateName, autoAlert.templateName, autoReply.templateName]);
  const selected = templates.find((t) => t.name === cTemplate);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">WhatsApp · {clientName}</h1>
          <div className="flex gap-3 text-xs text-zinc-400">
            <Link href={`/portal/${resellerId}/cliente/${clientSlug}/whatsapp/bandeja`} className="underline">Bandeja</Link>
            <Link href={`/portal/${resellerId}/cliente/${clientSlug}`} className="underline">Volver a leads</Link>
          </div>
        </div>
        {notice ? <p className="rounded-lg bg-zinc-800 p-3 text-sm">{notice}</p> : null}

        <section className={card}>
          <h2 className="text-sm font-semibold">Mensajes automáticos cuando llega un lead</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Se mandan solos desde el WhatsApp oficial del negocio, usando plantillas aprobadas. Primero crea las plantillas básicas y espera a que Meta las apruebe.
          </p>
          <button className={`${btnGhost} mt-3`} disabled={autoBusy} onClick={() => void createDefaults()}>
            Crear plantillas básicas (bienvenida y aviso)
          </button>
          {([
            ['Bienvenida a la persona que llenó el formulario ("recibimos tus datos, te contactaremos")', autoWelcome, setAutoWelcome],
            ['Aviso a la asesora de que entró un lead nuevo', autoAlert, setAutoAlert],
            ['Aviso a la asesora cuando la persona le contesta (máximo uno por hora por persona)', autoReply, setAutoReply],
          ] as const).map(([label, value, setValue]) => (
            <div key={label} className="mt-3 space-y-2 rounded-lg bg-zinc-950 p-3">
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" className="mt-0.5" checked={value.enabled} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} />
                {label}
              </label>
              <select className={input} value={value.templateName} onChange={(e) => setValue({ ...value, templateName: e.target.value, language: approved.find((t) => t.name === e.target.value)?.language ?? value.language })}>
                <option value="">Elige una plantilla aprobada…</option>
                {approved.map((t) => (
                  <option key={`${t.name}-${t.language}`} value={t.name}>{t.name} ({t.variables} variable{t.variables === 1 ? '' : 's'})</option>
                ))}
              </select>
            </div>
          ))}
          <p className="mt-2 text-xs text-zinc-500">Bienvenida usa 2 variables (nombre, negocio). Aviso a la asesora usa 2 (nombre, teléfono). Aviso al contestar usa 1 (nombre).</p>
          <button className={`${btn} mt-3`} disabled={autoBusy} onClick={() => void saveAuto()}>Guardar</button>
          <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
            <p className="text-xs font-semibold">Probar sin esperar un lead</p>
            <p className="text-xs text-zinc-400">
              Manda la bienvenida al teléfono que pongas (con código de país, por ejemplo 5219991234567) y los avisos al número de alertas de la asesora, usando las plantillas elegidas arriba. Guarda antes de probar.
            </p>
            <input className={input} placeholder="Tu teléfono con código de país" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
            <button className={btnGhost} disabled={testBusy || !testPhone.trim()} onClick={() => void sendTest()}>
              {testBusy ? 'Enviando…' : 'Enviar prueba'}
            </button>
          </div>
        </section>

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
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadContactsFile(f); }}
              />
              <button type="button" className={btnGhost} onClick={() => fileRef.current?.click()}>📎 Cargar Excel o CSV</button>
              <button type="button" className={btnGhost} onClick={() => void downloadExample()}>Descargar Excel de ejemplo</button>
              {fileInfo ? <span className="text-xs text-zinc-400">{fileInfo}</span> : null}
            </div>
            <p className="text-[11px] text-zinc-500">
              Primera columna: teléfono con código de país. Siguientes columnas: lo que pide la plantilla, en orden (por ejemplo, nombre). Elige primero la plantilla para que lea las columnas correctas. Puedes revisar y corregir la lista antes de enviar.
            </p>
            <textarea
              className={input}
              rows={6}
              placeholder={'Un contacto por línea: número con código de país, y luego las variables separadas por coma\n5491112345678, Ana, Seguro de vida'}
              value={cContacts}
              onChange={(e) => setCContacts(e.target.value)}
            />
            {selected ? <p className="text-xs text-zinc-400">Cada línea necesita {selected.variables} variable(s) después del número.</p> : null}
            {cContacts.trim() ? (
              <div className="rounded-lg bg-zinc-950 p-3 text-xs">
                <p>
                  <span className="font-semibold">{contactStats.valid}</span> contacto(s) listos para enviar
                  {contactStats.dup ? ` · ${contactStats.dup} repetido(s) se omiten` : ''}
                  {contactStats.invalid ? ` · ${contactStats.invalid} con teléfono inválido se omiten (${contactStats.badExamples.join(', ')})` : ''}
                </p>
                {contactStats.missing ? <p className="mt-1 text-yellow-400">{contactStats.missing} contacto(s) no traen todas las variables; completa esas filas antes de enviar.</p> : null}
                {(() => {
                  const cat = (selected?.category ?? '').toLowerCase();
                  const rate = Number(String(rates[cat] ?? '').replace(',', '.'));
                  return cat && rate > 0 ? (
                    <p className="mt-1 text-zinc-400">Costo estimado de Meta: ≈ USD {(contactStats.valid * rate).toFixed(2)} ({contactStats.valid} × {rate}, categoría {cat}).</p>
                  ) : (
                    <p className="mt-1 text-zinc-500">Para ver el costo estimado, captura la tarifa de la categoría de la plantilla en la sección Consumo, más abajo.</p>
                  );
                })()}
              </div>
            ) : null}
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
          <p className="mt-1 text-xs text-zinc-400">
            Conteo de mensajes salientes según lo que reporta Meta (incluye los avisos a la asesora). Escribe la tarifa de Meta por mensaje en cada categoría para ver un gasto estimado.
          </p>
          <ul className="mt-2 space-y-2 text-xs">
            {(() => {
              const base = usage?.byCategory ?? [];
              const extra = ['marketing', 'utility'].filter((c) => !base.some((r) => r.category === c)).map((c) => ({ category: c, messages: 0, billable: 0 }));
              return [...base, ...extra];
            })().map((r) => {
              const rate = Number(String(rates[r.category] ?? '').replace(',', '.'));
              const cost = Number.isFinite(rate) && rate > 0 ? r.billable * rate : null;
              return (
                <li key={r.category} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-[8rem]">{r.category}: {r.messages} mensajes ({r.billable} cobrables)</span>
                  <span className="text-zinc-400">× USD</span>
                  <input
                    className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={rates[r.category] ?? ''}
                    onChange={(e) => setRate(r.category, e.target.value)}
                  />
                  {cost !== null ? <span className="font-semibold">≈ USD {cost.toFixed(2)}</span> : null}
                </li>
              );
            })}
          </ul>
          {(() => {
            const total = (usage?.byCategory ?? []).reduce((sum, r) => {
              const rate = Number(String(rates[r.category] ?? '').replace(',', '.'));
              return sum + (Number.isFinite(rate) && rate > 0 ? r.billable * rate : 0);
            }, 0);
            return total > 0 ? <p className="mt-2 text-xs font-semibold">Gasto estimado del mes: USD {total.toFixed(2)}</p> : null;
          })()}
          <p className="mt-2 text-[11px] text-zinc-500">
            Es una estimación. El cargo exacto está en WhatsApp Manager → Información general → "Cargos aproximados". Las tarifas por país y categoría las publica Meta.
          </p>
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
