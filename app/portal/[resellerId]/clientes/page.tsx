import { requireResellerAuth } from '@/lib/reseller-auth';
import { getMongoDb } from '@/lib/mongodb';
import type { ResellerClient } from '@/lib/reseller-auth';
import Link from 'next/link';
import Image from 'next/image';

export default async function ClientesPage({ params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const reseller = await requireResellerAuth(resellerId);

  const db  = await getMongoDb();
  const now = new Date();
  const hoy = new Date(now); hoy.setHours(0, 0, 0, 0);
  const mes = new Date(now.getFullYear(), now.getMonth(), 1);

  const clients = await db
    .collection<ResellerClient>('reseller_clients')
    .find({ resellerId })
    .sort({ nombre: 1 })
    .toArray();

  const rows = await Promise.all(
    clients.map(async (c) => {
      const base: Record<string, unknown> = c.legacyQuery
        ? { $or: [{ resellerId, clientSlug: c.clientSlug }, c.legacyQuery] }
        : { resellerId, clientSlug: c.clientSlug };
      const [total, leadsHoy, leadsMes] = await Promise.all([
        db.collection('leads').countDocuments(base),
        db.collection('leads').countDocuments({ ...base, createdAt: { $gte: hoy } }),
        db.collection('leads').countDocuments({ ...base, createdAt: { $gte: mes } }),
      ]);
      return { ...c, total, leadsHoy, leadsMes };
    })
  );

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <header className="sticky top-0 z-10 border-b px-4 py-3" style={{ background: '#000', borderColor: '#1a1a1a' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/portal/${resellerId}/dashboard`} className="text-xs" style={{ color: '#555' }}>
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <Image src="/logo-agentia-2026.png" alt="Agentia" width={24} height={24} className="rounded" />
            <p className="text-sm font-bold text-white">Mis clientes · {reseller.nombre}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {rows.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: '#444' }}>No tienes clientes registrados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((c) => (
              <Link
                key={c.clientSlug}
                href={`/portal/${resellerId}/cliente/${c.clientSlug}`}
                className="block rounded-xl border p-4 transition"
                style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{c.nombre}</p>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={c.status === 'activo'
                          ? { background: '#0d2200', color: '#22c55e' }
                          : { background: '#1a0000', color: '#ef4444' }}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>{c.negocio}</p>
                    <p className="text-xs mt-1.5" style={{ color: '#444' }}>
                      {c.formularios.filter((f) => f.activo).length} formulario(s) activo(s)
                    </p>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <div>
                      <span className="text-sm font-bold" style={{ color: '#22c55e' }}>{c.leadsHoy}</span>
                      <span className="text-[10px] ml-1" style={{ color: '#444' }}>hoy</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">{c.leadsMes}</span>
                      <span className="text-[10px] ml-1" style={{ color: '#444' }}>mes</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: '#666' }}>{c.total}</span>
                      <span className="text-[10px] ml-1" style={{ color: '#333' }}>total</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
