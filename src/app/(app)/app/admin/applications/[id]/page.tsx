import { redirect } from 'next/navigation';

type PageProps = { params: Promise<{ id: string }> };

const AdminApplicationDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;
  redirect(`/applications/${id}`);
};

export default AdminApplicationDetailPage;
