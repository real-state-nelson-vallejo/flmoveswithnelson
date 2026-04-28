"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CloudDownload, MapPin, Database, Filter, SlidersHorizontal } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { SyncMapSelector, SpatialBoxResult } from "./SyncMapSelector";
import { SyncEstimateBadge, SubTotal, SyncMode } from "./SyncEstimateBadge";
import type { AdvancedPropertyFilters } from "@/backend/property/infrastructure/BridgePropertyRepository";

interface SyncMLSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SyncMLSModal({ isOpen, onClose, onSuccess }: SyncMLSModalProps) {
    const [zone, setZone] = useState("");
    const [minBeds, setMinBeds] = useState<number | ''>('');
    const [minBaths, setMinBaths] = useState<number | ''>('');
    const [minSqFt, setMinSqFt] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');
    const [propertyType, setPropertyType] = useState<string>('');
    const [waterfront, setWaterfront] = useState(false);
    const [hasPool, setHasPool] = useState(false);
    const [spatial, setSpatial] = useState<SpatialBoxResult | undefined>();
    const [targetScope, setTargetScope] = useState<"all" | "agent" | "office">("all");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const NELSON_AGENT_ID = process.env.NEXT_PUBLIC_NELSON_AGENT_ID ?? "";
    const FL_MOVES_OFFICE_ID = process.env.NEXT_PUBLIC_NELSON_OFFICE_ID ?? "";

    const filters = useMemo<AdvancedPropertyFilters>(() => {
        const f: AdvancedPropertyFilters = {};
        const zones = zone.split(',').map(z => z.trim()).filter(Boolean);
        if (zones.length) f.zones = zones;
        if (minBeds !== '') f.minBeds = Number(minBeds);
        if (minBaths !== '') f.minBaths = Number(minBaths);
        if (minSqFt !== '') f.minSqFt = Number(minSqFt);
        if (maxPrice !== '') f.maxPrice = Number(maxPrice);
        if (propertyType) f.propertyType = propertyType;
        if (waterfront) f.waterfront = true;
        if (hasPool) f.hasPool = true;
        if (spatial) f.spatialBox = {
            latMin: spatial.latMin, latMax: spatial.latMax,
            lngMin: spatial.lngMin, lngMax: spatial.lngMax,
        };
        if (targetScope === "agent" && NELSON_AGENT_ID) f.agentId = NELSON_AGENT_ID;
        if (targetScope === "office" && FL_MOVES_OFFICE_ID) f.officeId = FL_MOVES_OFFICE_ID;
        return f;
    }, [zone, minBeds, minBaths, minSqFt, maxPrice, propertyType, waterfront, hasPool, spatial, targetScope, NELSON_AGENT_ID, FL_MOVES_OFFICE_ID]);

    const handleConfirm = async (args: { filters: AdvancedPropertyFilters; mode: SyncMode; split?: SubTotal[]; total?: number; label?: string }) => {
        setIsSubmitting(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                toast.error("Debes iniciar sesión como admin.");
                return;
            }

            const body: any = { filters: args.filters, mode: args.mode, total: args.total, label: args.label };
            if (args.split) {
                body.split = args.split.map(s => ({ label: s.label, count: s.count, filters: s.filters }));
            }

            const res = await fetch("/api/sync/run", {
                method: "POST",
                headers: { "content-type": "application/json", "authorization": `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data?.error || "No se pudo encolar la sincronización.");
                return;
            }

            const jobCount = data.jobIds?.length ?? 1;
            toast.success(
                jobCount > 1
                    ? `${jobCount} jobs encolados · sigue el progreso en la barra superior`
                    : `Job encolado · sigue el progreso en la barra superior`
            );
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Error al encolar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="Advanced MLS Sync"
            widthClass="w-full sm:w-[500px] md:w-[70vw] lg:w-[60vw]"
        >
            <div className="flex flex-col min-h-full bg-slate-50/50 dark:bg-slate-950">
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-6 -mx-6 -mt-6 flex-shrink-0">
                    <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
                        Configurá filtros y el sistema te dirá cuántas propiedades hay antes de encolar. Sin paginación manual.
                    </p>
                </div>

                <div className="flex-1 py-6 space-y-8">
                    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl text-slate-500 dark:text-slate-400 text-xs shadow-sm border border-slate-100/50 dark:border-slate-800 hidden lg:flex">
                        <div className="flex flex-col items-center gap-2 font-medium"><CloudDownload size={18} className="text-indigo-500" /><span>Bridge API</span></div>
                        <div className="flex-1 px-4 flex items-center opacity-40"><div className="h-[2px] bg-indigo-200 w-full rounded-full"></div></div>
                        <div className="flex flex-col items-center gap-2 font-medium"><Database size={18} className="text-orange-500" /><span>Firestore</span></div>
                        <div className="flex-1 px-4 flex items-center opacity-40"><div className="h-[2px] bg-orange-200 w-full rounded-full"></div></div>
                        <div className="flex flex-col items-center gap-2 font-medium"><div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-[10px]">AI</div><span>Vector DB</span></div>
                    </div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-2">
                            <SlidersHorizontal size={16} className="text-blue-500" /> Target Inventory Scope
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                onClick={() => setTargetScope("all")}
                                className={`px-4 py-3 text-xs font-bold rounded-xl border shadow-sm transition-all ${targetScope === 'all' ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-50 dark:ring-blue-900/30 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                General Market
                            </button>
                            <button
                                onClick={() => setTargetScope("agent")}
                                className={`px-4 py-3 text-xs font-bold rounded-xl border shadow-sm transition-all ${targetScope === 'agent' ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-50 dark:ring-blue-900/30 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                My Listings
                            </button>
                            <button
                                onClick={() => setTargetScope("office")}
                                className={`px-4 py-3 text-xs font-bold rounded-xl border shadow-sm transition-all ${targetScope === 'office' ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-50 dark:ring-blue-900/30 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                Brokerage
                            </button>
                        </div>
                    </section>

                    <hr className="border-slate-200/60 dark:border-slate-800/60" />

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-2">
                            <MapPin size={16} className="text-blue-500" /> Location & Zones
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-1 md:p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <SyncMapSelector onSpatialChange={setSpatial} />
                        </div>
                        <div className="space-y-2 mt-4">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Manual Zones (Zip/City)</label>
                            <Input
                                placeholder="e.g. 33132, Miami, Coral Gables"
                                value={zone}
                                onChange={(e) => setZone(e.target.value)}
                                disabled={isSubmitting}
                                className="h-12 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-xl shadow-sm border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                            />
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">Separá múltiples zonas con comas. Si indicás varias, el sistema podrá sugerir dividir en jobs.</p>
                        </div>
                    </section>

                    <hr className="border-slate-200/60 dark:border-slate-800/60" />

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-2">
                            <Filter size={16} className="text-blue-500" /> Property Attributes
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Property Type</label>
                                <select
                                    className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-slate-200 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                    disabled={isSubmitting}
                                >
                                    <option value="">Any Type</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Land">Land</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Max Price</label>
                                <Input className="h-12 rounded-xl shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" type="number" placeholder="No limit" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')} disabled={isSubmitting} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Min Beds</label>
                                <Input className="h-12 rounded-xl shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" type="number" placeholder="Any" value={minBeds} onChange={(e) => setMinBeds(e.target.value ? Number(e.target.value) : '')} disabled={isSubmitting} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Min Baths</label>
                                <Input className="h-12 rounded-xl shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" type="number" placeholder="Any" value={minBaths} onChange={(e) => setMinBaths(e.target.value ? Number(e.target.value) : '')} disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 items-center">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Minimum Square Feet</label>
                                <Input className="h-12 rounded-xl shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" type="number" placeholder="e.g. 1500" value={minSqFt} onChange={(e) => setMinSqFt(e.target.value ? Number(e.target.value) : '')} disabled={isSubmitting} />
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:justify-end pt-2">
                                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" checked={waterfront} onChange={e => setWaterfront(e.target.checked)} className="peer sr-only" disabled={isSubmitting} />
                                        <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                    Waterfront
                                </label>
                                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" checked={hasPool} onChange={e => setHasPool(e.target.checked)} className="peer sr-only" disabled={isSubmitting} />
                                        <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                    Pool
                                </label>
                            </div>
                        </div>
                    </section>

                    <hr className="border-slate-200/60 dark:border-slate-800/60" />

                    {/* Preview badge: count en vivo + estimación + sugerencia de split */}
                    <SyncEstimateBadge
                        filters={filters}
                        onConfirm={handleConfirm}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="sticky -bottom-6 -mx-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex items-center justify-between gap-3 z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.4)] mt-auto">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        El progreso aparece en la barra superior — podés cerrar este modal.
                    </p>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="h-11 px-5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                        Cerrar
                    </Button>
                </div>
            </div>
        </SlideOver>
    );
}
