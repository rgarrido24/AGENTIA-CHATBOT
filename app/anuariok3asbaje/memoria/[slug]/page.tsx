import { notFound } from 'next/navigation';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import {
  alumnoToStudentView,
  MEMORIA_CHAPTER,
  MEMORIA_SALON_COVER,
} from '@/lib/anuario-k3/memoriaStudents';
import { MemoriaExperience } from '../_components/MemoriaExperience';

export const dynamic = 'force-dynamic';

export default async function MemoriaAlumnoPage({ params }: { params: { slug: string } }) {
  await connectDB();
  const alumno = await Alumno.findOne({ slug: params.slug }).lean();
  if (!alumno) notFound();

  const student = alumnoToStudentView(alumno);

  return (
    <MemoriaExperience
      data={{
        mode: 'alumno',
        generacion: '2024-2025',
        salon: 'Kinder 3 · Colegio Asbaje',
        coverUrl: student.portadaUrl || student.perfilUrl || MEMORIA_SALON_COVER,
        chapterUrl: MEMORIA_CHAPTER,
        students: [student],
      }}
    />
  );
}
