import { notFound, redirect } from 'next/navigation';
import { isDemoNegocio } from '@/lib/wallet-tenant';

type Props = { params: { negocio: string } };

export default function DemoNegocioPage({ params }: Props) {
  if (!isDemoNegocio(params.negocio)) notFound();
  redirect(`/demo/${params.negocio}/caja`);
}
