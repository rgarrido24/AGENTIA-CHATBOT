"use client";

import "@/styles/agentia-brand.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WhatsAppFloat from "@/components/shared/WhatsAppFloat";
import LeadForm from "@/components/shared/LeadForm";
import ROICalculator, { ROIResultLine } from "@/components/shared/ROICalculator";
import { useState } from "react";

const DIFERENCIADORES = [
  { titulo: "Mapa de calor de zonas cubiertas", texto: "Ve de un vistazo qué colonias ya se volantearon esta semana y cuáles faltan." },
  { titulo: "Panel web para supervisores", texto: "Seguimiento en tiempo real de cada equipo desde una computadora, sin instalar nada." },
  { titulo: "App Android nativa", texto: "Rastreo GPS en segundo plano, pensado para jornadas largas de campo sin drenar la batería." },
];

export default function RastreoLanding() {
  const [roiResult, setRoiResult] = useState<ROIResultLine[]>([]);

  return (
    <div className="ag-page">
      <Navbar />

      <section className="ag-container" style={{ padding: "88px 0 64px" }}>
        <p className="ag-eyebrow ag-hero-in">RASTREO GPS PARA EQUIPOS DE CAMPO</p>
        <h1 className="ag-h1 ag-hero-in ag-hero-in-delay-1" style={{ maxWidth: "17ch" }}>
          Sabe exactamente dónde estuvo tu equipo hoy, sin llamarles uno por uno
        </h1>
        <p className="ag-lead ag-hero-in ag-hero-in-delay-2" style={{ marginTop: 20 }}>
          App de rastreo GPS para volanteo, cambaceo o rutas de venta en campo, con
          panel web para supervisores y mapa de calor de zonas cubiertas.
        </p>
        <div className="ag-hero-in ag-hero-in-delay-3" style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <a href="#diagnostico" className="btn-primary">Quiero mi diagnóstico gratis</a>
          <a href="#caso" className="btn-ghost">Ver caso real</a>
        </div>
      </section>

      <section id="caso" className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">CASO REAL</p>
          <h2 className="ag-h2">Volanteo Tracker</h2>
          <div className="ag-card" style={{ marginTop: 24 }}>
            <p style={{ color: "var(--text-1)", marginBottom: 16 }}>
              App en Flutter para Android con GPS en segundo plano, usada por
              equipos de volanteo en varias plazas del país, con panel de mapa en
              tiempo real para supervisión.
            </p>
            <div className="ag-grid-3">
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "var(--verde)" }}>8+</p>
                <p style={{ color: "var(--text-1)", fontSize: 13 }}>personas en campo por plaza</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "var(--cyan)" }}>Flutter</p>
                <p style={{ color: "var(--text-1)", fontSize: 13 }}>app Android nativa</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "var(--amber)" }}>1</p>
                <p style={{ color: "var(--text-1)", fontSize: 13 }}>panel para todas las plazas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">LO QUE NO TIENEN LOS DEMÁS</p>
          <h2 className="ag-h2">Supervisión real, no reportes de palabra</h2>
          <div className="ag-grid-3" style={{ marginTop: 32 }}>
            {DIFERENCIADORES.map((d) => (
              <div key={d.titulo} className="ag-card">
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, marginBottom: 10 }}>{d.titulo}</p>
                <p style={{ color: "var(--text-1)", fontSize: 15 }}>{d.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="diagnostico" className="ag-section">
        <div className="ag-container ag-grid-2">
          <ROICalculator
            title="¿Cuánto te cuesta no saber dónde está tu equipo?"
            fields={[
              { key: "personas", label: "Personas en campo", defaultValue: 8, min: 1, max: 100, step: 1 },
              { key: "horasPerdidas", label: "% de horas perdidas sin supervisión", defaultValue: 20, min: 0, max: 60, suffix: "%" },
              { key: "costoHora", label: "Costo por hora por persona", defaultValue: 45, min: 20, max: 300, step: 5, suffix: "MXN" },
            ]}
            calculate={(v) => {
              const horasMes = v.personas * 8 * 22; // 8h/día, 22 días
              const horasPerdidasMes = horasMes * (v.horasPerdidas / 100);
              const costoMensual = horasPerdidasMes * v.costoHora;
              return [
                { label: "Horas-persona trabajadas / mes", value: Math.round(horasMes).toString() },
                { label: "Horas perdidas sin supervisión", value: Math.round(horasPerdidasMes).toString() },
                { label: "Costo mensual estimado", value: `$${Math.round(costoMensual).toLocaleString("es-MX")} MXN`, highlight: true },
              ];
            }}
            onResultChange={(_, r) => setRoiResult(r)}
          />
          <LeadForm product="rastreo" roiSnapshot={{ result: roiResult }} />
        </div>
      </section>

      <Footer />
      <WhatsAppFloat productLabel="Rastreo de Campo" />
    </div>
  );
}
