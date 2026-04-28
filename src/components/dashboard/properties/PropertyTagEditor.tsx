"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, X, Tag, Star, Gem, Waves, Sparkles, TrendingUp } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { HOME_SECTIONS, HomeSection, HOME_SECTION_LABELS } from "@/lib/schemas/propertySchema";

interface PropertyTagEditorProps {
    propertyId: string;
    propertyLabel: string;
    initialHomeSections: HomeSection[];
    initialEditorialNotes?: string;
    onClose: () => void;
    onSaved?: (sections: HomeSection[]) => void;
}

const SECTION_ICONS: Record<HomeSection, React.ComponentType<{ size?: number; className?: string }>> = {
    'featured': Star,
    'luxury': Gem,
    'waterfront': Waves,
    'new-today': Sparkles,
    'investor-deals': TrendingUp,
};

const SECTION_COLORS: Record<HomeSection, string> = {
    'featured': 'blue',
    'luxury': 'amber',
    'waterfront': 'cyan',
    'new-today': 'emerald',
    'investor-deals': 'purple',
};

function colorClasses(color: string, active: boolean): string {
    const map: Record<string, { active: string; idle: string }> = {
        blue: {
            active: 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-100 dark:ring-blue-900/30',
            idle: 'border-border hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30',
        },
        amber: {
            active: 'bg-amber-600 border-amber-600 text-white ring-2 ring-amber-100 dark:ring-amber-900/30',
            idle: 'border-border hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/30',
        },
        cyan: {
            active: 'bg-cyan-600 border-cyan-600 text-white ring-2 ring-cyan-100 dark:ring-cyan-900/30',
            idle: 'border-border hover:border-cyan-300 dark:hover:border-cyan-800 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30',
        },
        emerald: {
            active: 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-100 dark:ring-emerald-900/30',
            idle: 'border-border hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30',
        },
        purple: {
            active: 'bg-purple-600 border-purple-600 text-white ring-2 ring-purple-100 dark:ring-purple-900/30',
            idle: 'border-border hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-950/30',
        },
    };
    const fallback = map.blue!;
    const colorMap = map[color] ?? fallback;
    return active ? colorMap.active : colorMap.idle;
}

export function PropertyTagEditor({
    propertyId,
    propertyLabel,
    initialHomeSections,
    initialEditorialNotes = "",
    onClose,
    onSaved,
}: PropertyTagEditorProps) {
    const [selected, setSelected] = useState<Set<HomeSection>>(new Set(initialHomeSections));
    const [notes, setNotes] = useState(initialEditorialNotes);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSelected(new Set(initialHomeSections));
        setNotes(initialEditorialNotes);
    }, [propertyId, initialHomeSections, initialEditorialNotes]);

    const toggle = (section: HomeSection) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error("No auth token");

            const res = await fetch(`/api/properties/${propertyId}/tag`, {
                method: "PATCH",
                headers: {
                    "content-type": "application/json",
                    "authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    homeSections: Array.from(selected),
                    editorialNotes: notes.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Save failed");

            toast.success(`Etiquetas actualizadas · ${selected.size} ${selected.size === 1 ? "sección" : "secciones"}`, {
                description: propertyLabel,
            });
            onSaved?.(Array.from(selected));
            onClose();
        } catch (err: any) {
            toast.error(`No se pudieron guardar las etiquetas: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            <Tag size={12} /> Editorial tagging
                        </div>
                        <h3 className="text-lg font-bold truncate">{propertyLabel}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Elegí en qué secciones de la home aparece esta propiedad.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-2">
                    {HOME_SECTIONS.map((section) => {
                        const Icon = SECTION_ICONS[section];
                        const meta = HOME_SECTION_LABELS[section];
                        const color = SECTION_COLORS[section];
                        const active = selected.has(section);
                        return (
                            <button
                                key={section}
                                type="button"
                                onClick={() => toggle(section)}
                                disabled={saving}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left disabled:opacity-40 ${colorClasses(color, active)}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                    <Icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate">{meta.label}</div>
                                    <div className={`text-[11px] truncate ${active ? "opacity-90" : "text-muted-foreground"}`}>
                                        {meta.description}
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? "bg-white border-white" : "border-muted-foreground/40"}`}>
                                    {active && <div className="w-2 h-2 rounded-sm bg-current" style={{ color: `var(--${color}-600)` }} />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Notas internas (opcional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={saving}
                        maxLength={500}
                        placeholder="Ej. 'Destacar en la home mientras dure la promo de marzo'"
                        className="w-full h-16 rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-40"
                    />
                    <div className="text-[10px] text-muted-foreground text-right">{notes.length}/500</div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-10 px-4 rounded-xl text-sm font-semibold border border-border hover:bg-accent disabled:opacity-40"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="h-10 px-5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 inline-flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
                    >
                        {saving ? (
                            <><Loader2 size={14} className="animate-spin" /> Guardando…</>
                        ) : (
                            <>Guardar</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
