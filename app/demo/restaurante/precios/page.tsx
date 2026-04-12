import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function RestaurantePreciosPage() {
  return (
    <AgentiaPrecios
      giro="Restaurante"
      accentColor="#dc2626"
      features={{
        starter: [
          'Menú QR hasta 30 productos',
          'Panel de cocina básico',
          'Chat IA para pedidos 24/7',
          'Recordatorios a clientes (300/mes)',
          'Reportes de ventas básicos',
        ],
        pro: [
          'Productos ilimitados',
          'Delivery con seguimiento',
          'CRM de clientes recurrentes',
          'Reactivación automática',
          'Marca personalizada',
          'Recordatorios (1,500/mes)',
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
