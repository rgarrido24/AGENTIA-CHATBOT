/** Cliente mínimo de Mercado Pago (Checkout Pro) por REST. Solo servidor. */
import { createHmac, timingSafeEqual } from 'crypto';

const API = 'https://api.mercadopago.com';

export function mpToken(): string | null {
  return process.env.MP_ACCESS_TOKEN?.trim() || null;
}

export type MpPreferenceInput = {
  title: string;
  amount: number;
  reference: string;
  notificationUrl: string;
  backUrl: string;
  /** SPEI/OXXO: sin tarjetas. Tarjeta: sin efectivo ni transferencia. */
  metodo: 'efectivo_transferencia' | 'tarjeta';
  payerName?: string;
};

export async function crearPreferencia(i: MpPreferenceInput): Promise<{ id: string; initPoint: string }> {
  const token = mpToken();
  if (!token) throw new Error('MP_ACCESS_TOKEN no configurado');

  const excluded =
    i.metodo === 'tarjeta'
      ? [{ id: 'ticket' }, { id: 'bank_transfer' }, { id: 'atm' }]
      : [{ id: 'credit_card' }, { id: 'debit_card' }];

  const res = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: 'lealtad', title: i.title, quantity: 1, currency_id: 'MXN', unit_price: i.amount }],
      external_reference: i.reference,
      notification_url: i.notificationUrl,
      back_urls: { success: i.backUrl, pending: i.backUrl, failure: i.backUrl },
      auto_return: 'approved',
      statement_descriptor: 'AGENTIA',
      payment_methods: { excluded_payment_types: excluded },
      ...(i.payerName ? { payer: { name: i.payerName } } : {}),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; init_point?: string; message?: string };
  if (!res.ok || !data.init_point || !data.id) {
    throw new Error(`Mercado Pago ${res.status}: ${data.message ?? 'sin detalle'}`);
  }
  return { id: data.id, initPoint: data.init_point };
}

export type MpPayment = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_type_id?: string;
};

/** Fuente de verdad: se consulta el pago directo a Mercado Pago (no se confía en el cuerpo del webhook). */
export async function obtenerPago(id: string): Promise<MpPayment | null> {
  const token = mpToken();
  if (!token) return null;
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as MpPayment;
}

/** Valida x-signature si MP_WEBHOOK_SECRET está configurado. Sin secreto → true (se confía en obtenerPago). */
export function firmaValida(req: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  const header = req.headers.get('x-signature') ?? '';
  const requestId = req.headers.get('x-request-id') ?? '';
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k?.trim(), v?.trim()];
    }),
  ) as Record<string, string>;
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  return expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
