import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';
import { ContentGenerator } from "../domain/ContentGenerator";

export class GenkitContentGenerator implements ContentGenerator {
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
}
