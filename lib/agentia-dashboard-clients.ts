import type { Db, Document } from 'mongodb';

function clientDedupKey(doc: Document): string {
  const id = doc.clientId != null && String(doc.clientId).trim() !== ''
    ? String(doc.clientId).trim()
    : '';
  if (id) return `cid:${id}`;
  return `oid:${String(doc._id)}`;
}

/**
 * `agentia_clients` es la colección canónica (Stripe webhook, upserts).
 * `agentia_clientes` quedó como nombre alterno en algunos datos manuales; se fusiona
 * en lectura del dashboard sin duplicar por `clientId`.
 */
export async function listMergedAgentiaClients(
  db: Db,
  options?: { projection?: Document }
): Promise<Document[]> {
  const cursorOpts = options?.projection ? { projection: options.projection } : {};
  const [main, legacy] = await Promise.all([
    db.collection('agentia_clients').find({}, cursorOpts).sort({ createdAt: -1 }).toArray(),
    db.collection('agentia_clientes').find({}, cursorOpts).sort({ createdAt: -1 }).toArray(),
  ]);

  const seen = new Set<string>();
  for (const c of main) {
    seen.add(clientDedupKey(c));
  }

  const extra = legacy.filter((l) => !seen.has(clientDedupKey(l)));

  return [...main, ...extra];
}
