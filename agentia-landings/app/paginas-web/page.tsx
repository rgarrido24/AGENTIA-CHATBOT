"use client";

import "@/styles/agentia-brand.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WhatsAppFloat from "@/components/shared/WhatsAppFloat";
import LeadForm from "@/components/shared/LeadForm";
import ROICalculator, { ROIResultLine } from "@/components/shared/ROICalculator";
import { useState } from "react";

const DIFERENCIADORES = [
  { titulo: "Chatbot incluido", texto: "Tu landing no es solo un folleto: el chatbot de WhatsApp contesta a quien no llena el formulario." },
  { titulo: "Integración con Meta Ads", texto: "Conectada directo a tus campañas de Facebook e Instagram, con pixel y formularios sincronizados." },
  { titulo: "Captura de leads automática", texto: "Cada visita que llena el formulario cae directo a tu CRM, sin hojas de cálculo de por medio." },
];

export default function PaginasWebLanding() {
  const [roiResult, setRoiResult] = useState<ROIResultLine[]>([]);

  return (
    <div className="ag-page">
      <Navbar />

      <section className="ag-container" style={{ padding: "88px 0 64px" }}>
        <p className="ag-eyebrow ag-hero-in">PÁGINAS WEB DE ALTA CONVERSIÓN</p>
        <h1 className="ag-h1 ag-hero-in ag-hero-in-delay-1" style={{ maxWidth: "17ch" }}>
          Una página que convierte visitas en clientes, no solo en visitas
        </h1>
        <p className="ag-lead ag-hero-in ag-hero-in-delay-2" style={{ marginTop: 20 }}>
          Landing pages construidas para vender: rápidas, con chatbot de WhatsApp
          incluido y conectadas a tus campañas de Meta Ads desde el primer día.
        </p>
        <div className="ag-hero-in ag-hero-in-delay-3" style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <a href="#diagnostico" className="btn-primary">Quiero mi diagnóstico gratis</a>
          <a href="#diferenciadores" className="btn-ghost">Qué incluye</a>
        </div>
        <div style={{ marginTop: 28 }}>
          <span className="ag-badge ag-badge--meta">Partner oficial Meta — integración Ads</span>
        </div>
      </section>

      <section id="diferenciadores" className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">LO QUE NO TIENEN LOS DEMÁS</p>
          <h2 className="ag-h2">No es solo diseño, es un sistema de captura</h2>
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
            title="¿Cuántos leads te está costando tu página actual?"
            fields={[
              { key: "visitas", label: "Visitas mensuales a tu página actual", defaultValue: 800, min: 50, max: 30000, step: 50 },
              { key: "conversionActual", label: "Conversión actual", defaultValue: 1, min: 0.1, max: 10, step: 0.1, suffix: "%" },
              { key: "conversionNueva", label: "Conversión con landing + chatbot", defaultValue: 4, min: 0.5, max: 20, step: 0.5, suffix: "%" },
            ]}
            calculate={(v) => {
              const leadsActuales = v.visitas * (v.conversionActual / 100);
              const leadsNuevos = v.visitas * (v.conversionNueva / 100);
              const leadsAdicionales = leadsNuevos - leadsActuales;
              return [
                { label: "Leads actuales / mes", value: Math.round(leadsActuales).toString() },
                { label: "Leads con landing + chatbot", value: Math.round(leadsNuevos).toString() },
                { label: "Leads adicionales / mes", value: `+${Math.round(leadsAdicionales)}`, highlight: true },
              ];
            }}
            onResultChange={(_, r) => setRoiResult(r)}
          />
          <LeadForm product="paginas-web" roiSnapshot={{ result: roiResult }} />
        </div>
      </section>

      <Footer />
      <WhatsAppFloat productLabel="Páginas Web" />
    </div>
  );
}
