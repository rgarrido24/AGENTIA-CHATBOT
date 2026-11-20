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
async function createOnce(formId: string, pageToken: string): Promise<CreateTestLeadResult> {
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

/** Borra los leads de prueba (solo los creados por la API de pruebas) que Meta tenga en ese formulario. */
async function deleteExistingTestLeads(formId: string, pageToken: string): Promise<number> {
  const base = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;
  let borrados = 0;
  try {
    const r = await fetch(
      `${base}/${encodeURIComponent(formId)}/test_leads?access_token=${encodeURIComponent(pageToken)}`,
      { cache: 'no-store' },
    );
    const j = (await r.json().catch(() => ({}))) as { data?: Array<{ id?: string }> };
    for (const t of j.data || []) {
      if (!t.id) continue;
      const d = await fetch(`${base}/${encodeURIComponent(t.id)}?access_token=${encodeURIComponent(pageToken)}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      if (d.ok) borrados += 1;
    }
  } catch {
    /* si no se puede borrar, el reintento devolverá el error original */
  }
  return borrados;
}

/**
 * Crea un lead de prueba. Si Meta dice que ya existe uno para ese formulario (solo permite uno a la vez),
 * borra el anterior y vuelve a intentar una vez.
 */
export async function createMetaTestLead(formId: string, pageToken: string): Promise<CreateTestLeadResult> {
  const first = await createOnce(formId, pageToken);
  if (first.ok) return first;
  if (!/ya se cre|already (been )?created|test lead/i.test(first.error)) return first;
  const n = await deleteExistingTestLeads(formId, pageToken);
  if (!n) return first;
  return createOnce(formId, pageToken);
}
