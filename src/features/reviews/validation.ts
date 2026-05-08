import { z } from 'zod';

export const submitReviewSchema = z.object({
  booking_id: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
  trait_ids: z.array(z.string().uuid()).max(5).default([]),
});

export type SubmitReviewValues = z.infer<typeof submitReviewSchema>;
