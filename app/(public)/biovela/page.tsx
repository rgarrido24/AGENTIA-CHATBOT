import { BIOVELA_CATALOG } from '@/lib/biovela-catalog';
import { BiovelaCatalogLanding } from './BiovelaCatalogLanding';

export default function BiovelaCatalogPage() {
  return <BiovelaCatalogLanding catalog={BIOVELA_CATALOG} />;
}
