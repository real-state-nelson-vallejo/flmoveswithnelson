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

        const data = doc.data() as PropertyPersistenceModel;
        return Property.fromPersistence(data);
    }

    async findByExternalId(externalId: string): Promise<Property | null> {
        const snapshot = await adminDb.collection(COLLECTION_NAME)
            .where('externalId', '==', externalId)
            .limit(1)
            .get();
        
        if (snapshot.empty || !snapshot.docs[0]) return null;
        
        return Property.fromPersistence(snapshot.docs[0].data() as PropertyPersistenceModel);
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

        // Helper to handle state abbreviations
        const isStateMatch = (text: string | undefined, q: string) => {
            if (!text) return false;
            const lowerText = text.toLowerCase();
            const normalizedQuery = q === 'florida' ? 'fl' : q;
            return lowerText.includes(q) || lowerText.includes(normalizedQuery);
        };

        const filtered = allProperties.filter(p => {
            // Text Search - check title, description, and ALL location fields
            const matchesQuery = !query ||
                (p.UnparsedAddress || '').toLowerCase().includes(query) ||
                (p.PublicRemarks || '').toLowerCase().includes(query) ||
                (p.City || '').toLowerCase().includes(query) ||
                isStateMatch(p.StateOrProvince, query) ||
                (p.PostalCode || '').toLowerCase().includes(query);

            if (!matchesQuery) return false;

            // Price Filter
            if (filter.minPrice && (p.ListPrice || 0) < filter.minPrice) return false;
            if (filter.maxPrice && (p.ListPrice || 0) > filter.maxPrice) return false;

            // Specs Filter
            if (filter.minBeds && (p.BedroomsTotal || 0) < filter.minBeds) return false;
            if (filter.minBaths && (p.BathroomsTotalInteger || 0) < filter.minBaths) return false;

            // Type Filter
            if (filter.type) {
                const dbType = (p.PropertyType || '').toLowerCase();
                const filterType = filter.type.toLowerCase();
                
                if (filterType === 'sale' && dbType !== 'residential') return false;
                if (filterType === 'rent' && dbType !== 'residential lease') return false;
                if (filterType === 'land' && dbType !== 'land') return false;
            }

            return true;
        });

        // Apply Sorting
        if (filter.sort === 'price_asc') {
            filtered.sort((a, b) => (a.ListPrice || 0) - (b.ListPrice || 0));
        } else if (filter.sort === 'price_desc') {
            filtered.sort((a, b) => (b.ListPrice || 0) - (a.ListPrice || 0));
        } else {
            // Default to newest
            filtered.sort((a, b) => b.toDTO().createdAt - a.toDTO().createdAt);
        }

        return filtered;
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

        // Next property (older in a descending list)
        const nextSnapshot = await adminDb.collection(COLLECTION_NAME)
            .orderBy('createdAt', 'desc')
            .startAfter(currentDoc)
            .limit(1)
            .get();

        // Prev property (newer in a descending list)
        const prevSnapshot = await adminDb.collection(COLLECTION_NAME)
            .orderBy('createdAt', 'desc')
            .endBefore(currentDoc)
            .limitToLast(1)
            .get();

        const prev = (!prevSnapshot.empty && prevSnapshot.docs[0]) ? Property.fromPersistence(prevSnapshot.docs[0].data() as PropertyPersistenceModel) : null;
        const next = (!nextSnapshot.empty && nextSnapshot.docs[0]) ? Property.fromPersistence(nextSnapshot.docs[0].data() as PropertyPersistenceModel) : null;

        return { prev, next };
    }
}
