import type { MessageRow } from '@/features/messaging/queries';

type Props = {
  message: MessageRow;
  isOwn: boolean;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const MessageBubble = ({ message, isOwn }: Props) => {
  if (message.sender_role === 'system') {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500">
          {message.body}
        </span>
      </div>
    );
  }

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
          <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
        </div>
        <span className="px-1 text-[11px] text-neutral-400">{fmtTime(message.created_at)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-400">
        {(message.sender_name ?? '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className="px-1 text-xs font-medium text-neutral-500">{message.sender_name}</span>
        <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-tier1 ring-1 ring-neutral-200">
          <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
        </div>
        <span className="px-1 text-[11px] text-neutral-400">{fmtTime(message.created_at)}</span>
      </div>
    </div>
  );
};
