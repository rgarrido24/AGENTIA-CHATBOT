import { getAlumnosPublic } from "@/lib/anuario-k3/getAlumnosPublic";
import { mapAlumnosToStudents, type Student } from "./data";
import { ExperienciaClient } from "./ExperienciaClient";

export const dynamic = "force-dynamic";

export default async function ExperienciaAnuarioPage() {
  let students: Student[] = [];
  try {
    const rows = await getAlumnosPublic();
    students = mapAlumnosToStudents(rows);
  } catch (e) {
    console.error("Experiencia: no se pudieron cargar alumnos", e);
  }

  return <ExperienciaClient students={students} />;
}
