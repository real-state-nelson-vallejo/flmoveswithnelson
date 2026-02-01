import { ConversationRepository } from "../domain/ConversationRepository";
import { Message, MessageType, SenderRole } from "../domain/Conversation";

export class SendMessageService {
    constructor(private readonly repository: ConversationRepository) { }

    async execute(
        conversationId: string,
        senderId: string,
        senderRole: SenderRole,
        content: string,
        type: MessageType = 'text',
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const conversation = await this.repository.findById(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        const message = Message.create(conversationId, senderId, senderRole, content, type, metadata);

        // Domain logic: add message to conversation (updates lastMessage, etc)
        conversation.addMessage(message);

        // Repo handles saving the message AND updating the conversation (transactional ideally)
        await this.repository.saveMessage(message);
    }
}
