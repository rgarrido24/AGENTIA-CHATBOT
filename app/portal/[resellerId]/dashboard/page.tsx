import { requireResellerAuth } from '@/lib/reseller-auth';
import { getMongoDb } from '@/lib/mongodb';
import type { ResellerClient } from '@/lib/reseller-auth';
import Link from 'next/link';
import Image from 'next/image';

export default async function DashboardPage({ params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const reseller = await requireResellerAuth(resellerId);

  const db  = await getMongoDb();
  const now = new Date();
  const hoy    = new Date(now); hoy.setHours(0, 0, 0, 0);
  const semana = new Date(now); semana.setDate(now.getDate() - 7);
  const mes    = new Date(now.getFullYear(), now.getMonth(), 1);

  const clients = await db
    .collection<ResellerClient>('reseller_clients')
    .find({ resellerId })
    .sort({ nombre: 1 })
    .toArray();

  const clientsWithStats = await Promise.all(
    clients.map(async (c) => {
      const base: Record<string, unknown> = c.legacyQuery
        ? { $or: [{ resellerId, clientSlug: c.clientSlug }, c.legacyQuery] }
        : { resellerId, clientSlug: c.clientSlug };
      const [total, leadsHoy] = await Promise.all([
        db.collection('leads').countDocuments(base),
        db.collection('leads').countDocuments({ ...base, createdAt: { $gte: hoy } }),
      ]);
      return { ...c, total, leadsHoy };
    })
  );

  const [statsHoy, statsSemana, statsMes] = await Promise.all([
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: hoy } }),
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: semana } }),
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: mes } }),
  ]);

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b px-4 py-3" style={{ background: '#000', borderColor: '#1a1a1a' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-agentia-2026.png" alt="Agentia" width={32} height={32} className="rounded-lg" />
            <div>
              <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>Portal Agentia</p>
              <p className="text-sm font-bold text-white">{reseller.nombre}</p>
            </div>
          </div>
          <a
            href={`/api/portal/auth/logout?resellerId=${resellerId}`}
            className="text-xs px-3 py-1.5 rounded-lg transition"
            style={{ background: '#111', color: '#555', border: '1px solid #222' }}
          >
            Cerrar sesión
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: '#555' }}>Resumen global</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Leads hoy',    value: statsHoy },
              { label: 'Esta semana',  value: statsSemana },
              { label: 'Este mes',     value: statsMes },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl p-4 text-center border"
                style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
              >
                <p className="text-2xl font-extrabold" style={{ color: '#22c55e' }}>{value}</p>
                <p className="text-[10px] mt-1" style={{ color: '#555' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Clients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: '#555' }}>Mis clientes</p>
            <Link
              href={`/portal/${resellerId}/clientes`}
              className="text-xs"
              style={{ color: '#22c55e' }}
            >
              Ver todos →
            </Link>
          </div>

          {clientsWithStats.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center border"
              style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
            >
              <p className="text-sm" style={{ color: '#444' }}>No tienes clientes aún.</p>
              <p className="text-xs mt-1" style={{ color: '#333' }}>Contacta a Agentia para agregar tu primer cliente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clientsWithStats.map((c) => (
                <Link
                  key={c.clientSlug}
                  href={`/portal/${resellerId}/cliente/${c.clientSlug}`}
                  className="flex items-center justify-between rounded-xl px-4 py-3 border transition"
                  style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{c.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>{c.negocio}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: '#22c55e' }}>{c.leadsHoy} hoy</p>
                      <p className="text-[10px]" style={{ color: '#444' }}>{c.total} total</p>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={c.status === 'activo'
                        ? { background: '#0d2200', color: '#22c55e' }
                        : { background: '#1a0000', color: '#ef4444' }}
                    >
                      {c.status}
                    </span>
                    <span style={{ color: '#333' }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
