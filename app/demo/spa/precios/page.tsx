import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function SpaPreciosPage() {
  return (
    <AgentiaPrecios
      giro="Spa & Estética"
      accentColor="#9333ea"
      features={{
        starter: [
          'Agenda hasta 30 citas/mes',
          'Gestión de especialistas',
          'Recordatorios automáticos (300/mes)',
          'Chat IA para reservas 24/7',
          'KPIs básicos del negocio',
        ],
        pro: [
          'Citas y clientes ilimitados',
          'Clientes VIP con seguimiento',
          'Recordatorios (1,500/mes)',
          'Marca personalizada',
          'Reactivación automática de clientes',
          'Soporte prioritario',
        ],
        premium: [
          'Todo lo del plan Pro',
          'Múltiples sucursales',
          'WhatsApp Business API oficial',
          'Catálogo de servicios personalizado',
          'Personalización total',
          'Soporte dedicado 24/7',
        ],
      }}
    />
  );
}
