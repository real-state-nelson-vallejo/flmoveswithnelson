
import { tool, z } from 'genkit';
import { SemanticSearchService } from '@/backend/property/application/SemanticSearchService';
import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/FirestoreLeadRepository';
import { SaveSearchUseCase } from '@/backend/crm/application/SaveSearchUseCase';
import { FirestoreSavedSearchRepository } from '@/backend/crm/infrastructure/FirestoreSavedSearchRepository';

const leadRepository = new FirestoreLeadRepository();
export const PropertyTools = {
    register: () => {
        const TOOLS_NAME = 'propertyToolsInstances_v5';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((globalThis as any)[TOOLS_NAME]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (globalThis as any)[TOOLS_NAME];
        }

        console.log('[PropertyTools] Registering with latest SemanticSearchService v5');
        const semanticSearch = new SemanticSearchService();
        const saveSearchUseCase = new SaveSearchUseCase(new FirestoreSavedSearchRepository());

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
                    const simplified = results.map((p: any) => {
                        // Handle both full domain entities and DTOs
                        const dto = typeof p.toDTO === 'function' ? p.toDTO() : p;
                        
                        // Safely extract thumbnail or first image
                        let imageUrl: string | undefined = undefined;
                        if (Array.isArray(dto.Media) && dto.Media.length > 0) {
                            imageUrl = typeof dto.Media[0] === 'string' ? dto.Media[0] : dto.Media[0].MediaURL;
                        } else if (typeof dto.thumbnail === 'string') {
                            imageUrl = dto.thumbnail;
                        }

                        return {
                            id: dto.ListingKey,
                            title: dto.UnparsedAddress || 'Unknown Property',
                            price: dto.ListPrice || 0,
                            currency: 'USD',
                            location: `${dto.City || ''}, ${dto.StateOrProvince || ''}`.trim().replace(/^,|,$/g, ''),
                            specs: `${dto.BedroomsTotal || 0} bed, ${dto.BathroomsTotalInteger || 0} bath, ${dto.LivingArea || 0} sqft`,
                            propertyType: dto.PropertyType || 'Residential',
                            slug: dto.slug || dto.ListingKey,
                            image: imageUrl
                        };
                    });

                    return { 
                        type: 'property_results',
                        count: simplified.length,
                        properties: simplified 
                    };
                }
            ),
            tool(
                {
                    name: 'save_search_alert',
                    description: 'CRITICAL: Save a property search alert for the lead. Use this immediately if search_properties_v2 returns 0 results, or if the user explicitly asks to be alerted of future properties matching their criteria.',
                    inputSchema: z.object({
                        query: z.string().describe('Natural language description of the search to save.'),
                        minPrice: z.number().optional().describe('Minimum price constraint.'),
                        maxPrice: z.number().optional().describe('Maximum price constraint.'),
                        city: z.string().optional().describe('City to monitor.'),
                        beds: z.number().optional().describe('Minimum bedrooms constraint.'),
                        leadId: z.string().describe('REQUIRED. ID of the lead. DO NOT call this tool without a leadId from context.')
                    }),
                    outputSchema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                },
                async (input) => {
                    if (!input.leadId || input.leadId === 'none') {
                        return { success: false, message: "Cannot save search alert. No valid leadId provided." };
                    }
                    
                    try {
                        await saveSearchUseCase.execute({
                            leadId: input.leadId,
                            frequency: 'daily',
                            searchCriteria: {
                                query: input.query,
                                minPrice: input.minPrice,
                                maxPrice: input.maxPrice,
                                city: input.city,
                                beds: input.beds
                            }
                        });
                        
                        // Log interaction
                        try {
                            const lead = await leadRepository.findById(input.leadId);
                            if (lead) {
                                lead.addInteraction('save_search', `Auto-Saved AI Alert: "${input.query}"`);
                                await leadRepository.save(lead);
                            }
                        } catch (err) {
                            console.error('[PropertyTools] Failed to log interaction for saved search:', err);
                        }

                        return { success: true, message: "Active market alert successfully injected into CRM. The user will receive daily digest notifications." };
                    } catch (error: any) {
                        return { success: false, message: `Failed to save search alert: ${error.message}` };
                    }
                }
            )
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any)[TOOLS_NAME] = tools;
        return tools;
    }
};
