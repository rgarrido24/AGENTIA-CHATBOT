import { FB_GRAPH_VERSION } from '@/lib/facebook-lead-connect';

/**
 * Los leads de prueba que crea Meta (API `test_leads` o Lead Ads Testing Tool)
 * traen datos tipo "<test lead: dummy data for full_name>" en cada campo.
 */
export function isMetaTestLeadFields(fields: Record<string, string>): boolean {
  return Object.values(fields).some((v) => /<\s*test lead/i.test(String(v)));
}

export type CreateTestLeadResult = { ok: true } | { ok: false; error: string };

/** Crea un lead de prueba en un formulario (Meta lo entrega por el webhook como uno real). */
export async function createMetaTestLead(formId: string, pageToken: string): Promise<CreateTestLeadResult> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/${encodeURIComponent(formId)}/test_leads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ access_token: pageToken }).toString(),
        cache: 'no-store',
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; error_user_msg?: string; code?: number };
    };
    if (!res.ok || json.error) {
      const msg =
        json.error?.error_user_msg || json.error?.message || `Meta respondió ${res.status}`;
      return { ok: false, error: json.error?.code ? `#${json.error.code} ${msg}` : msg };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Error de red al llamar a Meta' };
  }
}
