import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DemoFotosEscuelaPage() {
  redirect('/demo-fotos-escuela/index.html');
}

