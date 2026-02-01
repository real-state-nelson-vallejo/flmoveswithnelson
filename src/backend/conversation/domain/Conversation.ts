import { ConversationDTO, MessageDTO } from "@/types/conversation";
import { CommunicationChannel, ConversationStatus, MessageType, SenderRole } from "@/types/conversation";

export type { CommunicationChannel, ConversationStatus, MessageType, SenderRole };

export interface MessageProps {
    id: string;
    conversationId: string;
    senderId: string;
    senderRole: SenderRole;
    content: string;
    type: MessageType;
    createdAt: Date;
    readBy: string[];
    metadata?: Record<string, unknown> | undefined;
}

export class Message {
    constructor(private readonly props: MessageProps) { }

    get id(): string { return this.props.id; }
    get conversationId(): string { return this.props.conversationId; }
    get senderId(): string { return this.props.senderId; }
    get senderRole(): SenderRole { return this.props.senderRole; }
    get content(): string { return this.props.content; }
    get type(): MessageType { return this.props.type; }
    get createdAt(): Date { return this.props.createdAt; }
    get readBy(): string[] { return [...this.props.readBy]; }
    get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }

    markAsRead(userId: string): void {
        if (!this.props.readBy.includes(userId)) {
            this.props.readBy.push(userId);
        }
    }

    toDTO(): MessageDTO {
        return {
            id: this.id,
            conversationId: this.conversationId,
            senderId: this.senderId,
            senderRole: this.senderRole,
            content: this.content,
            type: this.type,
            createdAt: this.createdAt.getTime(),
            readBy: this.readBy,
            metadata: this.metadata
        };
    }

    // Factory method for new messages
    static create(
        conversationId: string,
        senderId: string,
        senderRole: SenderRole,
        content: string,
        type: MessageType = 'text',
        metadata?: Record<string, unknown>
    ): Message {
        return new Message({
            id: crypto.randomUUID(),
            conversationId,
            senderId,
            senderRole,
            content,
            type,
            createdAt: new Date(),
            readBy: [],
            metadata
        });
    }
}

export interface ConversationProps {
    id: string;
    participants: string[];
    lastMessage: Message;
    unreadCount: Record<string, number>;
    status: ConversationStatus;
    channel: CommunicationChannel;
    metadata?: Record<string, unknown> | undefined;
    createdAt: Date;
    updatedAt: Date;
}

export class Conversation {
    constructor(private readonly props: ConversationProps) { }

    get id(): string { return this.props.id; }
    get participants(): string[] { return [...this.props.participants]; }
    get lastMessage(): Message { return this.props.lastMessage; }
    get unreadCount(): Record<string, number> { return { ...this.props.unreadCount }; }
    get status(): ConversationStatus { return this.props.status; }
    get channel(): CommunicationChannel { return this.props.channel; }
    get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    addMessage(message: Message): void {
        this.props.lastMessage = message;
        this.props.updatedAt = message.createdAt;
        // Logic to increment unread counts could go here
    }

    toDTO(): ConversationDTO {
        return {
            id: this.id,
            participants: this.participants,
            lastMessage: this.lastMessage.toDTO(),
            unreadCount: this.unreadCount,
            status: this.status,
            channel: this.channel,
            metadata: this.metadata,
            createdAt: this.createdAt.getTime(),
            updatedAt: this.updatedAt.getTime()
        };
    }

    static create(
        participants: string[],
        initialMessageContent: string,
        channel: CommunicationChannel = 'web_chat',
        metadata?: Record<string, unknown>
    ): { conversation: Conversation; message: Message } {
        const id = crypto.randomUUID();
        const now = new Date();

        // Assume first participant is the creator/sender
        const senderId = participants[0];
        if (!senderId) throw new Error("Conversation must have at least one participant");

        const message = Message.create(id, senderId, 'user', initialMessageContent);

        const conversation = new Conversation({
            id,
            participants,
            lastMessage: message,
            unreadCount: {},
            status: 'active',
            channel,
            metadata,
            createdAt: now,
            updatedAt: now
        });

        return { conversation, message };
    }
}
