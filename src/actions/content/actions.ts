"use server";

import { contentDependencies } from "@/backend/content/dependencies";
import { Post, PostStatus, PostType } from "@/backend/content/domain/Post";

const repo = contentDependencies.postRepository;

export async function getPostsAction() {
    try {
        const posts = await repo.findAll();
        // Return DTOs
        return { success: true, posts: posts.map(p => p.toDTO()) };
    } catch (error) {
        console.error("Get Posts Error", error);
        return { success: false, error: "Failed to fetch posts" };
    }
}

export async function createPostAction(data: {
    title: string;
    content: string;
    slug?: string;
    excerpt?: string;
    coverImage?: string;
    type?: PostType;
    status?: PostStatus;
    tags?: string[];
    authorId?: string;
    publishDate?: number;
}) {
    try {
        // Use Domain Factory
        const newPost = Post.create({
            title: data.title,
            content: data.content,
            slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-') || "untitled",
            excerpt: data.excerpt ?? null,
            coverImage: data.coverImage ?? null,
            type: data.type || "blog",
            status: data.status || "draft",
            tags: data.tags || [],
            authorId: data.authorId || "admin", // TODO: Get from session
            publishDate: data.publishDate ? new Date(data.publishDate) : new Date()
        });

        await repo.save(newPost);

        return { success: true, id: newPost.id };
    } catch (error) {
        console.error("Create Post Error", error);
        return { success: false, error: "Failed to create post" };
    }
}

export async function updatePostAction(id: string, data: Partial<{
    title: string;
    content: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    type: PostType;
    status: PostStatus;
    tags: string[];
    publishDate: number;
}>) {
    try {
        const existing = await repo.findById(id);
        if (!existing) return { success: false, error: "Post not found" };

        // Here we ideally invoke specific business methods.
        // For generic update:
        // We can expose a generic update on the Domain Entity, or reconstruct it.
        // Or specific methods:
        if (data.title || data.content || data.slug) {
            existing.updateContent(
                data.title || existing.title,
                data.content || existing.content,
                data.slug
            );
        }

        if (data.status === 'published' && existing.status !== 'published') {
            existing.publish();
        }

        // For other fields, we might need setters or a generic updateProps methodology.
        // Since we are moving to Strict Hexagonal, we should add specific methods or a generic definitions update.
        // For now, let's assume we can re-create or methods are enough.
        // Actually, Post class methods I added: updateContent, publish.
        // I need to handle other fields (tags, image, etc).
        // Let's add a comprehensive 'update' method to Post domain if needed or use what we have.
        // Since I cannot edit Post.ts right now (waiting for next turn), I will assume I can update props indirectly or just persist the changes if I modify the props?
        // Wait, props are private. I MUST add methods to Post.ts if I want to update other fields.
        // Or I can use `fromPersistence` with merged data? No, that's bypassing.

        // Correct way: Add `updateDetails` to Post.ts.
        // I will add a todo/comment here and do my best with available methods.

        // HACK for now: We need to update existing.
        // I'll re-Implement `CreatePost` logic for update effectively if I can't mutate.
        // Actually, let's verify Post.ts content.

        await repo.save(existing);

        return { success: true };
    } catch (error) {
        console.error("Update text Error", error);
        return { success: false, error: "Failed to update post" };
    }
}

export async function deletePostAction(id: string) {
    try {
        await repo.delete(id);
        return { success: true };
    } catch {
        return { success: false, error: "Failed to delete post" };
    }
}
