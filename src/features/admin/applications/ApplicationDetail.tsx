import { ApplicationActions } from '@/features/admin/applications/ApplicationActions';

export const ApplicationDetail = ({ id, state }: { id: string; state: string }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        Full detail rendering is handled by the route-level detail page while admin feature modules
        are being normalized.
      </p>
      <ApplicationActions applicationId={id} currentState={state} />
    </div>
  );
};
