import { LegalProfile } from "../domain/LegalProfile";
import { LegalProfileRepository } from "../domain/LegalProfileRepository";
import { adminDb } from "@/lib/firebase/admin";

export class FirestoreLegalProfileRepository implements LegalProfileRepository {
    private get collection() {
        return adminDb.collection('legal_profiles');
    }

    async save(profile: LegalProfile): Promise<void> {
        const data = profile.toPersistence();
        // Use userId as the document ID for 1:1 relationship
        await this.collection.doc(profile.userId).set(data, { merge: true });
    }

    async findByUserId(userId: string): Promise<LegalProfile | null> {
        const doc = await this.collection.doc(userId).get();
        if (!doc.exists) return null;

        const data = doc.data();
        if (!data) return null;

        return LegalProfile.fromPersistence({
            userId: data.userId,
            broker: data.broker,
            updatedAt: new Date(data.updatedAt)
        });
    }
}
