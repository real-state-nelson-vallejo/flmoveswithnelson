"use client";

import { X, Mail, Phone, Calendar, Tag } from "lucide-react";
import { LeadDTO } from "@/types/lead";

interface LeadSidebarProps {
    lead?: LeadDTO | undefined; // Optional, might not always link to a lead
    onClose: () => void;
}

export function LeadSidebar({ lead, onClose }: LeadSidebarProps) {
    if (!lead) {
        return (
            <div className="w-80 border-l bg-white p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-slate-800">Lead Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center text-center text-slate-400 text-sm">
                    <p>No lead associated with this conversation.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="h-16 px-4 border-b border-border bg-card flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Lead Profile</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded">
                    <X size={20} />
                </button>
            </div>

            {/* Profile Info */}
            <div className="p-6 text-center border-b border-border">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary font-bold text-2xl">
                    {lead.name.charAt(0)}
                </div>
                <h2 className="font-bold text-foreground text-lg">{lead.name}</h2>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
                <div className="mt-4 flex justify-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-600 text-xs px-2 py-1 rounded-full capitalize font-medium">
                        {lead.status}
                    </span>
                    <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full capitalize">
                        {lead.source}
                    </span>
                </div>
            </div>

            {/* Actions / Contact */}
            <div className="p-4 space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-foreground/80">
                        <Mail size={16} />
                        <span className="text-sm">{lead.email}</span>
                    </div>
                    {lead.phone && (
                        <div className="flex items-center gap-3 text-foreground/80">
                            <Phone size={16} />
                            <span className="text-sm">{lead.phone}</span>
                        </div>
                    )}
                </div>

                <hr className="border-border" />

                {/* Notes or Extras */}
                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Tag size={14} /> Notes
                    </h4>
                    <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md min-h-[80px]">
                        {lead.notes || "No notes added."}
                    </p>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Calendar size={14} /> Activity
                    </h4>
                    <div className="text-xs text-muted-foreground space-y-2">
                        <p>Created: {new Date(lead.createdAt).toLocaleDateString()}</p>
                        <p>Last Update: {new Date(lead.updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
