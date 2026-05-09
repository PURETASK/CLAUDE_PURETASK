import type { DisputeMessageRow } from '@/features/disputes/queries';

type Props = { messages: DisputeMessageRow[]; viewerRole: 'customer' | 'cleaner' | 'admin' };

const ROLE_STYLES: Record<string, { bg: string; border: string; label: string }> = {
  customer: { bg: 'bg-brand-600/5', border: 'border-brand-600/20', label: 'Customer' },
  cleaner: { bg: 'bg-neutral-50', border: 'border-neutral-200', label: 'Cleaner' },
  admin: { bg: 'bg-warning-light', border: 'border-warning/20', label: 'Platform' },
};

export const DisputeThread = ({ messages, viewerRole }: Props) => {
  if (messages.length === 0) {
    return <p className="text-sm text-neutral-400">No messages yet.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isOwn = msg.sender_role === viewerRole;
        const style = ROLE_STYLES[msg.sender_role] ?? ROLE_STYLES['admin']!;
        return (
          <div
            key={msg.id}
            className={`rounded-xl border p-3 ${style.bg} ${style.border} ${isOwn ? 'ml-6' : 'mr-6'}`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700">{msg.sender_name}</span>
              <span className="text-xs text-neutral-400">
                {new Date(msg.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-neutral-700">{msg.body}</p>
          </div>
        );
      })}
    </div>
  );
};
