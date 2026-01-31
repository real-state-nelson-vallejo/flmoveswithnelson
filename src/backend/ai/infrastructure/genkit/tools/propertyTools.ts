import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { ai } from '../config';

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
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            title: z.string(),
            price: z.number(),
            location: z.string(),
            description: z.string().optional()
        })),
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

        const snapshot = await query.limit(10).get();

        const results = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || 'Untitled Property',
                price: data.price?.amount || 0,
                location: data.location?.city || 'Unknown',
                description: data.description,
                // ... mapped fields
                bedrooms: data.specs?.bedrooms || 0,
                type: data.type
            };
        });

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
