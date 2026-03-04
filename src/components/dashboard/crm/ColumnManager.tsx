"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CRMStage, CRMConfig } from "@/backend/crm/domain/CRMConfig";
import { updateCRMConfigAction } from "@/actions/crm/actions";
import { Plus, GripVertical, Trash2, X, Settings } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnManagerProps {
    config: CRMConfig;
    pipelineIndex?: number;
    onUpdate: () => void;
}

const COLOR_OPTIONS = [
    { name: 'Slate', value: 'bg-slate-500' },
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Amber', value: 'bg-amber-500' },
    { name: 'Purple', value: 'bg-purple-500' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Emerald', value: 'bg-emerald-500' },
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Pink', value: 'bg-pink-500' },
    { name: 'Indigo', value: 'bg-indigo-500' },
];

function SortableStage({ stage, onUpdateTitle, onUpdateColor, onRemove }: {
    stage: CRMStage,
    onUpdateTitle: (id: string, newTitle: string) => void,
    onUpdateColor: (id: string, newColor: string) => void,
    onRemove: (id: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-card border rounded-lg mb-2 shadow-sm ${isDragging ? 'ring-2 ring-primary border-primary' : 'border-border'}`}>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical size={18} />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <Input
                    value={stage.label}
                    onChange={(e) => onUpdateTitle(stage.id, e.target.value)}
                    placeholder="Column Name"
                    className="h-9"
                />

                <div className="flex items-center gap-2">
                    <div className="flex bg-muted/50 p-1 rounded-md overflow-x-auto select-none no-scrollbar">
                        {COLOR_OPTIONS.map(c => (
                            <button
                                key={c.value}
                                onClick={() => onUpdateColor(stage.id, c.value)}
                                className={`w-6 h-6 rounded-full flex-shrink-0 mx-0.5 border-2 transition-transform hover:scale-110 ${c.value.replace('bg-', 'bg-').replace('-500', '-500')} ${stage.color === c.value ? 'border-foreground shadow-sm scale-110' : 'border-transparent'}`}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => onRemove(stage.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 size={16} />
            </Button>
        </div>
    );
}

export function ColumnManager({ config, pipelineIndex = 0, onUpdate }: ColumnManagerProps) {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Create a local copy to edit before saving
    const initialStages = config.pipelines[pipelineIndex]?.stages || [];
    const [stages, setStages] = useState<CRMStage[]>(initialStages);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setStages((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newOrdered = arrayMove(items, oldIndex, newIndex);
                // Update internal order index
                return newOrdered.map((stage, idx) => ({ ...stage, order: idx }));
            });
        }
    };

    const handleAddColumn = () => {
        const newId = `stage_${Date.now()}`;
        setStages([
            ...stages,
            { id: newId, label: 'New Stage', color: 'bg-slate-500', order: stages.length }
        ]);
    };

    const handleUpdateTitle = (id: string, newLabel: string) => {
        setStages(stages.map(s => s.id === id ? { ...s, label: newLabel } : s));
    };

    const handleUpdateColor = (id: string, newColor: string) => {
        setStages(stages.map(s => s.id === id ? { ...s, color: newColor } : s));
    };

    const handleRemove = (id: string) => {
        if (stages.length <= 1) {
            alert("A pipeline must have at least one stage.");
            return;
        }
        if (confirm("Are you sure? Any leads currently in this stage will remain attached to this invisible ID until reassigned.")) {
            const next = stages.filter(s => s.id !== id);
            setStages(next.map((s, idx) => ({ ...s, order: idx })));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const newConfig = { ...config };
        if (newConfig.pipelines[pipelineIndex]) {
            newConfig.pipelines[pipelineIndex].stages = stages;

            const res = await updateCRMConfigAction(newConfig);
            if (res.success) {
                onUpdate();
                setOpen(false);
            } else {
                alert("Failed to save changes.");
            }
        }
        setIsSaving(false);
    };

    // Reset local state when opened
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            const currentStages = config.pipelines[pipelineIndex]?.stages || [];
            setStages(currentStages.sort((a, b) => a.order - b.order));
        }
        setOpen(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Settings size={16} /> Manage Columns
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Configure Pipeline Stages</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 px-1 custom-scrollbar">
                    <Label className="mb-4 block text-muted-foreground">Drag to reorder stages. Left to right in the board equals top to bottom here.</Label>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={stages.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {stages.map(stage => (
                                <SortableStage
                                    key={stage.id}
                                    stage={stage}
                                    onUpdateTitle={handleUpdateTitle}
                                    onUpdateColor={handleUpdateColor}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-4 flex items-center justify-center gap-2 border-dashed border-2 bg-transparent hover:bg-muted"
                        onClick={handleAddColumn}
                    >
                        <Plus size={16} /> Add Stage
                    </Button>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Pipeline"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

