export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #7B5294 0%, #F4EBE1 55%, #F5B041 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Nunito', sans-serif",
        padding: "1.5rem",
      }}
    >
      <div style={{ textAlign: "center", color: "#2a1f35", maxWidth: 480 }}>
        <div style={{ fontSize: "3.5rem" }}>🤠🚀</div>
        <h1
          style={{
            fontFamily: "'Fredoka One', 'Lilita One', cursive",
            fontSize: "clamp(2rem, 6vw, 2.75rem)",
            marginBottom: "0.5rem",
            color: "#7B5294",
          }}
        >
          Anuario Kinder 3
        </h1>
        <p style={{ fontSize: "1.15rem", opacity: 0.9, fontWeight: 700 }}>
          Colegio Asbaje — Generación 2024-2026
        </p>
        <p style={{ marginTop: "1.25rem", opacity: 0.75, fontSize: "0.95rem", lineHeight: 1.5 }}>
          Plantilla digital lista. Usa el link del formulario para papás, o abre la
          experiencia interactiva para cargar fotos por sección.
        </p>
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <a
            href="/anuariok3asbaje/experiencia"
            style={{
              display: "inline-block",
              background: "#7B5294",
              color: "#fff",
              fontWeight: 800,
              textDecoration: "none",
              padding: "0.9rem 1.4rem",
              borderRadius: 999,
              boxShadow: "0 12px 30px rgba(42,31,53,0.2)",
            }}
          >
            Abrir experiencia digital
          </a>
          <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>
            También: link personalizado del formulario ✨
          </span>
        </div>
      </div>
    </main>
  );
}
