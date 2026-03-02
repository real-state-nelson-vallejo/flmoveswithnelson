import { LegalDocument } from "../domain/LegalDocument";
import { LegalDocumentRepository } from "../domain/LegalDocumentRepository";
import { adminDb } from "@/lib/firebase/admin"; // Verify import path
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

const COLLECTION_NAME = "legal_documents";

export class FirestoreLegalDocumentRepository implements LegalDocumentRepository {
    async save(document: LegalDocument): Promise<void> {
        const persistence = document.toPersistence();
        await adminDb.collection(COLLECTION_NAME).doc(document.id).set(persistence);
    }

    async findById(id: string): Promise<LegalDocument | null> {
        const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
        if (!doc.exists) return null;
        return LegalDocument.fromPersistence(doc.data() as any);
    }

    async findByPropertyId(propertyId: string): Promise<LegalDocument[]> {
        const snapshot = await adminDb.collection(COLLECTION_NAME)
            .where('propertyId', '==', propertyId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map((doc: QueryDocumentSnapshot) =>
            LegalDocument.fromPersistence(doc.data() as any)
        );
    }

    async findAll(): Promise<LegalDocument[]> {
        const snapshot = await adminDb.collection(COLLECTION_NAME)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map((doc: QueryDocumentSnapshot) =>
            LegalDocument.fromPersistence(doc.data() as any)
        );
    }

    async delete(id: string): Promise<void> {
        await adminDb.collection(COLLECTION_NAME).doc(id).delete();
    }
}
