// Genkit model integration for chatbot
import { z } from 'zod';
import { ai } from '../config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define the schema for the input state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChatInputSchema: any = z.object({
    history: z.array(z.any()), // Conversation history
    userInput: z.string(),
    modelId: z.string().optional(),
});

export const chatbotFlow = ai.defineFlow(
    {
        name: 'chatbotFlow',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputSchema: ChatInputSchema as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outputSchema: z.string() as any,
    },
    async (input) => {
        const { history, userInput, modelId } = input;

        try {
            console.log(`[chatbotFlow] Using model: ${modelId || 'default'}`);
            console.log(`[chatbotFlow] Message count: ${history.length}`);

            // Extract the actual model name (remove provider prefix if present)
            // e.g., 'googleai/gemini-2.5-flash' -> 'gemini-2.5-flash'
            const actualModelName = modelId?.includes('/')
                ? modelId.split('/').pop()!
                : (modelId || 'gemini-2.5-flash');

            console.log(`[chatbotFlow] Actual model name: ${actualModelName}`);

            // Use direct Google AI SDK (works in Next.js, Genkit's fetch doesn't)
            const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
            if (!apiKey) {
                console.error('[chatbotFlow] No API key found in environment');
                throw new Error("No API key configured");
            }

            console.log(`[chatbotFlow] API Key exists: ${apiKey.substring(0, 10)}...`);

            // Create custom fetch with better error handling
            const customFetch = async (url: string, options: RequestInit = {}) => {
                try {
                    console.log(`[chatbotFlow] Fetching: ${url}`);
                    const response = await fetch(url, {
                        ...options,
                        // Add explicit headers
                        headers: {
                            'Content-Type': 'application/json',
                            ...options.headers,
                        },
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`[chatbotFlow] HTTP Error: ${response.status} - ${errorText}`);
                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                    }

                    return response;
                } catch (error) {
                    console.error('[chatbotFlow] Fetch error:', error);
                    throw error;
                }
            };

            const genAI = new GoogleGenerativeAI(apiKey);

            // Set custom fetch if we're in a server environment
            if (typeof window === 'undefined') {
                // @ts-expect-error - Setting internal fetch
                genAI._fetch = customFetch;
            }

            const model = genAI.getGenerativeModel({
                model: actualModelName
            });

            // Convert history format for Google AI SDK
            // From: [{ role: 'user'|'model', content: [{ text: '...' }] }]
            // To: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
            const formattedHistory = history.map((msg: { role: string; content?: { text: string }[]; text?: string }) => ({
                role: msg.role === 'ai' ? 'model' : msg.role, // Normalize 'ai' to 'model'
                parts: msg.content || [{ text: msg.text || '' }]
            }));

            console.log(`[chatbotFlow] Starting chat with ${formattedHistory.length} history messages`);

            // Start chat with history
            const chat = model.startChat({
                history: formattedHistory,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
            });

            console.log(`[chatbotFlow] Sending message: ${userInput.substring(0, 50)}...`);

            // Send message with timeout
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout after 30s')), 30000)
            );

            const result = await Promise.race([
                chat.sendMessage(userInput),
                timeoutPromise
            ]);

            const response = result.response;
            const text = response.text();

            // Extract usage metadata
            const usage = response.usageMetadata ? {
                promptTokenCount: response.usageMetadata.promptTokenCount,
                candidatesTokenCount: response.usageMetadata.candidatesTokenCount,
                totalTokenCount: response.usageMetadata.totalTokenCount,
            } : undefined;

            console.log(`[chatbotFlow] Success. Generated ${text?.length || 0} chars`);

            return JSON.stringify({
                text,
                usage
            });

        } catch (error) {
            console.error("[chatbotFlow] AI generation error:", error);
            // Log full error details
            if (error instanceof Error) {
                console.error("[chatbotFlow] Error name:", error.name);
                console.error("[chatbotFlow] Error message:", error.message);
                console.error("[chatbotFlow] Error stack:", error.stack);
            }

            // Return a safe error response
            return JSON.stringify({
                text: "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
                usage: undefined,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
);
