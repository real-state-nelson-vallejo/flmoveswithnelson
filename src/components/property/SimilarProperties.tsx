"use client";

import { PropertyDTO } from "@/types/property";
import { PropertyCard } from "./PropertyCard";

interface SimilarPropertiesProps {
    currentId: string;
    locale: string;
}

export function SimilarProperties({ currentId, locale }: SimilarPropertiesProps) {
    // MOCK DATA: Similar Properties
    const SIMILAR_PROPERTIES: PropertyDTO[] = [
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
        // Duplicate for grid
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
        }
    ];

    return (
        <section className="mt-16 pt-16 border-t border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {SIMILAR_PROPERTIES.filter(p => p.id !== currentId).slice(0, 3).map(p => (
                    <PropertyCard key={p.id} property={p} locale={locale} />
                ))}
            </div>
        </section>
    );
}
