import { Property } from "../domain/Property";
import { PropertyRepository, PropertyFilter, PropertyPage } from "../domain/PropertyRepository";

export class InMemoryPropertyRepository implements PropertyRepository {
    private properties: Map<string, Property> = new Map();

    async save(property: Property): Promise<void> {
        this.properties.set(property.id, property);
    }

    async findById(id: string): Promise<Property | null> {
        return this.properties.get(id) || null;
    }

    async findAll(): Promise<Property[]> {
        return Array.from(this.properties.values());
    }

    async search(filter: PropertyFilter): Promise<Property[]> {
        const query = filter.query?.toLowerCase() || "";

        return Array.from(this.properties.values()).filter((p) => {
            // Text Search
            const matchesQuery = !query ||
                (p.UnparsedAddress || '').toLowerCase().includes(query) ||
                (p.PublicRemarks || '').toLowerCase().includes(query) ||
                (p.City || '').toLowerCase().includes(query) ||
                (p.PostalCode || '').toLowerCase().includes(query);

            if (!matchesQuery) return false;

            // Price Filter
            if (filter.minPrice && (p.ListPrice || 0) < filter.minPrice) return false;
            if (filter.maxPrice && (p.ListPrice || 0) > filter.maxPrice) return false;

            // Specs Filter
            if (filter.minBeds && (p.BedroomsTotal || 0) < filter.minBeds) return false;
            if (filter.minBaths && (p.BathroomsTotalInteger || 0) < filter.minBaths) return false;

            // Type Filter
            if (filter.type && p.PropertyType !== filter.type && p.PropertySubType !== filter.type) return false;

            return true;
        });
    }

    async searchPage(filter: PropertyFilter): Promise<PropertyPage> {
        const all = await this.search(filter);
        const limit = filter.limit ?? 20;
        const cursorIdx = filter.cursor ? all.findIndex(p => p.id === filter.cursor) : -1;
        const start = cursorIdx >= 0 ? cursorIdx + 1 : 0;
        const page = all.slice(start, start + limit);
        const lastItem = page[page.length - 1];
        const nextCursor = page.length === limit && lastItem ? lastItem.id : null;
        return { properties: page, nextCursor };
    }

    async findSimilar(property: Property, limit: number): Promise<Property[]> {
        const same = property.City;
        const price = property.ListPrice;
        return Array.from(this.properties.values())
            .filter(p => p.id !== property.id && p.City === same && Math.abs((p.ListPrice || 0) - price) <= price * 0.2)
            .slice(0, limit);
    }

    async delete(id: string): Promise<void> {
        this.properties.delete(id);
    }

    async findBySlug(slug: string): Promise<Property | null> {
        const properties = Array.from(this.properties.values());
        return properties.find(p => p.slug === slug) || null;
    }

    async getAdjacentProperties(id: string): Promise<{ prev: Property | null; next: Property | null }> {
        const properties = Array.from(this.properties.values());
        const index = properties.findIndex(p => p.id === id);

        if (index === -1) {
            return { prev: null, next: null };
        }

        const prev = index > 0 ? properties[index - 1] : null;
        const next = index < properties.length - 1 ? properties[index + 1] : null;

        return { prev: prev || null, next: next || null };
    }
}
