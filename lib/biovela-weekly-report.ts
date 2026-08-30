import { getMongoDb } from '@/lib/mongodb';
import { bridgeSendMessage } from '@/lib/baileys-bridge-client';
import type { PanelConversation, PanelMessage } from '@/lib/client-panel-store';
import { BIOVELA_CATALOG } from '@/lib/biovela-catalog';

const CLIENT_ID = 'biovela';
const COLLECTION = 'conversations';
const TIMEZONE = 'America/Mexico_City';
export const BIOVELA_WEEKLY_REPORT_PHONE = '525560556287';
export const BIOVELA_PANEL_URL = 'https://agentia.software/clientes/biovela/panel';

export type BiovelaWeeklyReportStats = {
  weekStart: Date;
  weekEnd: Date;
  conversations: number;
  ventasCerradas: number;
  pedidosEnviados: number;
  entregasConfirmadas: number;
  avgResponseMin: number;
  topProducts: Array<{ name: string; count: number }>;
};

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getBiovelaWeeklyRange(now = new Date()): { start: Date; end: Date } {
  const end = now;
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function messageAt(msg: PanelMessage): Date {
  return msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt);
}

function countProductMentions(text: string, counts: Map<string, number>): void {
  const lower = text.toLowerCase();
  for (const p of BIOVELA_CATALOG) {
    const name = p.name.trim();
    if (name.length < 4) continue;
    if (lower.includes(name.toLowerCase())) {
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
}

function computeAvgResponseMin(conversations: PanelConversation[], start: Date, end: Date): number {
  let totalMs = 0;
  let pairs = 0;

  for (const conv of conversations) {
    const msgs = [...(conv.messages || [])].sort(
      (a, b) => messageAt(a).getTime() - messageAt(b).getTime(),
    );
    for (let i = 0; i < msgs.length - 1; i++) {
      const userAt = messageAt(msgs[i]);
      const botAt = messageAt(msgs[i + 1]);
      if (userAt < start || userAt > end) continue;
      if (msgs[i].role !== 'user' || msgs[i + 1].role !== 'bot') continue;
      const delta = botAt.getTime() - userAt.getTime();
      if (delta > 0 && delta < 30 * 60 * 1000) {
        totalMs += delta;
        pairs += 1;
      }
    }
  }

  if (pairs === 0) return 0;
  return Math.round(totalMs / pairs / 60000);
}

function collectTopProducts(conversations: PanelConversation[], start: Date, end: Date): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();

  for (const conv of conversations) {
    for (const msg of conv.messages || []) {
      const at = messageAt(msg);
      if (at < start || at > end) continue;

      if (msg.productCard?.name?.trim()) {
        const name = msg.productCard.name.trim();
        counts.set(name, (counts.get(name) || 0) + 1);
      }

      if (msg.role === 'user' && msg.content?.trim()) {
        countProductMentions(msg.content, counts);
      }
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export async function computeBiovelaWeeklyReport(now = new Date()): Promise<BiovelaWeeklyReportStats> {
  const { start, end } = getBiovelaWeeklyRange(now);
  const db = await getMongoDb();

  const conversations = await db
    .collection<PanelConversation>(COLLECTION)
    .find({
      clientId: CLIENT_ID,
      updatedAt: { $gte: start, $lte: end },
    })
    .toArray();

  const ventasCerradas = conversations.filter((c) => c.stage === 'venta_cerrada').length;
  const pedidosEnviados = conversations.filter((c) => c.stage === 'pedido_enviado').length;
  const entregasConfirmadas = conversations.filter((c) => c.stage === 'entregado').length;

  return {
    weekStart: start,
    weekEnd: end,
    conversations: conversations.length,
    ventasCerradas,
    pedidosEnviados,
    entregasConfirmadas,
    avgResponseMin: computeAvgResponseMin(conversations, start, end),
    topProducts: collectTopProducts(conversations, start, end),
  };
}

export function buildBiovelaWeeklyReportMessage(stats: BiovelaWeeklyReportStats): string {
  const from = formatDateLabel(stats.weekStart);
  const to = formatDateLabel(stats.weekEnd);

  const productLines =
    stats.topProducts.length > 0
      ? stats.topProducts
          .map((p, i) => `${i + 1}. ${p.name} - ${p.count} ${p.count === 1 ? 'vez' : 'veces'}`)
          .join('\n')
      : '1. — sin datos\n2. —\n3. —';

  return (
    '📊 Reporte semanal La Rueda Veladoras\n' +
    `Semana del ${from} al ${to}\n\n` +
    `💬 Conversaciones: ${stats.conversations}\n` +
    `✅ Ventas cerradas: ${stats.ventasCerradas}\n` +
    `📦 Pedidos enviados: ${stats.pedidosEnviados}\n` +
    `🤝 Entregas confirmadas: ${stats.entregasConfirmadas}\n` +
    `⏱ Tiempo promedio respuesta: ${stats.avgResponseMin} min\n\n` +
    'Productos más consultados:\n' +
    `${productLines}\n\n` +
    `Panel: ${BIOVELA_PANEL_URL}`
  );
}

export async function sendBiovelaWeeklyReport(now = new Date()): Promise<{
  stats: BiovelaWeeklyReportStats;
  message: string;
}> {
  const stats = await computeBiovelaWeeklyReport(now);
  const message = buildBiovelaWeeklyReportMessage(stats);
  await bridgeSendMessage(CLIENT_ID, BIOVELA_WEEKLY_REPORT_PHONE, message);
  return { stats, message };
}
