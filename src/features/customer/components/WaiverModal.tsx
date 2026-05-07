'use client';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">Photo Waiver Required</h3>
        <p className="mt-3 text-sm text-zinc-700">
          You are requesting to skip all photos for completed work. By accepting this waiver, you
          understand that PureTask may have reduced ability to review disputes related to cleaning
          quality because no photo evidence will be available.
        </p>

        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAccepted}
            onChange={(event) => onAcceptedChange(event.target.checked)}
            className="mt-0.5"
          />
          <span>I understand and accept this waiver.</span>
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={!isAccepted}
            onClick={onConfirm}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Accept and continue
          </button>
        </div>
      </div>
    </div>
  );
};
