
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
        console.error("No API key found in GOOGLE_GENAI_API_KEY, GOOGLE_API_KEY, GEMINI_API_KEY, or NEXT_PUBLIC_* variants.");
        console.log("Environment keys found:", Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('GOOGLE') || k.includes('GEMINI')));
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // Note: The SDK might not expose listModels directly on the main class in all versions,
        // but typically it's available via the ModelManager or simply we try a generic call if SDK version varies.
        // Actually @google/generative-ai doesn't always expose listModels in the high level client easily 
        // without using the underlying API URL. 
        // Let's rely on a direct fetch to be sure, as SDKs change.

        // Using direct REST fetch for maximum reliability regardless of SDK version installed
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log("Available Models:");
        (data.models || []).forEach((m: any) => {
            console.log(`- ${m.name} (${m.displayName})`);
        });

    } catch (error) {
        console.error("Failed to list models:", error);
    }
}

listModels();
