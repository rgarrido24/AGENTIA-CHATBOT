import AgentiaAuthGuard from '../AgentiaAuthGuard';

export default function FacturacionLayout({ children }: { children: React.ReactNode }) {
  return <AgentiaAuthGuard>{children}</AgentiaAuthGuard>;
}
