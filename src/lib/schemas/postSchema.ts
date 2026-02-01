import { z } from 'zod';

export const PostStatusSchema = z.enum(['draft', 'scheduled', 'published']);
export const PostTypeSchema = z.enum(['blog', 'news']);

export const PostSchema = z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    content: z.string(),
    excerpt: z.string().optional().nullable(), // Allow optional/null
    coverImage: z.string().optional().nullable(),
    type: PostTypeSchema,
    status: PostStatusSchema,
    tags: z.array(z.string()),
    authorId: z.string(),
    publishDate: z.number(),
    createdAt: z.number(),
    updatedAt: z.number()
});
