"use client";

import { ConversationDTO as Conversation } from "@/types/conversation";
import { LeadDTO } from "@/types/lead";
import { cn } from "@/lib/cn";
import { Building } from "lucide-react";

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    leadsMap?: Record<string, LeadDTO>;
}

export function ConversationList({ conversations, selectedId, onSelect, leadsMap = {} }: ConversationListProps) {
    return (
        <div className="flex flex-col">
            {conversations.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">No conversations yet.</div>
            )}
            {conversations.map((conv) => {
                const isSelected = conv.id === selectedId;

                // Get lead name from leadsMap
                const leadId = conv.participants?.[0];
                const leadName = leadId && typeof leadId === 'string' && leadsMap[leadId]
                    ? leadsMap[leadId].name
                    : (conv.metadata?.['leadName'] as string) || "Unknown User";

                return (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={cn(
                            "flex items-start gap-3 p-4 border-b transition-colors text-left hover:bg-slate-50",
                            isSelected && "bg-blue-50 border-l-4 border-l-blue-500 border-b-transparent"
                        )}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 text-white font-semibold">
                            {leadName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className={cn("font-medium truncate", isSelected ? "text-blue-900" : "text-slate-900")}>
                                    {leadName}
                                </span>
                                <span className="text-xs text-slate-400 shrink-0">
                                    {new Date(conv.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 truncate">
                                {conv.lastMessage?.content || "No messages"}
                            </p>
                            {!!conv.metadata?.['subject'] && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                    <Building size={10} /> {String(conv.metadata['subject'])}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
