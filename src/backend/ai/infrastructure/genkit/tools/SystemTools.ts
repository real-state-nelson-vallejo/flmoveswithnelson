import { tool, z } from 'genkit';
// Removed unused import

export const getSystemTools = () => {
    const TOOLS_NAME = 'systemToolsInstances';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((globalThis as any)[TOOLS_NAME]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (globalThis as any)[TOOLS_NAME];
    }

    const tools = [
        tool(
            {
                name: 'change_voice_language',
                description: 'Change the voice language if the user explicitly requests to speak in Spanish or English. Crucial: ALWAYS use this if the user says "habla en español", "speak spanish", "speak english", etc.',
                inputSchema: z.object({
                    callSid: z.string().describe('The CallSid of the current call (must be extracted from the context or left to the server to inject if possible, but Genkit tools might need it passed manually or bound. If unavailable, pass "auto").'),
                    language: z.enum(['en-US', 'es-US']).describe('The target language code')
                }),
                outputSchema: z.object({
                    success: z.boolean(),
                    message: z.string()
                })
            },
            async (input) => {
                // Warning: To actually bind this to the active call session, the AI needs the CallSid.
                // Alternatively, we handle it as a global flag or return it in the tool output
                // and the route handler processes it. 
                // Since Genkit tool runs isolated, we'll return an instruction format.

                return {
                    success: true,
                    message: `Language formally switched to ${input.language}. Ensure your next response is spoken in ${input.language}.`,
                    _internalAction: {
                        type: 'CHANGE_LANGUAGE',
                        language: input.language
                    }
                };
            }
        )
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[TOOLS_NAME] = tools;
    return tools;
};
