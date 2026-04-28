export interface PropertyDTO {
    ListingKey: string;
    ListingId?: string;
    slug?: string;
    
    StandardStatus: string;
    PropertyType: string;
    PropertySubType?: string;
    
    ListPrice: number;
    ClosePrice?: number;
    AssociationFee?: number;
    
    BedroomsTotal: number;
    BathroomsTotalInteger: number;
    LivingArea: number; // sqft
    LotSizeAcres?: number;
    YearBuilt?: number;
    
    UnparsedAddress: string;
    City: string;
    StateOrProvince?: string;
    PostalCode?: string;
    Latitude?: number;
    Longitude?: number;
    
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
    
    Media: string[]; 
    ExteriorFeatures?: string[];
    PublicRemarks: string;
    
    videoUrl?: string; 
    virtualTourUrl?: string; 
    agentId?: string;
    views?: number;
    petsAllowed?: boolean;

    ListAgentMlsId?: string;
    ListOfficeMlsId?: string;
    
    opportunityScore?: number; 
    listingQualityScore?: number; 
    marketStatus?: 'normal' | 'distressed' | 'price_drop' | 'back_on_market';
    investmentAnalysis?: {
        cashFlow?: number;
        roi?: number;
        capRate?: number;
        description?: string;
    };

    // Editorial (Fase 4) — home sections + curator audit
    homeSections?: Array<'featured' | 'luxury' | 'waterfront' | 'new-today' | 'investor-deals'>;
    editorialNotes?: string;
    curatedAt?: number;
    curatedBy?: string;

    // Archive flag (Fase 6)
    archived?: boolean;
    archivedAt?: number;

    // Deprecated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rentCastData?: any;

    createdAt: number;
    updatedAt: number;
}
