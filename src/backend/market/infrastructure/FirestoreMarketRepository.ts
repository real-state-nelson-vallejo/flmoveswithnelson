import { MarketRepository } from "../domain/MarketRepository";
import { RentCastEnrichment } from "../domain/RentCastEnrichment";
import { adminDb } from "@/lib/firebase/admin";
import crypto from 'crypto';

export class FirestoreMarketRepository implements MarketRepository {

    private getCacheKey(address: string, zip: string): string {
        // Create a consistent hash/slug from address
        const normalized = `${zip}-${address}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return normalized;
    }

    async getCachedData(address: string, zip: string): Promise<RentCastEnrichment | null> {
        try {
            const cacheKey = this.getCacheKey(address, zip);
            const doc = await adminDb.collection('market_cache').doc(cacheKey).get();

            if (!doc.exists) return null;

            const data = doc.data();
            if (!data) return null;

            // Check if data is stale (> 30 days)
            const lastRetrieved = data.lastRetrieved;
            const now = Date.now();
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

            if (now - lastRetrieved > thirtyDaysMs) {
                console.log(`Cache expired for ${address} (${zip})`);
                return null;
            }

            return data as RentCastEnrichment;
        } catch (error) {
            console.error("Error fetching cached market data:", error);
            return null;
        }
    }

    async saveEnrichmentData(data: RentCastEnrichment, address: string, zip: string): Promise<void> {
        try {
            // 1. Always save to consistent market cache (Address-based)
            const cacheKey = this.getCacheKey(address, zip);
            await adminDb.collection('market_cache').doc(cacheKey).set(data, { merge: true });
            console.log(`Saved enrichment data to cache: ${cacheKey}`);

            // 2. If Property ID is valid (not temp), update the property document for easy retrieval
            if (data.propertyId && !data.propertyId.startsWith('temp-')) {
                await adminDb.collection('properties').doc(data.propertyId).update({
                    rentCastData: data
                });
                console.log(`Updated property ${data.propertyId} with enrichment data`);
            }
        } catch (error) {
            console.error("Error saving enrichment data:", error);
        }
    }
}
