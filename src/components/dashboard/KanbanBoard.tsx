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
import { Lead, LEAD_STATUSES } from "@/backend/crm/domain/Lead";
import { getLeadsAction, updateLeadStatusAction, createMockLeadsAction } from "@/actions/crm/actions";
import { Loader2, Plus } from "lucide-react";

// --- Components ---

function KanbanCard({ lead, isOverlay = false }: { lead: Lead, isOverlay?: boolean }) {
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
            className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing mb-3 hover:shadow-md transition-shadow ${isOverlay ? "shadow-xl ring-2 ring-indigo-500 rotate-2" : ""}`}
        >
            <h4 className="font-semibold text-slate-800">{lead.name}</h4>
            <p className="text-xs text-slate-500 mb-2">{lead.source}</p>
            <div className="flex justify-between items-center text-xs text-slate-400">
                <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
                {lead.propertyId && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">Property Interest</span>}
            </div>
        </div>
    );
}

function KanbanColumn({ id, title, leads }: { id: string, title: string, leads: Lead[] }) {
    const { setNodeRef } = useSortable({ id });

    return (
        <div ref={setNodeRef} className="flex flex-col bg-slate-50 rounded-xl min-w-[280px] w-80 max-h-full">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">{title}</h3>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {leads.length}
                </span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto min-h-[150px]">
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {leads.map(lead => (
                        <KanbanCard key={lead.id} lead={lead} />
                    ))}
                </SortableContext>
                {leads.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-300 text-sm italic py-8">
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
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        const res = await getLeadsAction();
        if (res.success && res.leads) {
            setLeads(res.leads);
        }
        setLoading(false);
    };

    const handleMock = async () => {
        setLoading(true);
        await createMockLeadsAction();
        loadLeads();
    };

    // Calculate columns
    const columns = LEAD_STATUSES.map(status => ({
        id: status,
        title: status.charAt(0).toUpperCase() + status.slice(1),
        leads: leads.filter(l => l.status === status)
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

        // Check if over is a container (column)
        if (LEAD_STATUSES.some(s => s === over.id)) {
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
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Pipeline</h2>
                <button
                    onClick={handleMock}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Generate Mock Leads
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start">
                    {columns.map(col => (
                        <KanbanColumn key={col.id} id={col.id} title={col.title} leads={col.leads} />
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <KanbanCard lead={leads.find(l => l.id === activeId)!} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
