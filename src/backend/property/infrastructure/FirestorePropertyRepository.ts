import { Property } from "../domain/Property";
import { PropertyRepository, PropertyFilter, PropertyPage } from "../domain/PropertyRepository";
import { adminDb } from "@/lib/firebase/admin";
import { PropertyPersistenceModel } from "./dto/PropertyPersistence";
import type { QueryDocumentSnapshot, Query } from 'firebase-admin/firestore';

const COLLECTION_NAME = "properties";
const DEFAULT_PAGE_SIZE = 20;
const LEGACY_SEARCH_CAP = 500;

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
        // Fast path: save() uses `doc(property.id)` and property.id === ListingKey === externalId,
        // so for every property written through this repo the doc ID equals the externalId.
        // This is an O(1) point read instead of a collection scan (tens of thousands of reads in a sync).
        const directDoc = await adminDb.collection(COLLECTION_NAME).doc(externalId).get();
        if (directDoc.exists) {
            return Property.fromPersistence(directDoc.data() as PropertyPersistenceModel);
        }

        // Legacy fallback: properties imported by older pipelines may have a random doc ID with
        // externalId stored as a field. Needs the `externalId` index (see firestore.indexes.json).
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

    /**
     * Builds a Firestore query with server-side filters where possible.
     * - `agentId`, `officeId`, `homeSection`, `city`, `type` → server-side `where` (uses indexes).
     * - `archived` → implicit `where archived != true` unless `includeArchived`.
     * - `minPrice`/`maxPrice` → range on ListPrice. Can't combine with another range in Firestore.
     * - `query` (free-text), `minBeds`, `minBaths` → post-filter in memory on the returned page.
     * `orderBy` matches the composite index being used.
     */
    private buildBaseQuery(filter: PropertyFilter): { q: Query; orderedBy: 'createdAt' | 'ListPrice' } {
        let q: Query = adminDb.collection(COLLECTION_NAME);
        let orderedBy: 'createdAt' | 'ListPrice' = 'createdAt';

        if (filter.homeSection) q = q.where('homeSections', 'array-contains', filter.homeSection);
        if (filter.agentId) q = q.where('ListAgentMlsId', '==', filter.agentId);
        if (filter.officeId) q = q.where('ListOfficeMlsId', '==', filter.officeId);
        if (filter.city) q = q.where('City', '==', filter.city);

        if (filter.type) {
            const filterType = filter.type.toLowerCase();
            if (filterType === 'sale') q = q.where('PropertyType', '==', 'Residential');
            else if (filterType === 'rent') q = q.where('PropertyType', '==', 'Residential Lease');
            else if (filterType === 'land') q = q.where('PropertyType', '==', 'Land');
        }

        if (!filter.includeArchived) q = q.where('archived', '==', false);

        // Range filter on price → forces orderBy ListPrice first.
        if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
            if (filter.minPrice !== undefined) q = q.where('ListPrice', '>=', filter.minPrice);
            if (filter.maxPrice !== undefined) q = q.where('ListPrice', '<=', filter.maxPrice);
            orderedBy = 'ListPrice';
            q = q.orderBy('ListPrice', filter.sort === 'price_desc' ? 'desc' : 'asc');
        } else if (filter.sort === 'price_asc' || filter.sort === 'price_desc') {
            orderedBy = 'ListPrice';
            q = q.orderBy('ListPrice', filter.sort === 'price_asc' ? 'asc' : 'desc');
        } else {
            q = q.orderBy('createdAt', 'desc');
        }

        return { q, orderedBy };
    }

    private postFilterInMemory(items: Property[], filter: PropertyFilter): Property[] {
        const query = filter.query?.toLowerCase() || "";
        const isStateMatch = (text: string | undefined, qq: string) => {
            if (!text) return false;
            const lowerText = text.toLowerCase();
            const normalizedQuery = qq === 'florida' ? 'fl' : qq;
            return lowerText.includes(qq) || lowerText.includes(normalizedQuery);
        };
        return items.filter(p => {
            if (query) {
                const matches =
                    (p.UnparsedAddress || '').toLowerCase().includes(query) ||
                    (p.PublicRemarks || '').toLowerCase().includes(query) ||
                    (p.City || '').toLowerCase().includes(query) ||
                    isStateMatch(p.StateOrProvince, query) ||
                    (p.PostalCode || '').toLowerCase().includes(query);
                if (!matches) return false;
            }
            if (filter.minBeds && (p.BedroomsTotal || 0) < filter.minBeds) return false;
            if (filter.minBaths && (p.BathroomsTotalInteger || 0) < filter.minBaths) return false;
            return true;
        });
    }

    async searchPage(filter: PropertyFilter): Promise<PropertyPage> {
        const pageSize = filter.limit ?? DEFAULT_PAGE_SIZE;
        const { q } = this.buildBaseQuery(filter);

        // We overfetch a bit to compensate for in-memory post-filters (query/minBeds/minBaths)
        // removing some items, without losing the cursor semantics.
        const hasPostFilter = !!(filter.query || filter.minBeds || filter.minBaths);
        const fetchSize = hasPostFilter ? Math.min(pageSize * 3, LEGACY_SEARCH_CAP) : pageSize;

        let query = q.limit(fetchSize);
        if (filter.cursor) {
            const cursorDoc = await adminDb.collection(COLLECTION_NAME).doc(filter.cursor).get();
            if (cursorDoc.exists) query = query.startAfter(cursorDoc);
        }

        const snap = await query.get();
        const items = snap.docs.map((d: QueryDocumentSnapshot) =>
            Property.fromPersistence(d.data() as PropertyPersistenceModel));
        const filtered = hasPostFilter ? this.postFilterInMemory(items, filter) : items;
        const page = filtered.slice(0, pageSize);

        const lastRawDoc = snap.docs[snap.docs.length - 1];
        // If Firestore returned fewer than we asked for, we're at the end.
        const reachedEnd = snap.docs.length < fetchSize;
        const nextCursor = !reachedEnd && lastRawDoc ? lastRawDoc.id : null;

        return { properties: page, nextCursor };
    }

    /**
     * Legacy non-paginated search. Returns up to `LEGACY_SEARCH_CAP` items.
     * Preserved for callers (home featured merge, section lists, search action shim).
     */
    async search(filter: PropertyFilter): Promise<Property[]> {
        const pageSize = filter.limit ?? LEGACY_SEARCH_CAP;
        const { properties } = await this.searchPage({ ...filter, limit: pageSize, cursor: undefined });
        return properties;
    }

    async findSimilar(property: Property, limit: number): Promise<Property[]> {
        const price = property.ListPrice || 0;
        if (!price) return [];
        const minP = Math.floor(price * 0.8);
        const maxP = Math.ceil(price * 1.2);

        let q: Query = adminDb.collection(COLLECTION_NAME);
        q = q.where('City', '==', property.City);
        q = q.where('archived', '==', false);
        q = q.where('ListPrice', '>=', minP).where('ListPrice', '<=', maxP);
        q = q.orderBy('ListPrice', 'asc').limit(limit + 1);

        const snap = await q.get();
        return snap.docs
            .map((d: QueryDocumentSnapshot) => Property.fromPersistence(d.data() as PropertyPersistenceModel))
            .filter(p => p.id !== property.id)
            .slice(0, limit);
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
