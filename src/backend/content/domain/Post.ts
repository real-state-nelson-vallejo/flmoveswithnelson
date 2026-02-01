import { PostDTO } from "@/types/content";
import { PostPersistenceModel } from "../infrastructure/dto/PostPersistence";
import { PostStatus, PostType } from "@/types/content";

export type { PostStatus, PostType };

export interface PostProps {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null;
    coverImage?: string | null;
    type: PostType;
    status: PostStatus;
    tags: string[];
    authorId: string;
    publishDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export class Post {
    private constructor(private readonly props: PostProps) { }

    static create(data: Omit<PostProps, 'id' | 'createdAt' | 'updatedAt'>): Post {
        const now = new Date();
        return new Post({
            ...data,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }

    static fromPersistence(data: PostPersistenceModel): Post {
        return new Post({
            ...data,
            publishDate: new Date(data.publishDate),
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }

    toPersistence(): PostPersistenceModel {
        return {
            ...this.props,
            publishDate: this.props.publishDate.getTime(),
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    toDTO(): PostDTO {
        return {
            ...this.props,
            publishDate: this.props.publishDate.getTime(),
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    // Getters
    get id() { return this.props.id; }
    get title() { return this.props.title; }
    get slug() { return this.props.slug; }
    get content() { return this.props.content; }
    get excerpt() { return this.props.excerpt; }
    get coverImage() { return this.props.coverImage; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get tags() { return [...this.props.tags]; }
    get authorId() { return this.props.authorId; }
    get publishDate() { return this.props.publishDate; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    // Business Methods
    updateContent(title: string, content: string, slug?: string): void {
        this.props.title = title;
        this.props.content = content;
        if (slug) this.props.slug = slug;
        this.touch();
    }

    publish(): void {
        this.props.status = 'published';
        this.props.publishDate = new Date();
        this.touch();
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}
