import { Property } from "./Property";
import type { HomeSection } from "@/lib/schemas/propertySchema";

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
    agentId?: string | undefined;
    officeId?: string | undefined;
    homeSection?: HomeSection | undefined;
    includeArchived?: boolean | undefined;
    limit?: number | undefined;
    cursor?: string | undefined; // ListingKey of the last doc of the previous page
}

export interface PropertyPage {
    properties: Property[];
    nextCursor: string | null;
}

export interface PropertyRepository {
    save(property: Property): Promise<void>;
    findById(id: string): Promise<Property | null>;
    findAll(): Promise<Property[]>;
    search(filter: PropertyFilter): Promise<Property[]>;
    searchPage(filter: PropertyFilter): Promise<PropertyPage>;
    findSimilar(property: Property, limit: number): Promise<Property[]>;
    delete(id: string): Promise<void>;
    findBySlug(slug: string): Promise<Property | null>;
    getAdjacentProperties(id: string): Promise<{ prev: Property | null; next: Property | null }>;
}
