import { adminDb } from "@/lib/firebase/admin";
import { Schedule, ScheduleEntityType } from "../domain/Schedule";
import { SchedulePersistenceModel, SchedulePersistenceSchema } from "./dto/SchedulePersistenceSchema";

export class FirestoreScheduleRepository {
    private collectionName = 'schedules';

    async save(schedule: Schedule): Promise<void> {
        const data = schedule.toPersistence();

        // Ensure dates are converted correctly for Firestore if they are strings
        // Though Admin SDK handles some translation, it's safer to maintain Date objects
        const docRef = adminDb.collection(this.collectionName).doc(schedule.id);

        await docRef.set({
            ...data,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
        }, { merge: true });
    }

    async getById(id: string): Promise<Schedule | null> {
        const doc = await adminDb.collection(this.collectionName).doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data();
        if (!data) return null;

        const parsed = SchedulePersistenceSchema.parse({
            id: doc.id,
            ...data
        });

        return Schedule.fromPersistence(parsed);
    }

    async getByEntity(entityId: string, entityType: ScheduleEntityType): Promise<Schedule | null> {
        const snapshot = await adminDb.collection(this.collectionName)
            .where('entityId', '==', entityId)
            .where('entityType', '==', entityType)
            .limit(1)
            .get();

        if (snapshot.empty || !snapshot.docs[0]) return null;

        const doc = snapshot.docs[0];
        const data = doc.data();

        const parsed = SchedulePersistenceSchema.parse({
            id: doc.id,
            ...data
        });

        return Schedule.fromPersistence(parsed);
    }

    async delete(id: string): Promise<void> {
        await adminDb.collection(this.collectionName).doc(id).delete();
    }
}
