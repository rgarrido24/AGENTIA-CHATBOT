/**
 * Oferta "Buen Mes" (anual $1,990, primeros 50). Solo servidor.
 * El cupo se cuenta en Mongo: pagadas/activadas + reservas pendientes de las últimas 48 h.
 * Configurable: LEALTAD_PROMO_CUPO (default 50), LEALTAD_PROMO_FIN (ISO, default 30-nov-2026 23:59 CDMX),
 * LEALTAD_PROMO_ACTIVA=0 la apaga.
 */
import { getMongoDb } from '@/lib/mongodb';
import { PRECIO_PROMO_ANUAL, PRECIO_PROMO_MES, type Periodo, type PromoTipo } from '@/lib/lealtad-pricing';
import { SOLICITUDES } from '@/lib/lealtad-provision';

const RESERVA_MS = 48 * 3600 * 1000;

export function cupoPromo(): number {
  const n = Number(process.env.LEALTAD_PROMO_CUPO);
  return n > 0 ? Math.floor(n) : 50;
}
export function finPromo(): Date {
  const d = new Date(process.env.LEALTAD_PROMO_FIN || '2026-11-30T23:59:59-06:00');
  return Number.isNaN(d.getTime()) ? new Date('2026-11-30T23:59:59-06:00') : d;
}

export type EstadoPromo = { activa: boolean; restantes: number; cupo: number; precio: number; fin: string };

export async function estadoPromo(): Promise<EstadoPromo> {
  const cupo = cupoPromo();
  const fin = finPromo();
  const base = { cupo, precio: PRECIO_PROMO_ANUAL, fin: fin.toISOString() };
  if (process.env.LEALTAD_PROMO_ACTIVA === '0' || Date.now() > fin.getTime()) {
    return { ...base, activa: false, restantes: 0 };
  }
  const col = (await getMongoDb()).collection(SOLICITUDES);
  const desde = new Date(Date.now() - RESERVA_MS);
  const usados = await col.countDocuments({
    promo: true,
    $or: [
      { estado: { $in: ['pagado', 'activando', 'activada', 'aplicando', 'error_activacion', 'monto_no_coincide'] } },
      { estado: { $in: ['pendiente_pago', 'pendiente_spei'] }, createdAt: { $gt: desde } },
    ],
  });
  const restantes = Math.max(0, cupo - usados);
  return { ...base, activa: restantes > 0, restantes };
}

/** ¿Este negocio existente puede usar Buen Mes al renovar? Solo con cupo y una vez por negocio. */
export async function promoParaNegocio(tenantKey: string): Promise<boolean> {
  const ya = await (await getMongoDb())
    .collection(SOLICITUDES)
    .countDocuments({ tenantKey, promo: true, estado: { $in: ['pagado', 'activando', 'activada', 'aplicando'] } });
  if (ya > 0) return false;
  return (await estadoPromo()).activa;
}

/**
 * Primer mes a $199 (Buen Mes). Solo por fechas, sin cupo.
 * LEALTAD_PROMO_MES_INICIO / LEALTAD_PROMO_MES_FIN (ISO). Default: 14-nov-2026 00:00 a 30-nov-2026 23:59:59 CDMX.
 * LEALTAD_PROMO_MES_ACTIVA=0 la apaga.
 */
function fecha(raw: string | undefined, def: string): Date {
  const d = new Date(raw || def);
  return Number.isNaN(d.getTime()) ? new Date(def) : d;
}
export type EstadoPromoMes = { activa: boolean; precio: number; inicio: string; fin: string };

export function estadoPromoMes(): EstadoPromoMes {
  const inicio = fecha(process.env.LEALTAD_PROMO_MES_INICIO, '2026-11-14T00:00:00-06:00');
  const fin = fecha(process.env.LEALTAD_PROMO_MES_FIN, '2026-11-30T23:59:59-06:00');
  const ahora = Date.now();
  const activa = process.env.LEALTAD_PROMO_MES_ACTIVA !== '0' && ahora >= inicio.getTime() && ahora <= fin.getTime();
  return { activa, precio: PRECIO_PROMO_MES, inicio: inicio.toISOString(), fin: fin.toISOString() };
}

const PAGADOS = ['pagado', 'activando', 'activada', 'aplicando'];

/** Una vez por WhatsApp (altas) o por negocio (renovaciones). */
async function yaUsoPromoMes(filtro: Record<string, unknown>): Promise<boolean> {
  const n = await (await getMongoDb()).collection(SOLICITUDES).countDocuments({ ...filtro, promoMes: true, estado: { $in: PAGADOS } });
  return n > 0;
}

/** Qué oferta aplica a un alta nueva (checkout). */
export async function promoTipoAlta(periodo: Periodo, whatsapp: string): Promise<PromoTipo> {
  if (periodo === 'anual') return (await estadoPromo()).activa ? 'anual' : null;
  if (!estadoPromoMes().activa) return null;
  return (await yaUsoPromoMes({ whatsapp })) ? null : 'mes';
}

/** Qué oferta aplica a un negocio existente (renovación / paso de prueba a pago). */
export async function promoTipoNegocio(periodo: Periodo, tenantKey: string): Promise<PromoTipo> {
  if (periodo === 'anual') return (await promoParaNegocio(tenantKey)) ? 'anual' : null;
  if (!estadoPromoMes().activa) return null;
  return (await yaUsoPromoMes({ tenantKey })) ? null : 'mes';
}
