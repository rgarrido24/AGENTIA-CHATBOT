import AgentiaAuthGuard from '../AgentiaAuthGuard';

export default function AgentiaConversacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AgentiaAuthGuard>{children}</AgentiaAuthGuard>;
}
