'use client';

import { Button } from '@/components/ui/button';

type Props = {
  isOpen: boolean;
  isAccepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export const WaiverModal = ({
  isOpen,
  isAccepted,
  onAcceptedChange,
  onConfirm,
  onCancel,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-tier3">
        <h3 className="text-lg font-bold text-neutral-900">Photo Waiver Required</h3>
        <p className="mt-3 text-sm text-neutral-600">
          You are requesting to skip all photos for completed work. By accepting this waiver, you
          understand that PureTask may have reduced ability to review disputes related to cleaning
          quality because no photo evidence will be available.
        </p>

        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={isAccepted}
            onChange={(event) => onAcceptedChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-brand-600"
          />
          <span className="text-neutral-700">I understand and accept this waiver.</span>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={!isAccepted} onClick={onConfirm}>
            Accept and continue
          </Button>
        </div>
      </div>
    </div>
  );
};
