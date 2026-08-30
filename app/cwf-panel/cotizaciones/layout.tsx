import CwfAuthGuard from '../CwfAuthGuard';

export default function CwfCotizacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CwfAuthGuard>{children}</CwfAuthGuard>;
}
