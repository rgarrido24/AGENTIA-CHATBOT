import SabucanAuthGuard from '@/app/sabucan/SabucanAuthGuard';
import { EnlacesForm } from '@/app/n/[negocio]/enlaces/EnlacesForm';

export const metadata = { title: 'SABUCAN · Mi link para redes' };

export default function SabucanEnlacesPage() {
  return (
    <SabucanAuthGuard from="/sabucan/enlaces">
      <EnlacesForm tenantId="sabucan" />
    </SabucanAuthGuard>
  );
}
