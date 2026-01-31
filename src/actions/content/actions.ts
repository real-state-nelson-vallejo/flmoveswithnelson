"use server";

import { contentDependencies } from "@/backend/content/dependencies";
import { Post } from "@/backend/content/domain/Post";

const repo = contentDependencies.postRepository;

export async function getPostsAction() {
    try {
        const posts = await repo.findAll();
        return { success: true, posts };
    } catch (error) {
        console.error("Get Posts Error", error);
        return { success: false, error: "Failed to fetch posts" };
    }
}

export async function createPostAction(data: Partial<Post>) {
    try {
        const id = data.id || `post-${Date.now()}`;
        const newPost: Post = {
            id,
            title: data.title || "Untitled",
            slug: data.slug || (data.title?.toLowerCase().replace(/\s+/g, '-') || "untitled"),
            content: data.content || "",
            type: data.type || "blog",
            status: data.status || "draft",
            tags: data.tags || [],
            authorId: "admin", // TODO: Get from session
            publishDate: data.publishDate || Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            coverImage: data.coverImage || undefined, // Firestore ignores undefined if ignoreUndefinedProperties is set, BUT user asked for null or sanitize. 
            excerpt: data.excerpt || null,
            // coverImage removed from here to avoid duplicate
        };
        // Let's update the interface to allow null, or cast here.
        // Ideally, I should update Domain Post to allow null.

        // For now, I will sanitize by ensuring they aren't undefined.
        // If I use `JSON.parse(JSON.stringify(obj))` it strips undefined, which is also a way.
        // But let's follow user instruction: "pasarlos como null".

        // I need to check Post interface. If it says optional `?`, it includes undefined.
        // To force null, I might need `string | null`.

        // Let's rely on a helper to clean the object? Or just manual null coalescence.
        // Since I cannot see Post.ts right now (I saw it earlier but let's be safe), I will assume optional means properties can be missing.
        // If I explicitly set `coverImage: data.coverImage || null`, and the type is `string | undefined`, TS might error.

        // Let's try to set them to null and see if TS complains. If so, I'll update Post.ts in next step.
        // Wait, I can use `...data` strategy but I need to ensure no undefineds.

        const sanitizedPost = {
            ...newPost,
            coverImage: newPost.coverImage ?? null,
            excerpt: newPost.excerpt ?? null
        };

        await repo.save(sanitizedPost as Post);
        return { success: true, id };
    } catch (error) {
        console.error("Create Post Error", error);
        return { success: false, error: "Failed to create post" };
    }
}

export async function updatePostAction(id: string, data: Partial<Post>) {
    try {
        const existing = await repo.findById(id);
        if (!existing) return { success: false, error: "Post not found" };

        const updated = {
            ...existing,
            ...data,
            coverImage: data.coverImage ?? existing.coverImage ?? null,
            excerpt: data.excerpt ?? existing.excerpt ?? null,
            updatedAt: Date.now()
        };

        await repo.save(updated as Post);
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
