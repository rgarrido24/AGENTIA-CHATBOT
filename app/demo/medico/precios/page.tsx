import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function MedicoPreciosPage() {
  return (
    <AgentiaPrecios
      giro="Consultorio Médico"
      accentColor="#16a34a"
      features={{
        starter: [
          'Hasta 30 pacientes activos',
          'Expediente clínico digital',
          'Recetas con QR verificable',
          'Agenda por especialidad',
          'Recordatorios (300/mes)',
        ],
        pro: [
          'Pacientes ilimitados',
          'Signos vitales con gráficas',
          'Lista de espera con IA',
          'Incapacidades digitales',
          'Marca personalizada',
          'Recordatorios (1,500/mes)',
        ],
        premium: [
          'Todo lo del plan Pro',
          'Múltiples especialistas',
          'WhatsApp Business API oficial',
          'Historial clínico completo',
          'Personalización total',
          'Soporte dedicado 24/7',
        ],
      }}
    />
  );
}
