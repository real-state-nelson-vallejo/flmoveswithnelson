"use client";

import { useEffect, useState } from "react";
import { getPropertiesAction, deletePropertyAction } from "@/actions/property/actions";
import { PropertyDTO } from "@/types/property";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

import { SlideOver } from "@/components/ui/SlideOver";
import { PropertyForm } from "@/components/dashboard/PropertyForm";

export default function PropertiesDashboardPage() {
    const [properties, setProperties] = useState<PropertyDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<PropertyDTO | undefined>(undefined);

    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = async () => {
        setLoading(true);
        const res = await getPropertiesAction();
        if (res.success && res.properties) {
            setProperties(res.properties);
        }
        setLoading(false);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Property Management</h2>
                <button
                    onClick={handleCreate}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Add Property
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-slate-400" />
                </div>
            ) : properties.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                    <p>No properties found. Start by adding a new one.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {properties.map((property) => (
                                <tr key={property.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{property.title}</td>
                                    <td className="px-6 py-4">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: property.price.currency }).format(property.price.amount)}
                                    </td>
                                    <td className="px-6 py-4">{property.location.city}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {property.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(property)}
                                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(property.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
