import { TenantLoginForm } from './TenantLoginForm';

type Props = { params: { negocio: string } };

export default function DemoLoginPage({ params }: Props) {
  return <TenantLoginForm negocio={params.negocio} />;
}
