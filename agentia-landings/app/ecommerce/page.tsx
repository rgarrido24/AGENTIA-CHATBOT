"use client";

import "@/styles/agentia-brand.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WhatsAppFloat from "@/components/shared/WhatsAppFloat";
import LeadForm from "@/components/shared/LeadForm";
import ROICalculator, { ROIResultLine } from "@/components/shared/ROICalculator";
import { useState } from "react";

const DIFERENCIADORES = [
  { titulo: "Chatbot integrado a la tienda", texto: "El mismo bot que contesta WhatsApp conoce tu catálogo y precios en tiempo real, sin catálogos separados." },
  { titulo: "Pasarelas de pago listas", texto: "Clip, Stripe y Mercado Pago conectados desde el día uno, sin trámites bancarios adicionales." },
  { titulo: "Envíos integrados", texto: "Cotización y guías de paquetería conectadas directo al checkout." },
];

export default function EcommerceLanding() {
  const [roiResult, setRoiResult] = useState<ROIResultLine[]>([]);

  return (
    <div className="ag-page">
      <Navbar />

      <section className="ag-container" style={{ padding: "88px 0 64px" }}>
        <p className="ag-eyebrow ag-hero-in">TIENDA ONLINE + PASARELA DE PAGO</p>
        <h1 className="ag-h1 ag-hero-in ag-hero-in-delay-1" style={{ maxWidth: "17ch" }}>
          Vende en línea con una tienda que también contesta WhatsApp
        </h1>
        <p className="ag-lead ag-hero-in ag-hero-in-delay-2" style={{ marginTop: 20 }}>
          Catálogo, checkout con tarjeta y chatbot con IA en un mismo lugar. Tus
          clientes preguntan por WhatsApp y el bot ya sabe qué hay en existencia y
          a qué precio.
        </p>
        <div className="ag-hero-in ag-hero-in-delay-3" style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <a href="#diagnostico" className="btn-primary">Quiero mi diagnóstico gratis</a>
          <a href="#caso" className="btn-ghost">Ver caso real</a>
        </div>
      </section>

      <section id="caso" className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">CASO REAL</p>
          <h2 className="ag-h2">Biovela (La Rueda Veladoras)</h2>
          <div className="ag-card" style={{ marginTop: 24 }}>
            <p style={{ color: "var(--text-1)", marginBottom: 16 }}>
              Empresa de veladoras en CDMX. Catálogo de 192 productos migrado a
              Tiendanube, cobro con Clip y envíos con WeShip — todo conectado al
              chatbot de WhatsApp del negocio.
            </p>
            <div className="ag-grid-3">
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "var(--verde)" }}>192</p>
                <p style={{ color: "var(--text-1)", fontSize: 13 }}>productos en catálogo</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "var(--cyan)" }}>Tiendanube</p>
                <p style={{ color: "var(--text-1)", fontSize: 13 }}>+ Clip + WeShip</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "var(--amber)" }}>1</p>
                <p style={{ color: "var(--text-1)", fontSize: 13 }}>chatbot para todo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">LO QUE NO TIENEN LOS DEMÁS</p>
          <h2 className="ag-h2">Tienda y chatbot, no dos sistemas separados</h2>
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
            title="¿Cuánto puedes vender con chatbot integrado?"
            fields={[
              { key: "visitas", label: "Visitas mensuales a tu tienda", defaultValue: 1500, min: 100, max: 50000, step: 100 },
              { key: "conversionActual", label: "Conversión actual sin chatbot", defaultValue: 1.5, min: 0.2, max: 10, step: 0.1, suffix: "%" },
              { key: "mejora", label: "Mejora esperada con chatbot integrado", defaultValue: 40, min: 5, max: 150, suffix: "%" },
              { key: "ticket", label: "Ticket promedio", defaultValue: 450, min: 50, max: 5000, step: 50, suffix: "MXN" },
            ]}
            calculate={(v) => {
              const ventasActuales = v.visitas * (v.conversionActual / 100);
              const ventasAdicionales = ventasActuales * (v.mejora / 100);
              const ingresoAdicional = ventasAdicionales * v.ticket;
              return [
                { label: "Ventas actuales / mes", value: Math.round(ventasActuales).toString() },
                { label: "Ventas adicionales con chatbot", value: `+${Math.round(ventasAdicionales)}` },
                { label: "Ingreso adicional / mes", value: `$${Math.round(ingresoAdicional).toLocaleString("es-MX")} MXN`, highlight: true },
              ];
            }}
            onResultChange={(_, r) => setRoiResult(r)}
          />
          <LeadForm product="ecommerce" roiSnapshot={{ result: roiResult }} />
        </div>
      </section>

      <Footer />
      <WhatsAppFloat productLabel="Tienda Online" />
    </div>
  );
}
