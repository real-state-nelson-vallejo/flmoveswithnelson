"use client";

import { useEffect, useState } from "react";
import { getPropertiesAction } from "@/actions/property/actions";
import { Property } from "@/backend/property/domain/Property";
import { Loader2, Plus } from "lucide-react";

import { SlideOver } from "@/components/ui/SlideOver";
import { PropertyForm } from "@/components/dashboard/PropertyForm";

export default function PropertiesDashboardPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Property Management</h2>
                <button
                    onClick={() => setIsFormOpen(true)}
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <SlideOver
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title="Create New Property"
            >
                <PropertyForm
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
