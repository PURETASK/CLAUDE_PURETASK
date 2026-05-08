import type { DisputeMessageRow } from '@/features/disputes/queries';

type Props = { messages: DisputeMessageRow[]; viewerRole: 'customer' | 'cleaner' | 'admin' };

const ROLE_STYLES: Record<string, { bg: string; label: string }> = {
  customer: { bg: 'bg-blue-50', label: 'Customer' },
  cleaner: { bg: 'bg-zinc-50', label: 'Cleaner' },
  admin: { bg: 'bg-amber-50', label: 'Platform' },
};

export const DisputeThread = ({ messages, viewerRole }: Props) => {
  if (messages.length === 0) {
    return <p className="text-sm text-zinc-400">No messages yet.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isOwn = msg.sender_role === viewerRole;
        const style = ROLE_STYLES[msg.sender_role] ?? ROLE_STYLES['admin']!;
        return (
          <div key={msg.id} className={`rounded-lg p-3 ${style.bg} ${isOwn ? 'ml-6' : 'mr-6'}`}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700">{msg.sender_name}</span>
              <span className="text-xs text-zinc-400">
                {new Date(msg.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{msg.body}</p>
          </div>
        );
      })}
    </div>
  );
};
