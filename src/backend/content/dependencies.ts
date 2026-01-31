import { FirestorePostRepository } from "./infrastructure/FirestorePostRepository";

const postRepository = new FirestorePostRepository();

export const contentDependencies = {
    postRepository,
};
