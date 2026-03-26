import { SavedSearch } from "../domain/SavedSearch";
import { SavedSearchRepository } from "../domain/SavedSearchRepository";
import { adminDb } from "@/lib/firebase/admin";
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const COLLECTION_NAME = "saved_searches";

export class FirestoreSavedSearchRepository implements SavedSearchRepository {
    async save(savedSearch: SavedSearch): Promise<void> {
        const persistence = savedSearch.toPersistence();
        await adminDb.collection(COLLECTION_NAME).doc(savedSearch.id).set(persistence);
    }

    async findById(id: string): Promise<SavedSearch | null> {
        const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
        if (!doc.exists) return null;
        return SavedSearch.fromPersistence(doc.data());
    }

    async findByLeadId(leadId: string): Promise<SavedSearch[]> {
        const snapshot = await adminDb.collection(COLLECTION_NAME)
            .where('leadId', '==', leadId)
            .get();
            
        return snapshot.docs.map((doc: QueryDocumentSnapshot) => SavedSearch.fromPersistence(doc.data()));
    }

    async findAllActive(): Promise<SavedSearch[]> {
        const snapshot = await adminDb.collection(COLLECTION_NAME)
            .where('active', '==', true)
            .get();

        return snapshot.docs.map((doc: QueryDocumentSnapshot) => SavedSearch.fromPersistence(doc.data()));
    }

    async delete(id: string): Promise<void> {
        await adminDb.collection(COLLECTION_NAME).doc(id).delete();
    }
}
