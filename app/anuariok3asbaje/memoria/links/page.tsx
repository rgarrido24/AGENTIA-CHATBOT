import Link from 'next/link';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import { anuarioPath } from '@/lib/anuario-k3/paths';
import { mapAlumnoToMemoria } from '@/lib/anuario-k3/memoriaMap';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Links Memoria · Anuario K3',
  description: 'Links personalizados por niño — experiencia Memoria',
};

/** Índice público de links por niño (datos del formulario; fotos después en Studio). */
export default async function MemoriaLinksPage() {
  await connectDB();
  const alumnos = (await Alumno.find().sort('nombreCorto').lean()) as Array<{
    slug: string;
    [key: string]: unknown;
  }>;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#f5f5f7',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: '3rem clamp(1.2rem, 4vw, 3rem)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '0.7rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          opacity: 0.45,
        }}
      >
        Generación 2024-2025
      </p>
      <h1
        style={{
          margin: '0.6rem 0 0.4rem',
          fontWeight: 400,
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          letterSpacing: '-0.03em',
        }}
      >
        Recuerdos por niño
      </h1>
      <p style={{ opacity: 0.55, fontWeight: 300, maxWidth: '42ch', lineHeight: 1.5 }}>
        Cada link abre la experiencia personal con los datos del formulario. Las fotos
        se cargan después desde Studio.
      </p>

      <p style={{ marginTop: '1.75rem' }}>
        <Link href={anuarioPath('/memoria')} style={{ color: '#c9d4ff' }}>
          Ver experiencia del salón →
        </Link>
      </p>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '2.5rem 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          maxWidth: 560,
        }}
      >
        {alumnos.map((a) => {
          const m = mapAlumnoToMemoria(a);
          const hasFacts = Object.values(m.facts).some((v) => String(v || '').trim());
          return (
            <li key={a.slug}>
              <Link
                href={anuarioPath(`/memoria/${a.slug}`)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '1rem',
                  padding: '1rem 1.1rem',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#f5f5f7',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 400 }}>{m.nombre}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.45 }}>
                  {hasFacts ? 'con datos' : 'pendiente'} · /{a.slug}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
