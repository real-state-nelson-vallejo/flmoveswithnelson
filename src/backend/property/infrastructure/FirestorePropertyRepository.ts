import { Property } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION_NAME = "properties";

export class FirestorePropertyRepository implements PropertyRepository {
    async save(property: Property): Promise<void> {
        // Convert Dates to Timestamps or ISO strings for Firestore?
        // Firestore supports Timestamps.
        await adminDb.collection(COLLECTION_NAME).doc(property.id).set({
            ...property,
            // Ensure nested objects are handled if necessary, but Firestore handles JSON-like objects well.
            // Explicitly handling dates if needed, but SDK usually handles JS Date objects converting to Timestamp.
            createdAt: property.createdAt,
            updatedAt: property.updatedAt
        });
    }

    async findById(id: string): Promise<Property | null> {
        const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
        if (!doc.exists) return null;
        return this.mapDocToProperty(doc.data()!);
    }

    async findAll(): Promise<Property[]> {
        const snapshot = await adminDb.collection(COLLECTION_NAME).get();
        return snapshot.docs.map(doc => this.mapDocToProperty(doc.data()));
    }

    async search(query: string): Promise<Property[]> {
        // Basic search implementation - In reality would use Algolia or specialized index
        // For now, let's just return all and filtering client side or basic exact match?
        // The interface implies specific search logic. 
        // Let's implement basic findAll for now as "search" fallback or simple title/location matching if feasible in memory for small datasets, 
        // OR a simple equality check if query is specific.
        // Given constraints, I'll return findAll() filtered in memory for this MVP phase, unless query is empty.

        const all = await this.findAll();
        if (!query) return all;

        const lowerQuery = query.toLowerCase();
        return all.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.location.city.toLowerCase().includes(lowerQuery)
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapDocToProperty(data: any): Property {
        return {
            ...data,
            // Convert Firestore Timestamps back to JS Dates
            createdAt: (data.createdAt as Timestamp).toDate(),
            updatedAt: (data.updatedAt as Timestamp).toDate()
        } as Property;
    }
}
