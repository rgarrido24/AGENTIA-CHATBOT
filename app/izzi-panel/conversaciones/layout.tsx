import IzziAuthGuard from '../IzziAuthGuard';

export default function IzziConversacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IzziAuthGuard>{children}</IzziAuthGuard>;
}
