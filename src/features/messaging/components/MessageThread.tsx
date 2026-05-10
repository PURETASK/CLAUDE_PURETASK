'use client';

import { useEffect, useRef, useState } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

import type { MessageRow } from '../queries';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

type Props = {
  initialMessages: MessageRow[];
  bookingId: string;
  userRole: 'customer' | 'cleaner';
  userId: string;
  otherPartyName: string;
  expiresAt: string;
  isExpired: boolean;
};

const fmtExpiry = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const MessageThread = ({
  initialMessages,
  bookingId,
  userRole,
  userId,
  otherPartyName,
  expiresAt,
  isExpired,
}: Props) => {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isExpired) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages:booking:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const isOwn = (row.sender_user_id as string) === userId;
          setMessages((prev) => {
            if (prev.some((m) => m.id === (row.id as string))) return prev;
            return [
              ...prev,
              {
                id: row.id as string,
                body: row.body as string,
                sender_role: row.sender_role as 'customer' | 'cleaner' | 'system',
                sender_name: isOwn ? 'You' : otherPartyName,
                created_at: row.created_at as string,
                expires_at: row.expires_at as string,
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, userId, otherPartyName, isExpired]);

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-tier1">
      {isExpired ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <svg
              className="h-6 w-6 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="font-medium text-neutral-700">Chat has expired</p>
          <p className="text-sm text-neutral-400">
            This chat closed on {fmtExpiry(expiresAt)}. Messages are no longer available.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium text-neutral-500">No messages yet</p>
                <p className="text-xs text-neutral-400">
                  Say hello to {otherPartyName} — this chat is private to your booking.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_role === userRole}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 bg-white/80 px-4 py-2">
            <p className="text-center text-xs text-neutral-400">
              🔒 This chat closes 4 hours after your job ends · {fmtExpiry(expiresAt)}
            </p>
          </div>

          <MessageInput bookingId={bookingId} disabled={isExpired} />
        </>
      )}
    </div>
  );
};
