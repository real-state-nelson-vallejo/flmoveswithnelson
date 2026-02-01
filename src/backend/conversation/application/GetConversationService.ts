import { ConversationRepository } from "../domain/ConversationRepository";
import { Conversation } from "../domain/Conversation";

export class GetConversationService {
    constructor(private readonly repository: ConversationRepository) { }

    async execute(id: string): Promise<Conversation | null> {
        return this.repository.findById(id);
    }

    async getUserConversations(userId: string): Promise<Conversation[]> {
        return this.repository.findByUserId(userId);
    }
}
