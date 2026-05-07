import { z } from 'zod';

export const createBookingSchema = z.object({
  cleaner_id: z.string().uuid(),
  service_type: z.enum(['standard', 'deep', 'move_out', 'airbnb']),
  address_id: z.string().uuid(),
  start_at: z.string().datetime({ local: true }),
  duration_hours: z.number().int().min(1).max(12),
  customer_notes: z.string().max(500).optional(),
});

export type CreateBookingValues = z.infer<typeof createBookingSchema>;
