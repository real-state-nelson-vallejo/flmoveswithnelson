"use client";

import { useEffect, useState, useRef } from 'react';
import { Conversation, Message } from "@/backend/crm/domain/Conversation";
import { getMessagesAction, sendMessageAction } from '@/actions/crm/actions';
import { Send, Paperclip } from "lucide-react";

interface ChatWindowProps {
    conversation: Conversation;
    currentUser: string;
    refreshTrigger?: number;
}

export function ChatWindow({ conversation, currentUser, refreshTrigger }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    // const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch messages when conversation changes or refresh is triggered
        const loadMessages = async () => {
            const res = await getMessagesAction(conversation.id);
            if (res.success && res.data) {
                setMessages(res.data);
            }
        };
        loadMessages();
    }, [conversation.id, refreshTrigger]);

    useEffect(() => {
        // Auto scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const content = inputValue;
        setInputValue(""); // Optimistic clear

        // Create Optimistic Message
        const tempId = crypto.randomUUID();
        const newMessage: Message = {
            id: tempId,
            conversationId: conversation.id,
            senderId: currentUser,
            senderRole: 'agent', // Hardcoded for now
            content,
            type: 'text',
            createdAt: Date.now(),
            readBy: [currentUser]
        };

        setMessages(prev => [...prev, newMessage]);

        const res = await sendMessageAction(newMessage);
        if (!res.success) {
            // Revert or show error
            console.error("Failed to send");
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 bg-white border-b shadow-sm flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-800">Conversation Details</h3>
                    <p className="text-xs text-slate-500">ID: {conversation.id}</p>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-3 shadow-md ${isMe
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-800 rounded-tl-none border'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <span className={`text-[10px] mt-1 block opacity-70 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
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
