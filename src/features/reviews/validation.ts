import { z } from 'zod';

export const submitReviewSchema = z.object({
  booking_id: z.string().uuid(),
  stars: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
