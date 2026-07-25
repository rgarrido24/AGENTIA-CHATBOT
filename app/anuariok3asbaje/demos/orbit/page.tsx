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

export default async function OrbitDemoPage() {
  const students = await loadStudents();
  return (
    <DemoRoster
      students={students}
      themeClass="theme-orbit"
      title="Mission Cinema"
      subtitle="Demo 4 — Sorpresa high-ticket: bitácora oscura tipo Apple TV / cine espacial. Ideal para vender el anuario premium el próximo año."
    />
  );
}
