import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { DocumentExtractor } from "../domain/DocumentExtractor";
import { Property } from "@/backend/property/domain/Property";
import { DocumentTemplate } from "../domain/DocumentTemplate";
import { LegalProfile } from "../domain/LegalProfile";
import { TransactionPreset } from "../domain/TransactionPreset";

export class GeminiDocumentExtractor implements DocumentExtractor {
    private ai: ReturnType<typeof genkit>;

    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            // In development, we might not have it set in checking scripts, but checking environment logic...
            // Warn instead of throw for now to allow build to pass if env is missing in CI
            console.warn("GEMINI_API_KEY is not set. AI features will result in errors.");
        }
        this.ai = genkit({
            plugins: [googleAI()],
        });
    }

    async extractData(
        conversationContext: string,
        property: Property,
        template: DocumentTemplate,
        profile?: LegalProfile | null,
        preset?: TransactionPreset | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lead?: Record<string, any> | null
    ): Promise<{ data: Record<string, unknown>; confidence: Record<string, number> }> {

        const FIELDS_PER_CHUNK = 20; // Reduced for safety and faster TTFB per promise
        const totalChunks = Math.ceil(template.fields.length / FIELDS_PER_CHUNK);

        // Prepare base prompt with all context layers
        const basePrompt = `
            Act as an expert legal real estate assistant. Extract information to cleanly fill the form "${template.name}".
            
            CONTEXT LAYER 1: Property Details
            Title: ${property.title}
            Address: ${property.location.address}, ${property.location.city}, ${property.location.state} ${property.location.zip || ''}
            Price/Rent: ${property.price.amount} ${property.price.currency}
            Description: ${property.description}
            
            CONTEXT LAYER 2: CRM Lead (Tenant/Buyer/Client)
            ${lead ? `
            Name: ${lead.name}
            Email: ${lead.email}
            Phone: ${lead.phone}
            ` : "No specific CRM lead bound to this document."}
            
            CONTEXT LAYER 3: Realtor/Broker Profile
            ${profile ? `
            Broker Name: ${profile.broker.name}
            License: ${profile.broker.licenseNumber}
            Company: ${profile.broker.companyName}
            Phone: ${profile.broker.phone}
            Email: ${profile.broker.email}
            Address: ${profile.broker.address}
            ` : "No profile provided."}

            CONTEXT LAYER 4: Historical Learned Presets
            ${preset ? `Use these AI-learned defaults for recurring fields (unless User Input overrides explicitly): \n${JSON.stringify(preset.defaultData, null, 2)}` : "No learned preset available for this type."}
            
            CONTEXT LAYER 5: User Input/Conversation Notes
            "${conversationContext}"
            
            CRITICAL INSTRUCTIONS:
            1. Extract the data for the requested FORM STRUCTURE fields (provided below in this chunk).
            2. Match your extracted values to the strict JSON 'Alias ID' keys provided in brackets [alias_id].
            3. For each field, provide the 'value' and a 'confidence' score (0.0 to 1.0).
            4. High Confidence (0.8 - 1.0): Values explicitly found in the Context Layers.
            5. Medium Confidence (0.4 - 0.7): Inferred values or logical deductions.
            6. Low Confidence (0.0 - 0.3): Best guesses or defaults.
            7. If data is completely MISSING, use value: null, confidence: 0.0.
            8. Format dates as MM/DD/YYYY. For Money/Price, use "$X,XXX.XX" format.
        `;

        const extractedData: Record<string, unknown> = {};
        const extractedConfidence: Record<string, number> = {};

        // Generate chunks Promises
        const chunkPromises = [];
        for (let i = 0; i < totalChunks; i++) {
            const chunkFields = template.fields.slice(i * FIELDS_PER_CHUNK, (i + 1) * FIELDS_PER_CHUNK);

            // We create aliases (e.g. "f_0", "f_1") to prevent Gemini API from crashing 
            // due to "Too many states" caused by 150+ character property names from PDF fields
            const aliasMap: Record<string, string> = {};
            const shape: Record<string, z.ZodTypeAny> = {};

            chunkFields.forEach((field, idx) => {
                const alias = `f_${idx}`;
                aliasMap[alias] = field.fieldId;

                let valueSchema;
                if (field.type === 'checkbox') {
                    valueSchema = z.boolean().nullable();
                } else {
                    valueSchema = z.string().nullable();
                }
                shape[alias] = z.object({
                    value: valueSchema,
                    confidence: z.number()
                });
            });
            const ChunkSchema = z.object(shape);

            // Group fields by page for this chunk's prompt context, attaching the Alias
            const fieldsByPage = chunkFields.reduce((acc, field, idx) => {
                const page = field.page + 1;
                if (!acc[page]) acc[page] = [];
                acc[page].push(`[f_${idx}] ${field.originalLabel || field.fieldId}`);
                return acc;
            }, {} as Record<number, string[]>);

            let fieldsContext = "";
            Object.entries(fieldsByPage).forEach(([page, fields]) => {
                fieldsContext += `Page ${page}:\n- ${fields.join('\n- ')}\n\n`;
            });

            const chunkPrompt = `
                ${basePrompt}
                
                FORM STRUCTURE FOR THIS EXTRACTION BATCH (Use the Alias ID in brackets matching the schema!):
                ${fieldsContext}
            `;

            chunkPromises.push(
                this.ai.generate({
                    model: 'googleai/gemini-2.5-flash',
                    prompt: chunkPrompt,
                    output: { schema: ChunkSchema }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }).then((response: any) => {
                    const parsed = response.output || {};
                    // Reverse map the aliases back to their original PDF fieldIds
                    const mappedOutput: Record<string, unknown> = {};
                    for (const [alias, obj] of Object.entries(parsed)) {
                        const originalFieldId = aliasMap[alias];
                        if (originalFieldId) {
                            mappedOutput[originalFieldId] = obj;
                        }
                    }
                    return mappedOutput;
                }).catch((error: unknown) => {
                    console.error(`Gemini Chunk ${i} Extraction Error:`, error);
                    return {}; // Return empty object on chunk failure so we don't crash whole process
                })
            );
        }

        // Await all chunks to finish
        const chunkResults = await Promise.all(chunkPromises);

        // Merge results
        for (const parsedOutput of chunkResults) {
            for (const [key, obj] of Object.entries(parsedOutput)) {
                // @ts-expect-error dynamic genkit mapping
                extractedData[key] = obj?.value ?? null;
                // @ts-expect-error dynamic genkit mapping
                extractedConfidence[key] = obj?.confidence ?? 0;
            }
        }

        return { data: extractedData, confidence: extractedConfidence };
    }
}
