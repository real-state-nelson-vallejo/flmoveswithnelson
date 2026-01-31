export interface Money {
    amount: number;
    currency: string;
}

export interface Property {
    id: string;
    title: string;
    description: string;
    price: Money;
    location: {
        address: string;
        city: string;
        country: string;
        state?: string;
        zip?: string;
    };
    specs: {
        beds: number;
        baths: number;
        area: number; // sqft or m2
        areaUnit: 'sqft' | 'm2';
        lotSize?: number;
        lotUnit?: 'acres' | 'm2';
        yearBuilt?: number;
    };
    hoa?: {
        amount: number;
        period: 'monthly' | 'yearly';
    };
    features: string[]; // List of strings like 'Pool', 'Garage'
    images: string[];
    type: 'sale' | 'rent';
    status: 'available' | 'sold' | 'reserved';
    createdAt: Date;
    updatedAt: Date;
}
