'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { anuarioPath } from '@/lib/anuario-k3/paths';

type Recuerdo = { url: string; publicId?: string; caption?: string };
type Mensaje = { autor: string; texto: string };

type Initial = {
  slug: string;
  token: string;
  nombre: string;
  nombreCompleto: string;
  portadaUrl: string;
  perfilUrl: string;
  recuerdos: Recuerdo[];
  mensajes: Mensaje[];
  published: boolean;
  facts: {
    color: string;
    sueno: string;
    comida: string;
    amigos: string;
    frase: string;
    gusto: string;
  };
  publicLink: string;
};

async function uploadFile(file: File, token: string) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('token', token);
  const res = await fetch(anuarioPath('/api/upload'), { method: 'POST', body: fd });
  if (!res.ok) throw new Error('upload failed');
  return res.json() as Promise<{ url: string; publicId: string }>;
}

export function StudioEditor({ initial }: { initial: Initial }) {
  const [nombre, setNombre] = useState(initial.nombre);
  const [portadaUrl, setPortadaUrl] = useState(initial.portadaUrl);
  const [perfilUrl, setPerfilUrl] = useState(initial.perfilUrl);
  const [recuerdos, setRecuerdos] = useState<Recuerdo[]>(initial.recuerdos);
  const [mensajes, setMensajes] = useState<Mensaje[]>(initial.mensajes);
  const [facts, setFacts] = useState(initial.facts);
  const [published, setPublished] = useState(initial.published);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!list.length) return;
      setStatus(`Subiendo ${list.length} archivo(s)…`);
      try {
        const uploaded: Recuerdo[] = [];
        for (const file of list) {
          const r = await uploadFile(file, initial.token);
          uploaded.push({ url: r.url, publicId: r.publicId, caption: '' });
        }
        setRecuerdos((prev) => [...prev, ...uploaded]);
        setStatus(`${uploaded.length} recuerdo(s) listos`);
      } catch {
        setStatus('Error al subir. Revisa Cloudinary.');
      }
    },
    [initial.token]
  );

  const uploadSingle = async (file: File, kind: 'portada' | 'perfil') => {
    setStatus(`Subiendo ${kind}…`);
    try {
      const r = await uploadFile(file, initial.token);
      if (kind === 'portada') setPortadaUrl(r.url);
      else setPerfilUrl(r.url);
      setStatus(`${kind} actualizada`);
    } catch {
      setStatus('Error al subir');
    }
  };

  const save = async () => {
    setSaving(true);
    setStatus('Guardando…');
    const res = await fetch(anuarioPath(`/api/studio/alumno/${initial.slug}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreCorto: nombre,
        facts,
        memoria: {
          portadaUrl,
          perfilUrl,
          recuerdos,
          mensajes: mensajes.filter((m) => m.texto.trim()),
          published,
        },
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setStatus('No se pudo guardar');
      return;
    }
    setStatus('Guardado. Link listo para compartir.');
  };

  return (
    <main className="ed-root">
      <header className="ed-top">
        <Link href={anuarioPath('/studio')}>← Studio</Link>
        <div className="ed-top-right">
          <label className="ed-pub">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Publicar
          </label>
          <button type="button" className="ed-save" disabled={saving} onClick={save}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </header>

      <div className="ed-grid">
        <section className="ed-panel">
          <h1>{nombre || 'Alumno'}</h1>
          <p className="ed-link">
            Link personalizado:{' '}
            <a href={initial.publicLink} target="_blank" rel="noreferrer">
              {initial.publicLink}
            </a>
          </p>

          <label className="ed-field">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>

          <div className="ed-uploads">
            <label className="ed-upload-box">
              <span>Subir portada</span>
              {portadaUrl ? <img src={portadaUrl} alt="" /> : <em>Sin portada</em>}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && uploadSingle(e.target.files[0], 'portada')}
              />
            </label>
            <label className="ed-upload-box">
              <span>Subir foto de perfil</span>
              {perfilUrl ? <img src={perfilUrl} alt="" /> : <em>Sin perfil</em>}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && uploadSingle(e.target.files[0], 'perfil')}
              />
            </label>
          </div>

          <h2>Recuerdos</h2>
          <div
            className={`ed-drop ${dragOver ? 'is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) void onFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            <strong>Arrastra aquí tus fotografías</strong>
            <span>o</span>
            <em>Seleccionar archivos</em>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => e.target.files && void onFiles(e.target.files)}
            />
          </div>

          <div className="ed-thumbs">
            {recuerdos.map((r, i) => (
              <div key={`${r.url}-${i}`} className="ed-thumb">
                <img src={r.url} alt="" />
                <button
                  type="button"
                  onClick={() => setRecuerdos((prev) => prev.filter((_, j) => j !== i))}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <h2>Agregar mensaje</h2>
          {mensajes.map((m, i) => (
            <div key={i} className="ed-msg">
              <input
                value={m.autor}
                placeholder="Autor"
                onChange={(e) =>
                  setMensajes((prev) => prev.map((x, j) => (j === i ? { ...x, autor: e.target.value } : x)))
                }
              />
              <textarea
                value={m.texto}
                placeholder="Mensaje de los padres…"
                rows={4}
                onChange={(e) =>
                  setMensajes((prev) => prev.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="ed-add-msg"
            onClick={() => setMensajes((prev) => [...prev, { autor: 'Familia', texto: '' }])}
          >
            + Otro mensaje
          </button>
        </section>

        <aside className="ed-panel ed-side">
          <h2>Datos del documental</h2>
          {(
            [
              ['color', 'Color favorito'],
              ['sueno', 'Sueño'],
              ['comida', 'Comida'],
              ['amigos', 'Mejores amigos'],
              ['frase', 'Frase favorita'],
              ['gusto', 'Lo que más le gustó'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="ed-field">
              {label}
              <input
                value={facts[key]}
                onChange={(e) => setFacts((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          {status ? <p className="ed-status">{status}</p> : null}
          <button type="button" className="ed-save ed-save-block" disabled={saving} onClick={save}>
            Guardar
          </button>
        </aside>
      </div>

      <style jsx global>{`
        .ed-root {
          min-height: 100vh;
          background: #0b0b0c;
          color: #f5f5f7;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 1.25rem clamp(1rem, 3vw, 2.5rem) 3rem;
        }
        .ed-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.75rem;
        }
        .ed-top a {
          color: rgba(245, 245, 247, 0.65);
          text-decoration: none;
          font-size: 0.85rem;
        }
        .ed-top-right {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .ed-pub {
          display: flex;
          gap: 0.45rem;
          align-items: center;
          font-size: 0.85rem;
          opacity: 0.8;
        }
        .ed-save {
          border: 0;
          background: #f5f5f7;
          color: #111;
          border-radius: 10px;
          padding: 0.7rem 1.15rem;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .ed-save:disabled {
          opacity: 0.45;
        }
        .ed-save-block {
          width: 100%;
          margin-top: 1rem;
        }
        .ed-grid {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr;
          gap: 1.25rem;
        }
        @media (max-width: 900px) {
          .ed-grid {
            grid-template-columns: 1fr;
          }
        }
        .ed-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 1.4rem 1.35rem;
        }
        .ed-panel h1 {
          margin: 0 0 0.35rem;
          font-weight: 400;
          font-size: 1.8rem;
          letter-spacing: -0.03em;
        }
        .ed-panel h2 {
          margin: 1.6rem 0 0.85rem;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.55;
          font-weight: 500;
        }
        .ed-link {
          margin: 0 0 1.25rem;
          font-size: 0.82rem;
          opacity: 0.55;
          word-break: break-all;
        }
        .ed-link a {
          color: #c9d4ff;
        }
        .ed-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.85;
          margin-bottom: 0.9rem;
        }
        .ed-field input,
        .ed-msg input,
        .ed-msg textarea {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 10px;
          padding: 0.75rem 0.9rem;
          font-size: 0.95rem;
          text-transform: none;
          letter-spacing: 0;
          font-family: inherit;
        }
        .ed-uploads {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .ed-upload-box {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          padding: 0.85rem;
          border-radius: 12px;
          border: 1px dashed rgba(255, 255, 255, 0.18);
          cursor: pointer;
          min-height: 140px;
        }
        .ed-upload-box span {
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.6;
        }
        .ed-upload-box img {
          width: 100%;
          height: 110px;
          object-fit: cover;
          border-radius: 8px;
        }
        .ed-upload-box em {
          opacity: 0.35;
          font-style: normal;
          font-size: 0.85rem;
        }
        .ed-drop {
          margin-top: 0.5rem;
          border: 1px dashed rgba(255, 255, 255, 0.22);
          border-radius: 16px;
          padding: 2.2rem 1rem;
          text-align: center;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          color: rgba(245, 245, 247, 0.7);
          transition: background 0.35s ease, border-color 0.35s ease;
        }
        .ed-drop.is-over {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.4);
        }
        .ed-drop strong {
          font-weight: 500;
          color: #fff;
        }
        .ed-drop em {
          font-style: normal;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .ed-thumbs {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.55rem;
          margin-top: 1rem;
        }
        .ed-thumb {
          position: relative;
        }
        .ed-thumb img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 8px;
        }
        .ed-thumb button {
          position: absolute;
          inset: auto 4px 4px auto;
          border: 0;
          background: rgba(0, 0, 0, 0.65);
          color: #fff;
          font-size: 0.65rem;
          border-radius: 6px;
          padding: 0.25rem 0.4rem;
          cursor: pointer;
        }
        .ed-msg {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-bottom: 0.75rem;
        }
        .ed-add-msg {
          border: 0;
          background: transparent;
          color: rgba(245, 245, 247, 0.65);
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0.4rem 0;
        }
        .ed-status {
          margin-top: 1rem;
          font-size: 0.85rem;
          opacity: 0.65;
        }
      `}</style>
    </main>
  );
}
