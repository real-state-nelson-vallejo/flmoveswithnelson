import { Content } from "./Content";

export interface ContentRepository {
    save(content: Content): Promise<void>;
    findBySlug(slug: string): Promise<Content | null>;
    findAll(): Promise<Content[]>;
}
