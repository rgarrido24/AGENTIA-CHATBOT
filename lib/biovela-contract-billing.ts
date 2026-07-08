export const BIOVELA_SETUP_MXN = 5000;
export const BIOVELA_MONTHLY_MXN = 999;
export const BIOVELA_PRORATE_END = new Date(2026, 6, 31); // 31 julio 2026
export const BIOVELA_RECURRING_START_LABEL = '1 de agosto de 2026';

/** Primer mes prorateado: fecha de firma → 31 jul 2026 */
export function calcBiovelaProrateMx(signDate: Date): number {
  const start = new Date(signDate.getFullYear(), signDate.getMonth(), signDate.getDate());
  const end = new Date(
    BIOVELA_PRORATE_END.getFullYear(),
    BIOVELA_PRORATE_END.getMonth(),
    BIOVELA_PRORATE_END.getDate()
  );

  if (start > end) return 0;

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const daysRemaining = end.getDate() - start.getDate() + 1;
    return Math.round((daysRemaining / daysInMonth) * BIOVELA_MONTHLY_MXN);
  }

  const msDay = 86_400_000;
  const totalDays = Math.floor((end.getTime() - start.getTime()) / msDay) + 1;
  return Math.round((totalDays / 30) * BIOVELA_MONTHLY_MXN);
}

export function formatMxDate(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatMxMoney(amount: number): string {
  return `$${amount.toLocaleString('es-MX')} MXN`;
}
