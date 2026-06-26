import { ClientPanelApp } from '@/components/client-panel/ClientPanelApp';

export default function ClientPanelPage({ params }: { params: { clientId: string } }) {
  return <ClientPanelApp clientId={params.clientId.toLowerCase()} />;
}
