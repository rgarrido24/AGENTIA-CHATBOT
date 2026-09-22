import Link from 'next/link';
import { requireResellerAuth } from '@/lib/reseller-auth';
import {
  FB_OAUTH_SESSION_COOKIE,
  fbConnectUserMessage,
  loadOauthSession,
} from '@/lib/facebook-lead-connect';
import { cookies } from 'next/headers';
import FacebookPageSelector from './FacebookPageSelector';

export const dynamic = 'force-dynamic';

export default async function FacebookConectarPage({
  params,
  searchParams,
}: {
  params: { resellerId: string };
  searchParams: { clientSlug?: string };
}) {
  const { resellerId } = params;
  await requireResellerAuth(resellerId);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(FB_OAUTH_SESSION_COOKIE)?.value || '';
  const session = await loadOauthSession(sessionId);
  const clientSlug = searchParams.clientSlug || session?.clientSlug || '';

  if (!session || session.resellerId !== resellerId || (clientSlug && session.clientSlug !== clientSlug)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#000' }}>
        <div className="max-w-md text-center space-y-3">
          <p className="text-sm text-white font-semibold">La sesión de Facebook venció</p>
          <p className="text-xs text-slate-400">{fbConnectUserMessage('expired')}</p>
          <Link href={`/portal/${resellerId}/clientes`} className="inline-block text-xs text-lime-400 underline">
            Volver a mis clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FacebookPageSelector
      resellerId={resellerId}
      clientSlug={session.clientSlug}
      pages={session.pages.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
