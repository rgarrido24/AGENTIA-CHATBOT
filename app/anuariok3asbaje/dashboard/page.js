import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import AdminDashboard from './AdminDashboard';
import { ANUARIO_COOKIE, anuarioAdminPassword, anuarioPath } from '@/lib/anuario-k3/paths';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const expected = anuarioAdminPassword();
  const autenticado = expected && cookieStore.get(ANUARIO_COOKIE)?.value === expected;

  if (!autenticado) redirect(anuarioPath('/dashboard/login'));

  await connectDB();
  const alumnos = await Alumno.find().sort('nombreCorto').lean();

  return <AdminDashboard alumnos={JSON.parse(JSON.stringify(alumnos))} />;
}
