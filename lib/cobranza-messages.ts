import type { Alumno } from '@/lib/mock-data-cobranza';

const mx = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

/** Plantilla de mensaje según ciclo (WhatsApp) */
export function plantillaMensaje(al: Alumno): string {
  const { nombre, tutor, montoColegiatura, montoAdeudo, diasAtraso } = al;
  const col = mx(montoColegiatura);
  const adeudo = mx(montoAdeudo);

  switch (al.ciclo) {
    case 'Ciclo 1':
      return (
        `Estimado/a ${tutor}:\n\n` +
        `Le escribimos del Instituto Meridian para recordarle amablemente el próximo vencimiento de la colegiatura de ${nombre}. ` +
        `El monto mensual es de ${col}. ` +
        `Puede realizar su pago en línea o en ventanilla. Si ya cubrió el mes, ignore este mensaje.\n\n` +
        `¡Gracias por confiar en nosotros!`
      );
    case 'Ciclo 2':
      return (
        `Estimado/a ${tutor}:\n\n` +
        `Le informamos que el adeudo acumulado de ${nombre} asciende a ${adeudo} (colegiatura referencia ${col}). ` +
        `Llevamos ${diasAtraso} días desde el último abono aplicado. ` +
        `Podemos ofrecerle un plan de 2 o 3 parcialidades sin recargo adicional si regulariza esta semana.\n\n` +
        `Quedamos atentos a su confirmación.`
      );
    case 'Ciclo 3':
      return (
        `Estimado/a ${tutor}:\n\n` +
        `Por acuerdo institucional le comunicamos que la cuenta de ${nombre} mantiene un adeudo formal de ${adeudo}. ` +
        `Han transcurrido ${diasAtraso} días de atraso; los recargos del 5% mensual continúan acumulándose conforme al reglamento. ` +
        `Requerimos un acuerdo de pago por escrito en los próximos 5 días hábiles.\n\n` +
        `Coordinación de Cobranza — Instituto Meridian`
      );
    case 'Ciclo 4':
    default:
      return (
        `Estimado/a ${tutor}:\n\n` +
        `ÚLTIMO AVISO antes de iniciar proceso de baja académica: el adeudo de ${nombre} es de ${adeudo} (${diasAtraso} días de mora). ` +
        `Debe regularizar o firmar convenio de última oportunidad en 48 horas. ` +
        `La coordinación académica será informada de no recibir respuesta.\n\n` +
        `Instituto Meridian — Cobranza`
      );
  }
}

export function previewSecuencia(paso: 0 | 1 | 2 | 3): string {
  const samples = [
    'Hola, le recordamos que hoy vence su colegiatura. Evite recargos pagando hoy mismo.',
    'Segundo recordatorio: aún no registramos su pago. ¿Necesita link de pago en línea?',
    'Aviso importante: adeudo acumulado. Regularice para mantener su lugar.',
    'Aviso final con estado de cuenta adjunto. Debe responder en 24 h o escalamos a dirección.',
  ];
  return samples[paso] ?? '';
}
