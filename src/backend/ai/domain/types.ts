export interface AgentResponse {
    text: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toolCalls?: { name: string; args: any }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contextUpdates?: Record<string, any>;
}

export interface ChatMessage {
    role: 'user' | 'model' | 'system' | 'tool';
    content: Array<{ text?: string; media?: { url: string } }>;
}

export interface IAgent {
    generateResponse(
        history: ChatMessage[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context?: any
    ): Promise<AgentResponse>;
}
