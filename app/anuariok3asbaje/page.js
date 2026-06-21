export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B4F8A 0%, #7C4DFF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
        <div style={{ fontSize: '4rem' }}>🎓</div>
        <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Anuario Kinder 3
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
          Colegio Asbaje — Generación 2024-2025
        </p>
        <p style={{ marginTop: '2rem', opacity: 0.7, fontSize: '0.9rem' }}>
          Usa tu link personalizado para llenar el formulario ✨
        </p>
      </div>
    </main>
  )
}