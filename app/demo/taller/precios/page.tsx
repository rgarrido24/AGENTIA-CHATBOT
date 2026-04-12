import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function TallerPreciosPage() {
  return (
    <AgentiaPrecios
      giro="Taller Mecánico"
      accentColor="#475569"
      features={{
        starter: [
          'Hasta 30 vehículos activos',
          'Órdenes de servicio digitales',
          'Presupuestos PDF profesionales',
          'Recordatorios de mantenimiento (300/mes)',
          'Chat IA para clientes',
        ],
        pro: [
          'Vehículos ilimitados',
          'Checklist de recepción con fotos',
          'Portal de seguimiento para cliente',
          'Inventario de refacciones',
          'Marca personalizada',
          'Recordatorios (1,500/mes)',
        ],
        premium: [
          'Todo lo del plan Pro',
          'Múltiples técnicos y sucursales',
          'WhatsApp Business API oficial',
          'Integración con punto de venta',
          'Personalización total',
          'Soporte dedicado 24/7',
        ],
      }}
    />
  );
}
