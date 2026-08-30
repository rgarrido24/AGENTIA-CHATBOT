import { loadDemoStudents } from "../_lib/loadStudents";
import { DemoRoster } from "../_components/DemoRoster";
import "../demos.css";

export default async function ScrapGradDemoPage() {
  const students = await loadDemoStudents();
  return (
    <DemoRoster
      students={students}
      themeClass="theme-scrap-grad"
      title="GRAD 2026 · Scrapbook"
      subtitle="Demo 2 — Polaroids con cinta, tipografía festiva y escenas interactivas por sueño/comida/color. Fotos: carga manual."
    />
  );
}
