import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import {
  alumnoToStudentView,
  hasMemoriaContent,
  MEMORIA_CHAPTER,
  MEMORIA_SALON_COVER,
} from '@/lib/anuario-k3/memoriaStudents';
import { MemoriaExperience } from './_components/MemoriaExperience';
import type { MemoriaStudent } from './_components/StudentDocumentary';

export const dynamic = 'force-dynamic';

export default async function MemoriaSalonPage() {
  let students: MemoriaStudent[] = [];
  try {
    await connectDB();
    const alumnos = (await Alumno.find().sort('nombreCorto').lean()) as Array<Record<string, unknown>>;
    students = alumnos
      .map((a) => alumnoToStudentView(a))
      .filter((s) => hasMemoriaContent(s));
  } catch {
    students = [];
  }

  const cover =
    students.find((s) => s.portadaUrl)?.portadaUrl ||
    students.find((s) => s.perfilUrl)?.perfilUrl ||
    MEMORIA_SALON_COVER;

  return (
    <MemoriaExperience
      data={{
        mode: 'salon',
        generacion: '2024-2025',
        salon: 'Kinder 3 · Colegio Asbaje',
        coverUrl: cover,
        chapterUrl: MEMORIA_CHAPTER,
        students,
      }}
    />
  );
}
