import { Conversation, Message } from "./Conversation";

export interface ConversationRepository {
    getConversations(userId: string): Promise<Conversation[]>;
    getConversationById(conversationId: string): Promise<Conversation | null>;
    getMessages(conversationId: string, limit?: number): Promise<Message[]>;

    saveMessage(message: Message): Promise<void>;
    updateConversation(id: string, data: Partial<Conversation>): Promise<void>;
    createConversation(conversation: Conversation): Promise<void>;

    // CRM Specific
    getConversationsByLead(leadId: string): Promise<Conversation[]>;
}
