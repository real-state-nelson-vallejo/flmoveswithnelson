"use client";

import { useEffect, useState } from "react";
import { getPropertiesAction, deletePropertyAction } from "@/actions/property/actions";
import { PropertyDTO } from "@/types/property";
import { Loader2, Plus, ArrowUpDown } from "lucide-react";

import { SlideOver } from "@/components/ui/SlideOver";
import { PropertyForm } from "@/components/dashboard/PropertyForm";
import { PropertyStats } from "@/components/dashboard/properties/PropertyStats";
import { PropertyCard } from "@/components/dashboard/properties/PropertyCard";
import { PropertyFilters } from "@/components/dashboard/properties/PropertyFilters";

export default function PropertiesDashboardPage() {
    const [properties, setProperties] = useState<PropertyDTO[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<PropertyDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<PropertyDTO | undefined>(undefined);

    // Filter States
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    useEffect(() => {
        loadProperties();
    }, []);

    useEffect(() => {
        filterProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [properties, search, statusFilter]);

    const loadProperties = async () => {
        setLoading(true);
        const res = await getPropertiesAction();
        if (res.success && res.properties) {
            setProperties(res.properties);
        }
        setLoading(false);
    };

    const filterProperties = () => {
        let result = [...properties];

        // Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(lowerSearch) ||
                p.location.city.toLowerCase().includes(lowerSearch) ||
                p.location.address.toLowerCase().includes(lowerSearch)
            );
        }

        // Status
        if (statusFilter !== 'all') {
            result = result.filter(p => p.status === statusFilter);
        }

        setFilteredProperties(result);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this property?")) return;

        // Optimistic update
        setProperties(prev => prev.filter(p => p.id !== id));

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
                    <p className="text-muted-foreground mt-1">Manage your portfolio, track opportunities, and optimize listings.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <Plus size={18} /> Add Property
                </button>
            </div>

            <PropertyStats properties={properties} />

            <PropertyFilters
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                viewMode={viewMode}
                setViewMode={setViewMode}
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
                            {filteredProperties.map(property => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
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
                                    {filteredProperties.map((property) => (
                                        <tr key={property.id} className="hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                                            <td className="px-6 py-4 font-medium text-foreground">{property.title}</td>
                                            <td className="px-6 py-4 font-mono text-muted-foreground">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: property.price.currency }).format(property.price.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{property.location.city}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${property.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    property.status === 'reserved' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-secondary text-muted-foreground'
                                                    }`}>
                                                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
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
                                                    onClick={() => handleDelete(property.id)}
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
                </>
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
