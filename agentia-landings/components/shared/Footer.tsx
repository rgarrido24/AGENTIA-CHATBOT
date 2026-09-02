export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        padding: "40px 0",
      }}
    >
      <div
        className="ag-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <a href="https://agentia.software" className="ag-logo" style={{ fontSize: 15 }}>
          agentia<span>.</span>software
        </a>
        <p style={{ color: "var(--text-2)", fontSize: 13 }}>
          Automatizamos negocios que quieren crecer sin contratar más gente.
        </p>
      </div>
    </footer>
  );
}
