"use client";

import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

export function PropertySearchFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local state for inputs to avoid excessive refreshes
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') || 'any');
    const [beds, setBeds] = useState(searchParams.get('minBeds') || 'any');

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams);

        if (query) params.set('q', query);
        else params.delete('q');

        if (priceRange !== 'any') {
            const [min, max] = priceRange.split('-');
            params.set('priceRange', priceRange);
            if (min) params.set('minPrice', min);
            if (max) params.set('maxPrice', max);
        } else {
            params.delete('priceRange');
            params.delete('minPrice');
            params.delete('maxPrice');
        }

        if (beds !== 'any') {
            params.set('minBeds', beds);
        } else {
            params.delete('minBeds');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm py-4">
            <div className="container mx-auto px-4 max-w-[1400px]">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Home Link & Search Inputs Group */}
                    <div className="flex-1 flex flex-col md:flex-row gap-4 w-full items-center">
                        <Link href="/" className="text-slate-900 font-bold uppercase tracking-widest text-sm whitespace-nowrap hover:opacity-70 transition-opacity">
                            Nelson Vallejo
                        </Link>
                        <div className="flex-1 flex flex-col md:flex-row gap-2 w-full">
                            <div className="relative flex-grow">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Location, City, or Zip"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:w-[300px]">
                                <select
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none cursor-pointer"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(e.target.value)}
                                >
                                    <option value="any">Price (Any)</option>
                                    <option value="500000-1000000">$500k - $1M</option>
                                    <option value="1000000-">$1M+</option>
                                </select>
                                <select
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none cursor-pointer"
                                    value={beds}
                                    onChange={(e) => setBeds(e.target.value)}
                                >
                                    <option value="any">Beds (Any)</option>
                                    <option value="3">3+ Beds</option>
                                    <option value="4">4+ Beds</option>
                                    <option value="5">5+ Beds</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full md:w-auto">
                        {/* <button className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <SlidersHorizontal size={18} />
                            <span>Filters</span>
                        </button> */}
                        <Button onClick={handleSearch} className="flex-1 md:w-auto flex items-center justify-center gap-2">
                            <Search size={18} />
                            Search
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
