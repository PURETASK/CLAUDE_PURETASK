import { z } from 'zod';

export const fileDisputeSchema = z.object({
  booking_id: z.string().uuid(),
  issue_category: z.enum([
    'quality_issue',
    'damage_to_property',
    'missing_item',
    'time_discrepancy',
    'safety_or_behavior',
  ]),
  customer_desired_outcome: z.enum([
    'free_reclean',
    'partial_refund',
    'flexible_let_cleaner_propose',
  ]),
  customer_description: z
    .string()
    .min(10, 'Please describe the issue (min 10 characters).')
    .max(2000),
});

export const cleanerRespondSchema = z.object({
  dispute_id: z.string().uuid(),
  response_type: z.enum(['offer_reclean', 'offer_partial_refund', 'stand_by_work']),
  response_message: z.string().min(10, 'Please add a message with your response.').max(2000),
  response_amount_cents: z.number().int().min(0).optional(),
});

export const adminResolveSchema = z.object({
  dispute_id: z.string().uuid(),
  resolution_type: z.enum(['admin_refund', 'admin_no_refund', 'admin_partial_refund']),
  resolution_notes: z.string().min(10, 'Please add resolution notes.').max(2000),
  resolution_amount_cents: z.number().int().min(0).optional(),
});

export const ISSUE_CATEGORY_LABELS: Record<string, string> = {
  quality_issue: 'Quality issue',
  damage_to_property: 'Damage to property',
  missing_item: 'Missing item',
  time_discrepancy: 'Time discrepancy',
  safety_or_behavior: 'Safety or behavior concern',
};

export const DESIRED_OUTCOME_LABELS: Record<string, string> = {
  free_reclean: 'Free re-clean',
  partial_refund: 'Partial refund',
  flexible_let_cleaner_propose: 'Let the cleaner propose a solution',
};

export const RESPONSE_TYPE_LABELS: Record<string, string> = {
  offer_reclean: 'Offer a free re-clean',
  offer_partial_refund: 'Offer a partial refund',
  stand_by_work: 'Stand by my work',
};
