'use client';

export const CheckrConsentForm = () => {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">FCRA Consent</p>
      <p className="mt-1">
        This consent text is a placeholder and must be replaced after legal review.
      </p>
      <p className="mt-2 text-xs">{'<!-- PENDING_LAWYER_REVIEW -->'}</p>
    </div>
  );
};
