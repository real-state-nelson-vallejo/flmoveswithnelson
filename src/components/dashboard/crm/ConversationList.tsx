"use client";

import { Conversation } from "@/backend/crm/domain/Conversation";
import { cn } from "@/lib/cn";
import { User, Building, Clock } from "lucide-react";

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
    return (
        <div className="flex flex-col">
            {conversations.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">No conversations yet.</div>
            )}
            {conversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                return (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={cn(
                            "flex items-start gap-3 p-4 border-b transition-colors text-left hover:bg-slate-50",
                            isSelected && "bg-blue-50 border-l-4 border-l-blue-500 border-b-transparent"
                        )}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <User size={20} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className={cn("font-medium truncate", isSelected ? "text-blue-900" : "text-slate-900")}>
                                    {conv.metadata?.leadName || "Unknown User"}
                                </span>
                                <span className="text-xs text-slate-400 shrink-0">
                                    {new Date(conv.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 truncate">
                                {conv.lastMessage?.content || "No messages"}
                            </p>
                            {conv.metadata?.subject && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                    <Building size={10} /> {conv.metadata.subject}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
