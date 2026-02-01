"use client";

import { use } from 'react';
import { PropertySearchFilter } from '@/components/property/PropertySearchFilter';
import { PropertiesWebMap } from '@/components/property/PropertiesWebMap';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyDTO } from "@/types/property";

// MOCK DATA (Synced with HomePage & Detail)
const MOCK_PROPERTIES: PropertyDTO[] = [
    {
        id: '1',
        title: 'New Build – Geneva Landings, Davenport',
        description: 'Under construction. One-story new build with 2,029 sq.ft, 4 bedrooms and 2.5 baths.',
        price: { amount: 390560, currency: 'USD' },
        location: { address: '1449 FLEUR Drive', city: 'Davenport, FL', country: 'USA', zip: '33837' },
        specs: { beds: 4, baths: 3, area: 2029, areaUnit: 'sqft', yearBuilt: 2025 },
        features: ['Granite Kitchen', 'Samsung SS Appliances', '2-car garage', 'Central Air'],
        images: ['https://images.unsplash.com/photo-1583608205776-bfd35f0d9f8e?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: '2',
        title: 'Modern Villa – Miami Shores',
        description: 'Stunning modern villa with pool and private dock.',
        price: { amount: 2500000, currency: 'USD' },
        location: { address: '890 Ocean Blvd', city: 'Miami', country: 'USA' },
        specs: { beds: 5, baths: 4, area: 4500, areaUnit: 'sqft' },
        features: ['Pool', 'Dock', 'Smart Home'],
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: '3',
        title: 'Downtown Loft',
        description: 'Industrial chic loft.',
        price: { amount: 850000, currency: 'USD' },
        location: { address: '45 Broad St', city: 'New York', country: 'USA' },
        specs: { beds: 2, baths: 2, area: 1400, areaUnit: 'sqft' },
        features: ['High Ceilings', 'Exposed Brick'],
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: '4',
        title: 'Suburban Family Home',
        description: 'Perfect for families.',
        price: { amount: 450000, currency: 'USD' },
        location: { address: '123 Maple Dr', city: 'Orlando', country: 'USA' },
        specs: { beds: 3, baths: 2, area: 1800, areaUnit: 'sqft' },
        features: ['Backyard', 'Garage'],
        images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: '5',
        title: 'Luxury Penthouse',
        description: 'Top of the world views.',
        price: { amount: 5200000, currency: 'USD' },
        location: { address: '101 Sky Tower', city: 'Miami', country: 'USA' },
        specs: { beds: 4, baths: 5, area: 6000, areaUnit: 'sqft' },
        features: ['Panoramic Views', 'Private Elevator'],
        images: ['https://images.unsplash.com/photo-1600596542815-2a4d9f6facb8?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        createdAt: Date.now(),
        updatedAt: Date.now()
    }
];

export default function PropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);

    return (
        <div className="flex flex-col h-[calc(100vh-80px)]"> {/* Adjust height based on navbar */}

            {/* 1. Header with Search & Filter */}
            <PropertySearchFilter />

            {/* 2. Main Content Split */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left: Listings (Scrollable) */}
                <div className="w-full md:w-[60%] lg:w-[55%] h-full overflow-y-auto bg-slate-50 p-6">
                    <div className="max-w-[800px] mx-auto">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Properties for Sale</h1>
                                <p className="text-slate-500">{MOCK_PROPERTIES.length} results found in Florida</p>
                            </div>
                            <select className="text-sm border-none bg-transparent font-medium text-slate-600 focus:outline-none cursor-pointer">
                                <option>Sort by: Newest</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {MOCK_PROPERTIES.map(p => (
                                <PropertyCard key={p.id} property={p} locale={locale} />
                            ))}
                        </div>

                        <div className="py-12 text-center">
                            <button className="text-slate-900 font-bold border-b-2 border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition-colors">
                                Load More Properties
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Map (Sticky/Fixed) */}
                <div className="hidden md:block w-[40%] lg:w-[45%] h-full border-l border-slate-200">
                    <PropertiesWebMap />
                </div>
            </div>
        </div>
    );
}
