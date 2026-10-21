import type { Metadata } from 'next';
import PublicForm from './PublicForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Formulario',
  robots: { index: false, follow: false },
};

export default function FormPage({ params }: { params: { slug: string } }) {
  return <PublicForm slug={params.slug} />;
}
