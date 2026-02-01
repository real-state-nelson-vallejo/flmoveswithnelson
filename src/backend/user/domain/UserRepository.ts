import { User, UserRole } from "./User";

export interface UserRepository {
    save(user: User): Promise<void>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    updateRole(id: string, role: UserRole): Promise<void>;
}
