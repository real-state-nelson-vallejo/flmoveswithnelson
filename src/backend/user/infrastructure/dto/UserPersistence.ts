import { UserRole } from "../../domain/User";

export interface UserPersistence {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    phoneNumber?: string | undefined;
    photoURL?: string | undefined;
    createdAt: number;
    updatedAt: number;
}
