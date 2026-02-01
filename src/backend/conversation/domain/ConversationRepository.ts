import { Conversation } from "./Conversation";
import { Message } from "./Conversation";

export interface ConversationRepository {
    save(conversation: Conversation): Promise<void>;
    findById(id: string): Promise<Conversation | null>;
    findByUserId(userId: string): Promise<Conversation[]>;

    // Message methods
    saveMessage(message: Message): Promise<void>;
    findMessagesByConversationId(conversationId: string, limit?: number): Promise<Message[]>;

    // Additional domain-specific lookups
    countUnread(userId: string): Promise<number>;
}
