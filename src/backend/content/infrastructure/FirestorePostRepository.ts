import { adminDb } from "@/lib/firebase/admin";
import { Post, PostStatus } from "../domain/Post";
import { PostRepository } from "../domain/PostRepository";
import { PostPersistenceModel } from "./dto/PostPersistence";
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export class FirestorePostRepository implements PostRepository {
    private collection = "posts";

    async save(post: Post): Promise<void> {
        const persistence = post.toPersistence();
        await adminDb.collection(this.collection).doc(post.id).set(persistence);
    }

    async findById(id: string): Promise<Post | null> {
        const doc = await adminDb.collection(this.collection).doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data() as PostPersistenceModel;
        return Post.fromPersistence(data);
    }

    async findAll(): Promise<Post[]> {
        const snapshot = await adminDb.collection(this.collection).orderBy("createdAt", "desc").get();
        return snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const data = doc.data() as PostPersistenceModel;
            return Post.fromPersistence(data);
        });
    }

    async findByStatus(status: PostStatus): Promise<Post[]> {
        const snapshot = await adminDb.collection(this.collection)
            .where("status", "==", status)
            .orderBy("publishDate", "asc")
            .get();
        return snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const data = doc.data() as PostPersistenceModel;
            return Post.fromPersistence(data);
        });
    }

    async delete(id: string): Promise<void> {
        await adminDb.collection(this.collection).doc(id).delete();
    }
}
