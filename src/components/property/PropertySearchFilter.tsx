"use client";

import { Search, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SaveSearchModal } from "./SaveSearchModal";

export function PropertySearchFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local state for inputs to avoid excessive refreshes
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') || 'any');
    const [beds, setBeds] = useState(searchParams.get('minBeds') || 'any');

    const handleSearch = (overrides?: { newQuery?: string, newPrice?: string, newBeds?: string }) => {
        const params = new URLSearchParams(searchParams);

        const currentQuery = overrides?.newQuery !== undefined ? overrides.newQuery : query;
        const currentPrice = overrides?.newPrice !== undefined ? overrides.newPrice : priceRange;
        const currentBeds = overrides?.newBeds !== undefined ? overrides.newBeds : beds;

        if (currentQuery) params.set('q', currentQuery);
        else params.delete('q');

        if (currentPrice !== 'any') {
            const [min, max] = currentPrice.split('-');
            params.set('priceRange', currentPrice);
            if (min) params.set('minPrice', min);
            if (max) params.set('maxPrice', max);
        } else {
            params.delete('priceRange');
            params.delete('minPrice');
            params.delete('maxPrice');
        }

        if (currentBeds !== 'any') {
            params.set('minBeds', currentBeds);
        } else {
            params.delete('minBeds');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] pt-3 pb-4 md:py-4 transition-all">
            <div className="container mx-auto px-4 max-w-[1400px]">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">

                    {/* Desktop Logo */}
                    <Link href="/" className="hidden md:block flex-shrink-0 hover:opacity-70 transition-opacity mr-2">
                        <img
                            src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Flogo.png?alt=media&token=e59824a2-1159-4fe7-9ea2-131c3a32ae22"
                            alt="Nelson Vallejo Logo"
                            className="h-10 w-auto object-contain"
                        />
                    </Link>

                    {/* Elegant Smart Pill */}
                    <div className="flex-1 w-full bg-white shadow-sm border border-slate-200 rounded-2xl md:rounded-full flex flex-col md:flex-row items-stretch md:items-center px-2 py-2 md:py-1.5 transition-shadow hover:shadow-md focus-within:shadow-md relative">
                        
                        {/* Query Input */}
                        <div className="flex-1 flex items-center px-4 py-1.5 md:py-0 md:border-r border-slate-200">
                            <MapPin className="text-slate-400 mr-2 flex-shrink-0" size={18} />
                            <input
                                type="text"
                                placeholder="Where to? City, neighborhood, or zip..."
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-[15px] font-medium text-slate-900 placeholder-slate-400 truncate"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>

                        {/* Inline Filters Container */}
                        <div className="flex items-center px-1 md:px-0 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <select
                                className="flex-1 md:w-auto bg-transparent border-none text-[14px] font-medium text-slate-700 focus:ring-0 cursor-pointer px-3 md:px-4 md:border-r border-slate-200 outline-none"
                                value={priceRange}
                                onChange={(e) => {
                                    setPriceRange(e.target.value);
                                    handleSearch({ newPrice: e.target.value });
                                }}
                            >
                                <option value="any">Any Price</option>
                                <option value="500000-1000000">$500k - $1M</option>
                                <option value="1000000-">Luxury ($1M+)</option>
                            </select>

                            <div className="w-[1px] h-6 bg-slate-200 md:hiddenmx-1" />

                            <select
                                className="flex-1 md:w-auto bg-transparent border-none text-[14px] font-medium text-slate-700 focus:ring-0 cursor-pointer px-3 md:px-4 outline-none"
                                value={beds}
                                onChange={(e) => {
                                    setBeds(e.target.value);
                                    handleSearch({ newBeds: e.target.value });
                                }}
                            >
                                <option value="any">Any Beds</option>
                                <option value="3">3+ Beds</option>
                                <option value="4">4+ Beds</option>
                                <option value="5">5+ Beds</option>
                            </select>
                        </div>

                        {/* Search Action */}
                        <button onClick={() => handleSearch()} className="absolute right-2 top-2 md:relative md:top-auto md:right-auto md:ml-1 bg-slate-900 hover:bg-slate-800 text-white rounded-full p-2.5 md:px-6 md:py-2.5 transition-colors flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Search size={18} />
                            <span className="hidden md:inline ml-2 font-bold text-[15px]">Search</span>
                        </button>
                    </div>

                    {/* Save Action */}
                    <div className="w-full md:w-auto mt-1 md:mt-0 flex justify-end">
                        <button 
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('open-save-search-modal', {
                                    detail: { searchParams: searchParams.toString() }
                                }));
                            }} 
                            className="w-full md:w-auto rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 py-2.5 px-6 font-semibold flex items-center justify-center gap-2 transition-all text-[15px] shadow-sm"
                        >
                            <Star size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" /> Save Search
                        </button>
                    </div>

                </div>
            </div>
            
            {/* Modal portal */}
            <SaveSearchModal />
        </div>
    );
}
