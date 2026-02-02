export interface PropertyDTO {
    id: string;
    slug?: string;
    title: string;
    description: string;
    videoUrl?: string; // Standard video (YouTube/Vimeo)
    virtualTourUrl?: string; // 3D Tour (Matterport, etc.)
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
    status: 'available' | 'sold' | 'reserved';
    createdAt: number;
    updatedAt: number;
}
