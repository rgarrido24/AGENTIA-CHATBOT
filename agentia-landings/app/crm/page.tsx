"use client";

import "@/styles/agentia-brand.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WhatsAppFloat from "@/components/shared/WhatsAppFloat";
import LeadForm from "@/components/shared/LeadForm";
import ROICalculator, { ROIResultLine } from "@/components/shared/ROICalculator";
import { useState } from "react";

const DIFERENCIADORES = [
  { titulo: "App PWA con notificaciones push", texto: "Cada asesora recibe el lead en el celular al instante, sin instalar nada desde una tienda de apps." },
  { titulo: "Conexión directa a Facebook Ads", texto: "Los formularios de Meta llegan al CRM vía Zapier, sin captura manual ni hojas de cálculo." },
  { titulo: "Paneles individuales por vendedora", texto: "Cada asesora ve solo sus leads y su seguimiento, sin mezclar información entre equipos." },
];

export default function CRMLanding() {
  const [roiResult, setRoiResult] = useState<ROIResultLine[]>([]);

  return (
    <div className="ag-page">
      <Navbar />

      <section className="ag-container" style={{ padding: "88px 0 64px" }}>
        <p className="ag-eyebrow ag-hero-in">CRM PARA EQUIPOS DE VENTAS</p>
        <h1 className="ag-h1 ag-hero-in ag-hero-in-delay-1" style={{ maxWidth: "18ch" }}>
          Cada lead con su asesora, sin que se te pierda ni uno
        </h1>
        <p className="ag-lead ag-hero-in ag-hero-in-delay-2" style={{ marginTop: 20 }}>
          Un CRM pensado para agencias y equipos de venta con varios asesores:
          distribución automática de leads, notificaciones push y conexión directa
          con tus campañas de Facebook Ads.
        </p>
        <div className="ag-hero-in ag-hero-in-delay-3" style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <a href="#diagnostico" className="btn-primary">Quiero mi diagnóstico gratis</a>
          <a href="#caso" className="btn-ghost">Ver caso real</a>
        </div>
        <div style={{ marginTop: 28 }}>
          <span className="ag-badge ag-badge--meta">Partner oficial Meta — integración Facebook Ads</span>
        </div>
      </section>

      <section id="caso" className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">CASO REAL</p>
          <h2 className="ag-h2">Luciano Ads</h2>
          <div className="ag-card" style={{ marginTop: 24 }}>
            <div className="ag-grid-3">
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--verde)" }}>26</p>
                <p style={{ color: "var(--text-1)", fontSize: 14 }}>asesoras activas con su propio panel</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--cyan)" }}>2,000+</p>
                <p style={{ color: "var(--text-1)", fontSize: 14 }}>leads procesados por mes</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--amber)" }}>0</p>
                <p style={{ color: "var(--text-1)", fontSize: 14 }}>captura manual de formularios</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">LO QUE NO TIENEN LOS DEMÁS</p>
          <h2 className="ag-h2">Un CRM hecho para equipos reales</h2>
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
            title="¿Cuánto vale organizar tu seguimiento?"
            fields={[
              { key: "leads", label: "Leads que generas al mes", defaultValue: 300, min: 20, max: 5000, step: 20 },
              { key: "conversionActual", label: "Tasa de conversión actual", defaultValue: 8, min: 1, max: 50, suffix: "%" },
              { key: "mejora", label: "Mejora esperada con seguimiento organizado", defaultValue: 30, min: 5, max: 100, suffix: "%" },
              { key: "ticket", label: "Valor promedio por cliente cerrado", defaultValue: 1500, min: 100, max: 20000, step: 100, suffix: "MXN" },
            ]}
            calculate={(v) => {
              const clientesActuales = v.leads * (v.conversionActual / 100);
              const clientesNuevos = clientesActuales * (v.mejora / 100);
              const ingresoAdicional = clientesNuevos * v.ticket;
              return [
                { label: "Clientes que cierras hoy", value: Math.round(clientesActuales).toString() },
                { label: "Clientes adicionales con CRM", value: `+${Math.round(clientesNuevos)}` },
                { label: "Ingreso adicional / mes", value: `$${Math.round(ingresoAdicional).toLocaleString("es-MX")} MXN`, highlight: true },
              ];
            }}
            onResultChange={(_, r) => setRoiResult(r)}
          />
          <LeadForm product="crm" roiSnapshot={{ result: roiResult }} />
        </div>
      </section>

      <Footer />
      <WhatsAppFloat productLabel="CRM de Ventas" />
    </div>
  );
}
