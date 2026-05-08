import { redirect } from 'next/navigation';

type PageProps = { params: Promise<{ id: string }> };

const AdminApplicationDetailAliasPage = async ({ params }: PageProps) => {
  const { id } = await params;
  redirect(`/applications/${id}`);
};

export default AdminApplicationDetailAliasPage;
