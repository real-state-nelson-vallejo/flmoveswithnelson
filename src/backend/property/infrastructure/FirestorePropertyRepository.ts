import { Property } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";
import { adminDb } from "@/lib/firebase/admin";
import { PropertyPersistenceModel } from "./dto/PropertyPersistence";
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const COLLECTION_NAME = "properties";

export class FirestorePropertyRepository implements PropertyRepository {
    async save(property: Property): Promise<void> {
        const persistence = property.toPersistence();
        // Firestore determines how to save 'createdAt' (number). 
        // If we want it as a Date object in Firestore, we should convert it here.
        // However, our PersistenceModel says 'number'. Let's stick to the model for now
        // or convert if Firestore best practices dictate otherwise. 
        // Given existing code likely used Dates, let's keep it consistent with what Firestore expects if possible,
        // BUT strict Hexagonal says we persist what the PersistenceModel says.
        // If the previous implementation relied on Timestamp objects, we might need a transformer here.
        // For now, saving as numbers (timestamps) is safe and portable.
        await adminDb.collection(COLLECTION_NAME).doc(property.id).set(persistence);
    }

    async findById(id: string): Promise<Property | null> {
        const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
        if (!doc.exists) return null;

        // We assume data in DB matches our PersistenceModel
        // In a real app, we should parse/validate with Zod here
        const data = doc.data() as PropertyPersistenceModel;
        return Property.fromPersistence(data);
    }

    async findAll(): Promise<Property[]> {
        const snapshot = await adminDb.collection(COLLECTION_NAME).get();
        return snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const data = doc.data() as PropertyPersistenceModel;
            return Property.fromPersistence(data);
        });
    }

    async search(query: string): Promise<Property[]> {
        const all = await this.findAll();
        if (!query) return all;

        const lowerQuery = query.toLowerCase();
        return all.filter((p: Property) =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.location.city.toLowerCase().includes(lowerQuery)
        );
    }
}
