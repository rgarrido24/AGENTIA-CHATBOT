/** SABUCAN — Google Wallet loyalty helpers (server-only secrets) */

export {
  POINTS_RATE,
  calcularPuntos,
} from '@/lib/wallet-sabucan-points';

export const SABUCAN_WALLET_CLASS_SUFFIX = 'sabucan_lealtad';

const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

export type GoogleWalletServiceAccount = {
  client_email: string;
  private_key: string;
};

export function getWalletIssuerId(): string | null {
  const id = (process.env.GOOGLE_WALLET_ISSUER_ID ?? '').trim();
  return id || null;
}

export function getWalletServiceAccount(): GoogleWalletServiceAccount | null {
  const raw = (process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON ?? '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GoogleWalletServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, '\n'),
    };
  } catch {
    return null;
  }
}

export function sabucanClassId(issuerId: string): string {
  return `${issuerId}.${SABUCAN_WALLET_CLASS_SUFFIX}`;
}

export function sabucanObjectId(issuerId: string, clienteId: string): string {
  const safe = String(clienteId).replace(/[^a-zA-Z0-9_-]/g, '-');
  return `${issuerId}.sabucan-${safe}`;
}

async function getWalletAccessToken(): Promise<string | null> {
  const sa = getWalletServiceAccount();
  if (!sa) return null;
  try {
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key,
      },
      scopes: [WALLET_SCOPE],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token ?? null;
  } catch (e) {
    console.warn(
      '[wallet-sabucan] access token:',
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

/**
 * Actualiza el saldo del loyalty object ya guardado en Google Wallet.
 * Si el pase no existe (cliente nunca lo agregó), falla en silencio.
 */
export async function actualizarPaseWallet(
  objectId: string,
  puntosNuevos: number,
): Promise<boolean> {
  const id = String(objectId ?? '').trim();
  if (!id) return false;

  const balance = Math.max(0, Number(puntosNuevos) || 0);
  const balanceStr = (Math.round(balance * 10) / 10).toFixed(1);

  try {
    const accessToken = await getWalletAccessToken();
    if (!accessToken) return false;

    const url = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loyaltyPoints: {
          balance: { string: balanceStr },
        },
      }),
    });

    if (!res.ok) {
      // 404 = pase no instalado aún — esperado y silencioso
      if (res.status !== 404) {
        const body = await res.text().catch(() => '');
        console.warn(
          `[wallet-sabucan] PATCH ${res.status} object=${id}`,
          body.slice(0, 300),
        );
      }
      return false;
    }
    return true;
  } catch (e) {
    console.warn(
      '[wallet-sabucan] actualizarPaseWallet:',
      e instanceof Error ? e.message : e,
    );
    return false;
  }
}

/** Construye objectId del cliente y hace PATCH; nunca lanza. */
export async function syncSabucanWalletPuntos(
  clienteId: string,
  puntosNuevos: number,
): Promise<void> {
  try {
    const issuerId = getWalletIssuerId();
    if (!issuerId || !clienteId) return;
    const objectId = sabucanObjectId(issuerId, clienteId);
    await actualizarPaseWallet(objectId, puntosNuevos);
  } catch (e) {
    console.warn(
      '[wallet-sabucan] syncSabucanWalletPuntos:',
      e instanceof Error ? e.message : e,
    );
  }
}
