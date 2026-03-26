"use client";

import { useState, useEffect } from "react";
import { LeadDTO as Lead } from "@/types/lead";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { updateLeadDetailsAction, deleteLeadAction } from "@/actions/crm/actions";
import { getLeadSavedSearchesAction } from "@/actions/crm/getLeadSavedSearchesAction";
import { Loader2, Trash2, Edit2, Check, X, BellRing } from "lucide-react";

interface LeadDetailsSlideOverProps {
    open: boolean;
    onClose: () => void;
    lead: Lead | null;
    onUpdate: () => void;
}

export function LeadDetailsSlideOver({ open, onClose, lead, onUpdate }: LeadDetailsSlideOverProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [savedSearches, setSavedSearches] = useState<any[]>([]);
    const [isLoadingSearches, setIsLoadingSearches] = useState(false);

    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        notes: ""
    });

    // Reset form when lead changes
    if (lead && editForm.name === "" && !isEditing) {
        setEditForm({
            name: lead.name,
            email: lead.email,
            phone: lead.phone || "",
            notes: lead.notes || ""
        });
    }

    useEffect(() => {
        if (lead?.id && open) {
            setIsLoadingSearches(true);
            getLeadSavedSearchesAction(lead.id).then(res => {
                if (res.success && res.savedSearches) {
                    setSavedSearches(res.savedSearches);
                }
                setIsLoadingSearches(false);
            });
        }
    }, [lead, open]);

    const handleSave = async () => {
        if (!lead) return;
        setIsSaving(true);
        const res = await updateLeadDetailsAction(lead.id, editForm);
        if (res.success) {
            setIsEditing(false);
            onUpdate();
        } else {
            alert("Failed to update lead details.");
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (!lead) return;
        if (!confirm(`Are you sure you want to delete ${lead.name}? This action cannot be undone.`)) return;

        setIsDeleting(true);
        const res = await deleteLeadAction(lead.id);
        if (res.success) {
            onClose();
            onUpdate();
        } else {
            alert("Failed to delete lead.");
        }
        setIsDeleting(false);
    };

    if (!lead) return null;

    return (
        <SlideOver
            isOpen={open}
            onClose={() => {
                setIsEditing(false);
                onClose();
            }}
            title={isEditing ? "Edit Lead" : "Lead Details"}
        >
            <div className="flex justify-end mb-6">
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                        <Edit2 size={14} /> Edit Lead
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="flex items-center gap-2" disabled={isSaving}>
                            <X size={14} /> Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSave} className="flex items-center gap-2" disabled={isSaving}>
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* Basics Section */}
                <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact Info</h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Full Name</Label>
                            {isEditing ? (
                                <Input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="h-9" />
                            ) : (
                                <p className="text-sm font-medium">{lead.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                {isEditing ? (
                                    <Input value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} className="h-9" />
                                ) : (
                                    <p className="text-sm">{lead.email}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Phone</Label>
                                {isEditing ? (
                                    <Input value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="h-9" />
                                ) : (
                                    <p className="text-sm">{lead.phone || <span className="text-muted-foreground italic">None</span>}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI & Context Section */}
                <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Context & Notes</h3>

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">AI Output / Private Notes</Label>
                        {isEditing ? (
                            <textarea
                                value={editForm.notes}
                                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full min-h-[100px] p-2 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none custom-scrollbar"
                                placeholder="Add notes here..."
                            />
                        ) : (
                            <div className="text-sm bg-card p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                                {lead.notes || <span className="text-muted-foreground italic">No context available.</span>}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 mt-4 pt-4 border-t border-border/50">
                        <div>
                            <span className="text-xs text-muted-foreground block mb-1">Source</span>
                            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">{lead.source}</span>
                        </div>
                        {lead.propertyId && (
                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Interest</span>
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">Property Inquiry</span>
                            </div>
                        )}
                        <div>
                            <span className="text-xs text-muted-foreground block mb-1">Created</span>
                            <span className="text-xs font-medium">{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Smart Searches Section */}
                <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <BellRing size={16} className="text-blue-500" />
                            Smart Searches (Alerts)
                        </h3>
                        {isLoadingSearches && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                    </div>

                    {!isLoadingSearches && savedSearches.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No automatic alerts configured.</p>
                    ) : (
                        <div className="space-y-3">
                            {savedSearches.map(search => (
                                <div key={search.id} className="bg-card border border-border/50 p-3 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 rounded-r-xl" />
                                    <span className="text-xs font-bold text-slate-800 uppercase">
                                        {search.searchCriteria.type || 'ANY'} • {search.frequency}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                        {search.searchCriteria.query ? `"${search.searchCriteria.query}"` : 'Any Location'} 
                                        {search.searchCriteria.minBeds ? ` • ${search.searchCriteria.minBeds}+ Beds` : ''}
                                    </span>
                                    {(search.searchCriteria.minPrice || search.searchCriteria.maxPrice) && (
                                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit mt-1">
                                            ${search.searchCriteria.minPrice ? (search.searchCriteria.minPrice / 1000) + 'k' : '0'} 
                                            {' - '}
                                            ${search.searchCriteria.maxPrice ? (search.searchCriteria.maxPrice / 1000) + 'k' : 'Max'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Danger Zone */}
            <div className="mt-12 pt-6 border-t border-border/50">
                <Button
                    variant="ghost"
                    onClick={handleDelete}
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2"
                    disabled={isDeleting || isSaving}
                >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {isDeleting ? "Deleting..." : "Delete Lead"}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-2">This action is permanent and cannot be undone.</p>
            </div>
        </SlideOver>
    );
}
