'use client';

import { TrustCallout } from '@/components/ui/trust-callout';

export const CheckrConsentForm = () => {
  return (
    <TrustCallout variant="warning" title="FCRA Consent">
      <p className="mt-1">
        This consent text is a placeholder and must be replaced after legal review.
      </p>
      <p className="mt-2 text-xs opacity-70">{'<!-- PENDING_LAWYER_REVIEW -->'}</p>
    </TrustCallout>
  );
};
