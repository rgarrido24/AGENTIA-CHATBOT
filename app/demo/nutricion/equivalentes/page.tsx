import { parseSMAE } from '@/lib/parse-smae';
import EquivalentesClient from './EquivalentesClient';

export default function EquivalentesPage() {
  const grupos = parseSMAE();
  return <EquivalentesClient grupos={grupos} />;
}
