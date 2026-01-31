export interface AgentResponse {
    text: string;
    toolCalls?: { name: string; args: any }[];
    contextUpdates?: Record<string, any>;
}

export interface ChatMessage {
    role: 'user' | 'model' | 'system' | 'tool';
    content: Array<{ text?: string; media?: { url: string } }>;
}

export interface IAgent {
    generateResponse(
        history: ChatMessage[],
        context?: any
    ): Promise<AgentResponse>;
}
