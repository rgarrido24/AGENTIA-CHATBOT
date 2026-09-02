import { redirect } from 'next/navigation';
import { ClientPanelApp } from '@/components/client-panel/ClientPanelApp';
import { isIzziClient } from '@/lib/izzi-panel';

export default function ClientPanelPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams?: { token?: string };
}) {
  const clientId = params.clientId.toLowerCase();
  if (isIzziClient(clientId)) {
    const token = typeof searchParams?.token === 'string' ? searchParams.token : '';
    if (token) {
      const q = new URLSearchParams({ clientId, token });
      redirect(`/api/izzi-panel/auth/from-panel-token?${q.toString()}`);
    }
    redirect('/izzi-panel/login');
  }
  return <ClientPanelApp clientId={clientId} />;
}
