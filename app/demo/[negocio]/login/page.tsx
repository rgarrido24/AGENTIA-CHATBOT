import { DemoLoginForm } from './DemoLoginForm';

type Props = { params: { negocio: string } };

export default function DemoLoginPage({ params }: Props) {
  return <DemoLoginForm negocio={params.negocio} />;
}
