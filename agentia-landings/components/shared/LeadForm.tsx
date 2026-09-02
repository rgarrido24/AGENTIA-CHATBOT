"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function LeadForm({
  product,
  roiSnapshot,
}: {
  /** slug del producto: 'chatbot' | 'crm' | 'ecommerce' | 'paginas-web' | 'rastreo' */
  product: string;
  /** opcional: resultado del simulador de ROI al momento de enviar, para guardarlo junto al lead */
  roiSnapshot?: Record<string, unknown>;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState({
    nombre: "",
    negocio: "",
    whatsapp: "",
    email: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/diagnostico-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          producto: product,
          roi: roiSnapshot ?? null,
          origen: "landing",
          url: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
      setValues({ nombre: "", negocio: "", whatsapp: "", email: "" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="ag-card" style={{ textAlign: "center" }}>
        <p className="ag-h2" style={{ fontSize: 22, marginBottom: 8 }}>
          Listo, ya lo recibimos
        </p>
        <p style={{ color: "var(--text-1)" }}>
          Te contactamos por WhatsApp en las próximas horas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ag-card">
      <div className="ag-grid-2" style={{ marginBottom: 16 }}>
        <div>
          <label className="ag-label" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            className="ag-input"
            required
            value={values.nombre}
            onChange={(e) => setValues({ ...values, nombre: e.target.value })}
          />
        </div>
        <div>
          <label className="ag-label" htmlFor="negocio">
            Nombre del negocio
          </label>
          <input
            id="negocio"
            className="ag-input"
            required
            value={values.negocio}
            onChange={(e) => setValues({ ...values, negocio: e.target.value })}
          />
        </div>
      </div>
      <div className="ag-grid-2" style={{ marginBottom: 20 }}>
        <div>
          <label className="ag-label" htmlFor="whatsapp">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            className="ag-input"
            type="tel"
            required
            placeholder="9991234567"
            value={values.whatsapp}
            onChange={(e) => setValues({ ...values, whatsapp: e.target.value })}
          />
        </div>
        <div>
          <label className="ag-label" htmlFor="email">
            Correo (opcional)
          </label>
          <input
            id="email"
            className="ag-input"
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </div>
      </div>
      <button
        type="submit"
        className="btn-primary"
        style={{ width: "100%" }}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Enviando..." : "Quiero mi diagnóstico gratis"}
      </button>
      {status === "error" && (
        <p style={{ color: "#ff8080", fontSize: 13, marginTop: 10 }}>
          No se pudo enviar. Intenta de nuevo o escríbenos por WhatsApp.
        </p>
      )}
    </form>
  );
}
