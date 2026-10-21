import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { normalizeAddons } from '@/lib/client-addons';
import { WA_ACCOUNTS, WA_MESSAGES } from '@/lib/wa-accounts';

export const dynamic = 'force-dynamic';

/**
 * Resumen de cobranza por revendedor (solo admin, protegido por middleware en /api/admin).
 * Cuenta clientes y add-ons activos; el monto se calcula en pantalla con las tarifas que fije el admin.
 */
export async function GET() {
  const db = await getMongoDb();
  const from = new Date();
  from.setUTCDate(1);
  from.setUTCHours(0, 0, 0, 0);

  const [resellers, clients, accounts, msgs, forms] = await Promise.all([
    db.collection('leads').find({ _collection_type: 'reseller' }, { projection: { resellerId: 1, nombre: 1, brandName: 1, status: 1 } }).toArray(),
    db
      .collection('leads')
      .find(
        { _collection_type: 'reseller_client' },
        { projection: { resellerId: 1, clientSlug: 1, nombre: 1, negocio: 1, status: 1, addons: 1, 'fb_connection.status': 1, createdAt: 1 } },
      )
      .toArray(),
    db.collection(WA_ACCOUNTS).find({}, { projection: { resellerId: 1, clientSlug: 1, displayPhone: 1, status: 1, qualityRating: 1, lastError: 1 } }).toArray(),
    db
      .collection(WA_MESSAGES)
      .aggregate<{ _id: { r: string; c: string }; n: number }>([
        { $match: { direction: 'out', createdAt: { $gte: from } } },
        { $group: { _id: { r: '$resellerId', c: '$clientSlug' }, n: { $sum: 1 } } },
      ])
      .toArray(),
    db.collection('wa_forms').aggregate<{ _id: { r: string; c: string }; n: number }>([{ $group: { _id: { r: '$resellerId', c: '$clientSlug' }, n: { $sum: 1 } } }]).toArray(),
  ]);

  const key = (r: string, c: string) => `${r}|${c}`;
  const accBy = new Map(accounts.map((a) => [key(String(a.resellerId), String(a.clientSlug)), a]));
  const msgBy = new Map(msgs.map((m) => [key(m._id.r, m._id.c), m.n]));
  const formBy = new Map(forms.map((f) => [key(f._id.r, f._id.c), f.n]));

  const out = resellers.map((r) => {
    const rid = String(r.resellerId);
    const mine = clients.filter((c) => String(c.resellerId) === rid);
    const detail = mine.map((c) => {
      const addons = normalizeAddons(c.addons);
      const acc = accBy.get(key(rid, String(c.clientSlug)));
      return {
        clientSlug: String(c.clientSlug),
        nombre: String(c.nombre ?? c.clientSlug),
        status: String(c.status ?? ''),
        fbNative: c.fb_connection?.status === 'connected',
        whatsappApi: addons.whatsappApi,
        forms: addons.forms,
        waNumber: acc?.displayPhone ? String(acc.displayPhone) : '',
        waStatus: acc ? String(acc.status) : '',
        waQuality: acc?.qualityRating ? String(acc.qualityRating) : '',
        waError: acc?.lastError ? String(acc.lastError) : '',
        messagesMonth: msgBy.get(key(rid, String(c.clientSlug))) ?? 0,
        formsCount: formBy.get(key(rid, String(c.clientSlug))) ?? 0,
      };
    });
    return {
      resellerId: rid,
      nombre: String(r.brandName ?? r.nombre ?? rid),
      totals: {
        clients: detail.length,
        activos: detail.filter((d) => d.status === 'activo').length,
        fbNative: detail.filter((d) => d.fbNative).length,
        whatsappApi: detail.filter((d) => d.whatsappApi).length,
        forms: detail.filter((d) => d.forms).length,
        both: detail.filter((d) => d.whatsappApi && d.forms).length,
      },
      detail,
    };
  });

  return NextResponse.json({ ok: true, month: from.toISOString().slice(0, 7), resellers: out });
}
