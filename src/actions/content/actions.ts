"use server";

import { contentDependencies } from "@/backend/content/dependencies";
import { Post } from "@/backend/content/domain/Post";
import { PostSchema } from "@/lib/schemas/postSchema";

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
        const now = Date.now();

        // Construct the raw object with defaults
        const rawPost = {
            id,
            title: data.title || "Untitled",
            slug: data.slug || (data.title?.toLowerCase().replace(/\s+/g, '-') || "untitled"),
            content: data.content || "",
            type: data.type || "blog",
            status: data.status || "draft",
            tags: data.tags || [],
            authorId: "admin", // TODO: Get from session
            publishDate: data.publishDate || now,
            createdAt: now,
            updatedAt: now,
            coverImage: data.coverImage ?? null,
            excerpt: data.excerpt ?? null,
        };

        // Validate with Zod
        const validation = PostSchema.safeParse(rawPost);

        if (!validation.success) {
            console.error("Validation failed", validation.error);
            return { success: false, error: "Validation failed: " + validation.error.message };
        }

        const newPost = validation.data;
        await repo.save(newPost);

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

        const updatedRaw = {
            ...existing,
            ...data,
            coverImage: data.coverImage ?? existing.coverImage ?? null,
            excerpt: data.excerpt ?? existing.excerpt ?? null,
            updatedAt: Date.now()
        };

        // Validate with Zod
        const validation = PostSchema.safeParse(updatedRaw);

        if (!validation.success) {
            console.error("Validation failed", validation.error);
            return { success: false, error: "Validation failed" };
        }

        const validPost = validation.data;
        await repo.save(validPost);

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
