export interface BridgeAPIClientOptions {
    top?: number;
    skip?: number;
    filter?: string;
    expand?: string;
    select?: string;
}

export interface BridgeMedia {
    MediaURL?: string;
    MediaCategory?: string;
    Order?: number;
}

export interface BridgePropertyPayload {
    ListingKey: string;
    ListingId: string;
    ListPrice?: number;
    ClosePrice?: number;
    StandardStatus?: string;
    PropertyType?: string;
    PropertySubType?: string;
    PublicRemarks?: string;
    BedroomsTotal?: number;
    BathroomsTotalInteger?: number;
    LivingArea?: number;
    BuildingAreaTotal?: number;
    LotSizeAcres?: number;
    YearBuilt?: number;
    UnparsedAddress?: string;
    City?: string;
    StateOrProvince?: string;
    PostalCode?: string;
    Latitude?: number;
    Longitude?: number;
    AssociationFee?: number;
    Media?: BridgeMedia[];
    ModificationTimestamp?: string;
    
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
    
    [key: string]: any; // Catch-all for other RESO fields
}
