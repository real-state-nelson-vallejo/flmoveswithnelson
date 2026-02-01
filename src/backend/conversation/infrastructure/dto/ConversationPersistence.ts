import { CommunicationChannel, ConversationStatus, MessageType, SenderRole } from "../../domain/types";

export interface MessagePersistence {
    id: string;
    conversationId: string;
    senderId: string;
    senderRole: SenderRole;
    content: string;
    type: MessageType;
    createdAt: number; // Firestore timestamp (millis)
    readBy: string[];
    metadata?: Record<string, unknown> | undefined;
}

export interface ConversationPersistence {
    id: string;
    participants: string[];
    lastMessage: MessagePersistence;
    unreadCount: Record<string, number>;
    status: ConversationStatus;
    channel: CommunicationChannel;
    metadata?: Record<string, unknown> | undefined;
    createdAt: number; // Firestore timestamp (millis)
    updatedAt: number; // Firestore timestamp (millis)
}
