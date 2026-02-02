import { Property } from "../domain/Property";
import { PropertyRepository, PropertyFilter } from "../domain/PropertyRepository";

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
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.location.city.toLowerCase().includes(query) ||
                p.location.zip?.toLowerCase().includes(query);

            if (!matchesQuery) return false;

            // Price Filter
            if (filter.minPrice && p.price.amount < filter.minPrice) return false;
            if (filter.maxPrice && p.price.amount > filter.maxPrice) return false;

            // Specs Filter
            if (filter.minBeds && p.specs.beds < filter.minBeds) return false;
            if (filter.minBaths && p.specs.baths < filter.minBaths) return false;

            // Type Filter
            if (filter.type && p.type !== filter.type) return false;

            return true;
        });
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
