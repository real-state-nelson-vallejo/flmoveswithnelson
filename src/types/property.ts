export interface PropertyDTO {
    id: string;
    title: string;
    description: string;
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
