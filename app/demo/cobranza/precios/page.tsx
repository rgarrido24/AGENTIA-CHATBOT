import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function CobranzaPreciosPage() {
  return (
    <AgentiaPrecios
      giro="Cobranza Escolar"
      accentColor="#1e40af"
      features={{
        starter: [
          'Hasta 50 cuentas activas',
          'Dashboard de morosidad',
          'Secuencias automáticas básicas',
          'Estado de cuenta PDF',
          'Recordatorios (300/mes)',
        ],
        pro: [
          'Cuentas ilimitadas',
          'Score de riesgo con IA',
          'Secuencias avanzadas multi-etapa',
          'Marca personalizada',
          'Recordatorios (1,500/mes)',
          'Soporte prioritario',
        ],
        premium: [
          'Todo lo del plan Pro',
          'Múltiples carteras',
          'WhatsApp Business API oficial',
          'Reportes ejecutivos',
          'Personalización total',
          'Soporte dedicado 24/7',
        ],
      }}
    />
  );
}
