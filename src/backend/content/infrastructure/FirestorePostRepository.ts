import { adminDb } from "@/lib/firebase/admin";
import { Post, PostStatus } from "../domain/Post";
import { PostRepository } from "../domain/PostRepository";

export class FirestorePostRepository implements PostRepository {
    private collection = "posts";

    async save(post: Post): Promise<void> {
        await adminDb.collection(this.collection).doc(post.id).set(post);
    }

    async findById(id: string): Promise<Post | null> {
        const doc = await adminDb.collection(this.collection).doc(id).get();
        if (!doc.exists) return null;
        return doc.data() as Post;
    }

    async findAll(): Promise<Post[]> {
        const snapshot = await adminDb.collection(this.collection).orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => doc.data() as Post);
    }

    async findByStatus(status: PostStatus): Promise<Post[]> {
        const snapshot = await adminDb.collection(this.collection)
            .where("status", "==", status)
            .orderBy("publishDate", "asc")
            .get();
        return snapshot.docs.map(doc => doc.data() as Post);
    }

    async delete(id: string): Promise<void> {
        await adminDb.collection(this.collection).doc(id).delete();
    }
}
