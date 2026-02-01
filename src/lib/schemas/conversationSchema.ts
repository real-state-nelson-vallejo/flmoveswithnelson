import { z } from 'zod';

export const MessageSchema = z.object({
    id: z.string(),
    conversationId: z.string(),
    senderId: z.string(),
    senderRole: z.enum(['admin', 'agent', 'user', 'system']),
    content: z.string(),
    type: z.enum(['text', 'image', 'audio', 'system']),
    createdAt: z.number(),
    readBy: z.array(z.string())
});

export const ConversationSchema = z.object({
    id: z.string(),
    participants: z.array(z.string()),
    lastMessage: MessageSchema,
    unreadCount: z.record(z.number()),
    status: z.enum(['active', 'archived', 'spam']),
    channel: z.enum(['web_chat', 'whatsapp', 'email', 'voice']),
    metadata: z.record(z.unknown()).optional(),
    createdAt: z.number(),
    updatedAt: z.number()
});
