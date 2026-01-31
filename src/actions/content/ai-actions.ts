"use server";

import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';

// Initialize Genkit specifically for actions (server-side only)
// Reuse this logic or extract to shared provider if needed regularly
const ai = genkit({
    plugins: [googleAI()],
    model: gemini20Flash,
});

export async function generateBlogPostAction(title: string, type: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "API Key missing" };
    }

    const prompt = `
        You are an expert real estate content writer.
        Write a ${type} post with the title: "${title}".
        
        Requirements:
        - Format: Markdown.
        - Tone: Professional, authoritative, yet inviting.
        - Structure: Introduction, 3-4 Key Sections with H2 headers, Conclusion.
        - Include an 'Excerpt' at the very top relative to the content, but I will strip it.
        - Length: Approx 400-600 words.
        
        Return ONLY the markdown content.
    `;

    try {
        const { text } = await ai.generate(prompt);

        // Simple extraction if needed, or just return text
        // Improve: Generate JSON with explicit fields

        return {
            success: true,
            content: text,
            excerpt: text.slice(0, 150) + "..." // Naive excerpt
        };
    } catch (error) {
        console.error("AI Blog Gen Error:", error);
        return { success: false, error: "Failed to generate blog post" };
    }
}
