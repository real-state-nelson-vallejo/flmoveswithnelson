export interface PropertyPersistenceModel {
    ListingKey: string;
    ListingId?: string;
    slug?: string;
    
    // Status & Type
    StandardStatus: string;
    PropertyType: string;
    PropertySubType?: string;
    
    // Pricing
    ListPrice: number;
    ClosePrice?: number;
    AssociationFee?: number;
    
    // Specs
    BedroomsTotal: number;
    BathroomsTotalInteger: number;
    LivingArea: number; // sqft
    LotSizeAcres?: number;
    YearBuilt?: number;
    
    // Location
    UnparsedAddress: string;
    City: string;
    StateOrProvince?: string;
    PostalCode?: string;
    Latitude?: number;
    Longitude?: number;
    
    // Advanced RESO Specifications
    HOAFee?: number;
    TaxAnnualAmount?: number;
    PoolPrivateYN?: boolean;
    WaterfrontYN?: boolean;
    Cooling?: string[];
    Heating?: string[];
    Appliances?: string[];
    GarageSpaces?: number;
    DaysOnMarket?: number;
    ArchitecturalStyle?: string[];
    View?: string[];
    AssociationAmenities?: string[];
    
    // Media & Remarks
    Media: string[]; 
    PublicRemarks: string;
    
    // Extras
    videoUrl?: string; 
    virtualTourUrl?: string; 
    agentId?: string;
    views?: number;
    petsAllowed?: boolean;
    
    // AI & Market Analysis Fields
    opportunityScore?: number; 
    listingQualityScore?: number; 
    marketStatus?: 'normal' | 'distressed' | 'price_drop' | 'back_on_market';
    investmentAnalysis?: {
        cashFlow?: number;
        description?: string;
    };
    createdAt: number; // Timestamp
    updatedAt: number; // Timestamp
}
