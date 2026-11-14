import { EnlacesForm } from './EnlacesForm';

export default function EnlacesPage({ params }: { params: { negocio: string } }) {
  return <EnlacesForm tenantId={params.negocio} />;
}
