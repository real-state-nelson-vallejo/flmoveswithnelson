import { TransactionPreset } from "../domain/TransactionPreset";
import { TransactionPresetRepository } from "../domain/TransactionPresetRepository";
import { adminDb } from "@/lib/firebase/admin";

export class FirestoreTransactionPresetRepository implements TransactionPresetRepository {
    private get collection() {
        return adminDb.collection('transaction_presets');
    }

    async save(preset: TransactionPreset): Promise<void> {
        const data = preset.toPersistence();
        await this.collection.doc(preset.id).set(data, { merge: true });
    }

    async findById(id: string): Promise<TransactionPreset | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data();
        if (!data) return null;

        return TransactionPreset.fromPersistence({
            id: data.id,
            userId: data.userId,
            name: data.name,
            description: data.description,
            defaultData: data.defaultData,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }

    async findByUserId(userId: string): Promise<TransactionPreset[]> {
        const snapshot = await this.collection.where('userId', '==', userId).get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return TransactionPreset.fromPersistence({
                id: data.id,
                userId: data.userId,
                name: data.name,
                description: data.description,
                defaultData: data.defaultData,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt)
            });
        });
    }

    async findAll(): Promise<TransactionPreset[]> {
        const snapshot = await this.collection.get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return TransactionPreset.fromPersistence({
                id: data.id,
                userId: data.userId,
                name: data.name,
                description: data.description,
                defaultData: data.defaultData,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt)
            });
        });
    }

    async delete(id: string): Promise<void> {
        await this.collection.doc(id).delete();
    }
}
