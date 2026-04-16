"use client";

import { useState } from "react";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, CloudDownload, MapPin, Database, Filter, SlidersHorizontal } from "lucide-react";
import { syncPropertiesAction } from "@/actions/property/sync";
import { SyncMapSelector, SpatialBoxResult } from "./SyncMapSelector";

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
    
    // Spatial mapping
    const [spatial, setSpatial] = useState<SpatialBoxResult | undefined>();

    const [limit, setLimit] = useState(20);
    const [skip, setSkip] = useState<number | ''>('');
    const [targetScope, setTargetScope] = useState<"all" | "agent" | "office">("all");
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hardcoded production values for Nelson Vallejo
    const NELSON_AGENT_ID = "272509597";
    const FL_MOVES_OFFICE_ID = "261024021";

    const handleSync = async () => {
        setIsSyncing(true);
        setError(null);

        try {
            const filters: any = {
                zones: zone ? zone.split(',').map(z => z.trim()).filter(Boolean) : undefined,
                minBeds: minBeds === '' ? undefined : Number(minBeds),
                minBaths: minBaths === '' ? undefined : Number(minBaths),
                minSqFt: minSqFt === '' ? undefined : Number(minSqFt),
                maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
                propertyType: propertyType === '' ? undefined : propertyType,
                waterfront: waterfront ? true : undefined,
                hasPool: hasPool ? true : undefined,
                spatialBox: spatial ? {
                    latMin: spatial.latMin,
                    latMax: spatial.latMax,
                    lngMin: spatial.lngMin,
                    lngMax: spatial.lngMax
                } : undefined
            };

            if (targetScope === "agent") {
                filters.agentId = NELSON_AGENT_ID;
            } else if (targetScope === "office") {
                filters.officeId = FL_MOVES_OFFICE_ID;
            }

            const offsetNum = skip === '' ? 0 : Number(skip);
            const res = await syncPropertiesAction(filters, limit, offsetNum);
            
            if (res.success) {
                alert(`Success! Synchronized ${res.syncedCount} active properties from MLS to Firestore and AI Embeddings.`);
                onSuccess();
            } else {
                setError(res.error || "Failed to sync. Please check server logs.");
            }
        } catch (err: any) {
            setError(err.message || "A network error occurred.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <SlideOver 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Live MLS Sync"
            widthClass="w-full sm:w-[500px] md:w-[70vw] lg:w-[60vw]"
        >
            {/* 
              We use min-h-full to ensure it pushes the footer down if content is small. 
              The SlideOver gives us a p-6 scrollable area.
            */}
            <div className="flex flex-col min-h-full bg-slate-50/50 dark:bg-slate-950">
                {/* Visual Header / Subtitle */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-6 -mx-6 -mt-6 flex-shrink-0">
                    <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
                        Fetch active listings directly from Bridge Interactive RESO Web API and vectorize them.
                    </p>
                </div>

                {/* Body (Expands) */}
                <div className="flex-1 py-6 space-y-8">
                    
                    {/* Data Flow Diagram (Desktop only) */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl text-slate-500 dark:text-slate-400 text-xs shadow-sm border border-slate-100/50 dark:border-slate-800 hidden lg:flex">
                        <div className="flex flex-col items-center gap-2 font-medium"><CloudDownload size={18} className="text-indigo-500" /><span>Bridge API</span></div>
                        <div className="flex-1 px-4 flex items-center opacity-40"><div className="h-[2px] bg-indigo-200 w-full rounded-full"></div></div>
                        <div className="flex flex-col items-center gap-2 font-medium"><Database size={18} className="text-orange-500" /><span>Firestore</span></div>
                        <div className="flex-1 px-4 flex items-center opacity-40"><div className="h-[2px] bg-orange-200 w-full rounded-full"></div></div>
                        <div className="flex flex-col items-center gap-2 font-medium"><div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-[10px]">AI</div><span>Vector DB</span></div>
                    </div>

                    {/* Section 1: Scope */}
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

                    {/* Section 2: Geo-Spatial */}
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
                                disabled={isSyncing}
                                className="h-12 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-xl shadow-sm border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                            />
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">Separate multiple zones with commas.</p>
                        </div>
                    </section>

                    <hr className="border-slate-200/60 dark:border-slate-800/60" />

                    {/* Section 3: Attributes */}
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
                                    disabled={isSyncing}
                                >
                                    <option value="">Any Type</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Land">Land</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Max Price</label>
                                <Input className="h-12 rounded-xl shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" type="number" placeholder="No limit" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')} disabled={isSyncing} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Min Beds</label>
                                <Input className="h-12 rounded-xl shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" type="number" placeholder="Any" value={minBeds} onChange={(e) => setMinBeds(e.target.value ? Number(e.target.value) : '')} disabled={isSyncing} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Min Baths</label>
                                <Input className="h-12 rounded-xl shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" type="number" placeholder="Any" value={minBaths} onChange={(e) => setMinBaths(e.target.value ? Number(e.target.value) : '')} disabled={isSyncing} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 items-center">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Minimum Square Feet</label>
                                <Input className="h-12 rounded-xl shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" type="number" placeholder="e.g. 1500" value={minSqFt} onChange={(e) => setMinSqFt(e.target.value ? Number(e.target.value) : '')} disabled={isSyncing} />
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:justify-end pt-2">
                                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" checked={waterfront} onChange={e => setWaterfront(e.target.checked)} className="peer sr-only" disabled={isSyncing} />
                                        <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                    Waterfront
                                </label>
                                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" checked={hasPool} onChange={e => setHasPool(e.target.checked)} className="peer sr-only" disabled={isSyncing} />
                                        <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                    Pool
                                </label>
                            </div>
                        </div>
                    </section>

                    <hr className="border-slate-200/60 dark:border-slate-800/60" />

                    {/* Section 4: Limit Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-100 dark:bg-slate-900/50 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Max Records</label>
                            <select 
                                className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                disabled={isSyncing}
                            >
                                <option value={10}>10 Properties (Quick)</option>
                                <option value={20}>20 Properties</option>
                                <option value={50}>50 Properties</option>
                                <option value={100}>100 Properties (Heavy Load)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Offset (Skip)</label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="h-12 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 focus-visible:ring-blue-500"
                                value={skip}
                                onChange={(e) => setSkip(e.target.value ? Number(e.target.value) : '')}
                                disabled={isSyncing}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 text-sm text-red-600 font-medium bg-red-50 dark:bg-red-950 dark:text-red-400 dark:border-red-900 rounded-xl border border-red-200 break-words flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0 mt-0.5">!</div>
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer (Sticky at bottom spanning full width compensating for padding) */}
                <div className="sticky -bottom-6 -mx-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.4)] mt-auto">
                    <Button variant="ghost" onClick={onClose} disabled={isSyncing} className="h-12 px-6 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSync} 
                        disabled={isSyncing} 
                        className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all w-full sm:w-auto text-base"
                    >
                        {isSyncing ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Ingesting Data...</>
                        ) : (
                            <><CloudDownload className="mr-2 h-5 w-5" /> Start Import</>
                        )}
                    </Button>
                </div>
            </div>
        </SlideOver>
    );
}
