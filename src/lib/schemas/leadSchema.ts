import { z } from 'zod';

export const LeadStatusSchema = z.enum(['new', 'contacted', 'viewing', 'negotiation', 'closed', 'qualified', 'lost']);

// Helper for Interaction
// Note: We avoid strict schema link here to avoid circularity if types were complex, but LeadDTO is simple.
const InteractionSchema = z.object({
    id: z.string(),
    type: z.enum(['view_property', 'contact_request', 'whatsapp_click']),
    propertyId: z.string().optional(),
    timestamp: z.number(),
    details: z.string().optional()
});

export const LeadSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    status: LeadStatusSchema,
    source: z.string(),
    propertyId: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
    score: z.number(), // Required in DTO
    interactions: z.array(InteractionSchema) // Required in DTO
});
