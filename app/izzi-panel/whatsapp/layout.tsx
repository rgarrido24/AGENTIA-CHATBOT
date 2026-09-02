import IzziAuthGuard from '../IzziAuthGuard';

export default function IzziWhatsappLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IzziAuthGuard>{children}</IzziAuthGuard>;
}
