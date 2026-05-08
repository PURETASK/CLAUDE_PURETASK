import { notFound, redirect } from 'next/navigation';

type PageProps = { params: Promise<{ step: string }> };

const CleanerApplyStepAliasPage = async ({ params }: PageProps) => {
  const { step } = await params;
  const match = /^step-(\d+)$/.exec(step);
  if (!match) notFound();

  const stepNumber = Number(match[1]);
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 11) notFound();

  redirect(`/app/apply/step/${stepNumber}`);
};

export default CleanerApplyStepAliasPage;
