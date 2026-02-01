import { z } from 'zod';

export const MoneySchema = z.object({
    amount: z.number(),
    currency: z.string()
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
    createdAt: z.number(),
    updatedAt: z.number()
});
