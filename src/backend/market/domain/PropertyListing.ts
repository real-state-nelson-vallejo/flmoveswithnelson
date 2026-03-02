export interface PropertyListing {
    id: string; // MLS or Source ID
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    livingArea?: number; // sqft
    propertyType: string;
    listedDate: string; // ISO Date
    listingUrl?: string; // Link to Zillow/Realtor etc if available
    images?: string[];
    features?: string[];
    yearBuilt?: number;
}
