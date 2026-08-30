/**
 * Sistema de Lealtad Digital
 * Cuenta visitas confirmadas por senderId+clientId y formatea el mensaje de puntos.
 * Cada 5 visitas = 1 servicio gratis.
 */
import { getMongoDb } from '../../lib/mongodb';

const VISITS_PER_REWARD = 5;

export async function getLoyaltyPoints(senderId: string, clientId: string): Promise<number> {
  const db = await getMongoDb();
  const count = await db.collection('appointments').countDocuments({
    senderId,
    clientId: clientId.trim().toLowerCase(),
    status: 'confirmed',
  });
  return count;
}

export function formatLoyaltyReply(totalVisits: number, senderName?: string): string {
  const cycle = totalVisits % VISITS_PER_REWARD;
  const completed = Math.floor(totalVisits / VISITS_PER_REWARD);
  const remaining = VISITS_PER_REWARD - cycle;
  const bar = '⬛'.repeat(cycle) + '⬜'.repeat(remaining);
  const name = senderName ? ` ${senderName.split(' ')[0]}` : '';
  const lines = [
    `✂️ *Mis Puntos de Lealtad*${name ? ` — Hola${name}!` : ''}`,
    ``,
    `Visitas totales: *${totalVisits}*`,
    `${bar} ${cycle}/${VISITS_PER_REWARD}`,
    ``,
  ];
  if (cycle === 0 && totalVisits > 0) {
    lines.push(`🏆 ¡Felicidades! Ya acumulaste *${completed}* servicio${completed > 1 ? 's' : ''} gratis.`);
    lines.push(`Dile al equipo en tu próxima visita para canjearlo 🎁`);
  } else if (remaining === 1) {
    lines.push(`🔥 ¡Solo te falta *1 visita* para tu próximo servicio gratis!`);
  } else {
    lines.push(`Te faltan *${remaining} visitas* para tu próximo servicio gratis 🎁`);
  }
  if (totalVisits === 0) {
    lines.push(`Aún no tienes visitas registradas. ¡Agenda tu primera cita y empieza a acumular!`);
  }
  return lines.join('\n');
}
