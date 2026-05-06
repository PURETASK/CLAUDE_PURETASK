import { redirect } from 'next/navigation';

import { ApplicationStatus } from '@/features/cleaner/components/ApplicationStatus';
import { getMyApplication } from '@/features/cleaner/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ApplyStatusPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const application = await getMyApplication();
  if (!application) redirect('/app/apply');
  if (application.state === 'draft') redirect('/app/apply/step/1');

  return (
    <div className="max-w-lg">
      <ApplicationStatus
        state={application.state}
        applicationNumber={application.application_number}
        submittedAt={application.submitted_at}
        rejectionReason={application.rejection_reason}
        infoRequestMessage={application.info_request_message}
      />
    </div>
  );
};

export default ApplyStatusPage;
