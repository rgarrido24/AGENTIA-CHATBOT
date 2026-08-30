import AgentiaPrecios from '@/components/AgentiaPrecios';

export default function NutricionPreciosPage() {
  return (
    <AgentiaPrecios
      giro="Nutrición"
      accentColor="#16a34a"
      features={{
        starter: [
          'Hasta 30 pacientes activos',
          'Tablero de progreso InBody',
          'Chat IA con dieta del paciente',
          'Recordatorios motivacionales (300/mes)',
          'Tabla SMAE integrada',
        ],
        pro: [
          'Pacientes ilimitados',
          'Lista del súper semanal con IA',
          'Generador de plan semanal',
          'Alertas de abandono automáticas',
          'Marca y colores personalizados',
          'Recordatorios (1,500/mes)',
        ],
        premium: [
          'Todo lo del plan Pro',
          'Múltiples nutriólogos',
          'WhatsApp Business API oficial',
          'OCR InBody ilimitado',
          'Personalización total',
          'Soporte dedicado 24/7',
        ],
      }}
    />
  );
}
