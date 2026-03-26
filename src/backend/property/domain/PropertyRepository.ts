import { Property } from "./Property";

export interface PropertyFilter {
    query?: string | undefined;
    city?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    minBeds?: number | undefined;
    beds?: number | undefined; 
    minBaths?: number | undefined;
    type?: 'sale' | 'rent' | string | undefined;
    sort?: 'newest' | 'price_asc' | 'price_desc' | undefined;
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
