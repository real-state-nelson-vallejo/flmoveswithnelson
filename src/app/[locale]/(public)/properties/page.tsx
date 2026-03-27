"use client";

import { useEffect, useState, use, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PropertySearchFilter } from '@/components/property/PropertySearchFilter';
import { PropertiesWebMap } from '@/components/property/PropertiesWebMap';
import { PropertyCard } from '@/components/property/PropertyCard';
import { SaveSearchModal } from '@/components/property/SaveSearchModal';
import { PropertyDTO } from "@/types/property";
import { getPropertiesAction } from '@/actions/property/actions';
import { PropertyFilter } from '@/backend/property/domain/PropertyRepository';
import { Loader2, ChevronDown, Search, Star } from 'lucide-react';
import { motion } from "framer-motion";

export default function PropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const [properties, setProperties] = useState<PropertyDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [teaserCount, setTeaserCount] = useState<number | null>(null);
    const [teaserLoading, setTeaserLoading] = useState(false);
    const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const [showMapMobile, setShowMapMobile] = useState(false);

    const filter: PropertyFilter = useMemo(() => {
        const f: PropertyFilter = {};
        const q = searchParams.get('q');
        const zone = searchParams.get('zone');
        
        if (q) {
            f.query = q;
        } else if (zone) {
            f.query = zone.replace(/\+/g, ' ');
        }

        const minPrice = searchParams.get('minPrice');
        if (minPrice) f.minPrice = Number(minPrice);

        const maxPrice = searchParams.get('maxPrice');
        if (maxPrice) f.maxPrice = Number(maxPrice);

        const minBeds = searchParams.get('minBeds');
        if (minBeds) f.minBeds = Number(minBeds);

        const type = searchParams.get('type');
        if (type === 'sale' || type === 'rent' || type === 'land') f.type = type as any;

        const sort = searchParams.get('sort');
        if (sort === 'price_asc' || sort === 'price_desc') f.sort = sort;
        else f.sort = 'newest';

        return f;
    }, [searchParams]);

    useEffect(() => {
        const fetchProperties = async () => {
            if (properties.length === 0) setLoading(true);
            else setIsFetching(true);
            
            setTeaserCount(null);

            try {
                const res = await getPropertiesAction(filter);
                if (res.success && res.properties) {
                    setProperties(res.properties);

                    // Organic Lazy Seeding: If 0 local results, ping Bridge via OData to tease the user
                    if (res.properties.length === 0) {
                        setTeaserLoading(true);
                        try {
                            const fallbackUrl = new URL(window.location.origin + '/api/search/live-fallback');
                            fallbackUrl.search = new URLSearchParams(searchParams as any).toString();
                            
                            const fallbackRes = await fetch(fallbackUrl.toString());
                            if (fallbackRes.ok) {
                                const data = await fallbackRes.json();
                                if (data.success && data.count > 0) {
                                    setTeaserCount(data.count);
                                }
                            }
                        } catch (e) {
                            console.error("Live fallback failed", e);
                        } finally {
                            setTeaserLoading(false);
                        }
                    }
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
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-[calc(100vh-80px)] relative z-10"
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
                            <div className="text-center py-16 flex flex-col items-center justify-center max-w-lg mx-auto bg-white border border-slate-200 shadow-sm rounded-[2rem] p-8 md:p-12 my-10 relative overflow-hidden transition-all duration-500">
                                <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${teaserCount ? 'from-emerald-400 to-teal-500' : 'from-blue-500 to-indigo-500'}`} />
                                
                                {teaserLoading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="animate-spin text-blue-500 mb-6" size={40} />
                                        <h3 className="text-xl font-bold text-slate-700 animate-pulse">Scanning Global MLS...</h3>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`p-5 rounded-full mb-6 relative ${teaserCount ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <Search size={36} className="animate-pulse" />
                                            {teaserCount && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce" />}
                                        </div>
                                        
                                        {teaserCount ? (
                                            <>
                                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Great News!</h3>
                                                <p className="text-slate-600 mb-8 max-w-sm mx-auto text-[15px] leading-relaxed">
                                                    We located <strong className="text-emerald-600 text-lg">{teaserCount} active listings</strong> matching your criteria directly on the MLS. Unlock them instantly by registering for free.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Zero Active Listings</h3>
                                                <p className="text-slate-600 mb-8 max-w-sm mx-auto text-[15px] leading-relaxed">
                                                    Top properties in this specific area go under contract within hours. Save this search to get instant alerts before the public.
                                                </p>
                                            </>
                                        )}
                                        
                                        <button 
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent('open-save-search-modal', {
                                                    detail: { searchParams: searchParams.toString() }
                                                }));
                                            }}
                                            className={`w-full sm:w-auto text-white px-8 py-3.5 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${teaserCount ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                                        >
                                            <Star size={18} fill="currentColor" />
                                            {teaserCount ? 'Unlock Listings Now' : 'Be the First to Know'}
                                        </button>
                                    </>
                                )}
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

            <SaveSearchModal />
        </>
    );
}
