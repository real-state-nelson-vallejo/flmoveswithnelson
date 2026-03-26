"use client";

import { useEffect, useState, use, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PropertySearchFilter } from '@/components/property/PropertySearchFilter';
import { PropertiesWebMap } from '@/components/property/PropertiesWebMap';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyDTO } from "@/types/property";
import { getPropertiesAction } from '@/actions/property/actions';
import { PropertyFilter } from '@/backend/property/domain/PropertyRepository';
import { Loader2, ChevronDown } from 'lucide-react';
import { motion } from "framer-motion";

export default function PropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const [properties, setProperties] = useState<PropertyDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);

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
        if (type === 'sale' || type === 'Residential Lease') f.type = type as 'sale' | 'rent';

        const sort = searchParams.get('sort');
        if (sort === 'price_asc' || sort === 'price_desc') f.sort = sort;
        else f.sort = 'newest';

        return f;
    }, [searchParams]);

    useEffect(() => {
        const fetchProperties = async () => {
            if (properties.length === 0) setLoading(true);
            else setIsFetching(true);

            try {
                const res = await getPropertiesAction(filter);
                if (res.success && res.properties) {
                    setProperties(res.properties);
                }
            } catch (error) {
                console.error("Failed to fetch properties:", error);
            } finally {
                setLoading(false);
                setIsFetching(false);
            }
        };

        fetchProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Real Estate & Homes</h1>
                                <p className="text-slate-500 mt-1">{properties.length} active listings waiting for you</p>
                            </div>
                            <div className="relative">
                                <button 
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="text-sm bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer shadow-sm flex items-center justify-between min-w-[190px]"
                                >
                                    {searchParams.get('sort') === 'price_asc' ? 'Price: Low to High' : searchParams.get('sort') === 'price_desc' ? 'Price: High to Low' : 'Sort Default (Newest)'}
                                    <ChevronDown size={16} className={`transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isSortOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-full sm:w-[220px] bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden z-50 py-1">
                                            {[
                                                { value: 'newest', label: 'Sort Default (Newest)' },
                                                { value: 'price_asc', label: 'Price: Low to High' },
                                                { value: 'price_desc', label: 'Price: High to Low' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.set('sort', opt.value);
                                                        router.push(`${pathname}?${params.toString()}`);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 ${
                                                        (searchParams.get('sort') || 'newest') === opt.value 
                                                            ? 'font-bold text-blue-600 bg-blue-50/50' 
                                                            : 'text-slate-600 font-medium'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {properties.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center justify-center">
                                <div className="p-4 bg-slate-100 rounded-full mb-4">
                                    <Loader2 className="text-slate-400 animate-pulse" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">No homes match your search</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Try zooming out on the map or modifying your filters to see more results.</p>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-10 transition-opacity duration-300 relative ${isFetching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                {isFetching && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <Loader2 className="animate-spin text-blue-500" size={32} />
                                    </div>
                                )}
                                {properties.map(p => (
                                    <PropertyCard
                                        key={p.ListingKey}
                                        property={p}
                                        locale={locale}
                                        onHover={(isHovered) => setHoveredPropertyId(isHovered ? p.ListingKey : null)}
                                    />
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
                    <PropertiesWebMap properties={properties} hoveredPropertyId={hoveredPropertyId} />
                </div>
            </div>
        </motion.div>
    );
}
