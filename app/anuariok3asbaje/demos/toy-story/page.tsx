import { loadDemoStudents } from "../_lib/loadStudents";
import { DemoRoster } from "../_components/DemoRoster";
import "../demos.css";

export default async function ToyStoryDemoPage() {
  const students = await loadDemoStudents();
  return (
    <DemoRoster
      students={students}
      themeClass="theme-toystory"
      title="Mis Días de Aventura"
      subtitle="Demo 1 — Toy Story / misión vaquera. Cada niño abre escenas interactivas (bombero, hot dog, color…) con datos reales del formulario."
    />
  );
}
