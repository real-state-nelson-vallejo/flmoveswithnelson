import { FirestoreUserRepository } from "./infrastructure/FirestoreUserRepository";

class UserDependencies {
    readonly userRepository = new FirestoreUserRepository();
}

export const userDependencies = new UserDependencies();
