import { PostStatus, PostType } from "@/types/content";

export interface PostPersistenceModel {
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
    createdAt: number; // Timestamp
    updatedAt: number; // Timestamp
}
