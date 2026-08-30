import CwfAuthGuard from '../CwfAuthGuard';

export default function CwfConversacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CwfAuthGuard>{children}</CwfAuthGuard>;
}
