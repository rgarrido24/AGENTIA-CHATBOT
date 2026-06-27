import { bridgeSendMessage } from '@/lib/baileys-bridge-client';
import type { PanelConversation } from '@/lib/client-panel-store';
import { getLastConsultedProduct } from '@/lib/biovela-followup';

export const BIOVELA_SALE_ALERT_PHONE = '525534489552';
export const BIOVELA_PANEL_URL = 'https://agentia.software/clientes/biovela/panel';

function displayClientName(conv: PanelConversation): string {
  const name = String(conv.contactName || '').trim();
  if (name && name !== conv.phone) return name;
  return conv.phone || 'Cliente';
}

function displayPhone(phone: string): string {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `+52 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 12 && digits.startsWith('52')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  }
  return phone || '—';
}

export function buildBiovelaSaleClosedMessage(conv: PanelConversation): string {
  const interest = getLastConsultedProduct(conv);
  return (
    '🕯 Nueva venta cerrada!\n' +
    `Cliente: ${displayClientName(conv)}\n` +
    `Teléfono: ${displayPhone(conv.phone)}\n` +
    `Interés: ${interest}\n` +
    `Ver conversación: ${BIOVELA_PANEL_URL}`
  );
}

export async function notifyBiovelaSaleClosed(conv: PanelConversation): Promise<void> {
  const message = buildBiovelaSaleClosedMessage(conv);
  await bridgeSendMessage('biovela', BIOVELA_SALE_ALERT_PHONE, message);
}
