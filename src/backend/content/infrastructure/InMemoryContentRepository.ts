import { Content } from "../domain/Content";
import { ContentRepository } from "../domain/ContentRepository";

export class InMemoryContentRepository implements ContentRepository {
    private contents: Map<string, Content> = new Map();

    async save(content: Content): Promise<void> {
        this.contents.set(content.slug, content);
    }

    async findBySlug(slug: string): Promise<Content | null> {
        return this.contents.get(slug) || null;
    }

    async findAll(): Promise<Content[]> {
        return Array.from(this.contents.values());
    }
}
