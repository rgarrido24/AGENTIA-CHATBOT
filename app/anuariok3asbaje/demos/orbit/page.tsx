import { loadDemoStudents } from "../_lib/loadStudents";
import { DemoRoster } from "../_components/DemoRoster";
import "../demos.css";

export default async function OrbitDemoPage() {
  const students = await loadDemoStudents();
  return (
    <DemoRoster
      students={students}
      themeClass="theme-orbit"
      title="Mission Cinema"
      subtitle="Demo 4 — Sorpresa high-ticket: bitácora oscura tipo Apple TV / cine espacial. Ideal para vender el anuario premium el próximo año."
    />
  );
}
