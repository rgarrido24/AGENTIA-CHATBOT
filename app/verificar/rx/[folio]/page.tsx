import Image from 'next/image';
import { findFolio, nivelLabel } from '@/lib/receta-verification';

export default function VerificarRecetaPage({
  params,
}: {
  params: { folio: string };
}) {
  const folio = decodeURIComponent(params.folio).toUpperCase();
  const record = findFolio(folio);

  if (!record) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-md max-w-md w-full p-8 text-center border border-gray-100">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Receta no encontrada</h1>
          <p className="text-gray-500 text-sm mb-4">
            El folio <span className="font-mono font-bold text-gray-700">{folio}</span> no existe
            en nuestro sistema o puede haber sido cancelada.
          </p>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-700 text-left">
            Si tienes dudas sobre la autenticidad de este documento, contacta directamente al médico
            o a la institución emisora.
          </div>
          <p className="text-xs text-gray-400 mt-6">
            Powered by{' '}
            <span className="font-semibold text-gray-600">Agentia</span>
          </p>
        </div>
      </main>
    );
  }

  const fechaDisplay = new Date(record.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md max-w-lg w-full p-8 border border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Agentia Médico</p>
              <p className="text-xs text-gray-400">Sistema de verificación</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Folio</p>
            <p className="font-mono text-sm font-bold text-gray-700">{record.folio}</p>
          </div>
        </div>

        {/* Verified badge */}
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-green-800 text-sm">RECETA VERIFICADA</p>
            <p className="text-green-600 text-xs">
              Esta receta es auténtica y fue emitida por el sistema Agentia Médico
            </p>
          </div>
        </div>

        {/* Data */}
        <div className="space-y-3 mb-6">
          <div className="border-b border-gray-100 pb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Datos del médico</p>
            <div className="space-y-1">
              <Row label="Médico" value={record.medico} />
              <Row label="Cédula Prof." value={record.cedula} />
              <Row label="Especialidad" value={record.especialidad} />
            </div>
          </div>
          <div className="border-b border-gray-100 pb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Datos del documento</p>
            <div className="space-y-1">
              <Row label="Paciente" value={record.paciente} />
              <Row label="Fecha de emisión" value={fechaDisplay} />
              <Row
                label="Nivel de autenticidad"
                value={nivelLabel(record.nivel)}
                highlight={record.nivel === 3}
              />
            </div>
          </div>

          {/* Checks */}
          <div className="space-y-1.5">
            {[
              'Documento no alterado',
              'Médico registrado en el sistema',
              'Paciente verificado',
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500 font-bold">✓</span>
                {t}
              </div>
            ))}
            {record.nivel === 3 && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span className="text-blue-500 font-bold">✓</span>
                Firmado con e.firma SAT — validez legal plena
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center">
          Powered by{' '}
          <a
            href="https://agentia-chatbot-ventas.onrender.com"
            className="font-semibold text-gray-600 hover:underline"
          >
            Agentia
          </a>{' '}
          · Sistema de recetas verificables
        </p>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-xs text-gray-400 shrink-0">{label}:</span>
      <span
        className={`text-sm font-medium text-right ${
          highlight ? 'text-blue-700' : 'text-gray-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
