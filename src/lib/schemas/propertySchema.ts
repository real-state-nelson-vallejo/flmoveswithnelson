import { z } from 'zod';

export const MoneySchema = z.object({
    amount: z.number(),
    currency: z.string().default('USD')
});

export const PropertySchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    price: MoneySchema,
    location: z.object({
        address: z.string(),
        city: z.string(),
        country: z.string(),
        state: z.string().optional(),
        zip: z.string().optional()
    }),
    specs: z.object({
        beds: z.number(),
        baths: z.number(),
        area: z.number(),
        areaUnit: z.enum(['sqft', 'm2']),
        lotSize: z.number().optional(),
        lotUnit: z.enum(['acres', 'm2']).optional(),
        yearBuilt: z.number().optional()
    }),
    hoa: z.object({
        amount: z.number(),
        period: z.enum(['monthly', 'yearly'])
    }).optional(),
    features: z.array(z.string()),
    images: z.array(z.string()),
    type: z.enum(['sale', 'rent']),
    status: z.enum(['available', 'sold', 'reserved']),
    // Allow Date, number, or Firestore Timestamp (handled as any/object for now)
    createdAt: z.union([z.date(), z.number(), z.any()]),
    updatedAt: z.union([z.date(), z.number(), z.any()])
});

export type Property = z.infer<typeof PropertySchema>;
