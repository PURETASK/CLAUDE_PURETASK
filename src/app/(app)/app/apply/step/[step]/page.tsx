import { notFound, redirect } from 'next/navigation';

import { ApplicationReview } from '@/features/cleaner/components/ApplicationReview';
import { ApplicationStep1 } from '@/features/cleaner/components/ApplicationStep1';
import { ApplicationStep2 } from '@/features/cleaner/components/ApplicationStep2';
import { ApplicationStep3 } from '@/features/cleaner/components/ApplicationStep3';
import { ApplicationStep4 } from '@/features/cleaner/components/ApplicationStep4';
import { StepIndicator } from '@/features/cleaner/components/StepIndicator';
import { getMyApplication } from '@/features/cleaner/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ step: string }> };

const VALID_STEPS = ['1', '2', '3', '4', '5'];

const ApplyStepPage = async ({ params }: PageProps) => {
  const { step } = await params;
  if (!VALID_STEPS.includes(step)) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const application = await getMyApplication();
  if (!application) redirect('/app/apply');
  if (application.state !== 'draft') redirect('/app/apply/status');

  const d = (application.application_data ?? {}) as Record<string, unknown>;

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <StepIndicator current={Number(step)} />

      {step === '1' && (
        <ApplicationStep1
          defaultValues={{
            home_zip: (d.home_zip as string) ?? '',
            travel_radius_miles: (d.travel_radius_miles as number) ?? 20,
          }}
        />
      )}
      {step === '2' && (
        <ApplicationStep2
          defaultValues={{
            years_experience: (d.years_experience as number) ?? 0,
            service_types:
              (d.service_types as ('standard' | 'deep' | 'move_out' | 'airbnb')[]) ?? [],
          }}
        />
      )}
      {step === '3' && (
        <ApplicationStep3
          defaultValues={{ why_puretask_text: (d.why_puretask_text as string) ?? '' }}
        />
      )}
      {step === '4' && (
        <ApplicationStep4
          defaultValues={{ etiquette_acknowledged: (d.etiquette_acknowledged as boolean) ?? false }}
        />
      )}
      {step === '5' && <ApplicationReview applicationData={d} />}
    </div>
  );
};

export default ApplyStepPage;
