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

  return (
    <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && (
        <span className="px-1 text-xs font-medium text-neutral-500">{message.sender_name}</span>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
          isOwn
            ? 'rounded-br-sm bg-brand-600 text-white'
            : 'rounded-bl-sm bg-white text-neutral-900 shadow-tier1 ring-1 ring-neutral-200'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
      </div>
      <span className="px-1 text-[11px] text-neutral-400">{fmtTime(message.created_at)}</span>
    </div>
  );
};
