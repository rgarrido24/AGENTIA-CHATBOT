import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import { ANUARIO_COOKIE, anuarioAdminPassword, anuarioPath } from '@/lib/anuario-k3/paths';
import { mapAlumnoToMemoria } from '@/lib/anuario-k3/memoriaMap';
import { StudioEditor } from './StudioEditor';

export const dynamic = 'force-dynamic';

type MemoriaRecuerdo = { url?: string; publicId?: string; caption?: string };
type MemoriaMensaje = { autor?: string; texto?: string };
type MemoriaDoc = {
  portadaUrl?: string;
  perfilUrl?: string;
  recuerdos?: MemoriaRecuerdo[];
  mensajes?: MemoriaMensaje[];
  published?: boolean;
};

export default async function StudioAlumnoPage({ params }: { params: { slug: string } }) {
  const expected = anuarioAdminPassword();
  const autenticado = expected && cookies().get(ANUARIO_COOKIE)?.value === expected;
  if (!autenticado) redirect(anuarioPath('/dashboard/login'));

  await connectDB();
  const alumno = await Alumno.findOne({ slug: params.slug }).lean();
  if (!alumno) notFound();

  const mapped = mapAlumnoToMemoria(alumno);
  const memoria = (alumno.memoria || {}) as MemoriaDoc;
  const recuerdos = memoria.recuerdos || [];
  const mensajesMemoria = memoria.mensajes || [];

  return (
    <StudioEditor
      initial={{
        slug: mapped.slug,
        token: mapped.token,
        nombre: mapped.nombre,
        nombreCompleto: mapped.nombreCompleto,
        portadaUrl: memoria.portadaUrl || mapped.portadaUrl || '',
        perfilUrl: memoria.perfilUrl || mapped.perfilUrl || '',
        recuerdos: recuerdos.map((r: MemoriaRecuerdo) => ({
          url: r.url || '',
          publicId: r.publicId || '',
          caption: r.caption || '',
        })),
        mensajes: mensajesMemoria.length
          ? mensajesMemoria.map((m: MemoriaMensaje) => ({
              autor: m.autor || 'Familia',
              texto: m.texto || '',
            }))
          : mapped.mensajes.length
            ? mapped.mensajes
            : [{ autor: 'Familia', texto: '' }],
        published: Boolean(memoria.published),
        facts: mapped.facts,
        publicLink: anuarioPath(`/memoria/${mapped.slug}`),
      }}
    />
  );
}
