'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type Conv = { contactKey: string; name: string; leadId: string | null; lastText: string; lastDirection: 'in' | 'out'; lastMessageAt: string; unread: number; windowOpen: boolean };
type Msg = {
  direction: 'in' | 'out';
  text: string;
  type: string;
  caption?: string | null;
  media?: { id: string; mime: string | null; filename: string | null; voice: boolean } | null;
  location?: { lat: number; lng: number; name?: string; address?: string } | null;
  status: string | null;
  errorCode: number | null;
  createdAt: string;
};
type Thread = { name: string; contactKey: string; windowOpen: boolean; windowClosesAt: string | null; messages: Msg[] };

const fmt = (iso: string) => new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const tick = (m: Msg) => (m.direction !== 'out' ? '' : m.status === 'read' ? ' ✓✓ leído' : m.status === 'delivered' ? ' ✓✓' : m.status === 'failed' ? ' ✗ no entregado' : ' ✓');

/** Contenido de una burbuja: texto, foto, audio, video, documento o ubicación. */
function Body({ m, mediaBase }: { m: Msg; mediaBase: string }) {
  const url = m.media ? `${mediaBase}/${m.media.id}` : '';
  const caption = m.caption ? <p className="mt-1">{m.caption}</p> : null;
  if (m.media && (m.type === 'image' || m.type === 'sticker')) {
    return (
      <>
        <a href={url} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={m.type === 'sticker' ? 'Sticker' : 'Imagen recibida'} loading="lazy" className="max-h-72 max-w-full rounded-lg" />
        </a>
        {caption}
      </>
    );
  }
  if (m.media && m.type === 'audio') {
    return (
      <>
        <audio controls preload="none" src={url} className="w-60 max-w-full" />
        <a href={`${url}?download=1`} className="mt-1 block text-[11px] underline">Descargar audio</a>
      </>
    );
  }
  if (m.media && m.type === 'video') {
    return (
      <>
        <video controls playsInline preload="metadata" src={url} className="max-h-72 max-w-full rounded-lg" />
        {caption}
      </>
    );
  }
  if (m.media && m.type === 'document') {
    const isPdf = (m.media.mime || '').includes('pdf');
    return (
      <>
        <p>📄 {m.media.filename || 'Documento'}</p>
        <p className="mt-1 text-[12px]">
          {isPdf ? <><a href={url} target="_blank" rel="noreferrer" className="underline">Abrir</a>{' · '}</> : null}
          <a href={`${url}?download=1`} className="underline">Descargar</a>
        </p>
        {caption}
      </>
    );
  }
  if (m.location) {
    return (
      <a href={`https://www.google.com/maps?q=${m.location.lat},${m.location.lng}`} target="_blank" rel="noreferrer" className="underline">
        📍 {m.location.name || m.location.address || 'Ver ubicación en el mapa'}
      </a>
    );
  }
  return <>{m.text}</>;
}

export default function Inbox({ resellerId, clientSlug, clientName }: { resellerId: string; clientSlug: string; clientName: string }) {
  const base = `/api/portal/${resellerId}/client/${clientSlug}/whatsapp/conversations`;
  const [convs, setConvs] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaBase = `/api/portal/${resellerId}/client/${clientSlug}/whatsapp/media`;

  const loadList = useCallback(async () => {
    try {
      const r = await fetch(base, { cache: 'no-store' });
      const j = (await r.json()) as { conversations?: Conv[] };
      if (r.ok) setConvs(j.conversations ?? []);
    } catch { /* se reintenta en el siguiente ciclo */ }
  }, [base]);

  const loadThread = useCallback(async (key: string, markRead: boolean) => {
    try {
      const r = await fetch(`${base}/${key}/messages${markRead ? '?markRead=1' : ''}`, { cache: 'no-store' });
      if (r.ok) setThread((await r.json()) as Thread);
    } catch { /* se reintenta */ }
  }, [base]);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    if (c) setSelected(c);
  }, []);

  useEffect(() => {
    void loadList();
    const t = setInterval(() => void loadList(), 10000);
    return () => clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!selected) return;
    setThread(null);
    void loadThread(selected, true).then(loadList);
    const t = setInterval(() => void loadThread(selected, true), 5000);
    return () => clearInterval(t);
  }, [selected, loadThread, loadList]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length]);

  async function send() {
    if (!selected || !text.trim()) return;
    setBusy(true);
    setError('');
    const r = await fetch(`${base}/${selected}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!r.ok) return setError(j.error || 'No se pudo enviar');
    setText('');
    await loadThread(selected, false);
    await loadList();
  }

  async function sendFile(file: File) {
    if (!selected) return;
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    if (text.trim()) fd.append('caption', text.trim());
    const r = await fetch(`${base}/${selected}/attachment`, { method: 'POST', body: fd });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
    if (!r.ok) return setError(j.error || 'No se pudo enviar el archivo');
    setText('');
    await loadThread(selected, false);
    await loadList();
  }

  const current = convs.find((c) => c.contactKey === selected);
  const title = thread?.name || current?.name || (selected ? `+${selected}` : '');

  return (
    <main className="flex h-[100dvh] flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-xs text-zinc-400">{clientName}</p>
          <h1 className="text-sm font-bold">Bandeja de WhatsApp</h1>
        </div>
        <div className="flex gap-3 text-xs text-zinc-400">
          <Link className="underline" href={`/portal/${resellerId}/cliente/${clientSlug}/whatsapp`}>Campañas</Link>
          <Link className="underline" href={`/portal/${resellerId}/cliente/${clientSlug}`}>Leads</Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Lista: en celular se oculta al abrir una conversación */}
        <aside className={`${selected ? 'hidden md:block' : 'block'} w-full overflow-y-auto border-r border-zinc-800 md:w-80`}>
          {convs.length === 0 ? <p className="p-4 text-sm text-zinc-500">Aún no hay conversaciones. Cuando alguien conteste, aparecerá aquí.</p> : null}
          {convs.map((c) => (
            <button
              key={c.contactKey}
              onClick={() => setSelected(c.contactKey)}
              className={`block w-full border-b border-zinc-900 px-4 py-3 text-left ${selected === c.contactKey ? 'bg-zinc-900' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{c.name || `+${c.contactKey}`}</span>
                {c.unread > 0 ? <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold">{c.unread}</span> : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-400">{c.lastDirection === 'out' ? 'Tú: ' : ''}{c.lastText}</p>
              <p className="mt-0.5 text-[10px] text-zinc-600">{fmt(c.lastMessageAt)}</p>
            </button>
          ))}
        </aside>

        <section className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
          {!selected ? (
            <p className="m-auto text-sm text-zinc-500">Elige una conversación.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2">
                <button className="text-xs text-zinc-400 md:hidden" onClick={() => setSelected(null)}>← Atrás</button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{title}</p>
                  <p className="text-[11px] text-zinc-500">+{selected}{current?.leadId ? ' · es un lead de tu panel' : ''}</p>
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {!thread ? <p className="text-sm text-zinc-500">Cargando…</p> : null}
                {thread?.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.direction === 'out' ? 'bg-green-700' : 'bg-zinc-800'}`}>
                      <Body m={m} mediaBase={mediaBase} />
                      <p className="mt-1 text-right text-[10px] opacity-60">{fmt(m.createdAt)}{tick(m)}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="border-t border-zinc-800 p-3">
                {thread && !thread.windowOpen ? (
                  <p className="text-xs text-yellow-300">
                    Pasaron más de 24 horas desde su último mensaje. WhatsApp solo permite escribirle con una plantilla aprobada (desde Campañas). Si te vuelve a escribir, podrás contestarle aquí.
                  </p>
                ) : (
                  <>
                    {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}
                    <div className="flex items-end gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,audio/aac,audio/mp4,audio/mpeg,audio/amr,audio/ogg,video/mp4,video/3gpp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) void sendFile(f); }}
                      />
                      <button type="button" title="Adjuntar foto, audio, video o documento" className="h-[44px] rounded-lg border border-zinc-700 px-3 text-lg disabled:opacity-50" disabled={busy} onClick={() => fileRef.current?.click()}>
                        📎
                      </button>
                      <textarea
                        className="min-h-[44px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Escribe tu respuesta…"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                      <button className="rounded-lg bg-green-600 px-4 text-sm font-semibold disabled:opacity-50" disabled={busy || !text.trim()} onClick={() => void send()}>
                        {busy ? '…' : 'Enviar'}
                      </button>
                    </div>
                    {thread?.windowClosesAt ? <p className="mt-1 text-[10px] text-zinc-500">Puedes escribirle libremente hasta {fmt(thread.windowClosesAt)}.</p> : null}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
