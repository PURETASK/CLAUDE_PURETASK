import { z } from 'zod';

export const step1Schema = z.object({
  home_zip: z.string().regex(/^\d{5}$/, 'Enter a 5-digit ZIP code.'),
  travel_radius_miles: z.number().int().min(5, 'Minimum 5 miles.').max(50, 'Maximum 50 miles.'),
});

export const step2Schema = z.object({
  years_experience: z
    .number()
    .int()
    .min(0, 'Enter years of experience.')
    .max(50, 'Maximum 50 years.'),
  service_types: z
    .array(z.enum(['standard', 'deep', 'move_out', 'airbnb']))
    .min(1, 'Select at least one service type.'),
});

export const step3Schema = z.object({
  why_puretask_text: z
    .string()
    .min(50, 'Please write at least 50 characters.')
    .max(1000, 'Maximum 1,000 characters.'),
});

export const step4Schema = z.object({
  etiquette_acknowledged: z
    .boolean()
    .refine((v) => v === true, 'You must acknowledge the photo guidelines.'),
});

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
export type Step4Values = z.infer<typeof step4Schema>;
