import type { Alumno } from '@/lib/mock-data-cobranza';

export type FactorRiesgo = { label: string; puntos: number };

export function factoresRiesgo(al: Alumno): FactorRiesgo[] {
  const out: FactorRiesgo[] = [];
  const cn = Number.parseInt(al.ciclo.replace(/\D/g, ''), 10) || 1;
  if (cn === 1) out.push({ label: 'Ciclo académico (Ciclo 1)', puntos: 20 });
  else if (cn === 2) out.push({ label: 'Ciclo académico (Ciclo 2)', puntos: 10 });
  else if (cn === 3) out.push({ label: 'Ciclo académico (Ciclo 3)', puntos: 0 });
  else out.push({ label: 'Ciclo académico (Ciclo 4)', puntos: -30 });

  const d = al.diasAtraso;
  if (d === 0) out.push({ label: 'Días de atraso (al corriente)', puntos: 15 });
  else if (d <= 30) out.push({ label: 'Días de atraso (1–30)', puntos: 5 });
  else if (d <= 60) out.push({ label: 'Días de atraso (31–60)', puntos: -10 });
  else out.push({ label: 'Días de atraso (>60)', puntos: -20 });

  const omisiones = al.historialPagos.filter((h) => h.status === 'omitido').length;
  const pagados = al.historialPagos.filter((h) => h.status === 'pagado').length;
  if (pagados >= 10) out.push({ label: 'Historial: mayoría de pagos completos', puntos: 15 });
  out.push({ label: `Historial: omisiones (${omisiones})`, puntos: -10 * omisiones });

  out.push({ label: 'Inscripción activa', puntos: 8 });

  return out;
}

export function labelScore(score: number): { label: string; color: string } {
  if (score > 70) return { label: 'BAJO', color: 'text-emerald-400' };
  if (score >= 40) return { label: 'MEDIO', color: 'text-amber-300' };
  if (score >= 20) return { label: 'ALTO', color: 'text-orange-400' };
  return { label: 'CRÍTICO', color: 'text-red-400' };
}

export function recomendacionIA(score: number): string {
  if (score > 70) return 'Bajo riesgo. Mantener seguimiento mensual estándar.';
  if (score >= 40) return 'Riesgo medio. Contactar esta semana con opción de plan de pagos.';
  if (score >= 20) return 'Riesgo alto. Prioridad de contacto hoy. Ofrecer parcialidades.';
  return 'Riesgo crítico. Escalar a dirección. Última gestión antes de baja.';
}

/** Barra visual: &gt;70 verde, 40–70 amarillo, &lt;40 rojo */
export function barColorScore(score: number): string {
  if (score > 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}
