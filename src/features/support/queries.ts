import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SupportTicketRow = {
  id: string;
  ticket_number: string;
  category: string;
  priority: string;
  subject: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  first_response_at: string | null;
  last_admin_response_at: string | null;
  resolution_notes: string | null;
};

export type TicketMessageRow = {
  id: string;
  sender_user_id: string;
  sender_role: string;
  body: string;
  is_internal_note: boolean;
  created_at: string;
};

export const getMyTickets = async (): Promise<SupportTicketRow[]> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('support_tickets')
    .select(
      'id, ticket_number, category, priority, subject, status, created_at, resolved_at, first_response_at, last_admin_response_at, resolution_notes',
    )
    .eq('submitter_user_id', user.id)
    .order('created_at', { ascending: false });

  return (data ?? []) as SupportTicketRow[];
};

export const getTicketById = async (
  id: string,
): Promise<{
  ticket: SupportTicketRow & { initial_message: string };
  messages: TicketMessageRow[];
} | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select(
      'id, ticket_number, category, priority, subject, initial_message, status, created_at, resolved_at, first_response_at, last_admin_response_at, resolution_notes',
    )
    .eq('id', id)
    .eq('submitter_user_id', user.id)
    .single();
  if (!ticket) return null;

  const { data: messages } = await supabase
    .from('support_ticket_messages')
    .select('id, sender_user_id, sender_role, body, is_internal_note, created_at')
    .eq('ticket_id', id)
    .eq('is_internal_note', false)
    .order('created_at');

  return {
    ticket: ticket as SupportTicketRow & { initial_message: string },
    messages: (messages ?? []) as TicketMessageRow[],
  };
};

export const getAllTicketsForAdmin = async (): Promise<
  (SupportTicketRow & { submitter_email: string })[]
> => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('support_tickets')
    .select(
      `id, ticket_number, category, priority, subject, status, created_at, resolved_at, first_response_at, last_admin_response_at, resolution_notes,
       users!support_tickets_submitter_user_id_fkey(email)`,
    )
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => {
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      ticket_number: row.ticket_number,
      category: row.category,
      priority: row.priority,
      subject: row.subject,
      status: row.status,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      first_response_at: row.first_response_at,
      last_admin_response_at: row.last_admin_response_at,
      resolution_notes: row.resolution_notes,
      submitter_email: (u as { email: string } | null)?.email ?? '—',
    };
  });
};

export const getTicketByIdForAdmin = async (id: string) => {
  const admin = createSupabaseAdminClient();

  const { data: ticket } = await admin
    .from('support_tickets')
    .select(
      `id, ticket_number, category, priority, subject, initial_message, status, created_at, resolved_at, first_response_at, last_admin_response_at, resolution_notes,
       users!support_tickets_submitter_user_id_fkey(email, full_name)`,
    )
    .eq('id', id)
    .single();
  if (!ticket) return null;

  const { data: messages } = await admin
    .from('support_ticket_messages')
    .select('id, sender_user_id, sender_role, body, is_internal_note, created_at')
    .eq('ticket_id', id)
    .order('created_at');

  const u = Array.isArray(ticket.users) ? ticket.users[0] : ticket.users;

  return {
    ticket: {
      ...(ticket as SupportTicketRow & { initial_message: string }),
      submitter_name: (u as { full_name: string } | null)?.full_name ?? '—',
      submitter_email: (u as { email: string } | null)?.email ?? '—',
    },
    messages: (messages ?? []) as TicketMessageRow[],
  };
};
