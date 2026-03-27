
import { Property } from "@/backend/property/domain/Property";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { ai } from "@/backend/ai/infrastructure/genkit/config";

const PROPERTIES_VECTORS_COLLECTION = 'properties_vectors';

export class VectorizePropertyService {
    async execute(property: Property, maxRetries: number = 3): Promise<void> {
        // 1. Generate the "Atom" text
        const atomText = property.toEmbeddingText();

        let embeddingResult;
        let attempt = 0;

        // Implement Retry Pattern (Exponential Backoff) for Resiliency
        while (attempt < maxRetries) {
            try {
                // 1.5. Compute Vector Inline
                embeddingResult = await ai.embed({
                    embedder: 'googleai/gemini-embedding-001',
                    content: atomText
                });
                break; // Success, break out of retry loop
            } catch (error: any) {
                attempt++;
                console.warn(`[VectorizePropertyService] API failed for ${property.id} (Attempt ${attempt}/${maxRetries}). Cause:`, error.message);
                
                if (attempt >= maxRetries) {
                    // Propagate the error so SyncBridgeProperties can catch it and degrade gracefully
                    throw new Error(`AI Vectorization failed completely after ${maxRetries} attempts. Last error: ${error.message}`);
                }
                // Exponential backoff: 1s, 2s...
                const delayMs = Math.pow(2, attempt) * 500;
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        let rawVec: number[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = embeddingResult;
        if (Array.isArray(res)) {
            if (res.length > 0 && typeof res[0] === 'number') { rawVec = res; }
            else if (res.length > 0 && res[0].embedding) { rawVec = res[0].embedding; }
            else { throw new Error("Unexpected array from ai.embed"); }
        } else if (res && typeof res === 'object') {
            if (res.embedding) { rawVec = res.embedding; }
            else if (res.values) { rawVec = res.values; }
            else { throw new Error("Unexpected object from ai.embed"); }
        } else {
            throw new Error("Unexpected return type from ai.embed");
        }

        // Clip to exactly 768 dimensions
        const embedding = rawVec.slice(0, 768);

        // 2. Prepare the Shadow Document
        // We include scalar fields needed for "Hard Filtering" (Phase 3 Hybrid Strategy)
        // so we can query: "Where price < X AND vector_similarity(q) > Y" in a single query.
        const vectorDoc = {
            propertyId: property.id,
            input_text: atomText, // The field the Extension listens to (Verified via _firestore-vector-search config)
            // Metadata for Hybrid Search Filtering:
            price: property.ListPrice,
            currency: 'USD',
            beds: property.BedroomsTotal,
            baths: property.BathroomsTotalInteger,
            city: property.City,
            type: property.PropertyType,
            status: property.StandardStatus,
            updatedAt: new Date(), // Force trigger update
            // We now compute the embedding inline instead of relying on the extension
            // to enforce the 768 dimension limit.
            embedding: FieldValue.vector(embedding)
        };

        // 3. Save to Shadow Collection (Triggering the Extension)
        await adminDb.collection(PROPERTIES_VECTORS_COLLECTION)
            .doc(property.id)
            .set(vectorDoc, { merge: true });

        console.log(`[VectorizePropertyService] Triggered vectorization for ${property.id}`);
    }
}
