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

export default async function ScrapGradDemoPage() {
  const students = await loadStudents();
  return (
    <DemoRoster
      students={students}
      themeClass="theme-scrap-grad"
      title="GRAD 2026 · Scrapbook"
      subtitle="Demo 2 — Polaroids con cinta, tipografía festiva y escenas interactivas por sueño/comida/color. Fotos: carga manual."
    />
  );
}
