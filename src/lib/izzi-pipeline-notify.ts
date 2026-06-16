import { enqueueOutbound } from './outbound-queue';

/**
 * Alerta WhatsApp al número configurado cuando entra el primer mensaje de un lead Izzi nuevo.
 * El bridge `izzi` envía el mensaje a `IZZI_PIPELINE_ALERT_WHATSAPP` (default 529844927769).
 */
export async function notifyIzziNewLeadWhatsApp(params: {
  senderName?: string;
  senderId?: string;
  botActive: boolean;
}): Promise<void> {
  const raw = (process.env.IZZI_PIPELINE_ALERT_WHATSAPP || '529844927769').replace(/\D/g, '');
  if (raw.length < 10) {
    console.warn('[izzi-pipeline-notify] IZZI_PIPELINE_ALERT_WHATSAPP inválido o ausente');
    return;
  }
  const senderJid = `${raw}@c.us`;
  const nombre = (params.senderName || 'SIN NOMBRE').toUpperCase();
  const wa = (params.senderId || '').replace(/@.*$/, '').replace(/\D/g, '') || 'N/D';
  const hora = new Date().toLocaleString('es-MX', {
    timeZone: 'America/Merida',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const botLine = params.botActive ? 'Estado bot: Activo ✅' : 'Estado bot: Pausado ⏸';
  const message =
    `🔔 NUEVO LEAD IZZI\n` +
    `NOMBRE: ${nombre}\n` +
    `WHATSAPP: ${wa}\n` +
    `HORA: ${hora}\n` +
    botLine;

  await enqueueOutbound({
    senderId: senderJid,
    clientId: 'izzi',
    message,
    type: 'manual',
    delaySeconds: 8,
  });
}
