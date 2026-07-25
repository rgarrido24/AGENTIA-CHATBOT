import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import { ANUARIO_COOKIE, anuarioAdminPassword, anuarioPath } from '@/lib/anuario-k3/paths';
import { mapAlumnoToMemoria } from '@/lib/anuario-k3/memoriaMap';
import { StudioHome } from './StudioHome';

export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const expected = anuarioAdminPassword();
  const autenticado = expected && cookies().get(ANUARIO_COOKIE)?.value === expected;
  if (!autenticado) redirect(anuarioPath('/dashboard/login'));

  await connectDB();
  const alumnos = await Alumno.find().sort('nombreCorto').lean();
  const list = alumnos.map((a) => {
    const m = mapAlumnoToMemoria(a);
    return {
      slug: m.slug,
      nombre: m.nombre,
      published: m.published,
      portadaUrl: m.portadaUrl,
      perfilUrl: m.perfilUrl,
      recuerdosCount: m.gallery.length,
      mensajesCount: m.mensajes.length,
      link: anuarioPath(`/memoria/${m.slug}`),
    };
  });

  return <StudioHome alumnos={list} salonLink={anuarioPath('/memoria')} />;
}
