import { GoogleGenerativeAI } from "@google/generative-ai";
import { ContentGenerator } from "../domain/ContentGenerator";

export class GeminiContentGenerator implements ContentGenerator {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generatePropertyDescription(data: {
        title: string;
        location: string;
        features: string[];
        specs: { beds: number; baths: number; area: number };
        type: string;
    }): Promise<string> {
        // Updated to optimized flash model as requested
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini Generation Error:", error);
            return "Failed to generate description via AI. Please try again later.";
        }
    }
}
