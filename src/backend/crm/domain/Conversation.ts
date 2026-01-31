export interface Message {
    id: string;
    conversationId: string;
    senderId: string; // 'system', 'agent-id', or 'user-id'
    senderRole: 'admin' | 'agent' | 'user' | 'system';
    content: string;
    type: 'text' | 'image' | 'audio' | 'system';
    createdAt: number;
    readBy: string[]; // List of user IDs who read it
}

export interface Conversation {
    id: string;
    participants: string[]; // List of User/Agent IDs
    lastMessage: Message;
    unreadCount: Record<string, number>; // Map userId -> count
    status: 'active' | 'archived' | 'spam';
    channel: 'web_chat' | 'whatsapp' | 'email' | 'voice';
    metadata?: {
        leadId?: string;
        leadName?: string;
        propertyId?: string;
        subject?: string;
    };
    createdAt: number;
    updatedAt: number;
}
