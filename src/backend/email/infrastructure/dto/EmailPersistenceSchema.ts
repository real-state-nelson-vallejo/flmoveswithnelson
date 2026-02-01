import { z } from 'zod';
import { EmailDTO } from './EmailDTO';

export const EmailPersistenceSchema: z.ZodType<EmailDTO> = z.object({
    id: z.string(),
    to: z.union([z.string(), z.array(z.string())]),
    message: z.object({
        subject: z.string(),
        text: z.string().optional(),
        html: z.string().optional()
    }),
    from: z.string().optional(),
    replyTo: z.string().optional(),
    cc: z.array(z.string()).optional(),
    bcc: z.array(z.string()).optional(),
    headers: z.record(z.string()).optional(),
    createdAt: z.number(),
    status: z.enum(['pending', 'sent', 'failed']),
    error: z.string().optional()
});
