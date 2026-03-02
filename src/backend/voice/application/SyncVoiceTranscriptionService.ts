import { ConversationRepository } from "@/backend/conversation/domain/ConversationRepository";
import { Conversation, Message } from "@/backend/conversation/domain/Conversation";

export interface TranscriptionParams {
    leadId: string;
    conversationId?: string | undefined;
    content: string;
    role: 'user' | 'model';
}

export class SyncVoiceTranscriptionService {
    constructor(private readonly repository: ConversationRepository) { }

    async execute(params: TranscriptionParams): Promise<string> {
        let conversation: Conversation;
        let cId = params.conversationId;

        // 1. Find or Create conversation
        if (cId) {
            const found = await this.repository.findById(cId);
            if (!found) throw new Error(`Conversation ${cId} not found`);
            conversation = found;
        } else {
            // Create new conversation, default leadId as participant
            const result = Conversation.create([params.leadId], "Inbound Voice Call Started", 'voice');
            conversation = result.conversation;
            cId = conversation.id;
            await this.repository.save(conversation);
        }

        // 2. Map role correctly -> 'user' maps to 'user', 'model' maps to 'agent' or 'system'
        const senderRole = params.role === 'model' ? 'agent' : 'user';
        const senderId = params.role === 'model' ? 'nelson-bot' : params.leadId;

        // 3. Create message
        const message = Message.create(
            conversation.id,
            senderId,
            senderRole,
            params.content,
            'text' // We're saving the transcription text
        );

        // 4. Save and append
        await this.repository.saveMessage(message);

        return conversation.id;
    }
}
