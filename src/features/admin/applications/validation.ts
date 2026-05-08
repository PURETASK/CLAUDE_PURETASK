import { z } from 'zod';

export const adminDecisionSchema = z.object({
  application_id: z.string().uuid('Invalid application id.'),
  decision: z.enum(['start_review', 'approve', 'reject', 'request_info']),
  reason: z.string().optional(),
  admin_notes: z.string().optional(),
});
