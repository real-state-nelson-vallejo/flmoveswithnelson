"use client";

import { use } from 'react';
import { PropertyDTO } from "@/types/property";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertySidebar } from "@/components/property/PropertySidebar";
import { PropertyMap } from "@/components/property/PropertyMap";
import { SimilarProperties } from "@/components/property/SimilarProperties";
import { PropertyPagination } from "@/components/property/PropertyPagination";
import { MapPin, Calendar, Bed, Bath, Square, CheckCircle } from "lucide-react";
import Link from 'next/link';

// MOCK DATA (Synced with HomePage)
const MOCK_PROPERTY: PropertyDTO = {
    id: '1',
    title: 'New Build – Geneva Landings, Davenport',
    description: 'Under construction. One-story new build with 2,029 sq.ft, 4 bedrooms and 2.5 baths. Open living area and an open kitchen with granite countertops, Samsung stainless-steel appliances, pantry, and a counter-height island that opens to the café and gathering room.\n\nLuxury wood-look vinyl plank in living, laundry and baths; stain-resistant carpet in bedrooms. 2-car garage, 0.14-acre lot. Community: Geneva Landings (Polk County). Year 2025. HOA $150/year. Heating Central; Central Air.',
    price: { amount: 390560, currency: 'USD' },
    location: { address: '1449 FLEUR Drive', city: 'Davenport, FL', country: 'USA', zip: '33837' },
    specs: {
        beds: 4,
        baths: 3,
        area: 2029,
        areaUnit: 'sqft',
        lotSize: 0.14,
        lotUnit: 'acres',
        yearBuilt: 2025
    },
    hoa: { amount: 150, period: 'yearly' },
    features: ['Granite Kitchen', 'Samsung SS Appliances', '2-car garage', 'Luxury vinyl plank', 'Central Air', 'Open Floor Plan', 'Pantry', 'Community Pool'],
    images: [
        'https://images.unsplash.com/photo-1600596542815-2a4d9f6facb8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1626178793926-22b28830aa30?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80'
    ],
    type: 'sale',
    status: 'available',
    createdAt: Date.now(),
    updatedAt: Date.now()
};

export default function PropertyDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale } = use(params);
    const property = MOCK_PROPERTY;

    return (
        <main className="container mx-auto px-4 py-8 max-w-[1400px]">
            {/* Breadcrumb / Back */}
            <div className="mb-6 flex justify-between items-center">
                <Link href={`/${locale}/properties`} className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                    ← Back to Properties
                </Link>
                <div className="text-sm text-slate-400">
                    Home / Properties / {property.title}
                </div>
            </div>

            {/* Gallery */}
            <PropertyGallery images={property.images} />

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Left Content (2/3) */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 uppercase leading-tight mb-4">
                            {property.title}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-slate-500 font-medium">
                            <span className="flex items-center gap-2"><MapPin size={18} /> {property.location.address}, {property.location.zip}</span>
                            <span className="flex items-center gap-2"><Calendar size={18} /> Built {property.specs.yearBuilt}</span>
                        </div>
                    </div>

                    {/* Key Specs */}
                    <div className="flex gap-8 py-6 border-y border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Bed size={24} className="text-slate-400" /> {property.specs.beds}</span>
                            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider mt-1">Bedrooms</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Bath size={24} className="text-slate-400" /> {property.specs.baths}</span>
                            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider mt-1">Bathrooms</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Square size={24} className="text-slate-400" /> {property.specs.area.toLocaleString()}</span>
                            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider mt-1">Sq Ft</span>
                        </div>
                    </div>

                    {/* Overview */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Overview</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                            {property.description}
                        </p>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {property.features.map(f => (
                                <div key={f} className="flex items-center gap-3 text-slate-700">
                                    <CheckCircle size={20} className="text-emerald-500" />
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Location</h3>
                        <PropertyMap address={`${property.location.address}, ${property.location.city}, ${property.location.zip}`} />
                    </div>

                </div>

                {/* Right Sidebar (1/3) */}
                <div className="lg:col-span-1">
                    <PropertySidebar property={property} />
                </div>
            </div>

            {/* Helper Navigation */}
            <PropertyPagination locale={locale} />

            {/* Similar Properties */}
            <SimilarProperties currentId={property.id} locale={locale} />

        </main>
    );
}
