import { User, UserRole } from "../domain/User";
import { UserRepository } from "../domain/UserRepository";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserPersistence } from "./dto/UserPersistence";
import { z } from "zod";

// Schema for runtime validation
const UserPersistenceSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    displayName: z.string(),
    role: z.enum(['admin', 'agent', 'user']),
    phoneNumber: z.string().optional(),
    photoURL: z.string().optional(),
    createdAt: z.number(),
    updatedAt: z.number()
});

export class FirestoreUserRepository implements UserRepository {
    private collection = adminDb.collection('users');

    private mapToDomain(data: UserPersistence): User {
        return new User({
            id: data.id,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            phoneNumber: data.phoneNumber,
            photoURL: data.photoURL,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }

    private mapToPersistence(user: User): UserPersistence {
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            phoneNumber: user.phoneNumber,
            photoURL: user.photoURL,
            createdAt: user.createdAt.getTime(),
            updatedAt: user.updatedAt.getTime()
        };
    }

    async save(user: User): Promise<void> {
        const data = this.mapToPersistence(user);
        const validated = UserPersistenceSchema.parse(data);
        await this.collection.doc(user.id).set(validated, { merge: true });
    }

    async findById(id: string): Promise<User | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;

        const result = UserPersistenceSchema.safeParse(doc.data());
        if (!result.success) {
            console.error(`Invalid User data for ID ${id}`, result.error);
            return null;
        }
        return this.mapToDomain(result.data);
    }

    async findByEmail(email: string): Promise<User | null> {
        const snapshot = await this.collection.where('email', '==', email).limit(1).get();
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        if (!doc) return null;

        const result = UserPersistenceSchema.safeParse(doc.data());

        if (!result.success) return null;
        return this.mapToDomain(result.data);
    }

    async updateRole(id: string, role: UserRole): Promise<void> {
        // 1. Update Firestore
        await this.collection.doc(id).update({ role, updatedAt: Date.now() });

        // 2. Update Auth Custom Claims
        try {
            await adminAuth.setCustomUserClaims(id, { role });
            console.log(`[FirestoreUserRepository] Updated claims for ${id} to ${role}`);
        } catch (error) {
            console.error(`[FirestoreUserRepository] Failed to set custom claims for ${id}`, error);
            // We don't throw here to avoid partial failure state in DB?? 
            // Better to throw so we know claims failed.
            throw error;
        }
    }
}
