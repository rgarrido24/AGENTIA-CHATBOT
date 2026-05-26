import { redirect } from 'next/navigation';

/** Alias de ruta: misma vista que `/dashboard/pipeline`. */
export default function IzziDashboardAliasPage() {
  redirect('/dashboard/pipeline');
}
