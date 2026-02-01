import { Conversation, Message } from "@/backend/conversation/domain/Conversation";
import { ConversationRepository } from "@/backend/conversation/domain/ConversationRepository";
import { adminDb } from "@/lib/firebase/admin";
import { ConversationPersistence, MessagePersistence } from "./dto/ConversationPersistence";
import { ConversationPersistenceSchema, MessagePersistenceSchema } from "./dto/ConversationPersistenceSchema";
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export class FirestoreConversationRepository implements ConversationRepository {
    private conversationsCollection = adminDb.collection('conversations');
    private messagesCollection = adminDb.collection('messages');

    // --- MAPPERS ---

    private mapToDomain(data: ConversationPersistence): Conversation {
        return new Conversation({
            id: data.id,
            participants: data.participants,
            lastMessage: this.mapMessageToDomain(data.lastMessage),
            unreadCount: data.unreadCount,
            status: data.status,
            channel: data.channel,
            metadata: data.metadata,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }

    private mapToPersistence(conversation: Conversation): ConversationPersistence {
        return {
            id: conversation.id,
            participants: conversation.participants,
            lastMessage: this.mapMessageToPersistence(conversation.lastMessage),
            unreadCount: conversation.unreadCount,
            status: conversation.status,
            channel: conversation.channel,
            metadata: conversation.metadata,
            createdAt: conversation.createdAt.getTime(),
            updatedAt: conversation.updatedAt.getTime()
        };
    }

    private mapMessageToDomain(data: MessagePersistence): Message {
        return new Message({
            id: data.id,
            conversationId: data.conversationId,
            senderId: data.senderId,
            senderRole: data.senderRole,
            content: data.content,
            type: data.type,
            createdAt: new Date(data.createdAt),
            readBy: data.readBy,
            metadata: data.metadata
        });
    }

    private mapMessageToPersistence(message: Message): MessagePersistence {
        return {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderRole: message.senderRole,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt.getTime(),
            readBy: message.readBy,
            metadata: message.metadata
        };
    }

    // --- REPOSITORY METHODS ---

    async save(conversation: Conversation): Promise<void> {
        const data = this.mapToPersistence(conversation);
        // Validate Schema before save
        const validated = ConversationPersistenceSchema.parse(data);
        await this.conversationsCollection.doc(conversation.id).set(validated);
    }

    async findById(id: string): Promise<Conversation | null> {
        const doc = await this.conversationsCollection.doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data();
        const result = ConversationPersistenceSchema.safeParse(data);

        if (!result.success) {
            console.error(`Invalid Conversation data for ID ${id}`, result.error);
            return null;
        }

        return this.mapToDomain(result.data);
    }

    async findByUserId(userId: string): Promise<Conversation[]> {
        const snapshot = await this.conversationsCollection
            .where('participants', 'array-contains', userId)
            .orderBy('updatedAt', 'desc')
            .get();

        return snapshot.docs
            .map((doc: QueryDocumentSnapshot) => {
                const result = ConversationPersistenceSchema.safeParse(doc.data());
                return result.success ? this.mapToDomain(result.data) : null;
            })
            .filter((c: Conversation | null): c is Conversation => c !== null);
    }

    async findAll(): Promise<Conversation[]> {
        const snapshot = await this.conversationsCollection
            .orderBy('updatedAt', 'desc')
            .limit(100)
            .get();

        return snapshot.docs
            .map((doc: QueryDocumentSnapshot) => {
                const result = ConversationPersistenceSchema.safeParse(doc.data());
                return result.success ? this.mapToDomain(result.data) : null;
            })
            .filter((c: Conversation | null): c is Conversation => c !== null);
    }

    async saveMessage(message: Message): Promise<void> {
        const data = this.mapMessageToPersistence(message);
        const validated = MessagePersistenceSchema.parse(data);

        // Transaction to save message AND update conversation lastMessage
        await adminDb.runTransaction(async (t) => {
            const messageRef = this.messagesCollection.doc(message.id);
            const conversationRef = this.conversationsCollection.doc(message.conversationId);

            t.set(messageRef, validated);
            t.update(conversationRef, {
                lastMessage: validated,
                updatedAt: validated.createdAt
            });
        });
    }

    async findMessagesByConversationId(conversationId: string, limit: number = 50): Promise<Message[]> {
        const snapshot = await this.messagesCollection
            .where('conversationId', '==', conversationId)
            .orderBy('createdAt', 'asc') // or desc depending on UI requirement
            .limit(limit)
            .get();

        return snapshot.docs
            .map((doc: QueryDocumentSnapshot) => {
                const result = MessagePersistenceSchema.safeParse(doc.data());
                return result.success ? this.mapMessageToDomain(result.data) : null;
            })
            .filter((m: Message | null): m is Message => m !== null);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async countUnread(_userId: string): Promise<number> {
        // This is tricky with NoSQL. Usually stored as a counter on the User or derived on client.
        // For now, let's rely on the 'unreadCount' map in Conversation if maintained, 
        // or query conversations where unreadCount[userId] > 0
        // Firestore map query: unreadCount.`${userId}` > 0 (requires index)
        // MVP: return 0 or implement later
        return 0;
    }
}
