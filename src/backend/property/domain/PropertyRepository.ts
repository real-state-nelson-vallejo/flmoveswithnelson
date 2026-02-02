import { Property } from "./Property";

export interface PropertyFilter {
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    minBeds?: number;
    minBaths?: number;
    type?: 'sale' | 'rent';
}

export interface PropertyRepository {
    save(property: Property): Promise<void>;
    findById(id: string): Promise<Property | null>;
    findAll(): Promise<Property[]>;
    search(filter: PropertyFilter): Promise<Property[]>;
    delete(id: string): Promise<void>;
    findBySlug(slug: string): Promise<Property | null>;
    getAdjacentProperties(id: string): Promise<{ prev: Property | null; next: Property | null }>;
}
