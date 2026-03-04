"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LeadDTO as Lead } from "@/types/lead";
import { getLeadsAction, updateLeadStatusAction, createMockLeadsAction, getCRMConfigAction } from "@/actions/crm/actions";
import { Loader2, Plus } from "lucide-react";
import { CRMStage, CRMConfig } from "@/backend/crm/domain/CRMConfig";
import { ColumnManager } from "./crm/ColumnManager";
import { LeadDetailsSlideOver } from "./crm/LeadDetailsSlideOver";

// --- Components ---

function KanbanCard({ lead, isOverlay = false, onClick }: { lead: Lead, isOverlay?: boolean, onClick?: ((lead: Lead) => void) | undefined }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead.id, data: { lead } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick && onClick(lead)}
            className={`bg-card p-4 rounded-xl shadow-sm border border-border cursor-grab active:cursor-grabbing mb-3 hover:shadow-md hover:border-primary/30 transition-all duration-200 group ${isOverlay ? "shadow-2xl ring-2 ring-primary rotate-2 scale-105" : ""}`}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">{lead.name}</h4>
                <div className="flex -space-x-1">
                    {lead.propertyId && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">Property</span>}
                </div>
            </div>

            {/* Contact Info Snippet */}
            <div className="flex flex-col gap-1 mb-4">
                <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
            </div>

            {/* AI Insights / Notes */}
            {lead.notes && (
                <div className="bg-muted/50 p-2 rounded text-xs text-foreground mb-3 border-l-2 border-primary line-clamp-3">
                    <span className="font-semibold text-primary block mb-1">AI Context:</span>
                    {lead.notes}
                </div>
            )}

            <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">{lead.source}</span>
                <span>{new Date(lead.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
        </div>
    );
}

function KanbanColumn({ id, title, color, leads, onCardClick }: { id: string, title: string, color?: string, leads: Lead[], onCardClick?: (lead: Lead) => void }) {
    const { setNodeRef } = useSortable({ id });

    return (

        <div ref={setNodeRef} className="flex flex-col bg-muted/30 dark:bg-muted/10 rounded-2xl min-w-[320px] w-80 max-h-full border border-border/50 overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/50">
                <div className="flex items-center gap-2">
                    {color && <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />}
                    <h3 className="font-semibold text-foreground tracking-tight">{title}</h3>
                </div>
                <span className="bg-background text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm border border-border/50">
                    {leads.length}
                </span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto min-h-[150px] custom-scrollbar">
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {leads.map(lead => (
                        <KanbanCard key={lead.id} lead={lead} onClick={onCardClick} />
                    ))}
                </SortableContext>
                {leads.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic py-8">
                        Empty column
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Board ---

export function KanbanBoard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stages, setStages] = useState<CRMStage[]>([]);
    const [config, setConfig] = useState<CRMConfig | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leadsRes, configRes] = await Promise.all([
                getLeadsAction(),
                getCRMConfigAction()
            ]);

            if (leadsRes.success && leadsRes.leads) {
                setLeads(leadsRes.leads);
            }

            if (configRes.success && configRes.config) {
                setConfig(configRes.config);
                // Determine main pipeline for now (first one)
                const mainPipeline = configRes.config.pipelines[0];
                if (mainPipeline) {
                    setStages(mainPipeline.stages.sort((a, b) => a.order - b.order));
                }
            }
        } catch (error) {
            console.error("Failed to load CRM data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMock = async () => {
        setLoading(true);
        await createMockLeadsAction();
        loadData();
    };

    // Calculate columns
    const columns = stages.map(stage => ({
        id: stage.id,
        title: stage.label,
        color: stage.color,
        leads: leads.filter(l => l.status === stage.id)
    }));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        // Find the lead being dragged
        const lead = leads.find(l => l.id === activeId);
        if (!lead) return;

        // Determine new status based on whether dropped on a container (Column) or an item (Card)
        // If dropped on a container, use container ID as status (if it's a valid status)
        // If dropped on another card, use that card's status

        let newStatus: Lead['status'] | undefined;

        // Check if over is a container (column stage ID)
        if (stages.some(s => s.id === over.id)) {
            newStatus = over.id as Lead['status'];
        } else {
            // Dropped on a card, find that card's status
            const overLead = leads.find(l => l.id === over.id);
            if (overLead) {
                newStatus = overLead.status;
            }
        }

        if (newStatus && newStatus !== lead.status) {
            // Optimistic Update
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus! } : l));

            // Server Update
            await updateLeadStatusAction(lead.id, newStatus);
        }
    };

    if (loading && leads.length === 0) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Pipeline</h2>
                    <p className="text-muted-foreground text-sm mt-1">Drag and drop leads to advance stages.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMock}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 border border-border hidden"
                    >
                        <Plus size={16} /> Mock Leads
                    </button>
                    {config && (
                        <ColumnManager
                            config={config}
                            pipelineIndex={0}
                            onUpdate={loadData}
                        />
                    )}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start custom-scrollbar">
                    {columns.map(col => (
                        <KanbanColumn key={col.id} id={col.id} title={col.title} color={col.color} leads={col.leads} onCardClick={setSelectedLead} />
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <KanbanCard lead={leads.find(l => l.id === activeId)!} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <LeadDetailsSlideOver
                open={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                lead={selectedLead}
                onUpdate={() => {
                    loadData();
                    setSelectedLead(null);
                }}
            />
        </div>
    );
}
