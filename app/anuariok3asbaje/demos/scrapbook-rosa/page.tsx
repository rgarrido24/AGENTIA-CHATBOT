import { loadDemoStudents } from "../_lib/loadStudents";
import { DemoRoster } from "../_components/DemoRoster";
import "../demos.css";

export default async function ScrapRosaDemoPage() {
  const students = await loadDemoStudents();
  return (
    <DemoRoster
      students={students}
      themeClass="theme-scrap-rosa"
      title="Orgullo Rosa · Scrapbook"
      subtitle="Demo 3 — Estética scrapbook luminosa (ref. Lia): pastel, polaroid y escenas vivas al tocar cada dato."
    />
  );
}
