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

export const step5Schema = z.object({
  identity_status: z.enum(['pending', 'verified', 'requires_input']),
});

export const step6Schema = z.object({
  background_check_status: z.enum(['requested', 'pending', 'in_progress', 'clear', 'consider']),
});

export const step7Schema = z.object({
  stripe_connect_completed: z.boolean(),
  pending_stripe_account_id: z.string().min(1, 'Enter a Stripe account id.').optional(),
});

export const step8Schema = z.object({
  legal_name: z.string().min(2, 'Legal name is required.'),
  tax_classification: z.enum(['sole_proprietor', 'llc', 'corporation', 'partnership']),
  tax_id_last4: z.string().regex(/^\d{4}$/, 'Enter last 4 digits.'),
});

export const step9Schema = z.object({
  photo_training_completed: z
    .boolean()
    .refine((v) => v, 'You must complete photo etiquette training.'),
});

export const step10Schema = z.object({
  ready_to_submit: z.boolean().refine((v) => v, 'Confirm all sections are complete before review.'),
});

export const step11Schema = z.object({
  confirm_submission: z.boolean().refine((v) => v, 'You must confirm before submitting.'),
});

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
export type Step4Values = z.infer<typeof step4Schema>;
export type Step5Values = z.infer<typeof step5Schema>;
export type Step6Values = z.infer<typeof step6Schema>;
export type Step7Values = z.infer<typeof step7Schema>;
export type Step8Values = z.infer<typeof step8Schema>;
export type Step9Values = z.infer<typeof step9Schema>;
export type Step10Values = z.infer<typeof step10Schema>;
export type Step11Values = z.infer<typeof step11Schema>;
