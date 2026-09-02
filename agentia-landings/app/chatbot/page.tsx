"use client";

import "@/styles/agentia-brand.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WhatsAppFloat from "@/components/shared/WhatsAppFloat";
import LeadForm from "@/components/shared/LeadForm";
import ROICalculator, { ROIResultLine } from "@/components/shared/ROICalculator";
import { useState } from "react";

const CASOS = [
  { nombre: "CWF México", giro: "Distribuidora de madera", detalle: "Cotiza y contesta precios 24/7 con política WeShip integrada." },
  { nombre: "Deco House", giro: "Vidrio y aluminio (Chile)", detalle: "Chatbot 'Elisa' atiende consultas técnicas de clientes." },
  { nombre: "Izzi (RGO)", giro: "Telecomunicaciones", detalle: "Primer cliente interno de Agentia — soporte y ventas." },
  { nombre: "Biovela", giro: "Veladoras (CDMX)", detalle: "Conecta catálogo, tienda y WhatsApp en un mismo flujo." },
];

const DIFERENCIADORES = [
  { titulo: "OCR de documentos", texto: "El bot lee fotos de comprobantes, capturas o catálogos que el cliente envía y responde con base en lo que ve." },
  { titulo: "Toma de control humana", texto: "Cualquier agente puede pausar al bot y responder en persona desde el panel, sin que el cliente note la transición." },
  { titulo: "Cotizaciones en PDF", texto: "Genera y envía cotizaciones formales por WhatsApp, listas para reenviar o imprimir." },
];

export default function ChatbotLanding() {
  const [roiResult, setRoiResult] = useState<ROIResultLine[]>([]);

  return (
    <div className="ag-page">
      <Navbar />

      {/* HERO */}
      <section className="ag-container" style={{ padding: "88px 0 64px" }}>
        <p className="ag-eyebrow ag-hero-in">CHATBOT WHATSAPP CON IA</p>
        <h1 className="ag-h1 ag-hero-in ag-hero-in-delay-1" style={{ maxWidth: "16ch" }}>
          Contesta a tus clientes en WhatsApp las 24 horas, sin contratar a nadie más
        </h1>
        <p className="ag-lead ag-hero-in ag-hero-in-delay-2" style={{ marginTop: 20 }}>
          Un chatbot con IA que entiende tu catálogo, cotiza, agenda y solo te avisa
          cuando de verdad tiene que intervenir una persona. Con panel CRM para dar
          seguimiento a cada conversación.
        </p>
        <div className="ag-hero-in ag-hero-in-delay-3" style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <a href="#diagnostico" className="btn-primary">Quiero mi diagnóstico gratis</a>
          <a href="#casos" className="btn-ghost">Ver casos reales</a>
        </div>
        <div style={{ marginTop: 28 }}>
          <span className="ag-badge ag-badge--meta">Partner oficial Meta — WhatsApp Cloud API</span>
        </div>
      </section>

      {/* CASOS */}
      <section id="casos" className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">CASOS REALES</p>
          <h2 className="ag-h2">Negocios que ya lo usan todos los días</h2>
          <div className="ag-grid-2" style={{ marginTop: 32 }}>
            {CASOS.map((c) => (
              <div key={c.nombre} className="ag-card">
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18 }}>{c.nombre}</p>
                <p style={{ color: "var(--cyan)", fontSize: 13, fontFamily: "var(--font-mono)", margin: "6px 0 12px" }}>{c.giro}</p>
                <p style={{ color: "var(--text-1)" }}>{c.detalle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">LO QUE NO TIENEN LOS DEMÁS</p>
          <h2 className="ag-h2">Más allá de responder preguntas frecuentes</h2>
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

      {/* ROI + LEAD FORM */}
      <section id="diagnostico" className="ag-section">
        <div className="ag-container ag-grid-2">
          <ROICalculator
            title="¿Cuánto estás perdiendo por no contestar a tiempo?"
            fields={[
              { key: "mensajes", label: "Mensajes de WhatsApp por día", defaultValue: 40, min: 5, max: 300, step: 5 },
              { key: "perdidos", label: "% que hoy se quedan sin respuesta", defaultValue: 30, min: 0, max: 90, suffix: "%" },
              { key: "ticket", label: "Ticket promedio por venta", defaultValue: 350, min: 50, max: 5000, step: 50, suffix: "MXN" },
            ]}
            calculate={(v) => {
              const mensajesPerdidosMes = v.mensajes * 30 * (v.perdidos / 100);
              const ventasRecuperadas = mensajesPerdidosMes * 0.2; // conversión conservadora
              const ingresoPotencial = ventasRecuperadas * v.ticket;
              const result: ROIResultLine[] = [
                { label: "Conversaciones perdidas al mes", value: Math.round(mensajesPerdidosMes).toString() },
                { label: "Ventas que podrías recuperar", value: `~${Math.round(ventasRecuperadas)}` },
                { label: "Ingreso potencial recuperado / mes", value: `$${Math.round(ingresoPotencial).toLocaleString("es-MX")} MXN`, highlight: true },
              ];
              return result;
            }}
            onResultChange={(_, r) => setRoiResult(r)}
          />
          <LeadForm product="chatbot" roiSnapshot={{ result: roiResult }} />
        </div>
      </section>

      <Footer />
      <WhatsAppFloat productLabel="Chatbot WhatsApp" />
    </div>
  );
}
