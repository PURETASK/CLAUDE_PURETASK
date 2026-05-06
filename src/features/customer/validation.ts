import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Name is required.').max(120, 'Name is too long.'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number (e.g. +19165550100).')
    .or(z.literal(''))
    .optional(),
});

export const addressSchema = z.object({
  label: z.string().max(60, 'Label is too long.').optional(),
  street_1: z.string().min(1, 'Street address is required.'),
  street_2: z.string().max(80).optional(),
  city: z.string().min(1, 'City is required.'),
  state: z.string().length(2, 'Use the 2-letter state code (e.g. CA).').toUpperCase(),
  zip_code: z.string().regex(/^\d{5}$/, 'Enter a 5-digit ZIP code.'),
  access_instructions: z.string().max(500, 'Too long.').optional(),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
