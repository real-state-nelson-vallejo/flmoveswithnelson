import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { ContentGenerator, AnalysisResult } from "../domain/ContentGenerator";

export class GenkitContentGenerator implements ContentGenerator {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private ai: any;

    constructor() {
        // Initialize Genkit with Google AI plugin
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        this.ai = genkit({
            plugins: [googleAI()],
            model: 'googleai/gemini-2.5-flash', // Set default model explicitly via string
        });
    }

    async generatePropertyDescription(data: {
        title: string;
        location: string;
        features: string[];
        specs: { beds: number; baths: number; area: number };
        type: string;
    }): Promise<string> {
        const prompt = `
            Act as a professional real estate copywriter. Write a compelling, engaging, and SEO-friendly property description for the following listing:

            Title: ${data.title}
            Location: ${data.location}
            Type: ${data.type}
            Specs: ${data.specs.beds} beds, ${data.specs.baths} baths, ${data.specs.area} sqft.
            Key Features: ${data.features.join(", ")}.

            Tone: Luxurious, inviting, and professional.
            Length: About 150-200 words.
            Format: Single paragraph followed by a bulleted highlights list.
        `;

        try {
            const { text } = await this.ai.generate(prompt);
            return text;
        } catch (error) {
            console.error("Genkit Generation Error:", error);
            // Fallback error message or rethrow
            throw new Error("Failed to generate content via Genkit");
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async analyzeProperty(data: any): Promise<AnalysisResult> {
        const AnalysisSchema = z.object({
            opportunityScore: z.number().min(0).max(100),
            listingQualityScore: z.number().min(0).max(100),
            marketStatus: z.enum(['normal', 'distressed', 'price_drop', 'back_on_market']),
            investmentAnalysis: z.object({
                cashFlow: z.number(),
                roi: z.number(),
                capRate: z.number(),
                description: z.string()
            })
        });

        // Use built-in heuristics based on the rich RESO Dictionary fields
        const estimatedTax = data.TaxAnnualAmount || (data.ListPrice * 0.0125); // ~1.25% rule of thumb in FL if missing
        const estimatedHOA = data.HOAFee ? (data.HOAFee * 12) : 0;
        const totalAnnualFixedCosts = estimatedTax + estimatedHOA;

        const prompt = `
            Analyze the following Florida real estate property for investment potential using Native Geo-spatial Market Knowledge.
            
            Title: ${data.UnparsedAddress}
            Price: $${data.ListPrice} 
            Location: ${data.City}, ${data.StateOrProvince} ${data.PostalCode}
            Specs: ${data.BedroomsTotal} beds, ${data.BathroomsTotalInteger} baths, ${data.LivingArea} sqft.
            Status: ${data.StandardStatus}
            
            Intrinsic Financial Data:
            - Annual Taxes: $${estimatedTax}
            - Annual HOA/Assoc Fees: $${estimatedHOA}
            - Total Fixed OpEx (Tax+HOA): $${totalAnnualFixedCosts}
            - Market Time: ${data.DaysOnMarket || 0} days

            Provide exactly the following metrics:
            1. Opportunity Score (0-100): High score (>80) if it is well priced, high yield potential, or low Days on Market.
            2. Listing Quality Score (0-100): Base this on completeness of the description and features.
            3. Market Status: 'normal', 'distressed', 'price_drop', or 'back_on_market'.
            4. Investment Analysis: Estimated Annual Cash Flow, estimated ROI %, Cap Rate %, and a short, 2-sentence description of its investment profile. Base your estimates on typical rental rates for this Zip code and area setup.
        `;

        try {
            const { output } = await this.ai.generate({
                model: 'googleai/gemini-2.5-flash',
                prompt: prompt,
                output: { schema: AnalysisSchema }
            });

            return output as AnalysisResult;
        } catch (error) {
            console.error("Genkit Analysis Error:", error);
            return {
                opportunityScore: 50,
                listingQualityScore: 50,
                marketStatus: 'normal',
                investmentAnalysis: {
                    cashFlow: 0,
                    roi: 0,
                    capRate: 0,
                    description: "AI Analysis unavailable."
                }
            };
        }
    }
}
