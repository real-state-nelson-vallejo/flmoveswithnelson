import { PropertyDTO } from "../infrastructure/dto/PropertyDTO";
import { PropertyPersistenceModel } from "../infrastructure/dto/PropertyPersistence";
import crypto from 'crypto';
import { serializeFirestoreData } from "@/lib/utils";

export interface Money {
    amount: number;
    currency: string;
}

export interface PropertyProps {
    id: string;
    slug?: string;
    title: string;
    description: string;
    videoUrl?: string;
    virtualTourUrl?: string;
    agentId?: string;
    views?: number;
    price: Money;
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
    opportunityScore?: number;
    listingQualityScore?: number;
    marketStatus?: 'normal' | 'distressed' | 'price_drop' | 'back_on_market';
    investmentAnalysis?: {
        cashFlow?: number;
        roi?: number;
        capRate?: number;
        description?: string;
    };
    rentCastData?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export class Property {
    private constructor(private readonly props: PropertyProps) { }

    // Aggregate Root Methods
    static create(data: Omit<PropertyProps, 'id' | 'createdAt' | 'updatedAt'>): Property {
        const now = new Date();
        const baseSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const generatedSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

        return new Property({
            ...data,
            id: crypto.randomUUID(),
            slug: generatedSlug,
            createdAt: now,
            updatedAt: now
        });
    }

    static fromPersistence(data: PropertyPersistenceModel): Property {
        return new Property({
            ...data,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rentCastData: (data as any).rentCastData as Record<string, unknown>, // Ensure we map it if it exists in persistence
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }

    toPersistence(): PropertyPersistenceModel {
        return {
            ...this.props,
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    toDTO(): PropertyDTO {
        return {
            ...this.props,
            rentCastData: serializeFirestoreData(this.props.rentCastData), // Serialize for Client Components
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    // Getters
    get id() { return this.props.id; }
    get slug() { return this.props.slug; }
    get title() { return this.props.title; }
    get description() { return this.props.description; }
    get videoUrl() { return this.props.videoUrl; }
    get virtualTourUrl() { return this.props.virtualTourUrl; }
    get agentId() { return this.props.agentId; }
    get views() { return this.props.views ?? 0; }
    get price() { return { ...this.props.price }; }
    get location() { return { ...this.props.location }; }
    get specs() { return { ...this.props.specs }; }
    get hoa() { return this.props.hoa ? { ...this.props.hoa } : undefined; }
    get features() { return [...this.props.features]; }
    get images() { return [...this.props.images]; }
    get type() { return this.props.type; }
    get propertyType() { return this.props.propertyType; }
    get status() { return this.props.status; }
    get petsAllowed() { return this.props.petsAllowed; }
    get opportunityScore() { return this.props.opportunityScore; }
    get listingQualityScore() { return this.props.listingQualityScore; }
    get marketStatus() { return this.props.marketStatus; }
    get investmentAnalysis() { return this.props.investmentAnalysis ? { ...this.props.investmentAnalysis } : undefined; }
    get rentCastData() { return this.props.rentCastData; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    // Business Methods
    toEmbeddingText(): string {
        // "Atom" Strategy: Serialize the full entity into a rich semantic string.
        // We purposefully exclude exact price to rely on metadata filtering, 
        // but include range indicators or qualitative aspects if needed. 
        // For now, we focus on the "What" and "Where".

        const featureList = this.props.features.join(', ');
        const locationStr = `${this.props.location.city}, ${this.props.location.state || ''} ${this.props.location.zip || ''}`.trim();

        return `
        Title: ${this.props.title}
        Type: ${this.props.propertyType || this.props.type}
        Status: ${this.props.status}
        Location: ${locationStr}
        Details: ${this.props.specs.beds} Beds, ${this.props.specs.baths} Baths. ${this.props.specs.yearBuilt ? `Built in ${this.props.specs.yearBuilt}.` : ''} ${this.props.petsAllowed ? 'Pets allowed.' : ''}
        Features: ${featureList}
        Description: ${this.props.description}
        `.replace(/\s+/g, ' ').trim(); // Normalize whitespace
    }

    updatePrice(newPrice: Money): void {
        this.props.price = newPrice;
        this.touch();
    }

    updateStatus(status: Property['status']): void {
        this.props.status = status;
        this.touch();
    }

    update(props: Partial<Omit<PropertyProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
        Object.assign(this.props, props);
        this.touch();
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}
