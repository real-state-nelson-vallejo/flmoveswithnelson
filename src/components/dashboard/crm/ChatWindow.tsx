"use client";

import { useEffect, useState, useRef } from 'react';
import { MessageDTO as Message, ConversationDTO as Conversation } from "@/types/conversation";
import { getMessagesAction, sendMessageAction } from '@/actions/crm/actions';
import { Send, Paperclip, Bot, User } from "lucide-react";

interface ChatWindowProps {
    conversation: Conversation;
    currentUser: string;
    refreshTrigger?: number;
}

export function ChatWindow({ conversation, currentUser, refreshTrigger }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadMessages = async () => {
            const res = await getMessagesAction(conversation.id);
            if (res.success && res.data) {
                setMessages(res.data);
            }
        };
        loadMessages();
    }, [conversation.id, refreshTrigger]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const content = inputValue;
        setInputValue("");

        const tempId = crypto.randomUUID();
        const newMessage: Message = {
            id: tempId,
            conversationId: conversation.id,
            senderId: currentUser,
            senderRole: 'agent',
            content,
            type: 'text',
            createdAt: Date.now(),
            readBy: [currentUser]
        };

        setMessages(prev => [...prev, newMessage]);

        const res = await sendMessageAction(newMessage);
        if (!res.success) {
            console.error("Failed to send");
        }
    };

    // Helper to get message styling and display info based on role
    const getMessageStyle = (role: string, senderId: string) => {
        // Check if it's the AI agent
        if (role === 'ai' || senderId === 'system-ai') {
            return {
                container: 'justify-start',
                bubble: 'bg-primary/10 border border-primary/20 text-foreground rounded-tl-none shadow-sm',
                time: 'text-muted-foreground',
                icon: <Bot size={14} className="text-primary" />,
                label: 'AI Assistant',
                showLabel: true
            };
        }

        // User/Lead
        if (role === 'user') {
            return {
                container: 'justify-start',
                bubble: 'bg-card border border-border text-foreground rounded-tl-none shadow-sm',
                time: 'text-muted-foreground',
                icon: <User size={14} className="text-muted-foreground" />,
                label: 'User',
                showLabel: true
            };
        }

        // Agent/Admin
        if (role === 'agent') {
            return {
                container: 'justify-end',
                bubble: 'bg-primary text-primary-foreground rounded-tr-none shadow-md',
                time: 'text-primary-foreground/70',
                icon: null,
                label: 'You',
                showLabel: false
            };
        }

        // Default
        return {
            container: 'justify-start',
            bubble: 'bg-secondary border border-border text-foreground',
            time: 'text-muted-foreground',
            icon: null,
            label: 'Unknown',
            showLabel: true
        };
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header - Desktop only */}
            <div className="hidden md:flex h-16 px-4 bg-card border-b border-border justify-between items-center">
                <div>
                    <h3 className="font-semibold text-foreground">Conversation Details</h3>
                    <p className="text-xs text-muted-foreground">ID: {conversation.id.slice(0, 20)}...</p>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const style = getMessageStyle(msg.senderRole, msg.senderId);
                    const isAgent = msg.senderRole === 'agent';

                    return (
                        <div key={msg.id} className={`flex ${style.container} animate-in slide-in-from-bottom-2 duration-200`}>
                            <div className="flex items-start gap-2 max-w-[75%]">
                                {!isAgent && style.icon && (
                                    <div className="mt-1 p-1.5 bg-card rounded-full shadow-sm border border-border flex-shrink-0">
                                        {style.icon}
                                    </div>
                                )}
                                <div className="flex-1">
                                    {!isAgent && style.showLabel && (
                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                            <span className="text-xs font-semibold text-muted-foreground">{style.label}</span>
                                        </div>
                                    )}
                                    <div className={`rounded-lg px-4 py-3 ${style.bubble}`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                        <span className={`text-[10px] mt-1.5 block opacity-70 ${style.time}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
                <div className="flex gap-2 items-center bg-secondary/50 p-2 rounded-lg border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <input
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm p-1 text-foreground placeholder:text-muted-foreground"
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                        disabled={!inputValue.trim()}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
