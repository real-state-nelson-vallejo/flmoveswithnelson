import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { ai } from '../config';
import { PropertySchema } from '@/lib/schemas/propertySchema';

// This tool wraps the Firestore query so the AI can find properties
export const searchPropertiesTool = ai.defineTool(
    {
        name: 'searchProperties',
        description: 'Searches for properties based on location, price range, and type (sale/rent). Returns a list of matching properties.',
        inputSchema: z.object({
            location: z.string().optional().describe('City or neighborhood name'),
            minPrice: z.number().optional().describe('Minimum price in USD/EUR'),
            maxPrice: z.number().optional().describe('Maximum price in USD/EUR'),
            type: z.enum(['sale', 'rent']).optional().describe('Type of listing: sale or rent'),
            bedrooms: z.number().optional().describe('Minimum number of bedrooms')
        }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        outputSchema: z.array(z.object({
            id: z.string(),
            title: z.string(),
            price: z.number(),
            location: z.string(),
            description: z.string().optional()
        })) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    async (input) => {
        // Basic implementation connecting to Firestore
        // Ideally this calls PropertyRepository, but for direct AI speed we query adminDb here or use the repository if available

        const query = adminDb.collection('properties');

        // Note: Firestore requires composite indexes for complex multi-field queries.
        // We will do basic client-side filtering or simple single-field queries for this MVP if indexes aren't ready.
        // For now, let's limit to just fetching recent ones and filtering manually if the dataset is small, 
        // or assume "location" is the main filter.

        if (input.type) {
            // query = query.where('type', '==', input.type); // Type check issue with chained queries in strict mode sometimes
        }


        // ... (existing imports)

        const snapshot = await query.limit(10).get();

        const results = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const rawData = doc.data();
            // Validate data against schema
            const parseResult = PropertySchema.safeParse(rawData);

            if (!parseResult.success) {
                console.warn(`Invalid property data for ${doc.id}:`, parseResult.error);
                return null;
            }

            const data = parseResult.data;

            return {
                id: doc.id,
                title: data.title,
                price: data.price.amount, // safe access
                location: data.location.city,
                description: data.description,
                // ... mapped fields
                bedrooms: data.specs.beds,
                type: data.type
            };
        }).filter((p: unknown): p is {
            id: string;
            title: string;
            price: number;
            location: string;
            description: string;
            bedrooms: number;
            type: "sale" | "rent";
        } => p !== null);

        // In-memory filter for MVP to avoid index creation hell during demo
        return results.filter(p => {
            if (input.location && !p.location.toLowerCase().includes(input.location.toLowerCase())) return false;
            if (input.minPrice && p.price < input.minPrice) return false;
            if (input.maxPrice && p.price > input.maxPrice) return false;
            if (input.type && p.type !== input.type) return false;
            if (input.bedrooms && p.bedrooms < input.bedrooms) return false;
            return true;
        });
    }
);
