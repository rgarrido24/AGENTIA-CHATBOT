import BriefPublicForm from './ui/BriefPublicForm';

export const dynamic = 'force-dynamic';

export default function BriefPublicPage({ params }: { params: { token: string } }) {
  return <BriefPublicForm token={params.token} />;
}

