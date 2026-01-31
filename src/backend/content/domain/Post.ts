export type PostStatus = 'draft' | 'scheduled' | 'published';
export type PostType = 'blog' | 'news';

export interface Post {
    id: string;
    title: string;
    slug: string; // SEO friendly URL part
    content: string; // HTML or Markdown
    excerpt?: string | null;
    coverImage?: string | null;
    type: PostType;
    status: PostStatus;
    tags: string[];
    authorId: string;
    publishDate: number; // Timestamp
    createdAt: number;
    updatedAt: number;
}
