import { cookies } from 'next/headers';
import { DecoHouseLogin } from './ui/DecoHouseLogin';
import { DecoHouseClientApp } from './ui/DecoHouseClientApp';

export const dynamic = 'force-dynamic';

export default function DecoHousePage() {
  const token = cookies().get('decohouse_auth')?.value;
  if (token !== '1') return <DecoHouseLogin />;
  return <DecoHouseClientApp />;
}

