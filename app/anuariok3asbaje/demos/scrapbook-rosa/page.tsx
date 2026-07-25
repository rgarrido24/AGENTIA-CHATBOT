import { getAlumnosPublic } from "@/lib/anuario-k3/getAlumnosPublic";
import { DemoRoster } from "../_components/DemoRoster";
import "../demos.css";

async function loadStudents() {
  try {
    return await getAlumnosPublic();
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function ScrapRosaDemoPage() {
  const students = await loadStudents();
  return (
    <DemoRoster
      students={students}
      themeClass="theme-scrap-rosa"
      title="Orgullo Rosa · Scrapbook"
      subtitle="Demo 3 — Estética scrapbook luminosa (ref. Lia): pastel, polaroid y escenas vivas al tocar cada dato."
    />
  );
}
