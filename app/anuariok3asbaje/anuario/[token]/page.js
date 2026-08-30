import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';

const StPageFlipViewer = dynamic(() => import('./StPageFlipViewer'), { ssr: false });
const AnuarioFlipbook = dynamic(() => import('./AnuarioFlipbook'), { ssr: false });

export const metadata = {
  title: 'Anuario K3 — Colegio Asbaje',
  description: 'Mis días de aventura — Generación 2024-2025',
};

export default async function AnuarioPage({ params }) {
  await connectDB();
  const alumno = await Alumno.findOne({ token: params.token }).lean();

  if (!alumno) notFound();

  const data = JSON.parse(JSON.stringify(alumno));
  const paginasAnuario = (data.paginasAnuario || []).filter(
    (url) => typeof url === 'string' && url.trim()
  );

  if (paginasAnuario.length > 0) {
    return <StPageFlipViewer pages={paginasAnuario} alumnoNombre={data.nombreCorto} />;
  }

  return <AnuarioFlipbook alumno={data} />;
}
