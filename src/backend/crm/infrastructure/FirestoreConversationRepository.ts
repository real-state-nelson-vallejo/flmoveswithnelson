import { adminDb } from "@/lib/firebase/admin";
import { Conversation, Message } from "../domain/Conversation";
import { ConversationRepository } from "../domain/ConversationRepository";

export class FirestoreConversationRepository implements ConversationRepository {
    private db = adminDb;
    private collection = this.db.collection('conversations');

    async getConversations(userId: string): Promise<Conversation[]> {
        const snapshot = await this.collection
            .where('participants', 'array-contains', userId)
            .orderBy('updatedAt', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data() as Conversation);
    }

    async getConversationById(conversationId: string): Promise<Conversation | null> {
        const doc = await this.collection.doc(conversationId).get();
        if (!doc.exists) return null;
        return doc.data() as Conversation;
    }

    async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
        const snapshot = await this.collection.doc(conversationId)
            .collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => doc.data() as Message).reverse();
    }

    async saveMessage(message: Message): Promise<void> {
        // Save message in subcollection
        await this.collection.doc(message.conversationId)
            .collection('messages')
            .doc(message.id)
            .set(message);

        // Update parent conversation lastMessage
        await this.collection.doc(message.conversationId).update({
            lastMessage: message,
            updatedAt: message.createdAt,
            // Increment logic for unread count would go here theoretically, 
            // but usually needs a transaction or separate counter update.
        });
    }

    async createConversation(conversation: Conversation): Promise<void> {
        await this.collection.doc(conversation.id).set(conversation);
    }

    async updateConversation(id: string, data: Partial<Conversation>): Promise<void> {
        await this.collection.doc(id).update(data);
    }

    async getConversationsByLead(leadId: string): Promise<Conversation[]> {
        const snapshot = await this.collection
            .where('metadata.leadId', '==', leadId)
            .get();
        return snapshot.docs.map(doc => doc.data() as Conversation);
    }
}
