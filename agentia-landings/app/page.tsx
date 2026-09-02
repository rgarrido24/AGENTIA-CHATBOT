"use client";

import "@/styles/agentia-brand.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WhatsAppFloat from "@/components/shared/WhatsAppFloat";
import Typewriter from "@/components/shared/Typewriter";
import Link from "next/link";

const PRODUCTOS = [
  { emoji: "🤖", nombre: "Chatbot WhatsApp", desc: "IA 24/7 con panel CRM", href: "/chatbot" },
  { emoji: "📊", nombre: "CRM de Ventas", desc: "Para equipos y agencias", href: "/crm" },
  { emoji: "🛒", nombre: "Tienda Online", desc: "Con pasarela de pago", href: "/ecommerce" },
  { emoji: "🎯", nombre: "Tarjeta de Lealtad", desc: "Puntos, sellos o cashback", href: "/lealtad" },
  { emoji: "🌐", nombre: "Páginas Web", desc: "Alta conversión con chatbot", href: "/paginas-web" },
  { emoji: "📍", nombre: "Rastreo de Campo", desc: "GPS para equipos en campo", href: "/rastreo" },
];

export default function HomePage() {
  return (
    <div className="ag-page">
      <Navbar />

      {/* HERO */}
      <section className="ag-container" style={{ padding: "100px 0 72px", textAlign: "center" }}>
        <p className="ag-eyebrow ag-hero-in" style={{ justifyContent: "center" }}>
          AGENTIA SOFTWARE
        </p>
        <h1
          className="ag-h1 ag-hero-in ag-hero-in-delay-1"
          style={{ margin: "0 auto", maxWidth: "20ch" }}
        >
          Automatizamos negocios que quieren crecer sin contratar más gente.
        </h1>
        <p
          className="ag-lead ag-hero-in ag-hero-in-delay-2"
          style={{ margin: "20px auto 0", textAlign: "center", fontSize: 20 }}
        >
          Consigue <Typewriter words={["más clientes", "más ventas", "menos trabajo manual"]} />
        </p>
        <div
          className="ag-hero-in ag-hero-in-delay-3"
          style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}
        >
          <a href="#productos" className="btn-primary">Ver productos</a>
          <a href="https://wa.me/529844927769" target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Hablar por WhatsApp
          </a>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos" className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">NUESTROS PRODUCTOS</p>
          <h2 className="ag-h2">Un sistema por cada parte de tu negocio</h2>
          <div className="ag-grid-3" style={{ marginTop: 32 }}>
            {PRODUCTOS.map((p) => (
              <Link key={p.href} href={p.href} style={{ textDecoration: "none" }}>
                <div className="ag-card" style={{ height: "100%" }}>
                  <p style={{ fontSize: 32, marginBottom: 14 }}>{p.emoji}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--text-0)" }}>
                    {p.nombre}
                  </p>
                  <p style={{ color: "var(--text-1)", fontSize: 14, marginTop: 6 }}>{p.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DEMOS */}
      <section className="ag-section">
        <div className="ag-container" style={{ textAlign: "center" }}>
          <p className="ag-eyebrow" style={{ justifyContent: "center" }}>
            VE CÓMO FUNCIONA
          </p>
          <h2 className="ag-h2">Mira lo que ya construimos</h2>
          <p className="ag-lead" style={{ margin: "16px auto 28px", textAlign: "center" }}>
            Demos reales por giro de negocio: restaurante, spa, barbería, dentista y más.
          </p>
          <Link href="/demos" className="btn-primary">
            Ver demos
          </Link>
        </div>
      </section>

      {/* SIMULADOR DE ROI GENERAL — reutiliza el componente que ya existe en el sitio */}
      <section className="ag-section">
        <div className="ag-container">
          <p className="ag-eyebrow">SIMULADOR</p>
          <h2 className="ag-h2">Calcula cuánto podrías ahorrar o vender más</h2>
          {/*
            AJUSTE NECESARIO: aquí va el componente de simulador de ROI general
            que ya tienen en la landing actual de agentia.software (no lo
            recreamos para no duplicar lógica) — importarlo tal cual, ej.:
            <ROISimuladorGeneral />
          */}
        </div>
      </section>

      <Footer />
      <WhatsAppFloat productLabel="Agentia Software" />
    </div>
  );
}
