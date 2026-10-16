import SabucanAuthGuard from '@/app/sabucan/SabucanAuthGuard';
import { BannerClient } from './BannerClient';

export const metadata = {
  title: 'SABUCAN · Banner de lealtad',
  description: 'Genera e imprime el banner del programa de lealtad',
};

export default function BannerPage() {
  return (
    <SabucanAuthGuard from="/sabucan/banner">
      <BannerClient />
    </SabucanAuthGuard>
  );
}
