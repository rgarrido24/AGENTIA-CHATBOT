import { notFound } from 'next/navigation';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import AnuarioFlipbook from './AnuarioFlipbook';

export const metadata = {
  title: 'Anuario K3 — Colegio Asbaje',
  description: 'Mis días de aventura — Generación 2024-2025',
};

export default async function AnuarioPage({ params }) {
  await connectDB();
  const alumno = await Alumno.findOne({ token: params.token }).lean();

  if (!alumno) notFound();

  return <AnuarioFlipbook alumno={JSON.parse(JSON.stringify(alumno))} />;
}
