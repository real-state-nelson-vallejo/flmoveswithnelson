"use client";

import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PropertySearchFilter() {
    return (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm py-4">
            <div className="container mx-auto px-4 max-w-[1400px]">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Search Inputs Group */}
                    <div className="flex-1 flex flex-col md:flex-row gap-2 w-full">
                        <div className="relative flex-grow">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Location, City, or Zip"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:w-[300px]">
                            <select className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none cursor-pointer">
                                <option>Price (Any)</option>
                                <option>$500k - $1M</option>
                                <option>$1M+</option>
                            </select>
                            <select className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none cursor-pointer">
                                <option>Beds (Any)</option>
                                <option>3+ Beds</option>
                                <option>4+ Beds</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <SlidersHorizontal size={18} />
                            <span>Filters</span>
                        </button>
                        <Button className="flex-1 md:w-auto flex items-center justify-center gap-2">
                            <Search size={18} />
                            Search
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
