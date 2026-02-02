import { NextResponse } from "next/server";
import { FirestorePropertyRepository } from "@/backend/property/infrastructure/FirestorePropertyRepository";
import { Property, PropertyProps } from "@/backend/property/domain/Property";
import { PropertyDTO } from "@/types/property";

// Mock data without IDs (they will be generated)
const MOCK_DATA: Partial<PropertyDTO>[] = [
    {
        title: 'Modern Villa – Miami Shores',
        slug: 'modern-villa-miami-shores',
        description: 'Stunning modern villa with pool and private dock. Features open concept living, high ceilings, and floor-to-ceiling windows.',
        price: { amount: 2500000, currency: 'USD' },
        location: {
            address: '890 Ocean Blvd', city: 'Miami', country: 'USA', state: 'FL', zip: '33138',
            coordinates: { lat: 25.86, lng: -80.18 }
        },
        specs: { beds: 5, baths: 4, area: 4500, areaUnit: 'sqft', lotSize: 0.25, lotUnit: 'acres', yearBuilt: 2021 },
        features: ['Pool', 'Dock', 'Smart Home', 'Waterfront', 'Summer Kitchen'],
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        agentId: 'admin',
        views: 230,
        videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
        title: 'Downtown Loft – Brickell',
        slug: 'downtown-loft-brickell',
        description: 'Industrial chic loft in the heart of Brickell. Walking distance to best restaurants and shops.',
        price: { amount: 850000, currency: 'USD' },
        location: {
            address: '45 Broad St', city: 'Miami', country: 'USA', state: 'FL', zip: '33131',
            coordinates: { lat: 25.76, lng: -80.19 }
        },
        specs: { beds: 2, baths: 2, area: 1400, areaUnit: 'sqft', yearBuilt: 2018 },
        features: ['High Ceilings', 'Exposed Brick', 'City Views', 'Gym', 'Concierge'],
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        agentId: 'admin',
        views: 89
    },
    {
        title: 'Cozy Family Home – Coral Gables',
        slug: 'cozy-family-home-coral-gables',
        description: 'Charming 4-bedroom home in a quiet neighborhood. Lush garden and recently renovated kitchen.',
        price: { amount: 1200000, currency: 'USD' },
        location: {
            address: '12 Sunset Dr', city: 'Coral Gables', country: 'USA', state: 'FL', zip: '33146',
            coordinates: { lat: 25.72, lng: -80.26 }
        },
        specs: { beds: 4, baths: 3, area: 2800, areaUnit: 'sqft', lotSize: 0.3, lotUnit: 'acres', yearBuilt: 1995 },
        features: ['Garden', 'Renovated Kitchen', 'Garage', 'Fireplace'],
        images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        agentId: 'admin',
        views: 45
    },
    {
        title: 'Luxury Penthouse – Sunny Isles',
        slug: 'luxury-penthouse-sunny-isles',
        description: 'Breathtaking ocean views from this 50th floor penthouse. Private elevator and rooftop terrace.',
        price: { amount: 5500000, currency: 'USD' },
        location: {
            address: '100 Collins Ave', city: 'Sunny Isles Beach', country: 'USA', state: 'FL', zip: '33160',
            coordinates: { lat: 25.94, lng: -80.12 }
        },
        specs: { beds: 4, baths: 5, area: 6000, areaUnit: 'sqft', yearBuilt: 2023 },
        features: ['Ocean View', 'Private Elevator', 'Rooftop Terrace', 'Spa', 'Valet'],
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        agentId: 'admin',
        views: 540
    },
    {
        title: 'Starter Home – Orlando',
        slug: 'starter-home-orlando',
        description: 'Perfect starter home near theme parks. Community pool and playground.',
        price: { amount: 420000, currency: 'USD' },
        location: {
            address: '77 Disney Way', city: 'Orlando', country: 'USA', state: 'FL', zip: '32830',
            coordinates: { lat: 28.38, lng: -81.56 }
        },
        specs: { beds: 3, baths: 2, area: 1800, areaUnit: 'sqft', yearBuilt: 2010 },
        features: ['Community Pool', 'Near Parks', 'Low HOA'],
        images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        agentId: 'admin',
        views: 112
    },
    {
        title: 'Beachfront Condo – Fort Lauderdale',
        slug: 'beachfront-condo-fort-lauderdale',
        description: 'Direct ocean access condo. Wake up to the sunrise over the Atlantic.',
        price: { amount: 650000, currency: 'USD' },
        location: {
            address: '500 A1A', city: 'Fort Lauderdale', country: 'USA', state: 'FL', zip: '33301',
            coordinates: { lat: 26.12, lng: -80.10 }
        },
        specs: { beds: 2, baths: 2, area: 1200, areaUnit: 'sqft', yearBuilt: 2005 },
        features: ['Ocean Front', 'Balcony', 'Pool', 'Gym'],
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'sold',
        agentId: 'admin',
        views: 300
    },
    {
        title: 'Spacious Estate – Weston',
        slug: 'spacious-estate-weston',
        description: 'Massive estate in gated community. Top rated schools and excellent security.',
        price: { amount: 1800000, currency: 'USD' },
        location: {
            address: '22 Royal Palm Blvd', city: 'Weston', country: 'USA', state: 'FL', zip: '33327',
            coordinates: { lat: 26.10, lng: -80.40 }
        },
        specs: { beds: 6, baths: 5, area: 5500, areaUnit: 'sqft', lotSize: 0.5, lotUnit: 'acres', yearBuilt: 2015 },
        features: ['Gated Community', 'Lake View', 'Home Theater', '3-Car Garage'],
        images: ['https://images.unsplash.com/photo-1600596542815-2a4fa2fa02fa?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        agentId: 'admin',
        views: 75
    },
    {
        title: 'Investment Duplex – Wynwood',
        slug: 'investment-duplex-wynwood',
        description: 'Great investment opportunity in the arts district. Two 2/1 units fully rented.',
        price: { amount: 950000, currency: 'USD' },
        location: {
            address: '25 NW 2nd Ave', city: 'Miami', country: 'USA', state: 'FL', zip: '33127',
            coordinates: { lat: 25.80, lng: -80.20 }
        },
        specs: { beds: 4, baths: 2, area: 2200, areaUnit: 'sqft', yearBuilt: 1980 },
        features: ['Income Producing', 'Art District', 'Walkable'],
        images: ['https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'reserved',
        agentId: 'admin',
        views: 210
    },
    {
        title: 'Lakefront Cabin – Winter Park',
        slug: 'lakefront-cabin-winter-park',
        description: 'Rustic charm meets modern luxury. Private boat dock on chain of lakes.',
        price: { amount: 1100000, currency: 'USD' },
        location: {
            address: '88 Lake Dr', city: 'Winter Park', country: 'USA', state: 'FL', zip: '32789',
            coordinates: { lat: 28.60, lng: -81.35 }
        },
        specs: { beds: 3, baths: 2, area: 2400, areaUnit: 'sqft', lotSize: 1, lotUnit: 'acres', yearBuilt: 1990 },
        features: ['Lakefront', 'Boat Dock', 'Wrap-around Porch'],
        images: ['https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        agentId: 'admin',
        views: 180
    },
    {
        title: 'Luxury Rental – Key Biscayne',
        slug: 'luxury-rental-key-biscayne',
        description: 'Exclusive island living. Fully furnished seasonal rental with beach access.',
        price: { amount: 15000, currency: 'USD' },
        location: {
            address: '55 Ocean Dr', city: 'Key Biscayne', country: 'USA', state: 'FL', zip: '33149',
            coordinates: { lat: 25.69, lng: -80.16 }
        },
        specs: { beds: 3, baths: 3, area: 2000, areaUnit: 'sqft', yearBuilt: 2019 },
        features: ['Beach Access', 'Furnished', 'Tennis Courts'],
        images: ['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=800&q=80'],
        type: 'sale',
        status: 'available',
        agentId: 'admin',
        views: 400
    }
];

export async function GET() {
    try {
        const repo = new FirestorePropertyRepository();
        let migratedCount = 0;

        for (const data of MOCK_DATA) {
            // Use Property.create to generate a fresh UUID and timestamp
            // We cast data to unknown then to the expected type because MOCK_DATA is Partial<PropertyDTO>
            // but we know it matches the shape required for creation in this context.
            console.log(`Migrating property: ${data.title}`);
            const property = Property.create(data as unknown as Omit<PropertyProps, 'id' | 'createdAt' | 'updatedAt'>);
            await repo.save(property);
            migratedCount++;
        }

        console.log(`Migration completed. Count: ${migratedCount}`);

        return NextResponse.json({
            success: true,
            message: `Successfully migrated ${migratedCount} properties to Firestore with new UUIDs.`
        });
    } catch (error) {
        console.error("Migration failed FATAL:", error);
        if (error instanceof Error) {
            console.error("Error stack:", error.stack);
        }
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
