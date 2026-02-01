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
                bubble: 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 text-purple-900 rounded-tl-none shadow-sm',
                time: 'text-purple-400',
                icon: <Bot size={14} className="text-purple-600" />,
                label: 'AI Assistant',
                showLabel: true
            };
        }

        // User/Lead
        if (role === 'user') {
            return {
                container: 'justify-start',
                bubble: 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm',
                time: 'text-slate-400',
                icon: <User size={14} className="text-slate-500" />,
                label: 'User',
                showLabel: true
            };
        }

        // Agent/Admin
        if (role === 'agent') {
            return {
                container: 'justify-end',
                bubble: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none shadow-md',
                time: 'text-blue-100',
                icon: null,
                label: 'You',
                showLabel: false
            };
        }

        // Default
        return {
            container: 'justify-start',
            bubble: 'bg-slate-100 border border-slate-200 text-slate-800',
            time: 'text-slate-400',
            icon: null,
            label: 'Unknown',
            showLabel: true
        };
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header - Desktop only */}
            <div className="hidden md:flex h-16 px-4 bg-white border-b border-slate-200 justify-between items-center">
                <div>
                    <h3 className="font-semibold text-slate-800">Conversation Details</h3>
                    <p className="text-xs text-slate-500">ID: {conversation.id.slice(0, 20)}...</p>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400 text-sm">No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const style = getMessageStyle(msg.senderRole, msg.senderId);
                    const isAgent = msg.senderRole === 'agent';

                    return (
                        <div key={msg.id} className={`flex ${style.container} animate-in slide-in-from-bottom-2 duration-200`}>
                            <div className="flex items-start gap-2 max-w-[75%]">
                                {!isAgent && style.icon && (
                                    <div className="mt-1 p-1.5 bg-white rounded-full shadow-sm border flex-shrink-0">
                                        {style.icon}
                                    </div>
                                )}
                                <div className="flex-1">
                                    {!isAgent && style.showLabel && (
                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                            <span className="text-xs font-semibold text-slate-600">{style.label}</span>
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
            <div className="p-4 bg-white border-t">
                <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <input
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm p-1"
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        disabled={!inputValue.trim()}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
