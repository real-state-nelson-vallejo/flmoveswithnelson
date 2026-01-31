import { z } from 'zod';

export const PostStatusSchema = z.enum(['draft', 'scheduled', 'published']);
export const PostTypeSchema = z.enum(['blog', 'news']);

export const PostSchema = z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    content: z.string(),
    excerpt: z.string().nullable().optional(),
    coverImage: z.string().nullable().optional(),
    type: PostTypeSchema,
    status: PostStatusSchema,
    tags: z.array(z.string()),
    authorId: z.string(),
    publishDate: z.number(),
    createdAt: z.number(),
    updatedAt: z.number()
});

export type Post = z.infer<typeof PostSchema>;
