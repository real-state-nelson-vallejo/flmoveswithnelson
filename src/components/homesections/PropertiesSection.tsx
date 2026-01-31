"use client";

import { PropertyCard } from '@/components/property/PropertyCard';
import { Property } from '@/backend/property/domain/Property';

const MOCK_PROPERTIES: Property[] = [
    {
        id: '1',
        title: 'New Build – Geneva Landings, Davenport',
        description: 'Under construction. One-story new build with 2,029 sq.ft, 4 bedrooms and 2.5 baths. Open living area and an open kitchen with granite countertops, Samsung stainless-steel appliances, pantry, and a counter-height island that opens to the café and gathering room.',
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
        features: ['Granite Kitchen', 'Samsung SS Appliances', '2-car garage', 'Luxury vinyl plank'],
        images: ['https://images.unsplash.com/photo-1583608205776-bfd35f0d9f8e?auto=format&fit=crop&w=800&q=80'], // Looks like the new build house
        type: 'sale',
        status: 'available',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '2',
        title: 'Modern Villa – Miami Shores',
        description: 'Stunning modern villa with pool and private dock.',
        price: { amount: 2500000, currency: 'USD' },
        location: { address: '890 Ocean Blvd', city: 'Miami', country: 'USA' },
        specs: {
            beds: 5,
            baths: 4,
            area: 4500,
            areaUnit: 'sqft'
        },
        features: ['Pool', 'Dock', 'Smart Home'],
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '3',
        title: 'Downtown Loft',
        description: 'Industrial chic loft.',
        price: { amount: 850000, currency: 'USD' },
        location: { address: '45 Broad St', city: 'New York', country: 'USA' },
        specs: {
            beds: 2,
            baths: 2,
            area: 1400,
            areaUnit: 'sqft'
        },
        features: ['High Ceilings', 'Exposed Brick'],
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

interface PropertiesSectionProps {
    locale: string;
}

export function PropertiesSection({ locale }: PropertiesSectionProps) {
    return (
        <section className="container" style={{ padding: 'var(--spacing-xl) var(--spacing-sm)' }}>
            <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase', color: '#0f172a' }}>
                    Featured Listings
                </h2>
                <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Explore our handpicked selection of premium properties.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '3rem'
            }}>
                {MOCK_PROPERTIES.map(p => (
                    <PropertyCard key={p.id} property={p} locale={locale} />
                ))}
            </div>
        </section>
    );
}
