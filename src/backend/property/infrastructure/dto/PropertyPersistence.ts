export interface PropertyPersistenceModel {
    id: string;
    slug?: string;
    title: string;
    description: string;
    videoUrl?: string;
    virtualTourUrl?: string;
    agentId?: string;
    views?: number;
    price: {
        amount: number;
        currency: string;
    };
    location: {
        address: string;
        city: string;
        country: string;
        state?: string | undefined;
        zip?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    specs: {
        beds: number;
        baths: number;
        area: number;
        areaUnit: 'sqft' | 'm2';
        lotSize?: number | undefined;
        lotUnit?: 'acres' | 'm2' | undefined;
        yearBuilt?: number | undefined;
    };
    hoa?: {
        amount: number;
        period: 'monthly' | 'yearly';
    } | undefined;
    features: string[];
    images: string[];
    type: 'sale' | 'rent';
    propertyType?: 'Single Family' | 'Condominium' | 'Mobile Home' | 'Townhome' | 'Villa' | 'Multifamily';
    status: 'available' | 'sold' | 'reserved';
    petsAllowed?: boolean;
    // AI & Market Analysis Fields
    opportunityScore?: number;
    listingQualityScore?: number;
    marketStatus?: 'normal' | 'distressed' | 'price_drop' | 'back_on_market';
    investmentAnalysis?: {
        cashFlow?: number;
        roi?: number;
        capRate?: number;
        description?: string;
    };
    createdAt: number; // Timestamp
    updatedAt: number; // Timestamp
}
