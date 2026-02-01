export type PostStatus = 'draft' | 'scheduled' | 'published';
export type PostType = 'blog' | 'news';

export interface PostDTO {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null | undefined;
    coverImage?: string | null | undefined;
    type: PostType;
    status: PostStatus;
    tags: string[];
    authorId: string;
    publishDate: number;
    createdAt: number;
    updatedAt: number;
}
