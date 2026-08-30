export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0b1220 0%, #7B5294 45%, #F4EBE1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Nunito', sans-serif",
        padding: "1.5rem",
      }}
    >
      <div style={{ textAlign: "center", color: "#fff", maxWidth: 520 }}>
        <div style={{ fontSize: "3rem" }}>🤠🚀</div>
        <h1
          style={{
            fontFamily: "'Fredoka One', 'Lilita One', cursive",
            fontSize: "clamp(2rem, 6vw, 2.75rem)",
            marginBottom: "0.5rem",
          }}
        >
          Anuario Kinder 3
        </h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.92, fontWeight: 700 }}>
          Colegio Asbaje — Generación 2024-2026
        </p>
        <p style={{ marginTop: "1rem", opacity: 0.8, fontSize: "0.95rem", lineHeight: 1.5 }}>
          4 demos interactivas con datos reales del formulario. Elige la que más enamore.
        </p>
        <div
          style={{
            marginTop: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <a
            href="/anuariok3asbaje/demos"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#1c2430",
              fontWeight: 800,
              textDecoration: "none",
              padding: "0.9rem 1.4rem",
              borderRadius: 999,
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            }}
          >
            Ver las 4 demos
          </a>
          <a
            href="/anuariok3asbaje/experiencia"
            style={{ color: "#fff", fontWeight: 700, opacity: 0.85 }}
          >
            Experiencia editorial Toy Story
          </a>
        </div>
      </div>
    </main>
  );
}
