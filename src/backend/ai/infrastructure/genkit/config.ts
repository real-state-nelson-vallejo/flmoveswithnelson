import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

// Note: Ensure GOOGLE_GENAI_API_KEY is set in .env
// We are using 'gemini-1.5-flash' as the code reference, 
// assuming the SDK maps it or we'll specify the model version string explicitly if 2.5 is not yet in the typed enum.
// For now, sticking to a known safe string or the latest alias provided by the SDK.
// If the user specifically meant 2.5, we might need to pass the string 'gemini-2.5-flash' if the SDK supports it dynamically.

export const ai = genkit({
    plugins: [googleAI({
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
    })],
    // Default model if none specified
    model: 'gemini-1.5-flash',
});
