import { PropertyDTO } from "../infrastructure/dto/PropertyDTO";
import { PropertyPersistenceModel } from "../infrastructure/dto/PropertyPersistence";
import crypto from 'crypto';
import { serializeFirestoreData } from "@/lib/utils";

export const HOME_SECTIONS = ['featured', 'luxury', 'waterfront', 'new-today', 'investor-deals'] as const;
export type HomeSection = typeof HOME_SECTIONS[number];

export interface PropertyProps {
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
    LivingArea: number; 
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
        description?: string;
    };

    // Editorial tagging — curated by the agent in the dashboard.
    // Feeds the home sections (featured, luxury, waterfront, new-today, investor-deals).
    homeSections?: HomeSection[];
    editorialNotes?: string;
    curatedAt?: Date;
    curatedBy?: string;

    // Archive flag — set by the sync worker when a listing leaves `Active` in Bridge.
    archived?: boolean;
    archivedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

export class Property {
    private constructor(private readonly props: PropertyProps) { }

    static create(data: Omit<PropertyProps, 'createdAt' | 'updatedAt'> & { ListingKey?: string }): Property {
        const now = new Date();
        const baseSlug = data.slug || data.UnparsedAddress?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'property';
        const generatedSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

        return new Property({
            ...data,
            ListingKey: data.ListingKey || crypto.randomUUID(), 
            slug: generatedSlug,
            createdAt: now,
            updatedAt: now
        });
    }

    static fromPersistence(data: any): Property {
        return new Property({
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            curatedAt: data.curatedAt ? new Date(data.curatedAt) : undefined,
            archivedAt: data.archivedAt ? new Date(data.archivedAt) : undefined,
        });
    }

    toPersistence(): PropertyPersistenceModel {
        // Build without spreading Date-typed curatedAt/archivedAt (persistence wants numbers).
        const { curatedAt, archivedAt, ...rest } = this.props;
        const base: PropertyPersistenceModel = {
            ...rest,
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime(),
        };
        if (curatedAt) base.curatedAt = curatedAt.getTime();
        if (archivedAt) base.archivedAt = archivedAt.getTime();
        return base;
    }

    toDTO(): PropertyDTO {
        const { curatedAt, archivedAt, ...rest } = this.props;
        const base: PropertyDTO = {
            ...rest,
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime(),
        } as PropertyDTO;
        if (curatedAt) base.curatedAt = curatedAt.getTime();
        if (archivedAt) base.archivedAt = archivedAt.getTime();
        return base;
    }

    // Alias for old ID usage to prevent breaking infrastructure repos suddenly
    get id() { return this.props.ListingKey; } 
    // And alias for fetching externalId from SyncBridgeProperties
    get externalId() { return this.props.ListingKey; }

    get ListingKey() { return this.props.ListingKey; }
    get slug() { return this.props.slug; }
    get StandardStatus() { return this.props.StandardStatus; }
    get PropertyType() { return this.props.PropertyType; }
    get ListPrice() { return this.props.ListPrice; }
    get BedroomsTotal() { return this.props.BedroomsTotal; }
    get BathroomsTotalInteger() { return this.props.BathroomsTotalInteger; }
    get LivingArea() { return this.props.LivingArea; }
    get UnparsedAddress() { return this.props.UnparsedAddress; }
    get City() { return this.props.City; }
    get StateOrProvince() { return this.props.StateOrProvince; }
    get PostalCode() { return this.props.PostalCode; }
    get Latitude() { return this.props.Latitude; }
    get Longitude() { return this.props.Longitude; }
    get Media() { return [...this.props.Media]; }
    get PublicRemarks() { return this.props.PublicRemarks; }
    get PropertySubType() { return this.props.PropertySubType; }
    get ClosePrice() { return this.props.ClosePrice; }
    get AssociationFee() { return this.props.AssociationFee; }
    get LotSizeAcres() { return this.props.LotSizeAcres; }
    get YearBuilt() { return this.props.YearBuilt; }

    get HOAFee() { return this.props.HOAFee; }
    get TaxAnnualAmount() { return this.props.TaxAnnualAmount; }
    get PoolPrivateYN() { return this.props.PoolPrivateYN; }
    get WaterfrontYN() { return this.props.WaterfrontYN; }
    get Cooling() { return this.props.Cooling; }
    get Heating() { return this.props.Heating; }
    get Appliances() { return this.props.Appliances; }
    get GarageSpaces() { return this.props.GarageSpaces; }
    get DaysOnMarket() { return this.props.DaysOnMarket; }
    get ArchitecturalStyle() { return this.props.ArchitecturalStyle; }
    get View() { return this.props.View; }
    get AssociationAmenities() { return this.props.AssociationAmenities; }
    get ListAgentMlsId() { return this.props.ListAgentMlsId; }
    get ListOfficeMlsId() { return this.props.ListOfficeMlsId; }

    get opportunityScore() { return this.props.opportunityScore; }
    get listingQualityScore() { return this.props.listingQualityScore; }
    get marketStatus() { return this.props.marketStatus; }
    get investmentAnalysis() { return this.props.investmentAnalysis ? { ...this.props.investmentAnalysis } : undefined; }

    get homeSections(): HomeSection[] { return this.props.homeSections ? [...this.props.homeSections] : []; }
    get editorialNotes() { return this.props.editorialNotes; }
    get curatedAt() { return this.props.curatedAt; }
    get curatedBy() { return this.props.curatedBy; }
    get archived() { return this.props.archived ?? false; }
    get archivedAt() { return this.props.archivedAt; }

    toEmbeddingText(): string {
        const locationStr = `${this.props.City}, ${this.props.StateOrProvince || ''} ${this.props.PostalCode || ''}`.trim();
        const features = [
            this.props.WaterfrontYN ? 'Waterfront' : '',
            this.props.PoolPrivateYN ? 'Private Pool' : '',
            this.props.GarageSpaces ? `${this.props.GarageSpaces} Car Garage` : '',
            ...(this.props.ArchitecturalStyle || [])
        ].filter(Boolean).join(', ');

        return `
        Title: ${this.props.UnparsedAddress}, ${this.props.City}
        Type: ${this.props.PropertySubType || this.props.PropertyType}
        Status: ${this.props.StandardStatus}
        Location: ${locationStr}
        Details: ${this.props.BedroomsTotal} Beds, ${this.props.BathroomsTotalInteger} Baths. ${this.props.YearBuilt ? `Built in ${this.props.YearBuilt}.` : ''} 
        Features: ${features}
        Description: ${this.props.PublicRemarks}
        `.replace(/\s+/g, ' ').trim();
    }

    updatePrice(newPrice: number): void {
        this.props.ListPrice = newPrice;
        this.touch();
    }

    updateStatus(status: string): void {
        this.props.StandardStatus = status;
        this.touch();
    }

    update(props: Partial<Omit<PropertyProps, 'ListingKey' | 'createdAt' | 'updatedAt'>>): void {
        Object.assign(this.props, props);
        this.touch();
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}
