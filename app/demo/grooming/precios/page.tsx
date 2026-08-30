import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function GroomingPreciosPage() {
  return (
    <AgentiaPrecios
      giro="Grooming & Veterinaria"
      accentColor="#f97316"
      features={{
        starter: [
          'Hasta 30 mascotas activas',
          'Fichas por mascota',
          'Agenda con detección de conflictos',
          'Recordatorios de baño (300/mes)',
          'Chat IA 24/7',
        ],
        pro: [
          'Mascotas ilimitadas',
          'Servicio a domicilio con zona',
          'Seguimiento GPS simulado',
          'Marca personalizada',
          'Recordatorios (1,500/mes)',
          'Soporte prioritario',
        ],
        premium: [
          'Todo lo del plan Pro',
          'Múltiples groomers',
          'WhatsApp Business API oficial',
          'Historial médico completo',
          'Personalización total',
          'Soporte dedicado 24/7',
        ],
      }}
    />
  );
}
