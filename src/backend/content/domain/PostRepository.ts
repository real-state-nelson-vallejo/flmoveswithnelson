import { Post, PostStatus } from "./Post";

export interface PostRepository {
    save(post: Post): Promise<void>;
    findById(id: string): Promise<Post | null>;
    findAll(): Promise<Post[]>;
    findByStatus(status: PostStatus): Promise<Post[]>;
    delete(id: string): Promise<void>;
}
