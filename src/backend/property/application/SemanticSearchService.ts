
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { PropertyDTO } from "../infrastructure/dto/PropertyDTO";
import { FirestorePropertyRepository } from "../infrastructure/FirestorePropertyRepository";

export interface SemanticSearchParams {
    query: string;
    limit?: number;
    // Hybrid Filters
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    city?: string | undefined;
    beds?: number | undefined;
    type?: string | undefined;
}

export class SemanticSearchService {
    private repo = new FirestorePropertyRepository();
    private collectionName = 'properties_vectors';

    async execute(params: SemanticSearchParams): Promise<PropertyDTO[]> {
        // 1. Generate Embedding for the Query
        // Fallback to a generic string if the model passed an empty string, to avoid 400 errors.
        const safeQuery = params.query?.trim() ? params.query.trim() : "A real estate property";
        console.log(`[SemanticSearch] Generating embedding for query: "${safeQuery}"`);

        // Use Google AI SDK directly (bypasses Genkit ai.embed which has issues inside Next.js runtime)
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) throw new Error("No GEMINI_API_KEY configured");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent(safeQuery);
        let embedding = result.embedding.values;

        // Clip to exactly 768 to match Firestore vector index
        embedding = embedding.slice(0, 768);

        console.log(`[SemanticSearch] Successfully extracted embedding vector of length: ${embedding.length}`);

        // 2. Build Firestore Vector Query
        // We skip pre-filters (city, price) to avoid requiring composite indexes.
        // All filtering is done in the post-filter step after vector search.
        const coll = adminDb.collection(this.collectionName);

        // 3. Execute Vector Search (pure vector, no composite filters)
        const vectorQuery = coll.findNearest({
            vectorField: 'embedding',
            queryVector: FieldValue.vector(embedding),
            limit: params.limit || 10, // Fetch more to compensate for post-filtering
            distanceMeasure: 'COSINE'
        });

        const snapshot = await vectorQuery.get();

        // 4. Retrieve Full Properties
        const propertyIds = snapshot.docs.map(doc => doc.id);

        if (propertyIds.length === 0) return [];

        // Manual "In" fetch or iterative fetch
        // propertyIds might be duplicated or empty
        const uniqueIds = [...new Set(propertyIds)];

        // We need to fetch the REAL property data, not just the vector doc
        const properties: PropertyDTO[] = [];
        for (const id of uniqueIds) {
            const prop = await this.repo.findById(id);
            if (prop) {
                // 5. Post-Filter for Range Constraints (Price/Beds)
                // Doing this in memory is safer than complex indexes for now
                let match = true;
                if (params.minPrice && prop.price.amount < params.minPrice) match = false;
                if (params.maxPrice && prop.price.amount > params.maxPrice) match = false;
                if (params.beds && prop.specs.beds < params.beds) match = false;

                if (match) {
                    properties.push(prop.toDTO());
                }
            }
        }

        return properties;
    }
}
