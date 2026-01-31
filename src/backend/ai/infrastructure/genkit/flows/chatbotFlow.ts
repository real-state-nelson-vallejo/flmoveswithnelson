import { gemini15Flash } from '@genkit-ai/googleai';
import { searchPropertiesTool } from '../tools/propertyTools';
import { z } from 'zod';
import { ai } from '../config';

// Define the schema for the input state
const ChatInputSchema = z.object({
    history: z.array(z.object({
        role: z.enum(['user', 'model', 'system', 'tool']),
        content: z.array(z.object({ text: z.string().optional() })),
    })),
    userInput: z.string(),
    modelId: z.string().optional(),
});

export const chatbotFlow = ai.defineFlow(
    {
        name: 'chatbotFlow',
        inputSchema: ChatInputSchema,
        outputSchema: z.string(),
    },
    async (input) => {
        const { history, userInput, modelId } = input;

        // Construct the prompt with history
        // In Genkit 0.5+ we use the `generate` function helper typically
        // Note: This pseudo-code complies with general Genkit patterns but exact SDK signature might vary slightly by version.

        // For this MVP inside Next.js, we might use the model directly if Flow server isn't running separately.
        // But let's assume we are using the `ai` instance we created in config.

        // We need to import 'ai' from config to ensure plugins are loaded? 
        // Actually defineFlow registers it.

        // Let's use the functional `generate` from core if available or the model object.

        // Quick implementation using the `ai` helper if possible or just standard generates
        // The `defineFlow` is mostly for `genkit start`. To call it programmatically we use `runFlow`.

        // However, usually we can just use `generate` directly for simple integration:

        // Simplified Logic for direct Next.js usage without starting a separate Genkit reflection server:

        // Using ai.generate with type casting to bypass potential type mismatches in this specific setup
        // We pass the history to the model so it has context.
        const response = await ai.generate({
            model: modelId,
            prompt: userInput,
            history: history as any,
            tools: [searchPropertiesTool],
            config: {
                temperature: 0.7,
            },
        } as any);

        return response.text;
    }
);
