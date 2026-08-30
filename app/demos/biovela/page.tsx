import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'La Rueda Veladoras | Redirigiendo…',
  robots: { index: false, follow: true },
};

export default function BiovelaDemoRedirectPage() {
  redirect('/biovela');
}
