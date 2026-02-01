import { PropertyDTO } from "../infrastructure/dto/PropertyDTO";
import { PropertyPersistenceModel } from "../infrastructure/dto/PropertyPersistence";

export interface Money {
    amount: number;
    currency: string;
}

export interface PropertyProps {
    id: string;
    title: string;
    description: string;
    price: Money;
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
    createdAt: Date;
    updatedAt: Date;
}

export class Property {
    private constructor(private readonly props: PropertyProps) { }

    // Aggregate Root Methods
    static create(data: Omit<PropertyProps, 'id' | 'createdAt' | 'updatedAt'>): Property {
        const now = new Date();
        return new Property({
            ...data,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }

    static fromPersistence(data: PropertyPersistenceModel): Property {
        return new Property({
            ...data,
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
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    // Getters
    get id() { return this.props.id; }
    get title() { return this.props.title; }
    get description() { return this.props.description; }
    get price() { return { ...this.props.price }; }
    get location() { return { ...this.props.location }; }
    get specs() { return { ...this.props.specs }; }
    get hoa() { return this.props.hoa ? { ...this.props.hoa } : undefined; }
    get features() { return [...this.props.features]; }
    get images() { return [...this.props.images]; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    // Business Methods
    updatePrice(newPrice: Money): void {
        this.props.price = newPrice;
        this.touch();
    }

    updateStatus(status: Property['status']): void {
        this.props.status = status;
        this.touch();
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}
