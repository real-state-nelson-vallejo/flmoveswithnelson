import { Property } from "../domain/Property";
import { PropertyRepository, PropertyFilter } from "../domain/PropertyRepository";
import { adminDb } from "@/lib/firebase/admin";
import { PropertyPersistenceModel } from "./dto/PropertyPersistence";
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

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

    async search(filter: PropertyFilter): Promise<Property[]> {
        // Basic implementation for now: Fetch all and filter in memory (Firestore complex queries need indexes)
        // Optimization: Use Firestore queries for exact matches or ranges where possible
        const snapshot = await adminDb.collection(COLLECTION_NAME).get();
        const allProperties = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const data = doc.data() as PropertyPersistenceModel;
            return Property.fromPersistence(data);
        });

        const query = filter.query?.toLowerCase() || "";

        return allProperties.filter(p => {
            // Text Search
            const matchesQuery = !query ||
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.location.city.toLowerCase().includes(query) ||
                p.location.zip?.toLowerCase().includes(query);

            if (!matchesQuery) return false;

            // Price Filter
            if (filter.minPrice && p.price.amount < filter.minPrice) return false;
            if (filter.maxPrice && p.price.amount > filter.maxPrice) return false;

            // Specs Filter
            if (filter.minBeds && p.specs.beds < filter.minBeds) return false;
            if (filter.minBaths && p.specs.baths < filter.minBaths) return false;

            // Type Filter
            if (filter.type && p.type !== filter.type) return false;

            return true;
        });
    }

    async delete(id: string): Promise<void> {
        await adminDb.collection(COLLECTION_NAME).doc(id).delete();
    }

    async findBySlug(slug: string): Promise<Property | null> {
        const snapshot = await adminDb.collection(COLLECTION_NAME).where('slug', '==', slug).limit(1).get();
        if (snapshot.empty || !snapshot.docs[0]) return null;
        const doc = snapshot.docs[0];
        return Property.fromPersistence(doc.data() as PropertyPersistenceModel);
    }
    async getAdjacentProperties(id: string): Promise<{ prev: Property | null; next: Property | null }> {
        const currentDoc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
        if (!currentDoc.exists) return { prev: null, next: null };

        const data = currentDoc.data() as PropertyPersistenceModel;
        const createdAt = data.createdAt || 0;

        // Prev: Created after current (newer) or before? usually "Next" is newer.
        // Let's say List is ordered by Date DESC (newest first).
        // Then "Next" in list is OLDER (createdAt < current). 
        // "Prev" in list is NEWER (createdAt > current).
        // But "Next Property" button usually implies "Next one in the sequence".
        // Let's implement simple chronological: Prev = Older, Next = Newer.

        // Prev: < createdAt, ordered desc limit 1
        const prevSnapshot = await adminDb.collection(COLLECTION_NAME)
            .where('createdAt', '<', createdAt)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        // Next: > createdAt, ordered asc limit 1
        const nextSnapshot = await adminDb.collection(COLLECTION_NAME)
            .where('createdAt', '>', createdAt)
            .orderBy('createdAt', 'asc')
            .limit(1)
            .get();

        const prev = (!prevSnapshot.empty && prevSnapshot.docs[0]) ? Property.fromPersistence(prevSnapshot.docs[0].data() as PropertyPersistenceModel) : null;
        const next = (!nextSnapshot.empty && nextSnapshot.docs[0]) ? Property.fromPersistence(nextSnapshot.docs[0].data() as PropertyPersistenceModel) : null;

        return { prev, next };
    }
}
