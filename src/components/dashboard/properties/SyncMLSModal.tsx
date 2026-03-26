"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, CloudDownload, MapPin, Database } from "lucide-react";
import { syncPropertiesAction } from "@/actions/property/sync";

interface SyncMLSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SyncMLSModal({ isOpen, onClose, onSuccess }: SyncMLSModalProps) {
    const [zone, setZone] = useState("");
    const [minBeds, setMinBeds] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');
    const [propertyType, setPropertyType] = useState<string>('');
    const [limit, setLimit] = useState(20);
    const [skip, setSkip] = useState<number | ''>('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setError(null);

        try {
            const filters = {
                zone: zone.trim() || undefined,
                minBeds: minBeds === '' ? undefined : Number(minBeds),
                maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
                propertyType: propertyType === '' ? undefined : propertyType,
            };

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CloudDownload className="text-blue-500" size={20} />
                        Live MLS Sync
                    </DialogTitle>
                    <DialogDescription>
                        Fetch active listings directly from Bridge Interactive RESO Web API and ingest them into the platform.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Visual Diagram */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg text-slate-500 text-xs mb-4 border border-slate-100">
                        <div className="flex flex-col items-center gap-1"><CloudDownload size={16} /><span>Bridge API</span></div>
                        <div className="h-px bg-slate-300 w-12" />
                        <div className="flex flex-col items-center gap-1"><Database size={16} /><span>Firestore</span></div>
                        <div className="h-px bg-slate-300 w-12" />
                        <div className="flex flex-col items-center gap-1"><div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 font-bold">AI</div><span>Vector DB</span></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <MapPin size={14} /> City or Zip (Optional)
                            </label>
                            <Input
                                placeholder="Any Zone..."
                                value={zone}
                                onChange={(e) => setZone(e.target.value)}
                                disabled={isSyncing}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Property Type</label>
                            <select 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
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
                            <label className="text-sm font-medium text-slate-700">Max Price (USD)</label>
                            <Input
                                type="number"
                                placeholder="Any Price"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                                disabled={isSyncing}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Min Beds</label>
                            <Input
                                type="number"
                                placeholder="Any Beds"
                                value={minBeds}
                                onChange={(e) => setMinBeds(e.target.value ? Number(e.target.value) : '')}
                                disabled={isSyncing}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Max Properties to Fetch</label>
                            <select 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                disabled={isSyncing}
                            >
                                <option value={10}>10 Properties</option>
                                <option value={20}>20 Properties</option>
                                <option value={50}>50 Properties</option>
                                <option value={100}>100 Properties (Heavy)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Offset (Pagination Skip)</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={skip}
                                onChange={(e) => setSkip(e.target.value ? Number(e.target.value) : '')}
                                disabled={isSyncing}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={onClose} disabled={isSyncing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSync} disabled={isSyncing} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                        {isSyncing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing API...</>
                        ) : (
                            "Start Import"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
