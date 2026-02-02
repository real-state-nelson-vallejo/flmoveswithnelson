"use client";

import { useEffect, useState, use, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PropertySearchFilter } from '@/components/property/PropertySearchFilter';
import { PropertiesWebMap } from '@/components/property/PropertiesWebMap';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyDTO } from "@/types/property";
import { getPropertiesAction } from '@/actions/property/actions';
import { PropertyFilter } from '@/backend/property/domain/PropertyRepository';
import { Loader2 } from 'lucide-react';
import { motion } from "framer-motion";

export default function PropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const searchParams = useSearchParams();
    const [properties, setProperties] = useState<PropertyDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const [showMapMobile, setShowMapMobile] = useState(false);

    const filter: PropertyFilter = useMemo(() => {
        const f: PropertyFilter = {};
        const q = searchParams.get('q');
        if (q) f.query = q;

        const minPrice = searchParams.get('minPrice');
        if (minPrice) f.minPrice = Number(minPrice);

        const maxPrice = searchParams.get('maxPrice');
        if (maxPrice) f.maxPrice = Number(maxPrice);

        const minBeds = searchParams.get('minBeds');
        if (minBeds) f.minBeds = Number(minBeds);

        const type = searchParams.get('type');
        if (type === 'sale' || type === 'rent') f.type = type;

        return f;
    }, [searchParams]);

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                const res = await getPropertiesAction(filter);
                if (res.success && res.properties) {
                    setProperties(res.properties);
                }
            } catch (error) {
                console.error("Failed to fetch properties:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [filter]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[calc(100vh-80px)] relative"
        >
            {/* 1. Header with Search & Filter */}
            <PropertySearchFilter />

            {/* Mobile Map Toggle */}
            <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                <button
                    onClick={() => setShowMapMobile(!showMapMobile)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    {showMapMobile ? 'Show List' : 'Show Map'}
                </button>
            </div>

            {/* 2. Main Content Split */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Left: Listings (Scrollable) */}
                <div className={`w-full md:w-[60%] lg:w-[55%] h-full overflow-y-auto bg-slate-50 p-6 ${showMapMobile ? 'hidden' : 'block'}`}>
                    <div className="max-w-[800px] mx-auto">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Properties for Sale</h1>
                                <p className="text-slate-500">{properties.length} results found in Florida</p>
                            </div>
                            <select className="text-sm border-none bg-transparent font-medium text-slate-600 focus:outline-none cursor-pointer">
                                <option>Sort by: Newest</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>

                        {properties.length === 0 ? (
                            <p className="text-center text-slate-500 py-10">No properties found.</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {properties.map(p => (
                                    <PropertyCard key={p.id} property={p} locale={locale} />
                                ))}
                            </div>
                        )}

                        <div className="py-12 text-center">
                            <button className="text-slate-900 font-bold border-b-2 border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition-colors">
                                Load More Properties
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Map (Sticky/Fixed on Desktop, Full on Mobile if toggled) */}
                <div className={`w-full md:w-[40%] lg:w-[45%] h-full border-l border-slate-200 ${showMapMobile ? 'block' : 'hidden md:block'}`}>
                    <PropertiesWebMap properties={properties} />
                </div>
            </div>
        </motion.div>
    );
}
