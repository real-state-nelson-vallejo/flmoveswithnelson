"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getPropertiesPageAction, deletePropertyAction } from "@/actions/property/actions";
import { PropertyDTO } from "@/types/property";
import { SlideOver } from "@/components/ui/SlideOver";
import { PropertyForm } from "@/components/dashboard/PropertyForm";
import { PropertyStats } from "@/components/dashboard/properties/PropertyStats";
import { PropertyCard } from "@/components/dashboard/properties/PropertyCard";
import { PropertyFilters } from "@/components/dashboard/properties/PropertyFilters";
import { SyncMLSModal } from "@/components/dashboard/properties/SyncMLSModal";
import { QuickSyncBar } from "@/components/dashboard/properties/QuickSyncBar";
import { PropertyTagEditor } from "@/components/dashboard/properties/PropertyTagEditor";
import type { HomeSection } from "@/lib/schemas/propertySchema";
import { SlidersHorizontal, Plus, ArrowUpDown, Loader2 } from "lucide-react";

export default function PropertiesDashboardPage() {
    const [properties, setProperties] = useState<PropertyDTO[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<PropertyDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<PropertyDTO | undefined>(undefined);
    const [taggingProperty, setTaggingProperty] = useState<PropertyDTO | null>(null);

    // Filter States
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [opportunitiesOnly, setOpportunitiesOnly] = useState(false);
    // Default true until all legacy properties get a backfilled `archived: false`.
    // Run `npx tsx scripts/backfill-archived.ts` once to normalize the collection,
    // then this default can safely become `false` to hide archived props by default.
    const [includeArchived, setIncludeArchived] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        loadProperties();
    }, []);

    useEffect(() => {
        filterProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [properties, search, statusFilter, opportunitiesOnly]);

    // Auto-refresh the listing whenever the SyncQueueBar detects a job just finished.
    useEffect(() => {
        const onSyncCompleted = (e: Event) => {
            const detail = (e as CustomEvent<{ jobId: string; label: string; added: number; updated: number; total: number }>).detail;
            const addedStr = detail.added > 0 ? `+${detail.added} nuevas` : "sin nuevas";
            const updatedStr = detail.updated > 0 ? ` · ${detail.updated} actualizadas` : "";
            toast.success(`Sync completado: ${detail.label}`, {
                description: `${addedStr}${updatedStr} · ${detail.total} procesadas`,
                duration: 6000,
            });
            loadProperties();
        };
        window.addEventListener("sync-completed", onSyncCompleted);
        return () => window.removeEventListener("sync-completed", onSyncCompleted);
    }, []);

    const loadProperties = async () => {
        setLoading(true);
        setNextCursor(null);
        const res = await getPropertiesPageAction({ includeArchived, limit: 30 });
        if (res.success && res.properties) {
            setProperties(res.properties);
            setNextCursor(res.nextCursor);
        }
        setLoading(false);
    };

    const loadMoreProperties = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await getPropertiesPageAction({ includeArchived, limit: 30, cursor: nextCursor });
            if (res.success && res.properties) {
                setProperties((prev) => [...prev, ...res.properties]);
                setNextCursor(res.nextCursor);
            }
        } finally {
            setLoadingMore(false);
        }
    };

    // Re-fetch when toggling archived inclusion so the dataset actually changes.
    useEffect(() => {
        loadProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeArchived]);

    const filterProperties = () => {
        let result = [...properties];

        // Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(p =>
                p.UnparsedAddress.toLowerCase().includes(lowerSearch) ||
                p.City.toLowerCase().includes(lowerSearch) ||
                p.UnparsedAddress.toLowerCase().includes(lowerSearch)
            );
        }

        // Status
        if (statusFilter !== 'all') {
            result = result.filter(p => p.StandardStatus === statusFilter);
        }

        // Smart Inbox (Opportunities)
        if (opportunitiesOnly) {
            result = result.filter(p => 
                (p.opportunityScore && p.opportunityScore >= 80) || 
                p.marketStatus === 'price_drop' || 
                p.marketStatus === 'distressed'
            );
        }

        setFilteredProperties(result);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this property?")) return;

        // Optimistic update
        setProperties(prev => prev.filter(p => p.ListingKey !== id));

        const res = await deletePropertyAction(id);
        if (!res.success) {
            alert("Failed to delete property");
            loadProperties(); // Revert
        }
    };

    const handleEdit = (property: PropertyDTO) => {
        setEditingProperty(property);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingProperty(undefined);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6 w-full p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Property Management</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Manage your portfolio, track opportunities, and optimize listings.</p>
                    <div className="flex items-center gap-2 mt-3 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5 bg-secondary/50 border border-border px-2.5 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
                            <span className="text-foreground/80">MLS Delta Sync: Active</span>
                        </div>
                        <span className="opacity-70">Updated hourly via CRON</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSyncModalOpen(true)}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent border border-border px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                        title="Sync avanzado con filtros complejos (attributes, spatial, etc.)"
                    >
                        <SlidersHorizontal size={16} /> Advanced Sync
                    </button>
                    <button
                        onClick={handleCreate}
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Property
                    </button>
                </div>
            </div>

            <QuickSyncBar />

            <PropertyStats properties={properties} />

            <PropertyFilters
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                viewMode={viewMode}
                setViewMode={setViewMode}
                opportunitiesOnly={opportunitiesOnly}
                setOpportunitiesOnly={setOpportunitiesOnly}
                includeArchived={includeArchived}
                setIncludeArchived={setIncludeArchived}
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 bg-card rounded-2xl border border-border">
                    <Loader2 className="animate-spin text-primary mb-4" size={32} />
                    <p className="text-muted-foreground font-medium">Loading your portfolio...</p>
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-16 text-center">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="text-muted-foreground" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">No properties found</h3>
                    <p className="text-muted-foreground mb-6">Try adjusting your filters or add a new property.</p>
                    <button onClick={handleCreate} className="text-primary font-medium hover:underline">
                        Add New Property
                    </button>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                            {filteredProperties.map((property, idx) => (
                                <PropertyCard
                                    key={property.ListingKey || `legacy-${idx}`}
                                    property={property}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onTagEdit={setTaggingProperty}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4 cursor-pointer hover:text-foreground flex items-center gap-1">
                                            Price <ArrowUpDown size={14} />
                                        </th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Opp. Score</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProperties.map((property, idx) => (
                                        <tr key={property.ListingKey || `legacy-${idx}`} className="hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                                            <td className="px-6 py-4 font-medium text-foreground">{property.UnparsedAddress}</td>
                                            <td className="px-6 py-4 font-mono text-muted-foreground">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: "USD" }).format(property.ListPrice)}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{property.City}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${property.StandardStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    property.StandardStatus === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-secondary text-muted-foreground'
                                                    }`}>
                                                    {property.StandardStatus ? property.StandardStatus.charAt(0).toUpperCase() + property.StandardStatus.slice(1) : 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {property.opportunityScore !== undefined ? (
                                                    <span className={`font-bold ${property.opportunityScore >= 80 ? 'text-emerald-600' :
                                                        property.opportunityScore >= 60 ? 'text-amber-500' :
                                                            'text-muted-foreground'
                                                        }`}>
                                                        {property.opportunityScore}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEdit(property)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(property.ListingKey)}
                                                    className="text-red-500 hover:text-red-700 font-medium text-xs"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {nextCursor && (
                        <div className="py-8 text-center">
                            <button
                                type="button"
                                onClick={loadMoreProperties}
                                disabled={loadingMore}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-accent border border-border rounded-xl text-sm font-semibold text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingMore ? (
                                    <><Loader2 size={14} className="animate-spin" /> Cargando más…</>
                                ) : (
                                    `Cargar más (siguientes 30)`
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            <SyncMLSModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                onSuccess={() => {
                    setIsSyncModalOpen(false);
                    loadProperties();
                }}
            />

            {taggingProperty && (
                <PropertyTagEditor
                    propertyId={taggingProperty.ListingKey}
                    propertyLabel={taggingProperty.UnparsedAddress}
                    initialHomeSections={(taggingProperty.homeSections ?? []) as HomeSection[]}
                    initialEditorialNotes={taggingProperty.editorialNotes ?? ""}
                    onClose={() => setTaggingProperty(null)}
                    onSaved={(sections) => {
                        // Optimistic update in the current list without refetching.
                        setProperties((prev) => prev.map((p) =>
                            p.ListingKey === taggingProperty.ListingKey
                                ? { ...p, homeSections: sections }
                                : p
                        ));
                    }}
                />
            )}

            <SlideOver
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingProperty ? "Edit Property" : "Create New Property"}
            >
                <PropertyForm
                    initialData={editingProperty}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        loadProperties();
                    }}
                    onCancel={() => setIsFormOpen(false)}
                />
            </SlideOver>
        </div>
    );
}
