import { notFound } from 'next/navigation';
import { isDemoNegocio } from '@/lib/wallet-tenant';
import { DemoLoginForm } from './DemoLoginForm';

type Props = { params: { negocio: string } };

export default function DemoLoginPage({ params }: Props) {
  if (!isDemoNegocio(params.negocio)) notFound();
  return <DemoLoginForm negocio={params.negocio} />;
}
