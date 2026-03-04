"use client";

import { ConversationDTO as Conversation } from "@/types/conversation";
import { LeadDTO } from "@/types/lead";
import { cn } from "@/lib/cn";
import { Building, PhoneCall, MessageCircle, MessageSquare } from "lucide-react";

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
                <div className="p-8 text-center text-muted-foreground text-sm">No conversations yet.</div>
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
                            "flex items-start gap-3 p-4 border-b border-border transition-colors text-left hover:bg-muted/50",
                            isSelected && "bg-secondary/50 border-l-4 border-l-primary border-b-transparent"
                        )}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0 text-primary-foreground font-semibold">
                            {leadName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className={cn("font-medium truncate", isSelected ? "text-primary" : "text-foreground")}>
                                    {leadName}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {new Date(conv.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground/80 truncate">
                                {conv.lastMessage?.content || "No messages"}
                            </p>
                            {/* Metadata Tags */}
                            <div className="flex gap-2 mt-2">
                                {!!conv.metadata?.['subject'] && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                                        <Building size={10} /> {String(conv.metadata['subject'])}
                                    </span>
                                )}

                                {/* Channel Indicator */}
                                {conv.channel === 'voice' && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                        <PhoneCall size={10} /> Voice Call
                                    </span>
                                )}
                                {conv.channel === 'whatsapp' && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                        <MessageCircle size={10} /> WhatsApp
                                    </span>
                                )}
                                {conv.channel === 'sms' && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                        <MessageSquare size={10} /> SMS
                                    </span>
                                )}
                                {conv.channel === 'web_chat' && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                        <MessageSquare size={10} /> Web
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
