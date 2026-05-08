import { AdminDecisionForm } from '@/features/cleaner/components/AdminDecisionForm';

export const ApplicationActions = ({
  applicationId,
  currentState,
}: {
  applicationId: string;
  currentState: string;
}) => {
  return <AdminDecisionForm applicationId={applicationId} currentState={currentState} />;
};
