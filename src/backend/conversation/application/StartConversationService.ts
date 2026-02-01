import { ConversationRepository } from "../domain/ConversationRepository";
import { Conversation, CommunicationChannel } from "../domain/Conversation";

export class StartConversationService {
    constructor(private readonly repository: ConversationRepository) { }

    async execute(
        participants: string[],
        initialMessage: string,
        channel: CommunicationChannel = 'web_chat',
        metadata?: Record<string, unknown>
    ): Promise<Conversation> {
        const { conversation, message } = Conversation.create(participants, initialMessage, channel, metadata);

        // We need to save both. Ideally repo.save(conversation) would suffice if it cascades, 
        // but our Firestore repo separates them.
        await this.repository.save(conversation);
        await this.repository.saveMessage(message);

        return conversation;
    }
}
