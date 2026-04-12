import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function DentistaPreciosPage() {
  return (
    <AgentiaPrecios
      giro="Clínica Dental"
      accentColor="#0284c7"
      features={{
        starter: [
          'Hasta 30 pacientes activos',
          'Expediente clínico digital',
          'Alerta de alergias automática',
          'Recetas con QR verificable',
          'Recordatorios de cita (300/mes)',
        ],
        pro: [
          'Pacientes ilimitados',
          'Radiografías y fotos clínicas',
          'Galería antes y después',
          'Odontograma digital',
          'Marca personalizada',
          'Recordatorios (1,500/mes)',
        ],
        premium: [
          'Todo lo del plan Pro',
          'Múltiples dentistas',
          'WhatsApp Business API oficial',
          'Firma digital de consentimiento',
          'Personalización total',
          'Soporte dedicado 24/7',
        ],
      }}
    />
  );
}
