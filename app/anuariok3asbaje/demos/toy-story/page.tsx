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

export default async function ToyStoryDemoPage() {
  const students = await loadStudents();
  return (
    <DemoRoster
      students={students}
      themeClass="theme-toystory"
      title="Mis Días de Aventura"
      subtitle="Demo 1 — Toy Story / misión vaquera. Cada niño abre escenas interactivas (bombero, hot dog, color…) con datos reales del formulario."
    />
  );
}
