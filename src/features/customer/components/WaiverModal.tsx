'use client';

import { Button } from '@/components/ui/button';
import { BubbleModal } from '@/features/experience/components/BubbleModal';

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
}: Props) => (
  <BubbleModal
    open={isOpen}
    onClose={onCancel}
    title="Photo waiver required"
    description="Skipping photos limits our ability to review quality disputes."
    footer={
      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled={!isAccepted} onClick={onConfirm}>
          Accept and continue
        </Button>
      </div>
    }
  >
    <p className="text-sm text-neutral-600">
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
  </BubbleModal>
);
