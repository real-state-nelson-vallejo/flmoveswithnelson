export type ConversationStatus = 'active' | 'archived' | 'spam';
export type CommunicationChannel = 'web_chat' | 'whatsapp' | 'email' | 'voice';
export type MessageType = 'text' | 'image' | 'audio' | 'system';
export type SenderRole = 'admin' | 'agent' | 'user' | 'system';

export interface MessageDTO {
    id: string;
    conversationId: string;
    senderId: string;
    senderRole: SenderRole;
    content: string;
    type: MessageType;
    createdAt: number;
    readBy: string[];
    metadata?: Record<string, unknown> | undefined;
}

export interface ConversationDTO {
    id: string;
    participants: string[];
    lastMessage: MessageDTO;
    unreadCount: Record<string, number>;
    status: ConversationStatus;
    channel: CommunicationChannel;
    metadata?: Record<string, unknown> | undefined;
    createdAt: number;
    updatedAt: number;
}
