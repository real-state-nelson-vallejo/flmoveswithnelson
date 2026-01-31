import { z } from 'zod';

export const LeadStatusSchema = z.enum(['new', 'contacted', 'viewing', 'negotiation', 'closed']);

// Helper for Firestore Timestamps or Dates to number (millis)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const timestampSchema = z.preprocess((val: any) => {
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    if (val && typeof val.toMillis === 'function') return val.toMillis();
    // If it's a string that looks like a number?
    return val;
}, z.number());

export const LeadSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    status: LeadStatusSchema,
    source: z.string(),
    propertyId: z.string().optional(),
    notes: z.string().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema
});

export type Lead = z.infer<typeof LeadSchema>;
