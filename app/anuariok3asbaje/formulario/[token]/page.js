import { notFound } from 'next/navigation';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import FormularioPapas from './FormularioPapas';

export default async function FormularioPage({ params }) {
  await connectDB();
  const alumno = await Alumno.findOne({ token: params.token }).lean();

  if (!alumno) notFound();

  if (alumno.formularioEnviado) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #4CAF82 0%, #1B4F8A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Nunito', sans-serif",
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', color: 'white', maxWidth: '500px' }}>
          <div style={{ fontSize: '5rem' }}>🎉</div>
          <h1
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '2.5rem',
              margin: '1rem 0',
            }}
          >
            ¡Ya recibimos todo!
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Gracias por llenar la información de <strong>{alumno.nombreCorto}</strong>. ¡Ya estamos
            preparando su anuario con mucho amor! 💖
          </p>
        </div>
      </main>
    );
  }

  return <FormularioPapas alumno={JSON.parse(JSON.stringify(alumno))} token={params.token} />;
}
