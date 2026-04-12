import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function BarberPreciosPage() {
  return (
    <AgentiaPrecios
      giro="Barbería / Estética"
      accentColor="#0d9488"
      features={{
        starter: [
          'Agenda con IA hasta 30 citas/mes',
          'Detección de conflictos de horario',
          'Recordatorios automáticos (300/mes)',
          'Chat IA para clientes 24/7',
          'Dashboard de ingresos básico',
        ],
        pro: [
          'Citas ilimitadas',
          'Recordatorios ilimitados (1,500/mes)',
          'Marca y colores personalizados',
          'Múltiples barberos',
          'Reportes avanzados',
          'Soporte prioritario WhatsApp',
        ],
        premium: [
          'Todo lo del plan Pro',
          'Múltiples sucursales',
          'WhatsApp Business API oficial',
          'Integración con punto de venta',
          'Personalización total',
          'Soporte dedicado 24/7',
        ],
      }}
    />
  );
}
