import { z } from 'zod';

const US_STATE_CODES = new Set([
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
]);

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Name is required.').max(120, 'Name is too long.'),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Enter a valid phone number.')
    .or(z.literal(''))
    .optional(),
});

export const addressSchema = z.object({
  label: z.string().max(60, 'Label is too long.').optional(),
  street_1: z.string().min(1, 'Street address is required.'),
  street_2: z.string().max(80).optional(),
  city: z.string().min(1, 'City is required.'),
  state: z
    .string()
    .length(2, 'Use the 2-letter state code (e.g. CA).')
    .transform((value) => value.toUpperCase())
    .refine((value) => US_STATE_CODES.has(value), 'Use a valid US state code.'),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code (12345 or 12345-6789).'),
  access_instructions: z.string().max(500, 'Too long.').optional(),
});

export const photoPolicySchema = z
  .object({
    photo_policy: z.enum(['default', 'skip_named_rooms', 'skip_all_with_waiver']),
    skip_photo_rooms: z.array(z.string()).default([]),
    waiver_accepted: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.photo_policy === 'skip_named_rooms' && value.skip_photo_rooms.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one room to skip.',
        path: ['skip_photo_rooms'],
      });
    }

    if (value.photo_policy === 'skip_all_with_waiver' && !value.waiver_accepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You must accept the waiver to skip all photos.',
        path: ['waiver_accepted'],
      });
    }

    if (value.photo_policy === 'default' && value.skip_photo_rooms.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default policy cannot include skipped rooms.',
        path: ['skip_photo_rooms'],
      });
    }
  });

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
export type PhotoPolicyInput = z.input<typeof photoPolicySchema>;
export type PhotoPolicyValues = z.output<typeof photoPolicySchema>;
