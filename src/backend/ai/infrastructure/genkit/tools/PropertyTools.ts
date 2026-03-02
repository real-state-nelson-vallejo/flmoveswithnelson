
import { tool, z } from 'genkit';
import { SemanticSearchService } from '@/backend/property/application/SemanticSearchService';
import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/FirestoreLeadRepository';

const leadRepository = new FirestoreLeadRepository();
export const PropertyTools = {
    register: () => {
        const TOOLS_NAME = 'propertyToolsInstances_v5';

        if ((globalThis as any)[TOOLS_NAME]) {
            return (globalThis as any)[TOOLS_NAME];
        }

        console.log('[PropertyTools] Registering with latest SemanticSearchService v5');
        const semanticSearch = new SemanticSearchService();

        const tools = [
            tool(
                {
                    name: 'search_properties_v2',
                    description: 'Search for properties using natural language. Use this to find homes that match a specific "vibe", description, or set of requirements. Support filtering by price, city, and beds. IMPORTANT: Always provide a descriptive "query" string summarizing what the user wants.',
                    inputSchema: z.object({
                        query: z.string().optional().describe('Natural language query describing the desired property. ALWAYS fill this with a summary of what the user wants, e.g., "house in Miami between 800000 and 1000000 dollars".'),
                        minPrice: z.number().optional().describe('Minimum price in USD.'),
                        maxPrice: z.number().optional().describe('Maximum price in USD.'),
                        city: z.string().optional().describe('City to filter by (e.g., "Miami", "Coral Gables").'),
                        beds: z.number().optional().describe('Minimum number of bedrooms.'),
                        leadId: z.string().optional().describe('REQUIRED. ID of the lead making the search.')
                    }),
                    outputSchema: z.object({
                        properties: z.array(z.any()).describe('List of properties matching the criteria.')
                    })
                },
                async (input) => {
                    // Build a smart query from filters if the LLM didn't provide one
                    let query = input.query?.trim() || "";
                    if (!query) {
                        const parts: string[] = ["property"];
                        if (input.city) parts.push(`in ${input.city}`);
                        if (input.minPrice && input.maxPrice) parts.push(`between $${input.minPrice} and $${input.maxPrice}`);
                        else if (input.minPrice) parts.push(`from $${input.minPrice}`);
                        else if (input.maxPrice) parts.push(`up to $${input.maxPrice}`);
                        if (input.beds) parts.push(`with ${input.beds} bedrooms`);
                        query = parts.join(" ");
                    }
                    console.log(`[PropertyTools] Synthesized query: "${query}"`);

                    const results = await semanticSearch.execute({
                        query,
                        minPrice: input.minPrice,
                        maxPrice: input.maxPrice,
                        city: input.city,
                        beds: input.beds
                    });

                    // Log this search interaction to the Lead profile
                    if (input.leadId) {
                        try {
                            const lead = await leadRepository.findById(input.leadId);
                            if (lead) {
                                const details = `Queries: "${input.query}"\nFilters: City: ${input.city || 'Any'}, Min: ${input.minPrice || 0}, Max: ${input.maxPrice || 'Any'}, Beds: ${input.beds || 'Any'}`;
                                lead.addInteraction('view_property', details);
                                await leadRepository.save(lead);
                            }
                        } catch (err) {
                            console.error('[PropertyTools] Failed to log interaction to CRM:', err);
                        }
                    }

                    // Simplify output for the LLM to save tokens, only returning key info
                    const simplified = results.map(p => ({
                        id: p.id,
                        title: p.title,
                        price: p.price.amount,
                        location: `${p.location.city}, ${p.location.state}`,
                        beds: p.specs.beds,
                        baths: p.specs.baths,
                        type: p.type,
                        link: `/properties/${p.slug}` // Useful for the AI to provide links
                    }));

                    return { properties: simplified };
                }
            )
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any)[TOOLS_NAME] = tools;
        return tools;
    }
};
