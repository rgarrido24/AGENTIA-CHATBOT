'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { anuarioPath } from '@/lib/anuario-k3/paths';

type Row = {
  slug: string;
  nombre: string;
  published: boolean;
  portadaUrl: string;
  perfilUrl: string;
  recuerdosCount: number;
  mensajesCount: number;
  link: string;
};

export function StudioHome({ alumnos, salonLink }: { alumnos: Row[]; salonLink: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const add = async () => {
    setBusy(true);
    setErr('');
    const res = await fetch(anuarioPath('/api/studio/alumnos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreCorto: nombre }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr('No se pudo crear el alumno');
      return;
    }
    const data = await res.json();
    setNombre('');
    router.push(anuarioPath(`/studio/${data.alumno.slug}`));
    router.refresh();
  };

  return (
    <main className="stu-root">
      <header className="stu-header">
        <div>
          <p className="stu-kicker">Anuario · Studio</p>
          <h1>Plantillas de memoria</h1>
          <p className="stu-sub">
            Prepara cada niño o salón, guarda y comparte un link personalizado.
          </p>
        </div>
        <Link className="stu-link-ghost" href={salonLink} target="_blank">
          Ver experiencia del salón
        </Link>
      </header>

      <section className="stu-add">
        <h2>Agregar alumno</h2>
        <div className="stu-add-row">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Amaia"
            onKeyDown={(e) => e.key === 'Enter' && nombre.trim() && add()}
          />
          <button type="button" disabled={!nombre.trim() || busy} onClick={add}>
            {busy ? 'Creando…' : 'Agregar'}
          </button>
        </div>
        {err ? <p className="stu-err">{err}</p> : null}
      </section>

      <section className="stu-list">
        {alumnos.map((a) => (
          <article key={a.slug} className="stu-row">
            <div
              className="stu-thumb"
              style={{
                backgroundImage: a.perfilUrl || a.portadaUrl ? `url(${a.perfilUrl || a.portadaUrl})` : undefined,
              }}
            />
            <div className="stu-row-body">
              <h3>{a.nombre}</h3>
              <p>
                {a.recuerdosCount} recuerdos · {a.mensajesCount} mensajes
                {a.published ? ' · publicada' : ' · borrador'}
              </p>
              <code>{a.link}</code>
            </div>
            <div className="stu-row-actions">
              <Link href={anuarioPath(`/studio/${a.slug}`)}>Editar</Link>
              <a href={a.link} target="_blank" rel="noreferrer">
                Ver link
              </a>
            </div>
          </article>
        ))}
      </section>

      <style jsx global>{`
        .stu-root {
          min-height: 100vh;
          background: #0b0b0c;
          color: #f5f5f7;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 2.5rem clamp(1.2rem, 4vw, 3.5rem) 4rem;
        }
        .stu-header {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          align-items: flex-start;
          margin-bottom: 2.5rem;
        }
        .stu-kicker {
          margin: 0 0 0.4rem;
          font-size: 0.7rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          opacity: 0.45;
        }
        .stu-header h1 {
          margin: 0;
          font-weight: 400;
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          letter-spacing: -0.03em;
        }
        .stu-sub {
          margin: 0.6rem 0 0;
          opacity: 0.55;
          font-weight: 300;
          max-width: 36ch;
        }
        .stu-link-ghost {
          color: rgba(245, 245, 247, 0.7);
          text-decoration: none;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0.7rem 1rem;
          border-radius: 999px;
        }
        .stu-add {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.4rem 1.5rem;
          margin-bottom: 2rem;
        }
        .stu-add h2 {
          margin: 0 0 1rem;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.65;
        }
        .stu-add-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .stu-add-row input {
          flex: 1;
          min-width: 180px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          font-size: 1rem;
        }
        .stu-add-row button {
          border: 0;
          background: #f5f5f7;
          color: #111;
          border-radius: 10px;
          padding: 0.85rem 1.2rem;
          font-size: 0.85rem;
          letter-spacing: 0.06em;
          cursor: pointer;
        }
        .stu-add-row button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .stu-err {
          color: #ff8a8a;
          font-size: 0.85rem;
          margin: 0.75rem 0 0;
        }
        .stu-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .stu-row {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          gap: 1rem;
          align-items: center;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .stu-thumb {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          background: #1a1a1c center/cover no-repeat;
        }
        .stu-row-body h3 {
          margin: 0;
          font-weight: 500;
          font-size: 1.05rem;
        }
        .stu-row-body p {
          margin: 0.25rem 0;
          opacity: 0.5;
          font-size: 0.85rem;
        }
        .stu-row-body code {
          font-size: 0.72rem;
          opacity: 0.4;
        }
        .stu-row-actions {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          align-items: flex-end;
        }
        .stu-row-actions a {
          color: #f5f5f7;
          text-decoration: none;
          font-size: 0.8rem;
          opacity: 0.75;
        }
        @media (max-width: 640px) {
          .stu-row {
            grid-template-columns: 56px 1fr;
          }
          .stu-row-actions {
            grid-column: 1 / -1;
            flex-direction: row;
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
