'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import type { Database } from '@/types/database';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createNotification } from '@/features/notifications/queries';

type SupportTicketCategory = Database['public']['Enums']['support_ticket_category'];

export type SupportActionState = { ok: boolean; error: string | null };

export const createTicketAction = async (
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const category = formData.get('category') as string;
  const subject = (formData.get('subject') as string | null)?.trim() ?? '';
  const body = (formData.get('body') as string | null)?.trim() ?? '';
  const relatedBookingId = (formData.get('related_booking_id') as string | null)?.trim() || null;

  if (!category) return { ok: false, error: 'Category is required.' };
  if (!subject) return { ok: false, error: 'Subject is required.' };
  if (!body) return { ok: false, error: 'Message is required.' };
  if (subject.length > 200) return { ok: false, error: 'Subject must be 200 characters or fewer.' };
  if (body.length > 5000) return { ok: false, error: 'Message must be 5000 characters or fewer.' };

  const priority = category === 'safety_concern' ? 'urgent' : 'normal';

  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      submitter_user_id: user.id,
      category: category as SupportTicketCategory,
      priority,
      subject,
      initial_message: body,
      ticket_number: ticketNumber,
      related_booking_id: relatedBookingId,
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !ticket) return { ok: false, error: 'Failed to create ticket. Please try again.' };

  await supabase.from('support_ticket_messages').insert({
    ticket_id: ticket.id,
    sender_user_id: user.id,
    sender_role: 'customer',
    body,
    is_internal_note: false,
  });

  redirect(`/app/support/${ticket.id}`);
};

export const replyToTicketAction = async (
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const ticketId = formData.get('ticket_id') as string;
  const body = (formData.get('body') as string | null)?.trim() ?? '';

  if (!body) return { ok: false, error: 'Reply cannot be empty.' };
  if (body.length > 5000) return { ok: false, error: 'Reply must be 5000 characters or fewer.' };

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, status')
    .eq('id', ticketId)
    .eq('submitter_user_id', user.id)
    .single();

  if (!ticket) return { ok: false, error: 'Ticket not found.' };
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    return { ok: false, error: 'This ticket is closed.' };
  }

  const { error } = await supabase.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_user_id: user.id,
    sender_role: 'customer',
    body,
    is_internal_note: false,
  });

  if (error) return { ok: false, error: 'Failed to send reply.' };

  await supabase
    .from('support_tickets')
    .update({
      status: 'awaiting_admin',
      last_customer_response_at: new Date().toISOString(),
    })
    .eq('id', ticketId);

  revalidatePath(`/app/support/${ticketId}`);
  return { ok: true, error: null };
};

export const adminReplyAction = async (
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> => {
  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const ticketId = formData.get('ticket_id') as string;
  const body = (formData.get('body') as string | null)?.trim() ?? '';
  const isInternal = formData.get('is_internal') === 'true';

  if (!body) return { ok: false, error: 'Reply cannot be empty.' };

  const { data: ticket } = await admin
    .from('support_tickets')
    .select('id, submitter_user_id, status, first_response_at')
    .eq('id', ticketId)
    .single();

  if (!ticket) return { ok: false, error: 'Ticket not found.' };

  const { error } = await admin.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_user_id: user.id,
    sender_role: 'admin',
    body,
    is_internal_note: isInternal,
  });

  if (error) return { ok: false, error: 'Failed to send reply.' };

  const now = new Date().toISOString();
  await admin
    .from('support_tickets')
    .update({
      status: 'awaiting_customer',
      last_admin_response_at: now,
      ...(ticket.first_response_at ? {} : { first_response_at: now }),
    })
    .eq('id', ticketId);

  if (!isInternal) {
    await createNotification(
      ticket.submitter_user_id,
      'support_ticket_response',
      'Support ticket updated',
      'An admin has responded to your support ticket.',
      { deepLink: `/app/support/${ticketId}` },
    );
  }

  revalidatePath(`/app/admin/support/${ticketId}`);
  return { ok: true, error: null };
};

export const resolveTicketAction = async (
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> => {
  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const ticketId = formData.get('ticket_id') as string;
  const notes = (formData.get('resolution_notes') as string | null)?.trim() ?? '';

  const { data: ticket } = await admin
    .from('support_tickets')
    .select('id, submitter_user_id')
    .eq('id', ticketId)
    .single();

  if (!ticket) return { ok: false, error: 'Ticket not found.' };

  const now = new Date().toISOString();
  await admin
    .from('support_tickets')
    .update({
      status: 'resolved',
      resolved_at: now,
      resolved_by_admin_id: user.id,
      resolution_notes: notes || null,
    })
    .eq('id', ticketId);

  await createNotification(
    ticket.submitter_user_id,
    'support_ticket_response',
    'Support ticket resolved',
    'Your support ticket has been resolved.',
    { deepLink: `/app/support/${ticketId}` },
  );

  revalidatePath(`/app/admin/support/${ticketId}`);
  revalidatePath('/app/admin/support');
  redirect('/app/admin/support');
};
