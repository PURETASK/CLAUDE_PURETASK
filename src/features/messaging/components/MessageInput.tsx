'use client';

import { useState } from 'react';

import { sendMessageAction } from '@/features/messaging/actions';

type Props = {
  bookingId: string;
  disabled?: boolean;
};

export const MessageInput = ({ bookingId, disabled }: Props) => {
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || pending || disabled) return;

    setPending(true);
    setError(null);
    const result = await sendMessageAction(bookingId, body);
    setPending(false);

    if (result.ok) {
      setBody('');
    } else {
      setError(result.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="border-t border-neutral-200 bg-white p-4">
      {error && <p className="mb-2 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">{error}</p>}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          disabled={disabled || pending}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-control focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:opacity-50"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!body.trim() || disabled || pending}
          className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-tier1 transition-all duration-control hover:bg-brand-900 hover:shadow-tier2 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          {pending ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};
