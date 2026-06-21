import { notFound, redirect } from 'next/navigation';

import { ApplicationReview } from '@/features/cleaner/components/ApplicationReview';
import { ApplicationStep1 } from '@/features/cleaner/components/ApplicationStep1';
import { ApplicationStep10 } from '@/features/cleaner/components/ApplicationStep10';
import { ApplicationStep2 } from '@/features/cleaner/components/ApplicationStep2';
import { ApplicationStep3 } from '@/features/cleaner/components/ApplicationStep3';
import { ApplicationStep4 } from '@/features/cleaner/components/ApplicationStep4';
import { ApplicationStep5 } from '@/features/cleaner/components/ApplicationStep5';
import { ApplicationStep6 } from '@/features/cleaner/components/ApplicationStep6';
import { ApplicationStep7 } from '@/features/cleaner/components/ApplicationStep7';
import { ApplicationStep8 } from '@/features/cleaner/components/ApplicationStep8';
import { ApplicationStep9 } from '@/features/cleaner/components/ApplicationStep9';
import { StepIndicator } from '@/features/cleaner/components/StepIndicator';
import { getMyApplication } from '@/features/cleaner/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ step: string }> };

const VALID_STEPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
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
      {step === '5' && (
        <ApplicationStep5
          defaultValues={{
            identity_status:
              (d.identity_status as 'pending' | 'verified' | 'requires_input') ?? 'pending',
          }}
        />
      )}
      {step === '6' && (
        <ApplicationStep6
          defaultValues={{
            background_check_status:
              (d.background_check_status as
                | 'requested'
                | 'pending'
                | 'in_progress'
                | 'clear'
                | 'consider') ?? 'requested',
          }}
        />
      )}
      {step === '7' && (
        <ApplicationStep7
          defaultValues={{
            stripe_connect_completed: (d.stripe_connect_completed as boolean) ?? false,
            pending_stripe_account_id: (d.pending_stripe_account_id as string) ?? '',
          }}
        />
      )}
      {step === '8' && (
        <ApplicationStep8
          defaultValues={{
            legal_name: (d.legal_name as string) ?? '',
            tax_classification:
              (d.tax_classification as 'sole_proprietor' | 'llc' | 'corporation' | 'partnership') ??
              'sole_proprietor',
            tax_id_last4: (d.tax_id_last4 as string) ?? '',
          }}
        />
      )}
      {step === '9' && (
        <ApplicationStep9
          defaultValues={{
            photo_training_completed: (d.photo_training_completed as boolean) ?? false,
          }}
        />
      )}
      {step === '10' && (
        <ApplicationStep10
          defaultValues={{
            ready_to_submit: (d.ready_to_submit as boolean) ?? false,
          }}
        />
      )}
      {step === '11' && <ApplicationReview applicationData={d} />}
    </div>
  );
};

export default ApplyStepPage;
