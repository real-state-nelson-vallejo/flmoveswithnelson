import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';
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
            model: gemini20Flash, // Set default model
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
    async analyzeProperty(data: any, rentCastData?: any): Promise<AnalysisResult> {
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

        // Build context from RentCast data if available
        let marketContext = "";
        if (rentCastData) {
            marketContext = `
            REAL MARKET DATA (Verified via RentCast):
            - Estimated Value: $${rentCastData.valuation?.price} (Range: $${rentCastData.valuation?.priceRangeLow} - $${rentCastData.valuation?.priceRangeHigh})
            - Estimated Rent: $${rentCastData.valuation?.rent} (Range: $${rentCastData.valuation?.rentRangeLow} - $${rentCastData.valuation?.rentRangeHigh})
            - Market Avg Rent (Zip): $${rentCastData.marketStats?.averageRent}
            - Avg Days on Market: ${rentCastData.marketStats?.averagedaysOnMarket}
            - Last Updated: ${new Date(rentCastData.lastRetrieved).toLocaleDateString()}
            
            Use this REAL data to calculate the Cash Flow and Cap Rate ACCURATELY. Do not guess if this data is present.
            Compare the Listing Price ($${data.price.amount}) vs Estimated Value ($${rentCastData.valuation?.price}).
            `;
        }

        const prompt = `
            Analyze the following real estate property for investment potential.
            Title: ${data.title}
            Description: ${data.description}
            Price: ${data.price.amount} ${data.price.currency}
            Location: ${data.location.city}, ${data.location.state}
            Specs: ${data.specs.beds} beds, ${data.specs.baths} baths, ${data.specs.area} sqft.
            Status: ${data.status}

            ${marketContext}

            Provide:
            1. Opportunity Score (0-100): Based on price vs value potential (Use real data if available).
            2. Listing Quality Score (0-100): Completeness and description quality.
            3. Market Status: 'normal', 'distressed', 'price_drop', or 'back_on_market'.
            4. Investment Analysis: Estimated Cash Flow, ROI, Cap Rate, and a short pros/cons description.
        `;

        try {
            const { output } = await this.ai.generate({
                model: gemini20Flash,
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
